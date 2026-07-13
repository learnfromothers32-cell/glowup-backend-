export interface UserIdentity {
  id: string;
  role: string;
  accountType?: "client" | "stylist" | "admin";
}

export interface AnalyticsProvider {
  name: string;
  initialize(): void;
  identify(user: UserIdentity): void;
  setRole(role: string): void;
  trackEvent(name: string, properties?: Record<string, string | number | boolean>): void;
  trackPageView(path: string): void;
  reset(): void;
}
