import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import type { UserRole, User } from "../types/auth";
import * as authApi from "../api/auth";
import { setAccessToken, API_SERVER_URL } from "../api/axios";
import { signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider, getGithubProvider, getAppleProvider } from "../config/firebase";
import { identifyUser, resetAnalytics, trackEvent } from "../services/analytics";
import { AnalyticsEvents } from "../services/analytics/events";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User } }
  | { type: "LOGOUT" }
  | { type: "RESTORE_SESSION"; payload: { user: User } }
  | { type: "SESSION_VALIDATED"; payload: { user: User } }
  | { type: "UPDATE_USER"; payload: { user: User } };

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<User>;
  socialLogin: (
    provider: "google" | "apple" | "instagram",
    role?: UserRole,
  ) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      identifyUser({
        id: action.payload.user.id,
        role: action.payload.user.role,
        accountType: action.payload.user.role,
      });
      return {
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case "LOGOUT":
      resetAnalytics();
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case "RESTORE_SESSION":
      return {
        user: action.payload.user,
        isLoading: true,
        isAuthenticated: true,
      };
    case "SESSION_VALIDATED":
      return {
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload.user,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on mount: quick health check to wake server, then validate
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        await axios.get(`${API_SERVER_URL}/api/hello`, { timeout: 8000 });
      } catch {
        // Server might be cold — don't wait, show login immediately
        if (!cancelled) dispatch({ type: "LOGOUT" });
        return;
      }
      if (cancelled) return;
      try {
        const res = await authApi.getMe();
        if (!cancelled) dispatch({ type: "SESSION_VALIDATED", payload: { user: res.data.user } });
      } catch (err) {
        console.error("[Auth] getMe failed on mount:", err);
        if (!cancelled) dispatch({ type: "LOGOUT" });
      }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await authApi.login(email, password);
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
      trackEvent(AnalyticsEvents.USER_LOGGED_IN);
      return user;
    } catch (err: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw new Error(err.response?.data?.message || "Invalid email or password", { cause: err });
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const res = await authApi.register(name, email, password, role);
        const { accessToken, user } = res.data;
        setAccessToken(accessToken);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
        trackEvent(AnalyticsEvents.USER_REGISTERED);
        return user;
      } catch (err: any) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw new Error(err.response?.data?.message || "Registration failed", { cause: err });
      }
    },
    [],
  );

  const socialLogin = useCallback(
    async (provider: "google" | "apple" | "instagram", role: UserRole = "client") => {
      let firebaseProvider;
      if (provider === "google") {
        firebaseProvider = getGoogleProvider();
      } else if (provider === "apple") {
        firebaseProvider = getAppleProvider();
      } else {
        firebaseProvider = getGithubProvider();
      }
      const result = await signInWithPopup(getFirebaseAuth(), firebaseProvider).catch(
        (err) => {
          console.error("Social Login Error:", err);
          throw new Error("Social login failed");
        },
      );
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const idToken = await result.user.getIdToken();

        const res = await authApi.socialLogin(idToken, role);
        const { accessToken, user } = res.data;

        setAccessToken(accessToken);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
        trackEvent(AnalyticsEvents.USER_LOGGED_IN, { method: "social" });
        return user;
      } catch (err: any) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw new Error(err.response?.data?.message || "Social login failed", { cause: err });
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    trackEvent(AnalyticsEvents.USER_LOGGED_OUT);
    try {
      await authApi.logout();
    } catch {
      // Proceed with client-side cleanup
    }
    const fbAuth = getFirebaseAuth();
    await signOut(fbAuth).catch(() => {});
    setAccessToken(null);
    dispatch({ type: "LOGOUT" });
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: "UPDATE_USER", payload: { user } });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, socialLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
