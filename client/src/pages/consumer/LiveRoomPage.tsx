import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Share2, ShoppingBag, ChevronUp, ChevronDown, MessageCircle, X } from "lucide-react";
import { useLiveSession, useSessionStatus, useJoinLiveSession } from "../../domain/live/live.hooks";
import { useLiveSocket } from "../../features/live/hooks/useLiveSocket";
import { useLiveMedia } from "../../features/live/hooks/useLiveMedia";
import { LivePlayer } from "../../features/live/components/LivePlayer";
import { ChatPanel } from "../../features/live/components/ChatPanel";
import { HostControls, ViewerControls } from "../../features/live/components/HostControls";
import { ConnectionBanner } from "../../features/live/components/ConnectionBanner";
import { StreamInfo, LiveBadge, ViewerCount } from "../../features/live/components/LiveBadge";
import { RoomSkeleton } from "../../features/live/components/LiveSkeleton";
import { StylistInfoPanel } from "../../features/live/components/StylistInfoPanel";
import { ServiceShowcase } from "../../features/live/components/ServiceCard";
import { BookingOverlay } from "../../features/live/components/BookingOverlay";
import { QueueWidget } from "../../features/live/components/QueueWidget";
import { ProductShelf } from "../../features/live/components/LiveAvailability";
import { HostCommerceControls } from "../../features/live/components/HostCommerceControls";
import { ReactionOverlay, ReactionBar } from "../../features/live/components/ReactionOverlay";
import { SafetyNotification } from "../../features/live/components/SafetyNotification";
import { HostSafetyDashboard } from "../../features/live/components/HostSafetyDashboard";
import { ViewerGuestRequestButton } from "../../features/live/components/GuestRequestPanel";
import { useConnectionStore } from "../../domain/live/stores/connectionStore";
import { useViewerStore } from "../../domain/live/stores/viewerStore";
import { useCommerceStore } from "../../domain/live/stores/commerceStore";
import { useModerationStore } from "../../domain/live/stores/moderationStore";
import { useGuestRequestStore } from "../../domain/live/stores/guestRequestStore";
import { useReactionStore } from "../../domain/live/stores/reactionStore";
import { useChatStore } from "../../domain/live/stores/chatStore";
import { useAuth } from "../../context/authUtils";
import { Button } from "../../components/ui/Button";
import { getStylistServices, getStylistById } from "../../api/stylists";
import { endLiveSession } from "../../api/live";
import { addFavorite, removeFavorite } from "../../api/favorites";
import {
  onServicePinned, offServicePinned,
  onServiceUnpinned, offServiceUnpinned,
  onAvailabilityUpdated, offAvailabilityUpdated,
  onShelfUpdated, offShelfUpdated,
  pinService, unpinService, updateAvailability, toggleShelf,
  sendReaction,
  onUserMuted, offUserMuted,
  onUserUnmuted, offUserUnmuted,
  onUserBanned, offUserBanned,
  onUserUnbanned, offUserUnbanned,
  onMessageDeleted, offMessageDeleted,
  onReportSubmitted, offReportSubmitted,
  onGuestRequestReceived, offGuestRequestReceived,
  onGuestRequestAccepted, offGuestRequestAccepted,
  onGuestRequestRejected, offGuestRequestRejected,
  onGuestRequestCancelled, offGuestRequestCancelled,
  onGuestRequestStatus, offGuestRequestStatus,
  onModerationNotification, offModerationNotification,
} from "../../services/liveSocket";

// ── Shared commerce panel (avoids duplication between desktop & mobile) ──
function CommercePanelContent({
  stylistProfile,
  availability,
  services,
  pinnedService,
  shelfVisible,
  stylistId,
  isHost,
  sessionId,
  onBookFromPanel,
  onBookService,
  onFollow,
  onPinService,
  onUnpinService,
  onToggleShelf,
  onUpdateAvailability,
}: {
  stylistProfile: any;
  availability: string;
  services: any[];
  pinnedService: any;
  shelfVisible: boolean;
  stylistId: string | null;
  isHost: boolean;
  sessionId: string;
  onBookFromPanel: () => void;
  onBookService: (s: any) => void;
  onFollow: () => void;
  onPinService: (id: string) => void;
  onUnpinService: () => void;
  onToggleShelf: (v: boolean) => void;
  onUpdateAvailability: (a: string) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      {stylistProfile && (
        <StylistInfoPanel
          profile={stylistProfile}
          availability={availability}
          onBook={onBookFromPanel}
          onFollow={onFollow}
        />
      )}
      {services.length > 0 && (
        <ServiceShowcase
          services={services}
          pinnedServiceId={pinnedService?.serviceId}
          onBookService={onBookService}
        />
      )}
      {stylistId && <QueueWidget stylistId={stylistId} />}
      {shelfVisible && <ProductShelf />}
      {isHost && (
        <>
          <HostSafetyDashboard sessionId={sessionId} />
          <HostCommerceControls
            services={services}
            pinnedServiceId={pinnedService?.serviceId ?? null}
            shelfVisible={shelfVisible}
            availability={availability}
            onPinService={onPinService}
            onUnpinService={onUnpinService}
            onToggleShelf={onToggleShelf}
            onUpdateAvailability={onUpdateAvailability}
          />
        </>
      )}
      {!isHost && <ViewerGuestRequestButton sessionId={sessionId} className="w-full" />}
    </div>
  );
}

export default function LiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hostState = (location.state as { token?: string; liveKitUrl?: string; isHost?: boolean }) ?? null;

  const { data, isLoading } = useLiveSession(id!);
  const { data: statusData } = useSessionStatus(id!, !!id);

  const session = data?.session;
  const status = useConnectionStore((s) => s.status);
  const viewerCount = useViewerStore((s) => s.viewerCount);

  const pinnedService = useCommerceStore((s) => s.pinnedService);
  const availability = useCommerceStore((s) => s.availability);
  const shelfVisible = useCommerceStore((s) => s.shelfVisible);
  const services = useCommerceStore((s) => s.services);
  const stylistProfile = useCommerceStore((s) => s.stylistProfile);
  const setPinnedService = useCommerceStore((s) => s.setPinnedService);
  const setAvailability = useCommerceStore((s) => s.setAvailability);
  const setShelfVisible = useCommerceStore((s) => s.setShelfVisible);
  const setServices = useCommerceStore((s) => s.setServices);
  const setStylistProfile = useCommerceStore((s) => s.setStylistProfile);
  const resetCommerce = useCommerceStore((s) => s.reset);

  const [showBooking, setShowBooking] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | undefined>();
  const [showMobileCommerce, setShowMobileCommerce] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const isHost = useMemo(() => {
    if (!session || !user) return false;
    return session.hostUserId === user.id;
  }, [session, user]);

  const stylistId = useMemo(() => {
    if (!session) return null;
    if (session.stylistId && typeof session.stylistId === "object") {
      return session.stylistId._id;
    }
    if (typeof session.stylistId === "string") {
      return session.stylistId;
    }
    return null;
  }, [session]);

  const stylist =
    session?.stylistId && typeof session.stylistId === "object" ? session.stylistId : null;

  // Load services + stylist profile
  useEffect(() => {
    if (!stylistId) return;
    getStylistServices(stylistId)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.services ?? [];
        setServices(
          list.map((s: any) => ({
            _id: s._id || s.id,
            name: s.name,
            price: typeof s.price === "string" ? parseFloat(s.price) || 0 : s.price || 0,
            duration: typeof s.duration === "string" ? parseInt(s.duration) || 30 : s.duration || 30,
            category: s.category || "",
            popular: s.popular,
          })),
        );
      })
      .catch(() => {});

    getStylistById(stylistId)
      .then((data: any) => {
        const s = data?.stylist || data;
        if (s) {
          setStylistProfile({
            _id: s.id || s._id,
            name: s.name,
            image: s.image,
            category: s.category,
            rating: s.rating || 0,
            reviewCount: s.reviewCount || 0,
            isVerified: s.isVerified || false,
            followerCount: s.followerCount || 0,
            isFollowing: s.isFollowing || false,
          });
        }
      })
      .catch(() => {});
  }, [stylistId, setServices, setStylistProfile]);

  // Commerce socket listeners
  useEffect(() => {
    const handleServicePinned = (data: any) => setPinnedService(data.service);
    const handleServiceUnpinned = () => setPinnedService(null);
    const handleAvailability = (data: any) => setAvailability(data.availability);
    const handleShelf = (data: any) => setShelfVisible(data.visible);

    onServicePinned(handleServicePinned);
    onServiceUnpinned(handleServiceUnpinned);
    onAvailabilityUpdated(handleAvailability);
    onShelfUpdated(handleShelf);

    return () => {
      offServicePinned(handleServicePinned);
      offServiceUnpinned(handleServiceUnpinned);
      offAvailabilityUpdated(handleAvailability);
      offShelfUpdated(handleShelf);
    };
  }, [setPinnedService, setAvailability, setShelfVisible]);

  // Moderation socket listeners (host-side)
  useEffect(() => {
    if (!isHost || !id) return;

    const handleUserMuted = (data: { userId: string }) => useModerationStore.getState().addMutedUser(data.userId);
    const handleUserUnmuted = (data: { userId: string }) => useModerationStore.getState().removeMutedUser(data.userId);
    const handleUserBanned = (data: { userId: string }) => useModerationStore.getState().addBannedUser(data.userId);
    const handleUserUnbanned = (data: { userId: string }) => useModerationStore.getState().removeBannedUser(data.userId);
    const handleReportSubmitted = () => useModerationStore.getState().incrementPendingReports();
    const handleMessageDeleted = (data: { messageId: string }) => useChatStore.getState().deleteMessage(data.messageId);

    onUserMuted(handleUserMuted);
    onUserUnmuted(handleUserUnmuted);
    onUserBanned(handleUserBanned);
    onUserUnbanned(handleUserUnbanned);
    onReportSubmitted(handleReportSubmitted);
    onMessageDeleted(handleMessageDeleted);

    return () => {
      offUserMuted(handleUserMuted);
      offUserUnmuted(handleUserUnmuted);
      offUserBanned(handleUserBanned);
      offUserUnbanned(handleUserUnbanned);
      offReportSubmitted(handleReportSubmitted);
      offMessageDeleted(handleMessageDeleted);
    };
  }, [isHost, id]);

  // Guest request socket listeners (host-side)
  useEffect(() => {
    if (!isHost || !id) return;

    const handleRequestReceived = (data: { requestId: string; displayName: string; reason?: string }) => {
      useGuestRequestStore.getState().addPendingRequest({
        id: data.requestId,
        sessionId: id,
        viewerId: "",
        displayName: data.displayName,
        status: "pending",
        reason: data.reason,
        createdAt: new Date().toISOString(),
      });
    };
    const handleRequestAccepted = (data: { requestId: string }) => useGuestRequestStore.getState().removePendingRequest(data.requestId);
    const handleRequestRejected = (data: { requestId: string }) => useGuestRequestStore.getState().removePendingRequest(data.requestId);
    const handleRequestCancelled = (data: { requestId: string }) => useGuestRequestStore.getState().removePendingRequest(data.requestId);

    onGuestRequestReceived(handleRequestReceived);
    onGuestRequestAccepted(handleRequestAccepted);
    onGuestRequestRejected(handleRequestRejected);
    onGuestRequestCancelled(handleRequestCancelled);

    return () => {
      offGuestRequestReceived(handleRequestReceived);
      offGuestRequestAccepted(handleRequestAccepted);
      offGuestRequestRejected(handleRequestRejected);
      offGuestRequestCancelled(handleRequestCancelled);
    };
  }, [isHost, id]);

  // Guest request status listener (viewer-side)
  useEffect(() => {
    if (isHost || !id) return;
    const handleStatus = (data: { status: string }) => useGuestRequestStore.getState().setMyRequestStatus(data.status as any);
    onGuestRequestStatus(handleStatus);
    return () => offGuestRequestStatus(handleStatus);
  }, [isHost, id]);

  // Moderation notification listener (viewer-side: muted/banned notifications)
  useEffect(() => {
    if (isHost || !id) return;
    const handleNotification = (data: { sessionId: string; type: string; message: string }) => {
      if (data.type === 'muted') {
        useModerationStore.getState().addMutedUser(user?.id || '');
      } else if (data.type === 'banned') {
        useModerationStore.getState().addBannedUser(user?.id || '');
      }
    };
    onModerationNotification(handleNotification);
    return () => offModerationNotification(handleNotification);
  }, [isHost, id, user?.id]);

  // Reaction handler
  const handleSendReaction = useCallback((type: any) => {
    if (id) sendReaction(id, type);
  }, [id]);

  // Connect to room
  const { join, disconnect, manualReconnect } = useLiveSocket();
  const { room, connect: connectMedia, disconnect: disconnectMedia, toggleCamera, toggleMic, localTracks } = useLiveMedia();
  const joinMutation = useJoinLiveSession();
  const joinedRef = useRef(false);

  // Join session + connect WebRTC (runs once when session loads)
  useEffect(() => {
    if (!id || !session || joinedRef.current) return;
    joinedRef.current = true;

    // Join socket room
    join(id, isHost ? "host" : "viewer", user?.name || "Guest");

    // If host token was passed via navigation state, use it directly
    if (hostState?.token && hostState?.liveKitUrl) {
      connectMedia(hostState.liveKitUrl, hostState.token, isHost).catch((err) => {
        console.error("Failed to connect host media:", err);
        setConnectError("Failed to connect to live stream. Please try again.");
      });
      return;
    }

    // Otherwise join via API (server detects host vs viewer by userId)
    joinMutation.mutate(id, {
      onSuccess: (result) => {
        if (result.liveKitUrl) {
          connectMedia(result.liveKitUrl, result.token, isHost).catch((err) => {
            console.error("Failed to connect media:", err);
            setConnectError("Failed to connect to live stream. Please try again.");
          });
        } else {
          setConnectError("Live streaming is not configured on this server. The host needs to set up LiveKit.");
        }
      },
      onError: (error) => {
        console.error("Failed to join session:", error);
        setConnectError("Could not join this session. It may have ended or you may not have access.");
      },
    });
  }, [id, session, isHost, user?.name, hostState, connectMedia, join, joinMutation]);

  // Cleanup ONLY on unmount (not on session refetch)
  useEffect(() => {
    return () => {
      disconnectMedia();
      disconnect();
      resetAllStores();
    };
  }, []);

  function resetAllStores() {
    resetCommerce();
    useModerationStore.getState().reset();
    useGuestRequestStore.getState().reset();
    useReactionStore.getState().reset();
    useChatStore.getState().reset();
  }

  const handleEndStream = useCallback(async () => {
    if (!id) return;
    try {
      await endLiveSession(id);
      disconnectMedia();
      disconnect();
      navigate(isHost ? "/stylist/go-live" : "/app/live");
    } catch (err) {
      console.error("Failed to end stream:", err);
    }
  }, [id, disconnectMedia, disconnect, navigate, isHost]);

  const handleLeave = useCallback(() => {
    disconnectMedia();
    disconnect();
    navigate(isHost ? "/stylist/go-live" : "/app/live");
  }, [disconnectMedia, disconnect, navigate, isHost]);

  const handleBookService = useCallback((service: any) => {
    setPreSelectedServiceId(service._id);
    setShowBooking(true);
  }, []);

  const handleBookFromPanel = useCallback(() => {
    setPreSelectedServiceId(undefined);
    setShowBooking(true);
  }, []);

  const handleFollow = useCallback(async () => {
    if (!stylistId || !stylistProfile) return;
    try {
      if (stylistProfile.isFollowing) {
        await removeFavorite(stylistId);
        setStylistProfile({ ...stylistProfile, isFollowing: false, followerCount: stylistProfile.followerCount - 1 });
      } else {
        await addFavorite(stylistId);
        setStylistProfile({ ...stylistProfile, isFollowing: true, followerCount: stylistProfile.followerCount + 1 });
      }
    } catch {}
  }, [stylistId, stylistProfile, setStylistProfile]);

  const handlePinService = useCallback((serviceId: string) => {
    if (id) pinService(id, serviceId);
  }, [id]);

  const handleUnpinService = useCallback(() => {
    if (id) unpinService(id);
  }, [id]);

  const handleToggleShelf = useCallback((visible: boolean) => {
    if (id) toggleShelf(id, visible);
  }, [id]);

  const handleUpdateAvailability = useCallback((avail: string) => {
    if (id) updateAvailability(id, avail);
  }, [id]);

  if (isLoading) {
    return <RoomSkeleton className="h-[calc(100vh-4rem)]" />;
  }

  if (!session) {
    return (
      <div className="page-container py-16 text-center">
        <h2 className="text-h3 font-display text-text-primary">Session not found</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/app/live")}>
          Back to Live
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black">
      {/* Global overlays */}
      <ReactionOverlay sessionId={id!} />
      <SafetyNotification />

      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-900 z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={handleLeave}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
            aria-label="Leave stream"
          >
            <ArrowLeft size={18} />
          </button>
          <StreamInfo
            title={session.title}
            stylistName={stylist?.name || "Stylist"}
            stylistAvatar={stylist?.image}
            category={session.category}
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {session.status === "live" && (
            <>
              <LiveBadge size="sm" />
              <ViewerCount count={statusData?.viewerCount ?? viewerCount} />
            </>
          )}
          <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" aria-label="Share stream">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <ConnectionBanner className="mx-4 mt-2" onRetry={manualReconnect} />

      {/* Connection error overlay */}
      {connectError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-center px-6 max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📡</span>
            </div>
            <p className="text-white font-medium mb-2">Connection Error</p>
            <p className="text-white/60 text-sm mb-4">{connectError}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleLeave}>Go Back</Button>
              <Button onClick={() => { setConnectError(null); joinedRef.current = false; window.location.reload(); }}>Retry</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP (lg+): Side-by-side video + sidebar ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative">
          <LivePlayer room={room} isHost={isHost} localVideoTrack={localTracks.video} localAudioTrack={localTracks.audio} />
        </div>

        {/* Sidebar: Commerce + Chat */}
        <div className="w-[320px] flex flex-col border-l border-gray-800">
          <div className="max-h-[40%] overflow-y-auto border-b border-gray-800">
            <CommercePanelContent
              stylistProfile={stylistProfile}
              availability={availability}
              services={services}
              pinnedService={pinnedService}
              shelfVisible={shelfVisible}
              stylistId={stylistId}
              isHost={isHost}
              sessionId={id!}
              onBookFromPanel={handleBookFromPanel}
              onBookService={handleBookService}
              onFollow={handleFollow}
              onPinService={handlePinService}
              onUnpinService={handleUnpinService}
              onToggleShelf={handleToggleShelf}
              onUpdateAvailability={handleUpdateAvailability}
            />
          </div>
          <div className="flex-1 min-h-0">
            <ChatPanel className="h-full" />
          </div>
          <div className="px-3 py-2 border-t border-gray-800">
            <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
          </div>
        </div>
      </div>

      {/* ── TABLET (sm-lg): Video + collapsible chat ── */}
      <div className="hidden sm:flex lg:hidden flex-1 overflow-hidden relative">
        <div className="flex-1 relative">
          <LivePlayer room={room} isHost={isHost} localVideoTrack={localTracks.video} localAudioTrack={localTracks.audio} />
        </div>
        {/* Floating chat toggle */}
        <button
          onClick={() => setShowMobileChat(!showMobileChat)}
          className="absolute bottom-4 right-4 z-10 p-3 rounded-full bg-brand-500 text-white shadow-lg"
          aria-label="Toggle chat"
        >
          {showMobileChat ? <X size={20} /> : <MessageCircle size={20} />}
        </button>
        {/* Sliding chat panel */}
        {showMobileChat && (
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-gray-900 border-l border-gray-800 flex flex-col z-10">
            <div className="flex-1 min-h-0">
              <ChatPanel className="h-full" />
            </div>
            <div className="px-3 py-2 border-t border-gray-800">
              <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE (<sm): Full video + bottom sheets for chat & commerce ── */}
      <div className="flex sm:hidden flex-1 flex-col overflow-hidden relative">
        {/* Video takes full remaining space */}
        <div className="flex-1 relative">
          <LivePlayer room={room} isHost={isHost} localVideoTrack={localTracks.video} localAudioTrack={localTracks.audio} />
        </div>

        {/* Bottom controls bar */}
        <div className="shrink-0 bg-gray-900 border-t border-gray-800">
          {/* Quick actions row */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              {/* Chat toggle */}
              <button
                onClick={() => { setShowMobileChat(!showMobileChat); setShowMobileCommerce(false); }}
                className={`p-2 rounded-lg transition-all ${showMobileChat ? "bg-brand-500 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                aria-label="Toggle chat"
              >
                <MessageCircle size={18} />
              </button>
              {/* Commerce toggle */}
              <button
                onClick={() => { setShowMobileCommerce(!showMobileCommerce); setShowMobileChat(false); }}
                className={`p-2 rounded-lg transition-all ${showMobileCommerce ? "bg-brand-500 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                aria-label="Toggle services"
              >
                <ShoppingBag size={18} />
              </button>
              {pinnedService && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-medium">
                  {pinnedService.name}
                </span>
              )}
            </div>
            <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
          </div>

          {/* Host/Viewer controls */}
          {isHost ? (
            <HostControls
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
              onEndStream={handleEndStream}
              isStreaming={session.status === "live"}
            />
          ) : (
            <ViewerControls onLeave={handleLeave} />
          )}
        </div>

        {/* Mobile chat bottom sheet */}
        {showMobileChat && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-[60vh] bg-gray-900 rounded-t-xl border-t border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-white">Chat</span>
              <button onClick={() => setShowMobileChat(false)} className="p-1 text-white/40 hover:text-white" aria-label="Close chat">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel className="h-full" />
            </div>
          </div>
        )}

        {/* Mobile commerce bottom sheet */}
        {showMobileCommerce && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-[60vh] bg-gray-900 rounded-t-xl border-t border-gray-800 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
              <span className="text-xs font-semibold text-white">Services & Info</span>
              <button onClick={() => setShowMobileCommerce(false)} className="p-1 text-white/40 hover:text-white" aria-label="Close services">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CommercePanelContent
                stylistProfile={stylistProfile}
                availability={availability}
                services={services}
                pinnedService={pinnedService}
                shelfVisible={shelfVisible}
                stylistId={stylistId}
                isHost={isHost}
                sessionId={id!}
                onBookFromPanel={handleBookFromPanel}
                onBookService={handleBookService}
                onFollow={handleFollow}
                onPinService={handlePinService}
                onUnpinService={handleUnpinService}
                onToggleShelf={handleToggleShelf}
                onUpdateAvailability={handleUpdateAvailability}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP controls bar ── */}
      <div className="hidden lg:flex items-center bg-gray-900 px-4 shrink-0">
        <div className="flex-1">
          {isHost ? (
            <HostControls
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
              onEndStream={handleEndStream}
              isStreaming={session.status === "live"}
            />
          ) : (
            <ViewerControls onLeave={handleLeave} />
          )}
        </div>
        <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
      </div>

      {/* Booking Overlay */}
      {showBooking && stylistId && (
        <BookingOverlay
          stylistId={stylistId}
          stylistName={stylist?.name || "Stylist"}
          services={services}
          preSelectedServiceId={preSelectedServiceId}
          onClose={() => { setShowBooking(false); setPreSelectedServiceId(undefined); }}
          onSuccess={() => { setShowBooking(false); setPreSelectedServiceId(undefined); }}
        />
      )}
    </div>
  );
}
