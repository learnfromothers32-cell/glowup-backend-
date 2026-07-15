import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, ShoppingBag, ChevronUp, ChevronDown } from "lucide-react";
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
import { useHostStore } from "../../domain/live/stores/hostStore";
import { useMediaStore } from "../../domain/live/stores/mediaStore";
import { useViewerStore } from "../../domain/live/stores/viewerStore";
import { useCommerceStore } from "../../domain/live/stores/commerceStore";
import { useModerationStore } from "../../domain/live/stores/moderationStore";
import { useGuestRequestStore } from "../../domain/live/stores/guestRequestStore";
import { useReactionStore } from "../../domain/live/stores/reactionStore";
import { useAuth } from "../../context/authUtils";
import { Button } from "../../components/ui/Button";
import { getStylistServices } from "../../api/stylists";
import { getStylistById } from "../../api/stylists";
import { addFavorite, removeFavorite } from "../../api/favorites";
import {
  onServicePinned,
  offServicePinned,
  onServiceUnpinned,
  offServiceUnpinned,
  onAvailabilityUpdated,
  offAvailabilityUpdated,
  onShelfUpdated,
  offShelfUpdated,
  pinService,
  unpinService,
  updateAvailability,
  toggleShelf,
  sendReaction,
  onUserMuted,
  offUserMuted,
  onUserBanned,
  offUserBanned,
  onMessageDeleted,
  offMessageDeleted,
  onReportSubmitted,
  offReportSubmitted,
  onGuestRequestReceived,
  offGuestRequestReceived,
  onGuestRequestAccepted,
  offGuestRequestAccepted,
  onGuestRequestRejected,
  offGuestRequestRejected,
  onGuestRequestStatus,
  offGuestRequestStatus,
} from "../../services/liveSocket";

export default function LiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const isHost = useMemo(() => {
    if (!session || !user) return false;
    const hostUserId =
      session.stylistId && typeof session.stylistId === "object"
        ? session.stylistId._id
        : session.hostUserId;
    return hostUserId === user.id || session.hostUserId === user.id;
  }, [session, user]);

  const stylistId = useMemo(() => {
    if (!session) return null;
    return session.stylistId && typeof session.stylistId === "object"
      ? session.stylistId._id
      : session.hostUserId;
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
    const handleServicePinned = (data: any) => {
      setPinnedService(data.service);
    };
    const handleServiceUnpinned = () => {
      setPinnedService(null);
    };
    const handleAvailability = (data: any) => {
      setAvailability(data.availability);
    };
    const handleShelf = (data: any) => {
      setShelfVisible(data.visible);
    };

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

    const handleUserMuted = (data: { userId: string }) => {
      useModerationStore.getState().addMutedUser(data.userId);
    };
    const handleUserBanned = (data: { userId: string }) => {
      useModerationStore.getState().addBannedUser(data.userId);
    };
    const handleReportSubmitted = () => {
      useModerationStore.getState().incrementPendingReports();
    };

    onUserMuted(handleUserMuted);
    onUserBanned(handleUserBanned);
    onReportSubmitted(handleReportSubmitted);

    return () => {
      offUserMuted(handleUserMuted);
      offUserBanned(handleUserBanned);
      offReportSubmitted(handleReportSubmitted);
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
    const handleRequestAccepted = (data: { requestId: string }) => {
      useGuestRequestStore.getState().removePendingRequest(data.requestId);
    };
    const handleRequestRejected = (data: { requestId: string }) => {
      useGuestRequestStore.getState().removePendingRequest(data.requestId);
    };

    onGuestRequestReceived(handleRequestReceived);
    onGuestRequestAccepted(handleRequestAccepted);
    onGuestRequestRejected(handleRequestRejected);

    return () => {
      offGuestRequestReceived(handleRequestReceived);
      offGuestRequestAccepted(handleRequestAccepted);
      offGuestRequestRejected(handleRequestRejected);
    };
  }, [isHost, id]);

  // Guest request status listener (viewer-side)
  useEffect(() => {
    if (isHost || !id) return;

    const handleStatus = (data: { status: string }) => {
      useGuestRequestStore.getState().setMyRequestStatus(data.status as any);
    };

    onGuestRequestStatus(handleStatus);
    return () => offGuestRequestStatus(handleStatus);
  }, [isHost, id]);

  // Reaction handler
  const handleSendReaction = useCallback((type: any) => {
    if (id) sendReaction(id, type);
  }, [id]);

  // Connect to room
  const { join, disconnect, manualReconnect } = useLiveSocket();
  const { room, connect: connectMedia, disconnect: disconnectMedia, toggleCamera, toggleMic } = useLiveMedia();
  const joinMutation = useJoinLiveSession();
  const joinedRef = useRef(false);

  // Join session + connect WebRTC
  useEffect(() => {
    if (!id || !session || joinedRef.current) return;
    joinedRef.current = true;

    // Join socket room
    join(id, isHost ? "host" : "viewer", user?.name || "Guest");

    // Join session via API to get LiveKit token
    joinMutation.mutate(id, {
      onSuccess: (result) => {
        if (result.liveKitUrl) {
          connectMedia(result.liveKitUrl, result.token).catch(() => {});
        }
      },
    });

    return () => {
      disconnectMedia();
      disconnect();
      resetCommerce();
      useModerationStore.getState().reset();
      useGuestRequestStore.getState().reset();
      useReactionStore.getState().reset();
    };
  }, [id, session]);

  const handleEndStream = useCallback(async () => {
    if (!id) return;
    try {
      const { endLiveSession } = await import("../../api/live");
      await endLiveSession(id);
      disconnectMedia();
      disconnect();
      navigate("/app/live");
    } catch {}
  }, [id, disconnectMedia, disconnect, navigate]);

  const handleLeave = useCallback(() => {
    disconnectMedia();
    disconnect();
    navigate("/app/live");
  }, [disconnectMedia, disconnect, navigate]);

  const handleBookService = useCallback((service: any) => {
    setPreSelectedServiceId(service._id);
    setShowBooking(true);
  }, []);

  const handleBookFromPanel = useCallback(() => {
    setPreSelectedServiceId(undefined);
    setShowBooking(true);
  }, []);

  const handleJoinQueue = useCallback(() => {
    // Queue joining is handled by QueueWidget internally
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
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
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
        <div className="flex items-center gap-3">
          {session.status === "live" && (
            <>
              <LiveBadge size="sm" />
              <ViewerCount count={statusData?.viewerCount ?? viewerCount} />
            </>
          )}
          <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <ConnectionBanner className="mx-4 mt-2" onRetry={manualReconnect} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative">
          <LivePlayer room={room} isHost={isHost} />
        </div>

        {/* Desktop sidebar: Chat + Commerce */}
        <div className="w-[320px] hidden lg:flex flex-col border-l border-gray-800">
          {/* Commerce panel */}
          <div className="max-h-[40%] overflow-y-auto p-3 space-y-3 border-b border-gray-800">
            {stylistProfile && (
              <StylistInfoPanel
                profile={stylistProfile}
                availability={availability}
                onBook={handleBookFromPanel}
                onJoinQueue={handleJoinQueue}
                onFollow={handleFollow}
              />
            )}
            {services.length > 0 && (
              <ServiceShowcase
                services={services}
                pinnedServiceId={pinnedService?.serviceId}
                onBookService={handleBookService}
              />
            )}
            {stylistId && (
              <QueueWidget stylistId={stylistId} />
            )}
            {shelfVisible && <ProductShelf />}
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
            {!isHost && (
              <ViewerGuestRequestButton sessionId={id!} className="w-full" />
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <ChatPanel className="h-full" />
          </div>

          {/* Reaction bar (desktop) */}
          <div className="px-3 py-2 border-t border-gray-800">
            <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
          </div>
        </div>

        {/* Mobile/Tablet: Chat only, commerce in bottom drawer */}
        <div className="flex-1 sm:flex lg:hidden flex-col">
          <div className="flex-1 min-h-0">
            <ChatPanel className="h-full" />
          </div>
          {/* Reaction bar (mobile) */}
          <div className="px-3 py-2 border-t border-gray-800 sm:hidden">
            <ReactionBar onSend={handleSendReaction} disabled={session.status !== "live"} />
          </div>
        </div>
      </div>

      {/* Mobile commerce bottom bar */}
      <div className="sm:hidden bg-gray-900 border-t border-gray-800">
        <button
          onClick={() => setShowMobileCommerce(!showMobileCommerce)}
          className="w-full flex items-center justify-between px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className="text-brand-400" />
            <span className="text-xs font-semibold text-white">Services & Info</span>
            {pinnedService && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-medium">
                {pinnedService.name}
              </span>
            )}
          </div>
          {showMobileCommerce ? (
            <ChevronDown size={14} className="text-white/40" />
          ) : (
            <ChevronUp size={14} className="text-white/40" />
          )}
        </button>

        {showMobileCommerce && (
          <div className="max-h-[50vh] overflow-y-auto p-3 space-y-3 border-t border-gray-800">
            {stylistProfile && (
              <StylistInfoPanel
                profile={stylistProfile}
                availability={availability}
                onBook={handleBookFromPanel}
                onJoinQueue={handleJoinQueue}
                onFollow={handleFollow}
              />
            )}
            {services.length > 0 && (
              <ServiceShowcase
                services={services}
                pinnedServiceId={pinnedService?.serviceId}
                onBookService={handleBookService}
              />
            )}
            {stylistId && (
              <QueueWidget stylistId={stylistId} />
            )}
            {shelfVisible && <ProductShelf />}
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
            {!isHost && (
              <ViewerGuestRequestButton sessionId={id!} className="w-full" />
            )}
          </div>
        )}

        {/* Controls */}
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

      {/* Desktop controls bar */}
      <div className="hidden sm:flex items-center bg-gray-900 px-4">
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
