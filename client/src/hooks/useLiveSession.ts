import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  DataPacket_Kind,
} from 'livekit-client';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
}

interface UseLiveSessionOptions {
  sessionId: string;
  isBroadcaster?: boolean;
  onStreamEnded?: () => void;
}

export function useLiveSession({ sessionId: _sessionId, isBroadcaster = false, onStreamEnded }: UseLiveSessionOptions) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const roomRef = useRef<Room | null>(null);
  const heartIdRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const cleanup = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setComments([]);
    setHearts([]);
    reconnectAttemptsRef.current = 0;
  }, []);

  const connect = useCallback(async (wsUrl: string, token: string) => {
    const lkRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    lkRoom.on(RoomEvent.Connected, () => {
      setConnectionState(ConnectionState.Connected);
      reconnectAttemptsRef.current = 0;
    });

    lkRoom.on(RoomEvent.Disconnected, () => {
      setConnectionState(ConnectionState.Disconnected);
      if (!isBroadcaster) {
        onStreamEnded?.();
      }
    });

    lkRoom.on(RoomEvent.Reconnecting, () => {
      reconnectAttemptsRef.current++;
      if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        cleanup();
        onStreamEnded?.();
        return;
      }
      setConnectionState(ConnectionState.Reconnecting);
    });

    lkRoom.on(RoomEvent.DataReceived, (payload, _participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'comment') {
          setComments((prev) => [
            ...prev.slice(-49),
            {
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              text: data.text,
              userId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar,
              timestamp: Date.now(),
            },
          ]);
        } else if (data.type === 'reaction') {
          const id = ++heartIdRef.current;
          const x = 20 + Math.random() * 60;
          setHearts((prev) => [...prev.slice(-15), { id, x }]);
          setTimeout(() => {
            setHearts((prev) => prev.filter((h) => h.id !== id));
          }, 2000);
        }
      } catch (e) {
        console.warn('Failed to parse live data:', e);
      }
    });

    lkRoom.on(RoomEvent.ParticipantConnected, () => {
      if (!isBroadcaster) {
        setViewerCount(lkRoom.remoteParticipants.size + 1);
      }
    });

    lkRoom.on(RoomEvent.ParticipantDisconnected, () => {
      if (!isBroadcaster) {
        setViewerCount(Math.max(0, lkRoom.remoteParticipants.size));
      }
    });

    await lkRoom.connect(wsUrl, token);

    if (isBroadcaster) {
      await lkRoom.localParticipant.setCameraEnabled(true);
      await lkRoom.localParticipant.setMicrophoneEnabled(true);
    }

    roomRef.current = lkRoom;
    setRoom(lkRoom);
    setConnectionState(lkRoom.state);
  }, [isBroadcaster, onStreamEnded, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const sendComment = useCallback(
    (text: string, userId: string, userName: string, userAvatar?: string) => {
      if (!roomRef.current) return;
      try {
        const data = new TextEncoder().encode(
          JSON.stringify({ type: 'comment', text, userId, userName, userAvatar })
        );
        roomRef.current.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE });
      } catch (e) {
        console.warn('Failed to send comment:', e);
      }
    },
    []
  );

  const sendReaction = useCallback(() => {
    if (!roomRef.current) return;
    try {
      const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction' }));
      roomRef.current.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE });
    } catch (e) {
      console.warn('Failed to send reaction:', e);
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isCameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(!enabled);
  }, []);

  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
  }, []);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  return {
    room,
    connectionState,
    viewerCount,
    setViewerCount,
    comments,
    hearts,
    connect,
    disconnect,
    sendComment,
    sendReaction,
    toggleCamera,
    toggleMicrophone,
  };
}
