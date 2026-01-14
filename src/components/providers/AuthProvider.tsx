"use client";

import * as React from "react";
import {
  useAuthStore,
  isUserTypeAllowed,
} from "@/lib/store/auth-store";
import { useWebsiteStore } from "@/lib/store/website-store";
import { verifyAuth } from "@/lib/actions/api";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    token,
    setAuth,
    clearAuth,
    setInitialized,
    setLoading,
    isInitialized,
  } = useAuthStore();
  const { website, isLoading: websiteLoading } = useWebsiteStore();

  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    // Wait for website config to load
    if (websiteLoading || !website) return;
    
    // Prevent double initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initializeAuth() {
      // If no stored token, just mark as initialized
      if (!token) {
        setInitialized(true);
        return;
      }

      setLoading(true);

      try {
        // Verify the stored token
        const result = await verifyAuth(token);

        if (result.success && result.user) {
          // Check if user type is allowed for this website
          const userBaseType = website?.userBaseType;

          if (!isUserTypeAllowed(result.user.type, userBaseType)) {
            // User type doesn't match website requirements - clear auth
            console.warn(
              `User type '${result.user.type}' not allowed for website type '${userBaseType}'`
            );
            clearAuth();
          } else {
            // Token is valid and user type matches
            setAuth(token, result.user);
          }
        } else {
          // Token is invalid or expired
          clearAuth();
        }
      } catch (error) {
        console.error("Failed to verify auth:", error);
        clearAuth();
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    }

    initializeAuth();
  }, [
    token,
    website,
    websiteLoading,
    setAuth,
    clearAuth,
    setInitialized,
    setLoading,
  ]);

  // Always render children - auth check happens in protected components
  return <>{children}</>;
}

// Custom hook to use auth state
export function useAuth() {
  const authStore = useAuthStore();
  const websiteStore = useWebsiteStore();

  const userBaseType = websiteStore.getUserBaseType();

  return {
    // Auth state
    user: authStore.user,
    token: authStore.token,
    isLoading: authStore.isLoading || !authStore.isInitialized,
    isAuthenticated: authStore.isAuthenticated(),
    error: authStore.error,

    // User info
    userType: authStore.getUserType(),
    fullName: authStore.getFullName(),

    // Website config
    userBaseType,
    
    // Helper flags
    requiresAuth: userBaseType === "agents",
    supportsAuth: userBaseType === "all-or-guests" || userBaseType === "agents",
    supportsSignUp: userBaseType === "all-or-guests",

    // Actions
    signOut: authStore.clearAuth,
  };
}
