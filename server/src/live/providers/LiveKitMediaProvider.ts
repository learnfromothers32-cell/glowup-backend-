/**
 * LiveKitMediaProvider
 *
 * LiveKit implementation of the LiveMediaProvider interface.
 * This is the ONLY file in the codebase that imports from livekit-server-sdk.
 * Business logic depends only on the LiveMediaProvider interface.
 *
 * Supports self-hosted LiveKit Server. Migratable to LiveKit Cloud
 * by simply changing LIVEKIT_URL to the cloud endpoint.
 */

import {
  LiveKitAPI,
  AccessToken,
  ParticipantInfo,
} from 'livekit-server-sdk';
import {
  LiveMediaProvider,
  CreateRoomResult,
  RoomInfoResult,
  TokenResult,
  RecordingResult,
  ParticipantResult,
  HealthCheckResult,
} from './types';
import { LiveKitConfig } from '../config/livekit.config';
import logger from '../../utils/logger';

const LIVEKIT_SDK_VERSION = '2.17.0';

export class LiveKitMediaProvider implements LiveMediaProvider {
  private api: LiveKitAPI;
  private config: LiveKitConfig;

  constructor(config: LiveKitConfig) {
    this.config = config;
    this.api = new LiveKitAPI({
      host: config.url,
      apiKey: config.apiKey,
      secret: config.apiSecret,
    });
  }

  // ── Room Management ──

  async createRoom(roomName: string, maxParticipants: number): Promise<CreateRoomResult> {
    try {
      const room = await this.api.room.createRoom({
        name: roomName,
        emptyTimeout: 300,
        maxParticipants,
      });

      logger.info('LiveKit room created', { roomName, sid: room.sid });

      return {
        roomName: room.name,
        maxParticipants: room.maxParticipants,
      };
    } catch (error) {
      logger.error('Failed to create LiveKit room', { roomName, error });
      throw this.wrapError(error, 'createRoom');
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.api.room.deleteRoom(roomName);
      logger.info('LiveKit room deleted', { roomName });
    } catch (error) {
      logger.error('Failed to delete LiveKit room', { roomName, error });
      throw this.wrapError(error, 'deleteRoom');
    }
  }

  async getRoom(roomName: string): Promise<RoomInfoResult> {
    try {
      const rooms = await this.api.room.listRooms([roomName]);
      const room = rooms.find((r) => r.name === roomName);

      if (!room) {
        throw new Error(`Room not found: ${roomName}`);
      }

      const participants = await this.api.room.listParticipants(roomName);

      return {
        roomName: room.name,
        sid: room.sid,
        emptyTimeout: room.emptyTimeout,
        maxParticipants: room.maxParticipants,
        metadata: room.metadata || '',
        numParticipants: participants.length,
        createdAt: Number(room.creationTime),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Room not found')) {
        throw error;
      }
      logger.error('Failed to get LiveKit room', { roomName, error });
      throw this.wrapError(error, 'getRoom');
    }
  }

  // ── Token Generation ──

  async generateHostToken(
    roomName: string,
    userId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return this.generateToken(roomName, `${userId}:host`, ttlSeconds, {
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateMetadata: true,
    });
  }

  async generateViewerToken(
    roomName: string,
    userId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return this.generateToken(roomName, `${userId}:viewer`, ttlSeconds, {
      roomJoin: true,
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
      canUpdateMetadata: false,
    });
  }

  async generateGuestToken(
    roomName: string,
    guestId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return this.generateToken(roomName, `guest_${guestId}:viewer`, ttlSeconds, {
      roomJoin: true,
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
      canUpdateMetadata: false,
    });
  }

  async generateModeratorToken(
    roomName: string,
    userId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return this.generateToken(roomName, `${userId}:moderator`, ttlSeconds, {
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateMetadata: true,
      canRemoveParticipants: true,
    });
  }

  private async generateToken(
    roomName: string,
    identity: string,
    ttlSeconds: number,
    grants: Record<string, boolean>
  ): Promise<TokenResult> {
    try {
      const at = new AccessToken(
        this.config.apiKey,
        this.config.apiSecret,
        {
          identity,
          ttl: ttlSeconds,
        }
      );

      at.addGrant({
        room: roomName,
        ...grants,
      });

      const token = await at.toJwt();
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      return { token, expiresAt };
    } catch (error) {
      logger.error('Failed to generate LiveKit token', { roomName, identity, error });
      throw this.wrapError(error, 'generateToken');
    }
  }

  // ── Participant Management ──

  async listParticipants(roomName: string): Promise<ParticipantResult[]> {
    try {
      const participants = await this.api.room.listParticipants(roomName);

      return participants.map((p: ParticipantInfo) => ({
        identity: p.identity,
        name: p.name || '',
        state: p.state.toString(),
        tracks: (p.tracks || []).map((t) => t.sid),
        metadata: p.metadata || '',
        joinedAt: Number(p.joinedAt),
      }));
    } catch (error) {
      logger.error('Failed to list LiveKit participants', { roomName, error });
      throw this.wrapError(error, 'listParticipants');
    }
  }

  async disconnectParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.api.room.removeParticipant(roomName, identity);
      logger.info('LiveKit participant disconnected', { roomName, identity });
    } catch (error) {
      logger.error('Failed to disconnect LiveKit participant', { roomName, identity, error });
      throw this.wrapError(error, 'disconnectParticipant');
    }
  }

  async updateParticipantPermissions(
    roomName: string,
    identity: string,
    permissions: { canPublish: boolean; canSubscribe: boolean; canPublishData: boolean }
  ): Promise<void> {
    try {
      await this.api.room.updateParticipant(roomName, identity, {
        permission: permissions,
      });
      logger.info('LiveKit participant permissions updated', { roomName, identity, permissions });
    } catch (error) {
      logger.error('Failed to update LiveKit participant permissions', { roomName, identity, error });
      throw this.wrapError(error, 'updateParticipantPermissions');
    }
  }

  // ── Recording (stub — Phase 3H) ──

  async startRecording(_roomName: string): Promise<RecordingResult> {
    throw new Error('Recording not yet implemented — Phase 3H');
  }

  async stopRecording(_egressId: string): Promise<void> {
    throw new Error('Recording not yet implemented — Phase 3H');
  }

  // ── Health Checks ──

  async isHealthy(): Promise<boolean> {
    try {
      await this.api.room.listRooms();
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await this.api.room.listRooms();
      const latencyMs = Date.now() - start;

      return {
        healthy: true,
        provider: 'livekit',
        latencyMs,
        details: `LiveKit reachable at ${this.config.url}`,
        timestamp: new Date(),
        sdkVersion: LIVEKIT_SDK_VERSION,
        liveKitUrl: this.config.url,
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const message = error instanceof Error ? error.message : 'Unknown error';

      return {
        healthy: false,
        provider: 'livekit',
        latencyMs,
        details: `LiveKit unreachable: ${message}`,
        timestamp: new Date(),
        sdkVersion: LIVEKIT_SDK_VERSION,
      };
    }
  }

  // ── Error Handling ──

  private wrapError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('not found') || msg.includes('room not found')) {
        return new LiveKitProviderError('ROOM_NOT_FOUND', `Room not found: ${operation}`, 404);
      }
      if (msg.includes('already exists') || msg.includes('room already exists')) {
        return new LiveKitProviderError('ROOM_ALREADY_EXISTS', `Room already exists: ${operation}`, 409);
      }
      if (msg.includes('unauthorized') || msg.includes('invalid') || msg.includes('forbidden')) {
        return new LiveKitProviderError('INVALID_CREDENTIALS', `Invalid LiveKit credentials: ${operation}`, 401);
      }
      if (msg.includes('participant') && msg.includes('not found')) {
        return new LiveKitProviderError('PARTICIPANT_NOT_FOUND', `Participant not found: ${operation}`, 404);
      }
      if (msg.includes('timeout') || msg.includes('econnrefused') || msg.includes('network')) {
        return new LiveKitProviderError('PROVIDER_UNAVAILABLE', `LiveKit unavailable: ${operation}`, 503);
      }

      return new LiveKitProviderError('PROVIDER_ERROR', `LiveKit error in ${operation}: ${error.message}`, 500);
    }

    return new LiveKitProviderError('PROVIDER_ERROR', `Unknown LiveKit error in ${operation}`, 500);
  }
}

// ── Provider-specific Error Class ──

export class LiveKitProviderError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'LiveKitProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
