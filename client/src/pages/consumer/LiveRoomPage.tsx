import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  ShoppingBag,
  MessageCircle,
  X,
  Heart,
  Calendar,
  Star,
  BadgeCheck,
  Users,
  Zap,
} from "lucide-react";
import { useLiveSession, useSessionStatus, useJoinLiveSession } from "../../domain/live/live.hooks";
import { useLiveSocket } from "../../features/live/hooks/useLiveSocket";
import { useLiveMedia } from "../../features/live/hooks/useLiveMedia";
import { LivePlayer } from "../../features/live/components/LivePlayer";
import { ChatPanel } from "../../features/live/components/ChatPanel";
import { HostControls, ViewerControls } from "../../features/live/components/HostControls";
import { ConnectionBanner } from "../../features/live/components/ConnectionBanner";
import { LiveBadge, ViewerCount } from "../../features/live/components/LiveBadge";
import { RoomSkeleton } from "../../features/live/components/LiveSkeleton";
import { ServiceShowcase } from "../../features/live/components/ServiceCard";
import { BookingOverlay } from "../../features/live/components/BookingOverlay";
import { ProductShelf } from "../../features/live/components/LiveAvailability";
import { HostCommerceControls } from "../../features/live/components/HostCommerceControls";
import { ReactionOverlay, ReactionBar } from "../../features/live/components/ReactionOverlay";
import { SafetyNotification } from "../../features/live/components/SafetyNotification";
import { HostSafetyDashboard } from "../../features/live/components/HostSafetyDashboard";
import { ViewerGuestRequestButton } from "../../features/live/components/GuestRequestPanel";
import { LiveEndScreen } from "../../features/live/components/LiveEndScreen";
import { useConnectionStore } from "../../domain/live/stores/connectionStore";
import { useViewerStore } from "../../domain/live/stores/viewerStore";
import { useCommerceStore } from "../../domain/live/stores/commerceStore";
import { useModerationStore } from "../../domain/live/stores/moderationStore";
import { useGuestRequestStore } from "../../domain/live/stores/guestRequestStore";
import { useChatStore } from "../../domain/live/stores/chatStore";
import { useReactionStore } from "../../domain/live/stores/reactionStore";
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

export default function LiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hostState = (location.state as { token?: string; liveKitUrl?: string; isHost?: boolean }) ?? null;

  const { data, isLoading } = useLiveSession(id!);
  const { data: statusData } = useSessionStatus(id!, !!id);

  const session = data?.session;
  const _status = useConnectionStore((s) => s.status);
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
  const [showPinnedBanner, setShowPinnedBanner] = useState(false);

  const isHost = useMemo(() => {
    if (!session || !user) return false;
    return session.hostUserId === user.id;
  }, [session, user]);

  const stylistId = useMemo(() => {
    if (!session) return null;
    if (session.stylistId && typeof session.stylistId === "object") return session.stylistId._id;
    if (typeof session.stylistId === "string") return session.stylistId;
    return null;
  }, [session]);

  const stylist = session?.stylistId && typeof session.stylistId === "object" ? session.stylistId : null;

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
    const handleServicePinned = (data: any) => {
      setPinnedService(data.service);
      setShowPinnedBanner(true);
      setTimeout(() => setShowPinnedBanner(false), 4000);
    };
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
    const handleMessageDeleted = (data: { messageId: string }) => {
      useChatStore.getState().deleteMessage(data.messageId);
    };

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
        id: data.requestId, sessionId: id, viewerId: "", displayName: data.displayName,
        status: "pending", reason: data.reason, createdAt: new Date().toISOString(),
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

  // Moderation notification listener (viewer-side)
  useEffect(() => {
    if (isHost || !id) return;
    const handleNotification = (data: { sessionId: string; type: string; message: string }) => {
      if (data.type === "muted") useModerationStore.getState().addMutedUser(user?.id || "");
      else if (data.type === "banned") useModerationStore.getState().addBannedUser(user?.id || "");
    };
    onModerationNotification(handleNotification);
    return () => offModerationNotification(handleNotification);
  }, [isHost, id, user?.id]);

  const handleSendReaction = useCallback((type: any) => {
    if (id) sendReaction(id, type);
  }, [id]);

  const { join, disconnect, manualReconnect } = useLiveSocket();
  const { room, connect: connectMedia, disconnect: disconnectMedia, toggleCamera, toggleMic, localTracks } = useLiveMedia();
  const joinMutation = useJoinLiveSession();
  const joinedRef = useRef(false);

  // Join session + connect WebRTC
  useEffect(() => {
    if (!id || !session || joinedRef.current) return;
    joinedRef.current = true;
    join(id, isHost ? "host" : "viewer", user?.name || "Guest");
    if (hostState?.token && hostState?.liveKitUrl) {
      connectMedia(hostState.liveKitUrl, hostState.token, isHost).catch(() => {
        setConnectError("Failed to connect to live stream. Please try again.");
      });
      return;
    }
    joinMutation.mutate(id, {
      onSuccess: (result) => {
        if (result.liveKitUrl) {
          connectMedia(result.liveKitUrl, result.token, isHost).catch(() => {
            setConnectError("Failed to connect to live stream. Please try again.");
          });
        } else {
          setConnectError("Live streaming is not configured. The host needs to set up LiveKit.");
        }
      },
      onError: () => {
        setConnectError("Could not join this session. It may have ended.");
      },
    });
  }, [id, session, isHost, user?.name, hostState, connectMedia, join, joinMutation]);

  // Cleanup on unmount
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
    useChatStore.getState().reset();
    useReactionStore.getState().reset();
  }

  const handleEndStream = useCallback(async () => {
    if (!id) return;
    try {
      await endLiveSession(id);
      disconnectMedia();
      disconnect();
      navigate(isHost ? "/stylist/go-live" : "/app/live");
    } catch {}
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

  const handlePinService = useCallback((serviceId: string) => { if (id) pinService(id, serviceId); }, [id]);
  const handleUnpinService = useCallback(() => { if (id) unpinService(id); }, [id]);
  const handleToggleShelf = useCallback((visible: boolean) => { if (id) toggleShelf(id, visible); }, [id]);
  const handleUpdateAvailability = useCallback((avail: string) => { if (id) updateAvailability(id, avail); }, [id]);

  if (isLoading) return <RoomSkeleton className="h-[calc(100vh-4rem)]" />;

  if (!session) {
    return (
      <div className="page-container py-16 text-center">
        <h2 className="text-h3 font-display text-text-primary">Session not found</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/app/live")}>Back to Live</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black relative">
      {/* Global overlays */}
      <ReactionOverlay sessionId={id!} />
      <SafetyNotification />

      {/* Pinned Service Toast */}
      {showPinnedBanner && pinnedService && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 animate-slide-down">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 text-white shadow-2xl shadow-brand-500/30">
            <Zap size={14} />
            <span className="text-xs font-semibold">{pinnedService.name} — GHS {pinnedService.price.toLocaleString()}</span>
            <span className="text-[10px] opacity-70">featured</span>
          </div>
        </div>
      )}

      {/* Header - Minimal, overlaid on video */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={handleLeave}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/50 transition-all shrink-0"
              aria-label="Leave stream"
            >
              <ArrowLeft size={18} />
            </button>
            {/* Stylist info overlay */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                {stylist?.image ? (
                  <img src={stylist.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                    {stylist?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-white truncate">{stylist?.name || "Stylist"}</h2>
                  {stylist?.isVerified && <BadgeCheck size={12} className="text-brand-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-white/60 truncate">{session.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {session.status === "live" && (
              <>
                <LiveBadge size="sm" />
                <ViewerCount count={statusData?.viewerCount ?? viewerCount} />
              </>
            )}
            <button
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white transition-all"
              aria-label="Share stream"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <ConnectionBanner className="absolute top-14 left-3 right-3 z-20" onRetry={manualReconnect} />

      {/* Connection error overlay */}
      {connectError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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

      {/* Session ended */}
      {session.status === "ended" && (
        <LiveEndScreen
          session={session}
          stylistName={stylist?.name || (typeof session.stylistId === "object" ? session.stylistId.name : "Stylist")}
          stylistImage={stylist?.image}
          isFollowing={stylistProfile?.isFollowing}
          onRebook={handleBookFromPanel}
          onFollow={!isHost ? handleFollow : undefined}
        />
      )}

      {/* ── DESKTOP (lg+): Side-by-side video + sidebar ── */}
      {session.status !== "ended" && (<>
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative">
           <LivePlayer
             room={room}
             isHost={isHost}
             localVideoTrack={localTracks.video}
             localAudioTrack={localTracks.audio}
             viewerCount={statusData?.viewerCount ?? viewerCount}
             onRetryConnect={() => {}}
           />

          {/* Floating bottom-left: Stylist info + Book CTA for viewers */}
          {!isHost && (
            <div className="absolute bottom-20 left-4 right-4 z-10 flex items-end justify-between">
              <div className="max-w-md">
                {/* Pinned service callout */}
                {pinnedService && (
                  <div className="mb-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={12} className="text-brand-400" />
                      <span className="text-[10px] font-bold text-brand-400 uppercase">Featured Service</span>
                    </div>
                    <p className="text-sm font-bold text-white">{pinnedService.name}</p>
                    <p className="text-xs text-white/60">{pinnedService.duration}min · GHS {pinnedService.price.toLocaleString()}</p>
                    <button
                      onClick={() => { setPreSelectedServiceId(pinnedService.serviceId); setShowBooking(true); }}
                      className="mt-2 px-4 py-1.5 rounded-full bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating bottom-right: Follow button */}
          {!isHost && stylistProfile && (
            <div className="absolute bottom-20 right-4 z-10">
              <button
                onClick={handleFollow}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md text-xs font-semibold transition-all",
                  stylistProfile.isFollowing
                    ? "bg-white/20 text-white border border-white/20"
                    : "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                )}
              >
                {stylistProfile.isFollowing ? (
                  <><BadgeCheck size={12} /> Following</>
                ) : (
                  <><Heart size={12} /> Follow</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Commerce + Chat */}
        <div className="w-[340px] flex flex-col border-l border-gray-800 bg-gray-900">
          {/* Commerce panel - scrollable */}
          <div className="max-h-[45%] overflow-y-auto border-b border-gray-800">
            <div className="p-3 space-y-3">
              {/* Stylist mini-profile */}
              {stylistProfile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {stylistProfile.image ? (
                      <img src={stylistProfile.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                        {stylistProfile.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white truncate">{stylistProfile.name}</span>
                      {stylistProfile.isVerified && <BadgeCheck size={12} className="text-brand-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                      <span className="flex items-center gap-0.5"><Star size={9} className="text-amber-400 fill-amber-400" />{stylistProfile.rating > 0 ? stylistProfile.rating.toFixed(1) : "New"}</span>
                      <span className="flex items-center gap-0.5"><Users size={9} />{stylistProfile.followerCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book + Follow buttons */}
              {!isHost && (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1" onClick={handleBookFromPanel}>
                    <Calendar size={14} /> Book Appointment
                  </Button>
                  <button
                    onClick={handleFollow}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                      stylistProfile?.isFollowing
                        ? "bg-white/10 text-white"
                        : "bg-brand-500/20 text-brand-400 hover:bg-brand-500/30"
                    )}
                  >
                    {stylistProfile?.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <ServiceShowcase
                  services={services}
                  pinnedServiceId={pinnedService?.serviceId}
                  onBookService={handleBookService}
                />
              )}

              {/* Product shelf */}
              {stylistId && <ProductShelf stylistId={stylistId} visible={shelfVisible} />}

              {/* Host controls */}
              {isHost && (
                <>
                  <HostSafetyDashboard sessionId={id!} />
                  <HostCommerceControls
                    services={services}
                    pinnedServiceId={pinnedService?.serviceId ?? null}
                    shelfVisible={shelfVisible}
                    availability={availability}
                    onPinService={handlePinService}
                    onUnpinService={handleUnpinService}
                    onToggleShelf={handleToggleShelf}
                    onUpdateAvailability={handleUpdateAvailability}
                  />
                </>
              )}

              {!isHost && <ViewerGuestRequestButton sessionId={id!} className="w-full" />}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <ChatPanel className="h-full" onOpenBooking={handleBookFromPanel} />
          </div>

          {/* Reaction bar */}
          <div className="px-3 py-2 border-t border-gray-800">
            <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
          </div>
        </div>
      </div>

      {/* ── MOBILE/TABLET: Full video + bottom controls ── */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden relative">
        <div className="flex-1 relative">
           <LivePlayer
             room={room}
             isHost={isHost}
             localVideoTrack={localTracks.video}
             localAudioTrack={localTracks.audio}
             viewerCount={statusData?.viewerCount ?? viewerCount}
             onRetryConnect={() => {}}
           />

          {/* Floating viewer actions */}
          {!isHost && (
            <div className="absolute bottom-24 right-3 z-10 flex flex-col gap-2">
              <button
                onClick={handleFollow}
                className={cn(
                  "p-2.5 rounded-full backdrop-blur-md transition-all",
                  stylistProfile?.isFollowing ? "bg-white/20 text-white" : "bg-brand-500 text-white shadow-lg"
                )}
                aria-label={stylistProfile?.isFollowing ? "Following" : "Follow"}
              >
                <Heart size={18} fill={stylistProfile?.isFollowing ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => { setShowMobileChat(!showMobileChat); setShowMobileCommerce(false); }}
                className={cn(
                  "p-2.5 rounded-full backdrop-blur-md transition-all",
                  showMobileChat ? "bg-brand-500 text-white" : "bg-black/30 text-white"
                )}
                aria-label="Toggle chat"
              >
                <MessageCircle size={18} />
              </button>
              <button
                onClick={() => { setShowMobileCommerce(!showMobileCommerce); setShowMobileChat(false); }}
                className={cn(
                  "p-2.5 rounded-full backdrop-blur-md transition-all",
                  showMobileCommerce ? "bg-brand-500 text-white" : "bg-black/30 text-white"
                )}
                aria-label="Toggle services"
              >
                <ShoppingBag size={18} />
              </button>
            </div>
          )}

          {/* Floating pinned service for viewers */}
          {!isHost && pinnedService && (
            <div className="absolute bottom-24 left-3 z-10 max-w-[200px]">
              <button
                onClick={() => { setPreSelectedServiceId(pinnedService.serviceId); setShowBooking(true); }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/30 text-xs font-bold animate-pulse"
              >
                <Zap size={12} />
                Book: {pinnedService.name}
              </button>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="shrink-0 bg-gray-900 border-t border-gray-800">
          <div className="flex items-center justify-between px-3 py-2">
            <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
          </div>
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
          <div className="absolute bottom-0 left-0 right-0 z-30 h-[65vh] bg-gray-900 rounded-t-2xl border-t border-gray-700 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-bold text-white">Chat</span>
              <button onClick={() => setShowMobileChat(false)} className="p-1 text-white/40 hover:text-white" aria-label="Close chat">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel className="h-full" onOpenBooking={handleBookFromPanel} />
            </div>
          </div>
        )}

        {/* Mobile commerce bottom sheet */}
        {showMobileCommerce && (
          <div className="absolute bottom-0 left-0 right-0 z-30 h-[65vh] bg-gray-900 rounded-t-2xl border-t border-gray-700 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
              <span className="text-sm font-bold text-white">Services & Shop</span>
              <button onClick={() => setShowMobileCommerce(false)} className="p-1 text-white/40 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Stylist info */}
              {stylistProfile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {stylistProfile.image ? (
                      <img src={stylistProfile.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">{stylistProfile.name?.[0]}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white truncate">{stylistProfile.name}</span>
                      {stylistProfile.isVerified && <BadgeCheck size={12} className="text-brand-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                      <span className="flex items-center gap-0.5"><Star size={9} className="text-amber-400 fill-amber-400" />{stylistProfile.rating > 0 ? stylistProfile.rating.toFixed(1) : "New"}</span>
                      <span className="flex items-center gap-0.5"><Users size={9} />{stylistProfile.followerCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book button */}
              {!isHost && (
                <Button variant="primary" size="md" className="w-full" onClick={handleBookFromPanel}>
                  <Calendar size={16} /> Book Appointment
                </Button>
              )}

              {/* Services */}
              {services.length > 0 && (
                <ServiceShowcase
                  services={services}
                  pinnedServiceId={pinnedService?.serviceId}
                  onBookService={handleBookService}
                />
              )}

              {/* Product shelf */}
              {stylistId && <ProductShelf stylistId={stylistId} visible={shelfVisible} />}

              {/* Host controls in mobile */}
              {isHost && (
                <>
                  <HostSafetyDashboard sessionId={id!} />
                  <HostCommerceControls
                    services={services}
                    pinnedServiceId={pinnedService?.serviceId ?? null}
                    shelfVisible={shelfVisible}
                    availability={availability}
                    onPinService={handlePinService}
                    onUnpinService={handleUnpinService}
                    onToggleShelf={handleToggleShelf}
                    onUpdateAvailability={handleUpdateAvailability}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </>)}

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
