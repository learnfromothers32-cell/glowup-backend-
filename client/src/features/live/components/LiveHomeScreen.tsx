import { useState, useRef, useEffect } from "react";
import { logger } from "../../../utils/logger";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  CalendarPlus,
  Clock,
  History,
  Bell,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Users,
  X,
} from "lucide-react";
import { useLiveStore } from "../store/liveStore";
import { useLiveSessions, useTrendingSessions } from "../hooks/useLiveSessions";
import { LiveSessionCard } from "./LiveSessionCard";
import { UpcomingSessionCard } from "./UpcomingSessionCard";
import { SessionReplayCard } from "./SessionReplayCard";
import { LiveNotifications } from "./LiveNotifications";
import { ScheduleSessionForm } from "./ScheduleSessionForm";
import { LivePlayerScreen } from "./LivePlayerScreen";
import type { LiveSession } from "../types/live.types";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "fitness", label: "Fitness" },
  { key: "startup", label: "Startup" },
  { key: "career", label: "Career" },
  { key: "productivity", label: "Productivity" },
  { key: "wellness", label: "Wellness" },
  { key: "business", label: "Business" },
  { key: "financial-literacy", label: "Finance" },
] as const;

type Tab = "live" | "upcoming" | "recordings";

export function LiveHomeScreen() {
  const [category, setCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    liveSessions,
    upcomingSessions,
    pastSessions,
    recommendedSessions,
    openPlayer,
    closePlayer,
    isPlayerOpen,
    notifications,
    markAsRead,
    markAllAsRead,
  } = useLiveStore();

  useLiveSessions(category === "all" ? undefined : category);
  useTrendingSessions();

  const allSessions = [...liveSessions, ...recommendedSessions];

  const handleJoin = (session: LiveSession) => openPlayer(session);
  const handleWatchReplay = (session: PastSession) => {
    if (session.recordingUrl) {
      window.open(session.recordingUrl, "_blank");
    }
  };
  const handleRemind = (id: string) => {
    useLiveStore.getState().setUpcomingSessions(
      upcomingSessions.map((s) =>
        s.id === id ? { ...s, reminder: !s.reminder } : s
      )
    );
  };
  const handleSchedule = (data: any) => {
    logger.log("Schedule session:", data);
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [category]);

  const goNext = () => {
    if (currentIndex < allSessions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const inFeed = !showGrid && allSessions.length > 0;
  const currentSession = inFeed ? allSessions[currentIndex] : null;

  const feedContent = currentSession && (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="w-full h-full lg:w-auto lg:h-full lg:aspect-[9/16] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-white">
                  {currentSession.host.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white/50 text-sm">Tap to watch</p>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

          <div className="absolute top-0 left-0 right-0 z-10 px-4" style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowGrid(true)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/90 dark:bg-green-600/90 backdrop-blur-sm text-[10px] font-bold text-white">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white">
                  <Users size={12} /> {currentSession.viewerCount >= 1000 ? `${(currentSession.viewerCount / 1000).toFixed(1)}k` : currentSession.viewerCount}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-gradient-to-br from-gray-600 to-gray-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{currentSession.host.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm truncate">{currentSession.host.name}</p>
                <p className="text-white/50 text-[10px] capitalize">{currentSession.category}</p>
              </div>
            </div>
            <h3 className="text-white text-sm font-medium mb-3">{currentSession.title}</h3>

            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-30 transition-all bg-white/10 text-white active:bg-white/20"
              >
                ← Prev
              </button>
              <span className="text-xs text-white/40">{currentIndex + 1}/{allSessions.length}</span>
              <button
                onClick={goNext}
                disabled={currentIndex >= allSessions.length - 1}
                className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-30 transition-all bg-white/10 text-white active:bg-white/20"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (inFeed) {
    return <>{feedContent}{isPlayerOpen && <LivePlayerScreen onClose={closePlayer} />}</>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary flex items-center gap-2.5">
                <Radio size={22} className="text-blue-500" />
                Live
              </h1>
              <p className="text-sm text-text-secondary dark:text-text-dark-muted mt-1">
                Learn from experts. Connect with community. Grow together.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors"
              >
                <Bell size={18} className="text-text-secondary dark:text-text-dark-muted" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white hover:bg-brand-600 rounded-xl text-sm font-semibold transition-colors"
              >
                <CalendarPlus size={16} />
                Schedule
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  category === cat.key
                    ? "bg-brand-500 text-white dark:bg-brand-600 border-brand-500 dark:border-brand-600"
                    : "bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-muted border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 mb-6 border-b border-gray-100 dark:border-gray-700/40">
            {[
              { key: "live", label: "Live Now", icon: Radio },
              { key: "upcoming", label: "Upcoming", icon: Clock },
              { key: "recordings", label: "Recordings", icon: History },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-brand-500 dark:border-brand-400 text-text-primary dark:text-text-dark-primary"
                    : "border-transparent text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.key === "live" && liveSessions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-green-500 dark:bg-green-600 text-white text-[10px] font-bold rounded-full">
                    {liveSessions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "live" && (
            <>
              {allSessions.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary mb-4">
                    Live Now
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {allSessions.map((session) => (
                      <LiveSessionCard
                        key={session.id}
                        session={session}
                        onJoin={handleJoin}
                      />
                    ))}
                  </div>
                </section>
              )}

              {allSessions.length === 0 && (
                <div className="text-center py-20">
                  <Radio size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-semibold text-text-muted dark:text-text-dark-secondary">
                    No live sessions right now
                  </h3>
                  <p className="text-sm text-text-muted dark:text-text-dark-secondary mt-2">
                    Check back soon or browse upcoming sessions
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "upcoming" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
                  Upcoming Sessions
                </h2>
              </div>
              {upcomingSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingSessions.map((session) => (
                    <UpcomingSessionCard
                      key={session.id}
                      session={session}
                      onRemind={handleRemind}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Clock size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-text-muted dark:text-text-dark-secondary">No upcoming sessions scheduled</p>
                </div>
              )}
            </section>
          )}

          {activeTab === "recordings" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
                  Past Sessions
                </h2>
                <button className="text-xs text-text-secondary dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </button>
              </div>
              {pastSessions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pastSessions.map((session) => (
                    <SessionReplayCard
                      key={session.id}
                      session={session}
                      onWatch={handleWatchReplay}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <History size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-text-muted dark:text-text-dark-secondary">No past recordings yet</p>
                </div>
              )}
            </section>
          )}

          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm"
            >
              <LiveNotifications
                notifications={notifications}
                onMarkRead={markAsRead}
                onMarkAllRead={markAllAsRead}
              />
            </motion.div>
          )}
        </div>
      </div>

      {showSchedule && (
        <ScheduleSessionForm
          onClose={() => setShowSchedule(false)}
          onSubmit={handleSchedule}
        />
      )}

      {isPlayerOpen && <LivePlayerScreen onClose={closePlayer} />}
    </>
  );
}
