import { LiveSessionService } from '../services/LiveSessionService';
import { MockLiveMediaProvider } from '../providers/types';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { liveParticipantRepository } from '../repositories/LiveParticipantRepository';
import { liveModerationRepository } from '../repositories/LiveModerationRepository';
import { ApiError } from '../../utils/apiError';

// Mock repositories
jest.mock('../repositories/LiveSessionRepository', () => ({
  liveSessionRepository: {
    findActiveSessionByStylist: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithPopulate: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    incrementViewerCount: jest.fn(),
    decrementViewerCount: jest.fn(),
    delete: jest.fn(),
    findFeaturedSessions: jest.fn(),
    findSessions: jest.fn(),
  },
}));

jest.mock('../repositories/LiveParticipantRepository', () => ({
  liveParticipantRepository: {
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    findActiveParticipants: jest.fn(),
    isUserInSession: jest.fn(),
  },
}));

jest.mock('../repositories/LiveModerationRepository', () => ({
  liveModerationRepository: {
    isUserBanned: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('LiveSessionService', () => {
  let service: LiveSessionService;
  let mockProvider: MockLiveMediaProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = new MockLiveMediaProvider();
    service = new LiveSessionService(mockProvider);
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const mockSession = {
        _id: 'session123',
        stylistId: 'stylist123',
        hostUserId: 'user123',
        title: 'Test Session',
        status: 'scheduled',
        roomName: 'live_stylist123_1234567890',
      };

      (liveSessionRepository.findActiveSessionByStylist as jest.Mock).mockResolvedValue(null);
      (liveSessionRepository.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.createSession('stylist123', 'user123', {
        title: 'Test Session',
        category: 'beauty',
      });

      expect(result).toEqual(mockSession);
      expect(liveSessionRepository.findActiveSessionByStylist).toHaveBeenCalledWith('stylist123');
      expect(liveSessionRepository.create).toHaveBeenCalled();
    });

    it('should throw 409 if active session exists', async () => {
      const existingSession = { _id: 'existing123', status: 'live' };
      (liveSessionRepository.findActiveSessionByStylist as jest.Mock).mockResolvedValue(existingSession);

      await expect(
        service.createSession('stylist123', 'user123', { title: 'Test' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getSessionById', () => {
    it('should return session when found', async () => {
      const mockSession = { _id: 'session123', title: 'Test Session' };
      (liveSessionRepository.findByIdWithPopulate as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.getSessionById('session123');
      expect(result).toEqual(mockSession);
    });

    it('should throw 404 when session not found', async () => {
      (liveSessionRepository.findByIdWithPopulate as jest.Mock).mockResolvedValue(null);

      await expect(service.getSessionById('nonexistent')).rejects.toThrow(ApiError);
    });
  });

  describe('startSession', () => {
    it('should start a session successfully', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'scheduled',
        roomName: 'live_stylist123_1234567890',
        settings: { maxViewers: 10000 },
      };
      const updatedSession = { ...mockSession, status: 'live' };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveSessionRepository.updateStatus as jest.Mock).mockResolvedValue(updatedSession);
      (liveParticipantRepository.addParticipant as jest.Mock).mockResolvedValue({});

      const result = await service.startSession('session123', 'user123');

      expect(result.session).toEqual(updatedSession);
      expect(result.token).toBeDefined();
    });

    it('should throw 403 if not owner', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'other_user',
        status: 'scheduled',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.startSession('session123', 'user123')).rejects.toThrow(ApiError);
    });

    it('should throw 409 if session already live', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'live',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.startSession('session123', 'user123')).rejects.toThrow(ApiError);
    });
  });

  describe('endSession', () => {
    it('should end a session successfully', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'live',
        startedAt: new Date(Date.now() - 3600000),
        durationMs: 0,
        roomName: 'live_stylist123_1234567890',
      };
      const updatedSession = { ...mockSession, status: 'ended' };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveSessionRepository.updateStatus as jest.Mock).mockResolvedValue(updatedSession);
      (liveParticipantRepository.findActiveParticipants as jest.Mock).mockResolvedValue([]);

      const result = await service.endSession('session123', 'user123');
      expect(result).toEqual(updatedSession);
    });

    it('should throw 403 if not owner', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'other_user',
        status: 'live',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.endSession('session123', 'user123')).rejects.toThrow(ApiError);
    });
  });

  describe('pauseSession', () => {
    it('should pause a live session', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'live',
      };
      const updatedSession = { ...mockSession, status: 'paused' };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveSessionRepository.updateStatus as jest.Mock).mockResolvedValue(updatedSession);

      const result = await service.pauseSession('session123', 'user123');
      expect(result.status).toBe('paused');
    });

    it('should throw 409 if session not live', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'scheduled',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.pauseSession('session123', 'user123')).rejects.toThrow(ApiError);
    });
  });

  describe('resumeSession', () => {
    it('should resume a paused session', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'paused',
        pausedAt: new Date(Date.now() - 60000),
        durationMs: 0,
      };
      const updatedSession = { ...mockSession, status: 'live' };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveSessionRepository.updateStatus as jest.Mock).mockResolvedValue(updatedSession);

      const result = await service.resumeSession('session123', 'user123');
      expect(result.status).toBe('live');
    });

    it('should throw 409 if session not paused', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
        status: 'live',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      await expect(service.resumeSession('session123', 'user123')).rejects.toThrow(ApiError);
    });
  });

  describe('joinSession', () => {
    it('should join a live session', async () => {
      const mockSession = {
        _id: 'session123',
        status: 'live',
        viewerCount: 10,
        hostUserId: { toString: () => 'owner123' },
        settings: { maxViewers: 10000, followersOnly: false },
        roomName: 'live_stylist123_1234567890',
      };
      const updatedSession = { ...mockSession, viewerCount: 11 };

      (liveSessionRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(updatedSession);
      (liveModerationRepository.isUserBanned as jest.Mock).mockResolvedValue(false);
      (liveParticipantRepository.isUserInSession as jest.Mock).mockResolvedValue(false);
      (liveParticipantRepository.addParticipant as jest.Mock).mockResolvedValue({});
      (liveSessionRepository.incrementViewerCount as jest.Mock).mockResolvedValue(updatedSession);

      const result = await service.joinSession('session123', 'viewer123');

      expect(result.session).toEqual(updatedSession);
      expect(result.token).toBeDefined();
    });

    it('should throw 403 if user is banned', async () => {
      const mockSession = {
        _id: 'session123',
        status: 'live',
        hostUserId: { toString: () => 'owner123' },
        settings: { maxViewers: 10000, followersOnly: false },
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveModerationRepository.isUserBanned as jest.Mock).mockResolvedValue(true);

      await expect(service.joinSession('session123', 'banned_user')).rejects.toThrow(ApiError);
    });

    it('should throw 400 if room is full', async () => {
      const mockSession = {
        _id: 'session123',
        status: 'live',
        viewerCount: 10000,
        hostUserId: { toString: () => 'owner123' },
        settings: { maxViewers: 10000, followersOnly: false },
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveModerationRepository.isUserBanned as jest.Mock).mockResolvedValue(false);

      await expect(service.joinSession('session123', 'viewer123')).rejects.toThrow(ApiError);
    });
  });

  describe('leaveSession', () => {
    it('should leave a session', async () => {
      const mockSession = { _id: 'session123', status: 'live', hostUserId: { toString: () => 'host123' } };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
      (liveParticipantRepository.isUserInSession as jest.Mock).mockResolvedValue(true);
      (liveParticipantRepository.removeParticipant as jest.Mock).mockResolvedValue({});
      (liveSessionRepository.decrementViewerCount as jest.Mock).mockResolvedValue({});

      await service.leaveSession('session123', 'viewer123');

      expect(liveParticipantRepository.removeParticipant).toHaveBeenCalledWith('session123', 'viewer123');
      expect(liveSessionRepository.decrementViewerCount).toHaveBeenCalledWith('session123');
    });
  });

  describe('validatePermissions', () => {
    it('should return true for owner', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'user123',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.validatePermissions('session123', 'user123', 'start');
      expect(result).toBe(true);
    });

    it('should throw 403 for non-owner', async () => {
      const mockSession = {
        _id: 'session123',
        hostUserId: 'other_user',
      };

      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);

      await expect(
        service.validatePermissions('session123', 'user123', 'start')
      ).rejects.toThrow(ApiError);
    });
  });
});
