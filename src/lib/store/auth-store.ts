"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// User type from API
export type UserType = "agent" | "guest";

// Website user base type
export type UserBaseType = "all" | "all-or-guests" | "agents";

export interface AuthUser {
  id: number;
  email: string;
  type: UserType;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
}

interface AuthStore {
  // State
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;

  // Computed/getters
  isAuthenticated: () => boolean;
  getUserType: () => UserType | null;
  getFullName: () => string | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Actions
      setAuth: (token, user) =>
        set({
          token,
          user,
          error: null,
          isLoading: false,
        }),

      setUser: (user) =>
        set({
          user,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          error: null,
          isLoading: false,
        }),

      // Getters
      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },

      getUserType: () => {
        const user = get().user;
        return user?.type || null;
      },

      getFullName: () => {
        const user = get().user;
        if (!user?.firstName && !user?.lastName) return null;
        return [user.firstName, user.lastName].filter(Boolean).join(" ");
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Helper to check if user type matches website requirements
export function isUserTypeAllowed(
  userType: UserType | null,
  userBaseType: UserBaseType | null | undefined
): boolean {
  if (!userBaseType || userBaseType === "all") {
    // 'all' type doesn't support authentication
    return false;
  }

  if (userBaseType === "all-or-guests") {
    // Only guest accounts allowed
    return userType === "guest";
  }

  if (userBaseType === "agents") {
    // Only agent accounts allowed
    return userType === "agent";
  }

  return false;
}

// Get error message for mismatched user type
export function getUserTypeMismatchError(
  userType: UserType | null,
  userBaseType: UserBaseType | null | undefined
): string | null {
  if (!userType || !userBaseType) return null;

  if (userBaseType === "all-or-guests" && userType === "agent") {
    return "Agent accounts cannot be used on this website. Please sign in with a guest account.";
  }

  if (userBaseType === "agents" && userType === "guest") {
    return "This website is for travel agents only. Please sign in with an agent account.";
  }

  return null;
}
