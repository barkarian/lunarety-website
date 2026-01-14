"use client";

import * as React from "react";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { SignInForm } from "./SignInForm";

interface ProtectedContentProps {
  children: React.ReactNode;
  /**
   * Custom loading component to show while checking auth
   */
  loadingFallback?: React.ReactNode;
}

/**
 * A client wrapper that protects children based on website's userBaseType.
 * Unlike ProtectedRoute, this accepts children as a slot, allowing server
 * components to be passed as children.
 * 
 * For 'agents' websites: Shows sign-in screen until authenticated
 * For other types: Always renders children
 */
export function ProtectedContent({
  children,
  loadingFallback,
}: ProtectedContentProps) {
  const { isAuthenticated, isLoading, requiresAuth } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return loadingFallback || (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 pattern-bg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Agent Portal</h1>
          <p className="text-muted-foreground max-w-md">
            This website is exclusively for travel agents. Please sign in with your agent account to access the booking system.
          </p>
        </div>

        <SignInForm showSwitchToSignUp={false} />
      </div>
    );
  }

  // Render children - either auth is not required, or user is authenticated
  return <>{children}</>;
}
