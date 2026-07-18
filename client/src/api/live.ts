import api from './axios';

export interface LiveSession {
  _id: string;
  stylistId: {
    _id: string;
    name: string;
    image?: string;
    category: string;
    followerCount: number;
  };
  title: string;
  thumbnail?: string;
  category: string;
  status: 'pending' | 'live' | 'ended';
  viewerCount: number;
  peakViewerCount: number;
  startedAt?: string;
  endedAt?: string;
  duration: number;
  roomId: string;
}

export const createLiveSession = async (data: {
  title: string;
  category: string;
  thumbnail?: string;
}): Promise<{ session: LiveSession; token: string; wsUrl: string }> => {
  const res = await api.post('/live', data);
  return res.data.data;
};

export const startLiveSession = async (sessionId: string) => {
  const res = await api.post(`/live/${sessionId}/start`);
  return res.data.data;
};

export const endLiveSession = async (sessionId: string) => {
  const res = await api.post(`/live/${sessionId}/end`);
  return res.data.data;
};

export const getActiveLiveSessions = async (): Promise<{ sessions: LiveSession[] }> => {
  const res = await api.get('/live/active');
  return res.data.data;
};

export const getLiveSession = async (sessionId: string): Promise<{ session: LiveSession }> => {
  const res = await api.get(`/live/${sessionId}`);
  return res.data.data;
};

export const joinLiveSession = async (
  sessionId: string
): Promise<{ token: string; wsUrl: string; session: LiveSession }> => {
  const res = await api.post(`/live/${sessionId}/join`);
  return res.data.data;
};
