import api from "./axios";
import type {
  LiveSession,
  DiscoverSessionsParams,
  DiscoverSessionsResponse,
  CreateLiveSessionParams,
  StartSessionResponse,
  JoinSessionResponse,
  SessionStatusResponse,
} from "../domain/live/live.types";

export async function getLiveSessions(params?: DiscoverSessionsParams) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.stylistId) query.set("stylistId", params.stylistId);
  const qs = query.toString();
  const { data } = await api.get(`/live${qs ? `?${qs}` : ""}`);
  return data.data as DiscoverSessionsResponse;
}

export async function getFeaturedSessions(limit?: number) {
  const qs = limit ? `?limit=${limit}` : "";
  const { data } = await api.get(`/live/featured${qs}`);
  return data.data as DiscoverSessionsResponse;
}

export async function getLiveSessionById(id: string) {
  const { data } = await api.get(`/live/${id}`);
  return data.data as { session: LiveSession };
}

export async function getSessionStatus(id: string) {
  const { data } = await api.get(`/live/${id}/status`);
  return data.data as SessionStatusResponse;
}

export async function createLiveSession(params: CreateLiveSessionParams) {
  const { data } = await api.post("/live", params);
  return data.data as { session: LiveSession };
}

export async function updateLiveSession(
  id: string,
  params: Partial<CreateLiveSessionParams>,
) {
  const { data } = await api.patch(`/live/${id}`, params);
  return data.data as { session: LiveSession };
}

export async function deleteLiveSession(id: string) {
  await api.delete(`/live/${id}`);
}

export async function startLiveSession(id: string) {
  const { data } = await api.post(`/live/${id}/start`);
  return data.data as StartSessionResponse;
}

export async function endLiveSession(id: string) {
  const { data } = await api.post(`/live/${id}/end`);
  return data.data as { session: LiveSession };
}

export async function pauseLiveSession(id: string) {
  const { data } = await api.post(`/live/${id}/pause`);
  return data.data as { session: LiveSession };
}

export async function resumeLiveSession(id: string) {
  const { data } = await api.post(`/live/${id}/resume`);
  return data.data as { session: LiveSession };
}

export async function joinLiveSession(id: string) {
  const { data } = await api.post(`/live/${id}/join`);
  return data.data as JoinSessionResponse;
}
