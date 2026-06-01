// src/hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface GamificationState {
  points: number;
  badges: Badge[];
  lastCheckInDate: string | null;
  checkInStreak: number;
  actions: {
    bookings: number;
    reviews: number;
    likes: number;
    shares: number;
    bookmarks: number;
    favorites: number;
  };
}

const STORAGE_KEY = 'glowup_gamification';

const initialState: GamificationState = {
  points: 0,
  badges: [],
  lastCheckInDate: null,
  checkInStreak: 0,
  actions: {
    bookings: 0,
    reviews: 0,
    likes: 0,
    shares: 0,
    bookmarks: 0,
    favorites: 0,
  },
};

function loadState(): GamificationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return initialState;
}

function saveState(state: GamificationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Badge definitions and conditions
const badgeDefinitions = [
  { id: 'first_booking', name: 'First Step', description: 'Completed your first booking', icon: '🌟', condition: (state: GamificationState) => state.actions.bookings >= 1 },
  { id: 'reviewer', name: 'Voice of the Community', description: 'Left 3 reviews', icon: '🗣️', condition: (state: GamificationState) => state.actions.reviews >= 3 },
  { id: 'trendsetter', name: 'Trendsetter', description: 'Liked 10 trending posts', icon: '🔥', condition: (state: GamificationState) => state.actions.likes >= 10 },
  { id: 'loyal', name: 'Loyal Client', description: 'Completed 5 bookings', icon: '👑', condition: (state: GamificationState) => state.actions.bookings >= 5 },
  { id: 'social', name: 'Social Butterfly', description: 'Shared 3 times', icon: '🤝', condition: (state: GamificationState) => state.actions.shares >= 3 },
  { id: 'superfan', name: 'Super Fan', description: '10 bookings + 5 reviews', icon: '💎', condition: (state: GamificationState) => state.actions.bookings >= 10 && state.actions.reviews >= 5 },
];

function checkAndAwardBadges(state: GamificationState): { newState: GamificationState; newBadges: Badge[] } {
  const earnedBadgeIds = state.badges.map(b => b.id);
  const newBadges: Badge[] = [];
  for (const def of badgeDefinitions) {
    if (!earnedBadgeIds.includes(def.id) && def.condition(state)) {
      newBadges.push({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt: new Date().toISOString(),
      });
    }
  }
  if (newBadges.length === 0) return { newState: state, newBadges: [] };
  return {
    newState: { ...state, badges: [...state.badges, ...newBadges] },
    newBadges,
  };
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addPoints = useCallback((points: number) => {
    setState(prev => ({ ...prev, points: prev.points + points }));
  }, []);

  const incrementAction = useCallback((action: keyof GamificationState['actions']) => {
    setState(prev => {
      const newActions = { ...prev.actions, [action]: prev.actions[action] + 1 };
      const intermediateState = { ...prev, actions: newActions };
      const { newState, newBadges } = checkAndAwardBadges(intermediateState);
      if (newBadges.length) {
        // Optional: show toast for each new badge
        console.log('🎉 New badge(s) earned:', newBadges);
      }
      return newState;
    });
  }, []);

  const dailyCheckIn = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setState(prev => {
      if (prev.lastCheckInDate === today) return prev;
      let newStreak = 1;
      if (prev.lastCheckInDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (prev.lastCheckInDate === yesterday.toISOString().split('T')[0]) {
          newStreak = prev.checkInStreak + 1;
        }
      }
      const bonus = Math.min(10 + (newStreak - 1) * 10, 50);
      return {
        ...prev,
        points: prev.points + bonus,
        lastCheckInDate: today,
        checkInStreak: newStreak,
      };
    });
  }, []);

  return {
    points: state.points,
    badges: state.badges,
    checkInStreak: state.checkInStreak,
    lastCheckInDate: state.lastCheckInDate,
    actions: state.actions,
    addPoints,
    incrementAction,
    dailyCheckIn,
  };
}