import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import type { UserRole, User } from "../types/auth";
import * as authApi from "../api/auth";
import { setAccessToken } from "../api/axios";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User } }
  | { type: "LOGOUT" }
  | { type: "RESTORE_SESSION"; payload: { user: User } };

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
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case "LOGOUT":
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case "RESTORE_SESSION":
      return {
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
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

  const saveUser = useCallback((user: User) => {
    localStorage.setItem("auth_user", JSON.stringify(user));
  }, []);

  const clearStored = useCallback(() => {
    localStorage.removeItem("auth_user");
    setAccessToken(null);
  }, []);

  // Restore session on mount: use cached user instantly, then validate with server
  useEffect(() => {
    const cached = localStorage.getItem("auth_user");
    if (cached) {
      try {
        const parsed: User = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && "role" in parsed) {
          dispatch({
            type: "RESTORE_SESSION",
            payload: { user: parsed },
          });
        }
      } catch {
        // Invalid cache, ignore
      }
    }

    // Silently validate the stored session in background.
    // Never force-logout on failure — let the axios interceptor handle 401s
    // when actual API calls are made.
    const validate = async () => {
      try {
        const res = await authApi.getMe();
        const user = res.data.user;
        saveUser(user);
        dispatch({ type: "RESTORE_SESSION", payload: { user } });
      } catch {
        try {
          const res = await authApi.refreshToken();
          setAccessToken(res.data.accessToken);
          saveUser(res.data.user);
          dispatch({
            type: "RESTORE_SESSION",
            payload: { user: res.data.user },
          });
        } catch {
          // Tokens invalid — keep the cached session anyway.
          // The axios interceptor will attempt refresh on the first real 401.
        }
      }
      dispatch({ type: "SET_LOADING", payload: false });
    };

    if (cached) validate();
    else dispatch({ type: "SET_LOADING", payload: false });
  }, [clearStored, saveUser]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await authApi.login(email, password);
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      saveUser(user);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
      return user;
    } catch (err: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw new Error(err.response?.data?.message || "Invalid email or password");
    }
  }, [saveUser]);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const res = await authApi.register(name, email, password, role);
        const { accessToken, user } = res.data;
        setAccessToken(accessToken);
        saveUser(user);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
        return user;
      } catch (err: any) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw new Error(err.response?.data?.message || "Registration failed");
      }
    },
    [saveUser],
  );

  const socialLogin = useCallback(
    async (provider: "google" | "apple" | "instagram", role: UserRole = "client") => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        let firebaseProvider = googleProvider;
        const result = await signInWithPopup(auth, firebaseProvider);
        const idToken = await result.user.getIdToken();

        const res = await authApi.socialLogin(idToken, role);
        const { accessToken, user } = res.data;

        setAccessToken(accessToken);
        saveUser(user);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
        return user;
      } catch (err: any) {
        dispatch({ type: "SET_LOADING", payload: false });
        console.error("Social Login Error:", err);
        throw new Error(err.response?.data?.message || "Social login failed");
      }
    },
    [saveUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with client-side cleanup
    }
    await signOut(auth).catch(() => {});
    clearStored();
    dispatch({ type: "LOGOUT" });
  }, [clearStored]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, socialLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
