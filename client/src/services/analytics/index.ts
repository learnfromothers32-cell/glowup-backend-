import type { AnalyticsProvider, UserIdentity } from "./types";

let activeProvider: AnalyticsProvider | null = null;

export function initializeAnalytics(): void {
  if (activeProvider) return;

  if (typeof window === "undefined") return;

  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (!projectId) return;

  import("./clarity").then(({ clarityProvider }) => {
    activeProvider = clarityProvider;
    activeProvider.initialize();
  }).catch(() => {
    // provider failed to load — analytics disabled
  });
}

export function identifyUser(user: UserIdentity): void {
  activeProvider?.identify(user);
}

export function setUserRole(role: string): void {
  activeProvider?.setRole(role);
}

export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): void {
  activeProvider?.trackEvent(name, properties);
}

export function trackPageView(path: string): void {
  activeProvider?.trackPageView(path);
}

export function resetAnalytics(): void {
  activeProvider?.reset();
  activeProvider = null;
}
