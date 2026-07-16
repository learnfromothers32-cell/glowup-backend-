import { ApiError } from '../../utils/apiError';
import { LiveSession, ILiveSession } from '../models/LiveSession';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { liveParticipantRepository } from '../repositories/LiveParticipantRepository';
import { liveModerationRepository } from '../repositories/LiveModerationRepository';
import { LiveMediaProvider } from '../providers/types';
import {
  CreateLiveSessionInput,
  UpdateLiveSessionInput,
  LiveSessionQueryFilters,
  LiveSessionStatus,
  SESSION_STATUS_TRANSITIONS,
} from '../types';
import logger from '../../utils/logger';

export class LiveSessionService {
  private mediaProvider: LiveMediaProvider;

  constructor(mediaProvider: LiveMediaProvider) {
    this.mediaProvider = mediaProvider;
  }

  /**
   * Create a new live session.
   */
  async createSession(
    stylistId: string,
    hostUserId: string,
    input: CreateLiveSessionInput
  ): Promise<ILiveSession> {
    // Check for existing active session
    const existingSession = await liveSessionRepository.findActiveSessionByStylist(stylistId);
    if (existingSession) {
      throw new ApiError(409, 'You already have an active live session');
    }

    // Generate room name
    const roomName = `live_${stylistId}_${Date.now()}`;

    // Create session
    const session = await liveSessionRepository.create({
      stylistId,
      hostUserId,
      title: input.title,
      description: input.description,
      category: input.category || 'general',
      tags: input.tags,
      roomName,
      scheduledAt: input.scheduledAt,
    });

    logger.info('Live session created', {
      sessionId: session._id,
      stylistId,
      hostUserId,
      title: input.title,
    });

    return session;
  }

  /**
   * Get session by ID.
   */
  async getSessionById(id: string): Promise<ILiveSession> {
    const session = await liveSessionRepository.findByIdWithPopulate(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }
    return session;
  }

  /**
   * Update session details.
   */
  async updateSession(
    id: string,
    userId: string,
    input: UpdateLiveSessionInput
  ): Promise<ILiveSession> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    // Only allow updates on scheduled sessions
    if (session.status !== 'scheduled') {
      throw new ApiError(400, 'Can only update scheduled sessions');
    }

    const updatedSession = await liveSessionRepository.update(id, input);
    if (!updatedSession) {
      throw new ApiError(500, 'Failed to update session');
    }

    logger.info('Live session updated', { sessionId: id, userId });
    return updatedSession;
  }

  /**
   * Delete a session.
   */
  async deleteSession(id: string, userId: string): Promise<void> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    // Only allow deletion of scheduled or ended sessions
    if (!['scheduled', 'ended'].includes(session.status)) {
      throw new ApiError(400, 'Can only delete scheduled or ended sessions');
    }

    await liveSessionRepository.delete(id);
    logger.info('Live session deleted', { sessionId: id, userId });
  }

  /**
   * Start a live session.
   */
  async startSession(id: string, userId: string): Promise<{ session: ILiveSession; token: string }> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    // Validate state transition
    if (!this.canTransition(session.status, 'live')) {
      throw new ApiError(409, `Cannot start session in ${session.status} status`);
    }

    // Create LiveKit room
    await this.mediaProvider.createRoom(session.roomName, session.settings.maxViewers);

    // Update session status
    const updatedSession = await liveSessionRepository.updateStatus(id, 'live', {
      startedAt: new Date(),
    });

    if (!updatedSession) {
      throw new ApiError(500, 'Failed to start session');
    }

    // Generate host token
    const tokenResult = await this.mediaProvider.generateHostToken(
      session.roomName,
      userId
    );

    // Add host as participant
    await liveParticipantRepository.addParticipant(id, userId, 'host');

    logger.info('Live session started', {
      sessionId: id,
      stylistId: session.stylistId,
      roomName: session.roomName,
    });

    return { session: updatedSession, token: tokenResult.token };
  }

  /**
   * End a live session.
   */
  async endSession(id: string, userId: string): Promise<ILiveSession> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    // Validate state transition
    if (!this.canTransition(session.status, 'ended')) {
      throw new ApiError(409, `Cannot end session in ${session.status} status`);
    }

    // Calculate duration
    let durationMs = session.durationMs;
    if (session.startedAt) {
      const endTime = new Date();
      durationMs += endTime.getTime() - session.startedAt.getTime();
    }

    // Delete LiveKit room
    try {
      await this.mediaProvider.deleteRoom(session.roomName);
    } catch (error) {
      logger.error('Failed to delete LiveKit room', { sessionId: id, error });
    }

    // Update session status
    const updatedSession = await liveSessionRepository.updateStatus(id, 'ended', {
      endedAt: new Date(),
      durationMs,
    });

    if (!updatedSession) {
      throw new ApiError(500, 'Failed to end session');
    }

    // Remove all active participants
    const activeParticipants = await liveParticipantRepository.findActiveParticipants(id);
    for (const participant of activeParticipants) {
      await liveParticipantRepository.removeParticipant(id, participant.userId.toString());
    }

    logger.info('Live session ended', {
      sessionId: id,
      durationMs,
      totalViews: session.totalViews,
    });

    return updatedSession;
  }

  /**
   * Pause a live session.
   */
  async pauseSession(id: string, userId: string): Promise<ILiveSession> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    // Validate state transition
    if (!this.canTransition(session.status, 'paused')) {
      throw new ApiError(409, `Cannot pause session in ${session.status} status`);
    }

    const updatedSession = await liveSessionRepository.updateStatus(id, 'paused', {
      pausedAt: new Date(),
    });

    if (!updatedSession) {
      throw new ApiError(500, 'Failed to pause session');
    }

    logger.info('Live session paused', { sessionId: id });
    return updatedSession;
  }

  /**
   * Resume a paused session.
   */
  async resumeSession(id: string, userId: string): Promise<ILiveSession> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    // Validate state transition
    if (!this.canTransition(session.status, 'live')) {
      throw new ApiError(409, `Cannot resume session in ${session.status} status`);
    }

    // Calculate paused duration
    let durationMs = session.durationMs;
    if (session.pausedAt) {
      durationMs += Date.now() - session.pausedAt.getTime();
    }

    const updatedSession = await liveSessionRepository.updateStatus(id, 'live', {
      pausedAt: undefined,
      durationMs,
    });

    if (!updatedSession) {
      throw new ApiError(500, 'Failed to resume session');
    }

    logger.info('Live session resumed', { sessionId: id });
    return updatedSession;
  }

  /**
   * Join a live session as a viewer.
   */
  async joinSession(
    sessionId: string,
    userId: string
  ): Promise<{ session: ILiveSession; token: string }> {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Check session is joinable
    if (!['live', 'paused'].includes(session.status)) {
      throw new ApiError(400, 'Session is not available');
    }

    // Check if user is banned
    const isBanned = await liveModerationRepository.isUserBanned(sessionId, userId);
    if (isBanned) {
      throw new ApiError(403, 'You are banned from this session');
    }

    // Check followers-only mode
    if (session.settings.followersOnly) {
      // TODO: Check if user follows the stylist
      // For now, allow all users
    }

    // Check max viewers
    if (session.viewerCount >= session.settings.maxViewers) {
      throw new ApiError(400, 'Room is full');
    }

    // Check if already in session
    const isAlreadyIn = await liveParticipantRepository.isUserInSession(sessionId, userId);
    if (isAlreadyIn) {
      // Generate token without incrementing viewer count
      const tokenResult = await this.mediaProvider.generateViewerToken(
        session.roomName,
        userId
      );
      return { session, token: tokenResult.token };
    }

    // Add participant
    await liveParticipantRepository.addParticipant(sessionId, userId, 'viewer');

    // Increment viewer count
    await liveSessionRepository.incrementViewerCount(sessionId);

    // Generate viewer token
    const tokenResult = await this.mediaProvider.generateViewerToken(
      session.roomName,
      userId
    );

    logger.info('Viewer joined session', { sessionId, userId });

    // Return updated session
    const updatedSession = await liveSessionRepository.findById(sessionId);
    if (!updatedSession) {
      throw new ApiError(500, 'Failed to join session');
    }

    return { session: updatedSession, token: tokenResult.token };
  }

  /**
   * Leave a live session.
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Check if user is in session
    const isInSession = await liveParticipantRepository.isUserInSession(sessionId, userId);
    if (!isInSession) {
      return; // Already left
    }

    // Remove participant
    await liveParticipantRepository.removeParticipant(sessionId, userId);

    // Decrement viewer count
    await liveSessionRepository.decrementViewerCount(sessionId);

    logger.info('Viewer left session', { sessionId, userId });
  }

  /**
   * Get session status.
   */
  async getSessionStatus(id: string): Promise<{
    status: LiveSessionStatus;
    viewerCount: number;
    likeCount: number;
    chatMessageCount: number;
  }> {
    const session = await liveSessionRepository.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    return {
      status: session.status,
      viewerCount: session.viewerCount,
      likeCount: session.likeCount,
      chatMessageCount: session.chatMessageCount,
    };
  }

  /**
   * Get featured sessions.
   */
  async getFeaturedSessions(limit: number = 20): Promise<ILiveSession[]> {
    return liveSessionRepository.findFeaturedSessions(limit);
  }

  /**
   * Discover sessions with filters.
   */
  async discoverSessions(filters: LiveSessionQueryFilters): Promise<ILiveSession[]> {
    return liveSessionRepository.findSessions({
      ...filters,
      status: filters.stylistId ? filters.status : 'live',
    });
  }

  /**
   * Validate permissions for an action.
   */
  async validatePermissions(
    sessionId: string,
    userId: string,
    action: 'start' | 'pause' | 'resume' | 'end'
  ): Promise<boolean> {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Verify ownership
    if (session.hostUserId.toString() !== userId) {
      throw new ApiError(403, 'Not authorized');
    }

    return true;
  }

  /**
   * Check if a status transition is valid.
   */
  private canTransition(from: LiveSessionStatus, to: LiveSessionStatus): boolean {
    const allowedTransitions = SESSION_STATUS_TRANSITIONS[from];
    return allowedTransitions.includes(to);
  }
}
