import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "../../hooks/useGamification";
import {
  Calendar, Star, Award, TrendingUp, Sparkles,
  Trophy, Flame, CheckCircle, ChevronRight,
  Gift, Zap, Target, Users, Heart,
  MessageSquare, Share2, Bookmark, Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Milestone {
  current: number;
  target: number;
  label: string;
  icon: typeof Calendar;
  reward: string;
}

// ─── Tier System ──────────────────────────────────────────────────────────────
const TIERS = [
  { name: "Newcomer", min: 0, max: 49, color: "gray", icon: "✨" },
  { name: "Regular", min: 50, max: 149, color: "blue", icon: "💫" },
  { name: "VIP", min: 150, max: 349, color: "amber", icon: "⭐" },
  { name: "Elite", min: 350, max: 699, color: "purple", icon: "💎" },
  { name: "Icon", min: 700, max: Infinity, color: "rose", icon: "👑" },
];

function getTier(points: number) {
  return TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
}

function getNextTier(points: number) {
  const idx = TIERS.findIndex(t => points >= t.min && points <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ progress, size = 80, strokeWidth = 6, color = "#1f2937" }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function PointsCard({ points, streak, alreadyCheckedIn, onCheckIn }: {
  points: number; streak: number;
  alreadyCheckedIn: boolean; onCheckIn: () => void;
}) {
  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const progressToNext = nextTier
    ? ((points - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;
  const pointsToNext = nextTier ? nextTier.min - points : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Tier accent */}
      <div className="h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400" />

      <div className="p-5">
        <div className="flex items-start gap-5">
          {/* Points */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{tier.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{tier.name} Tier</span>
            </div>
            <p className="text-4xl font-black text-gray-900 tabular-nums tracking-tight mb-1">{points}</p>
            <p className="text-xs text-gray-400">reward points</p>

            {/* Progress to next tier */}
            {nextTier && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {pointsToNext} pts to {nextTier.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{Math.round(progressToNext)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gray-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Streak + Check-in */}
          <div className="flex flex-col items-end gap-3">
            {/* Streak */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end mb-0.5">
                <Flame size={14} className="text-orange-500" />
                <span className="text-2xl font-black text-gray-900 tabular-nums">{streak}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">day streak</p>
            </div>

            {/* Check-in button */}
            <button
              onClick={onCheckIn}
              disabled={alreadyCheckedIn}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold
                transition-all duration-200
                ${alreadyCheckedIn
                  ? "bg-green-50 text-green-600 border border-green-100 cursor-default"
                  : "bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-gray-900/10 active:scale-[0.97]"
                }
              `}
            >
              {alreadyCheckedIn ? (
                <><CheckCircle size={13} />Checked in</>
              ) : (
                <><Zap size={13} />Check in · +10</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────
function BadgeCard({ badge, index }: { badge: { id: string; name: string; icon: string; description: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
          {badge.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{badge.name}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{badge.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Locked Badge ─────────────────────────────────────────────────────────────
function LockedBadge({ name, description, index }: { name: string; description: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-50 rounded-xl border border-gray-100 p-4 opacity-60"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <Lock size={18} className="text-gray-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-400 mb-0.5">{name}</p>
          <p className="text-xs text-gray-300 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Milestone Row ────────────────────────────────────────────────────────────
function MilestoneRow({ milestone, index }: { milestone: Milestone; index: number }) {
  const Icon = milestone.icon;
  const pct = Math.min((milestone.current / milestone.target) * 100, 100);
  const done = milestone.current >= milestone.target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        done ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
      }`}>
        {done ? <CheckCircle size={18} /> : <Icon size={18} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className={`text-sm font-semibold ${done ? "text-green-700" : "text-gray-900"}`}>
            {milestone.label}
          </p>
          <span className="text-xs font-bold text-gray-400 tabular-nums">
            {milestone.current}/{milestone.target}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            className={`h-full rounded-full ${done ? "bg-green-500" : "bg-gray-900"}`}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {done ? "✅ Reward unlocked" : `Reward: ${milestone.reward}`}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Tier List ────────────────────────────────────────────────────────────────
function TierList({ points }: { points: number }) {
  const currentTier = getTier(points);

  return (
    <div className="space-y-2">
      {TIERS.map((tier, i) => {
        const isCurrent = tier.name === currentTier.name;
        const isUnlocked = points >= tier.min;
        const pct = tier.max === Infinity
          ? 100
          : Math.min(((points - tier.min) / (tier.max - tier.min)) * 100, 100);

        return (
          <div
            key={tier.name}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              isCurrent
                ? "bg-gray-50 border-gray-300 shadow-sm"
                : isUnlocked
                  ? "bg-white border-gray-100"
                  : "bg-gray-50/50 border-gray-100 opacity-50"
            }`}
          >
            <span className="text-xl">{tier.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${isCurrent ? "text-gray-900" : "text-gray-600"}`}>
                  {tier.name}
                </p>
                {isCurrent && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-900 text-white uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                {tier.min}–{tier.max === Infinity ? "∞" : tier.max} pts
              </p>
            </div>
            {isUnlocked ? (
              <CheckCircle size={16} className="text-green-500 shrink-0" />
            ) : (
              <Lock size={14} className="text-gray-300 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Rewards() {
  const { points, badges, checkInStreak, lastCheckInDate, dailyCheckIn, actions } = useGamification();
  const today = new Date().toISOString().split("T")[0];
  const alreadyCheckedIn = lastCheckInDate === today;

  const milestones: Milestone[] = [
    { current: actions.bookings, target: 1, label: "Complete a booking", icon: Calendar, reward: "First Step badge" },
    { current: actions.reviews, target: 3, label: "Write 3 reviews", icon: MessageSquare, reward: "Critic badge" },
    { current: actions.likes, target: 10, label: "Like 10 trending posts", icon: Heart, reward: "Trendsetter badge" },
    { current: actions.shares, target: 3, label: "Share 3 looks", icon: Share2, reward: "Influencer badge" },
    { current: checkInStreak, target: 7, label: "7-day check-in streak", icon: Flame, reward: "Loyal badge + 50 pts" },
    { current: actions.bookmarks, target: 5, label: "Save 5 stylists", icon: Bookmark, reward: "Curator badge" },
  ];

  const unlockedCount = milestones.filter(m => m.current >= m.target).length;
  const totalMilestones = milestones.length;

  // Locked badges (those not yet earned)
  const allBadges = [
    { id: "first-step", name: "First Step", description: "Complete your first booking", icon: "🎯" },
    { id: "critic", name: "Critic", description: "Write 3 reviews", icon: "✍️" },
    { id: "trendsetter", name: "Trendsetter", description: "Like 10 trending posts", icon: "🔥" },
    { id: "influencer", name: "Influencer", description: "Share 3 looks", icon: "📣" },
    { id: "loyal", name: "Loyal", description: "7-day check-in streak", icon: "💪" },
    { id: "curator", name: "Curator", description: "Save 5 stylists to favorites", icon: "📌" },
    { id: "social-butterfly", name: "Social Butterfly", description: "Connect with 5 stylists", icon: "🦋" },
    { id: "glow-queen", name: "Glow Queen", description: "Reach 500 reward points", icon: "👑" },
  ];

  const earnedIds = new Set(badges.map(b => b.id));
  const lockedBadges = allBadges.filter(b => !earnedIds.has(b.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* ── Header ── */}
        <div className="pt-14 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rewards</h1>
              <p className="text-sm text-gray-400">Earn points, unlock badges, and level up</p>
            </div>
          </div>
        </div>

        {/* ── Points + Streak + Check-in ── */}
        <PointsCard
          points={points}
          streak={checkInStreak}
          alreadyCheckedIn={alreadyCheckedIn}
          onCheckIn={dailyCheckIn}
        />

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-3 gap-3 mt-4 mb-8">
          {[
            { label: "Badges", value: badges.length, icon: Award, color: { bg: "bg-amber-50", icon: "text-amber-500", text: "text-amber-700" } },
            { label: "Milestones", value: `${unlockedCount}/${totalMilestones}`, icon: Target, color: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-700" } },
            { label: "Streak", value: `${checkInStreak}d`, icon: Flame, color: { bg: "bg-orange-50", icon: "text-orange-500", text: "text-orange-700" } },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-3.5">
              <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center mb-2`}>
                <Icon size={15} className={color.icon} />
              </div>
              <p className={`text-lg font-bold ${color.text} tabular-nums`}>{value}</p>
              <p className="text-[11px] text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Earned Badges ── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Your Badges</h2>
              <p className="text-xs text-gray-400 mt-0.5">{badges.length} earned</p>
            </div>
          </div>

          {badges.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Award size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">No badges yet</p>
              <p className="text-xs text-gray-400 max-w-[220px] mx-auto">Complete milestones below to earn your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {badges.map((badge, i) => (
                <BadgeCard key={badge.id} badge={badge} index={i} />
              ))}
              {lockedBadges.slice(0, 2).map((badge, i) => (
                <LockedBadge key={badge.id} name={badge.name} description={badge.description} index={badges.length + i} />
              ))}
            </div>
          )}
        </section>

        {/* ── Milestones ── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
              <p className="text-xs text-gray-400 mt-0.5">{unlockedCount} of {totalMilestones} completed</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / totalMilestones) * 100}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full bg-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-4">
            {milestones.map((m, i) => (
              <MilestoneRow key={m.label} milestone={m} index={i} />
            ))}
          </div>
        </section>

        {/* ── Tier Progression ── */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Tier Progression</h2>
            <p className="text-xs text-gray-400 mt-0.5">Level up by earning more points</p>
          </div>
          <TierList points={points} />
        </section>

        {/* ── How to Earn ── */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">How to Earn Points</h2>
            <p className="text-xs text-gray-400 mt-0.5">Actions that reward you</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {[
              { action: "Daily check-in", pts: "+10", icon: Calendar, color: "text-green-500" },
              { action: "Complete a booking", pts: "+50", icon: CheckCircle, color: "text-blue-500" },
              { action: "Write a review", pts: "+20", icon: MessageSquare, color: "text-amber-500" },
              { action: "Share a look", pts: "+5", icon: Share2, color: "text-purple-500" },
              { action: "Save a stylist", pts: "+2", icon: Bookmark, color: "text-pink-500" },
              { action: "Like a trending post", pts: "+1", icon: Heart, color: "text-red-400" },
            ].map(({ action, pts, icon: Icon, color }) => (
              <div key={action} className="flex items-center gap-3 px-4 py-3">
                <Icon size={16} className={color} />
                <span className="flex-1 text-sm text-gray-700">{action}</span>
                <span className="text-sm font-bold text-gray-900">{pts}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer note ── */}
        <div className="text-center">
          <p className="text-xs text-gray-400">More challenges and rewards coming soon ✨</p>
        </div>
      </div>
    </div>
  );
}