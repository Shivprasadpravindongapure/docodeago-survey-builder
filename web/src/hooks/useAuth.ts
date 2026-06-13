import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api";
import type { User } from "../types";

interface AuthUser extends User {
  hasPassword?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await authApi.me();
    if (res.ok) {
      setUser(res.data as AuthUser);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    authApi.me().then((res) => {
      if (res.ok) {
        setUser(res.data as AuthUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    // Hard redirect so the session cookie is fully cleared
    window.location.href = "/login";
  }, []);

  return { user, loading, logout, setUser, refreshUser };
}
