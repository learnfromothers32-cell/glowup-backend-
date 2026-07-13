import * as clarity from "@microsoft/clarity";
import type { AnalyticsProvider, UserIdentity } from "./types";

const CLARITY_KEY = import.meta.env.VITE_CLARITY_PROJECT_ID;

let initialized = false;

export const clarityProvider: AnalyticsProvider = {
  name: "clarity",

  initialize() {
    if (initialized) return;
    if (!CLARITY_KEY) return;
    if (typeof window === "undefined") return;
    if (import.meta.env.MODE !== "production") return;

    try {
      clarity.start(CLARITY_KEY);
      initialized = true;
    } catch {
      // Clarity failed to init — fail silently
    }
  },

  identify(user: UserIdentity) {
    if (!initialized) return;
    try {
      clarity.identify(user.id, user.role);
      if (user.accountType) {
        clarity.setTag("account_type", user.accountType);
      }
    } catch {
      // fail silently
    }
  },

  setRole(role: string) {
    if (!initialized) return;
    try {
      clarity.setTag("user_role", role);
    } catch {
      // fail silently
    }
  },

  trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
    if (!initialized) return;
    try {
      clarity.event(name);
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          clarity.setTag(key, String(value));
        }
      }
    } catch {
      // fail silently
    }
  },

  trackPageView(_path: string) {
    if (!initialized) return;
    try {
      clarity.tag("page_view");
    } catch {
      // fail silently
    }
  },

  reset() {
    if (!initialized) return;
    try {
      clarity.stop();
      initialized = false;
    } catch {
      // fail silently
    }
  },
};
