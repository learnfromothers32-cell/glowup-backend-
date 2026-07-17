import { useCallback, useRef, useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type Room as LiveKitRoom,
  type LocalAudioTrack,
  type LocalVideoTrack,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from "livekit-client";
import { useMediaStore } from "@/domain/live/stores/mediaStore";
import { useConnectionStore } from "@/domain/live/stores/connectionStore";

export function useLiveMedia() {
  const roomRef = useRef<LiveKitRoom | null>(null);
  const connectingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const [room, setRoom] = useState<LiveKitRoom | null>(null);
  const [localTracks, setLocalTracks] = useState<{
    video?: LocalVideoTrack;
    audio?: LocalAudioTrack;
  }>({});

  const cameraEnabled = useMediaStore((s) => s.cameraEnabled);
  const micEnabled = useMediaStore((s) => s.micEnabled);
  const setCameraEnabled = useMediaStore((s) => s.setCameraEnabled);
  const setMicEnabled = useMediaStore((s) => s.setMicEnabled);
  const setStatus = useConnectionStore((s) => s.setStatus);

  const connect = useCallback(
    async (url: string, token: string, publishLocal = true) => {
      if (connectingRef.current) return roomRef.current;

      if (roomRef.current) {
        intentionalDisconnectRef.current = true;
        localTracks.video?.stop();
        localTracks.audio?.stop();
        await roomRef.current.disconnect();
        roomRef.current.removeAllListeners();
        roomRef.current = null;
        setRoom(null);
        setLocalTracks({});
      }

      connectingRef.current = true;
      intentionalDisconnectRef.current = false;

      try {
        const r = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
          videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 30 } },
        });

        r.on(RoomEvent.Connected, () => {
          setStatus("connected");
        });

        r.on(RoomEvent.Disconnected, () => {
          if (!intentionalDisconnectRef.current) {
            setStatus("disconnected");
          }
        });

        r.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          if (state === ConnectionState.Connecting) setStatus("connecting");
          else if (state === ConnectionState.Connected) setStatus("connected");
          else if (state === ConnectionState.Reconnecting) setStatus("reconnecting");
        });

        r.on(RoomEvent.TrackSubscribed, () => {});

        await r.connect(url, token);

        if (publishLocal) {
          try {
            if (cameraEnabled) {
              const videoTrack = await createLocalVideoTrack();
              await r.localParticipant.publishTrack(videoTrack);
              setLocalTracks((prev) => ({ ...prev, video: videoTrack }));
            }

            if (micEnabled) {
              const audioTrack = await createLocalAudioTrack();
              await r.localParticipant.publishTrack(audioTrack);
              setLocalTracks((prev) => ({ ...prev, audio: audioTrack }));
            }
          } catch (trackErr) {
            console.warn("Failed to publish local tracks (room still connected):", trackErr);
          }
        }

        roomRef.current = r;
        setRoom(r);
        return r;
      } finally {
        connectingRef.current = false;
      }
    },
    [cameraEnabled, micEnabled, setStatus],
  );

  const disconnect = useCallback(async () => {
    const r = roomRef.current;
    if (r) {
      intentionalDisconnectRef.current = true;
      localTracks.video?.stop();
      localTracks.audio?.stop();
      await r.disconnect();
      r.removeAllListeners();
      roomRef.current = null;
      setRoom(null);
      setLocalTracks({});
    }
  }, [localTracks]);

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    if (!r?.localParticipant) return;
    const pub = r.localParticipant.getTrackPublication(Track.Source.Camera);
    if (pub) {
      if (pub.isMuted) {
        await pub.unmute();
        setCameraEnabled(true);
      } else {
        await pub.mute();
        setCameraEnabled(false);
      }
    } else if (!cameraEnabled) {
      try {
        const track = await createLocalVideoTrack();
        await r.localParticipant.publishTrack(track);
        setLocalTracks((prev) => ({ ...prev, video: track }));
        setCameraEnabled(true);
      } catch (err) {
        console.warn("Failed to enable camera:", err);
      }
    }
  }, [cameraEnabled, setCameraEnabled]);

  const toggleMic = useCallback(async () => {
    const r = roomRef.current;
    if (!r?.localParticipant) return;
    const pub = r.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (pub) {
      if (pub.isMuted) {
        await pub.unmute();
        setMicEnabled(true);
      } else {
        await pub.mute();
        setMicEnabled(false);
      }
    } else if (!micEnabled) {
      try {
        const track = await createLocalAudioTrack();
        await r.localParticipant.publishTrack(track);
        setLocalTracks((prev) => ({ ...prev, audio: track }));
        setMicEnabled(true);
      } catch (err) {
        console.warn("Failed to enable microphone:", err);
      }
    }
  }, [micEnabled, setMicEnabled]);

  useEffect(() => {
    return () => {
      const r = roomRef.current;
      if (r) {
        intentionalDisconnectRef.current = true;
        localTracks.video?.stop();
        localTracks.audio?.stop();
        r.disconnect();
        r.removeAllListeners();
        roomRef.current = null;
      }
    };
  }, []);

  return {
    room,
    connect,
    disconnect,
    toggleCamera,
    toggleMic,
    localTracks,
  };
}
