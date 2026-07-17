import { create } from "zustand";

export interface MediaState {
  cameraEnabled: boolean;
  micEnabled: boolean;
  speaking: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  reset: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  cameraEnabled: true,
  micEnabled: true,
  speaking: false,
  setCameraEnabled: (enabled) => set({ cameraEnabled: enabled }),
  setMicEnabled: (enabled) => set({ micEnabled: enabled }),
  setSpeaking: (speaking) => set({ speaking }),
  toggleCamera: () => set((s) => ({ cameraEnabled: !s.cameraEnabled })),
  toggleMic: () => set((s) => ({ micEnabled: !s.micEnabled })),
  reset: () => set({ cameraEnabled: true, micEnabled: true, speaking: false }),
}));
