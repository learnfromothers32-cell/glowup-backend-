import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as liveApi from "../../../api/live";
import { useLiveStore } from "../store/liveStore";
import type { LiveSession, LiveCategory } from "../types/live.types";

function mapStreamToSession(stream: any): LiveSession {
  return {
    id: stream.id,
    hostId: stream.stylistId,
    host: {
      id: stream.stylist?.id || stream.stylistId,
      name: stream.stylist?.name || "Unknown Host",
      image: stream.stylist?.image,
      isVerified: stream.stylist?.isVerified || false,
      isFollowing: stream.stylist?.isFollowing || false,
    },
    title: stream.title,
    description: "",
    category: (stream.category as LiveCategory) || "hairstyling",
    viewerCount: stream.viewerCount || 0,
    isLive: stream.isLive !== undefined ? stream.isLive : true,
    startedAt: stream.startedAt,
    tags: [],
  };
}

export function useLiveSessions(category?: string) {
  const setLiveSessions = useLiveStore((s) => s.setLiveSessions);
  const setLoading = useLiveStore((s) => s.setLoading);

  return useQuery({
    queryKey: ["live-sessions", category],
    queryFn: async () => {
      setLoading(true);
      const data = await liveApi.getLiveFeed({
        page: 1,
        limit: 50,
        filter: category || "all",
      });
      const sessions = (data.streams || []).map(mapStreamToSession);
      setLiveSessions(sessions);
      setLoading(false);
      return sessions as LiveSession[];
    },
    refetchInterval: 30_000,
  });
}

export function useTrendingSessions() {
  const setRecommendedSessions = useLiveStore((s) => s.setRecommendedSessions);

  return useQuery({
    queryKey: ["live-trending"],
    queryFn: async () => {
      const streams = await liveApi.getTrendingStreams();
      const sessions = (streams || []).map(mapStreamToSession);
      setRecommendedSessions(sessions);
      return sessions as LiveSession[];
    },
    refetchInterval: 30_000,
  });
}

export function useStartStream() {
  const queryClient = useQueryClient();
  const setStreaming = useLiveStore((s) => s.setStreaming);

  return useMutation({
    mutationFn: (params: { title?: string; category?: string; privacy?: string }) =>
      liveApi.startLive(params.title, params.category, params.privacy),
    onSuccess: () => {
      setStreaming(true);
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
    },
  });
}

export function useStopStream() {
  const queryClient = useQueryClient();
  const resetStream = useLiveStore((s) => s.resetStream);

  return useMutation({
    mutationFn: () => liveApi.stopLive(),
    onSuccess: () => {
      resetStream();
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
    },
  });
}
