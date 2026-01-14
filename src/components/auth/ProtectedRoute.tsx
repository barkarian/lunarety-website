"use client";

import * as React from "react";
import { Loader2, ShieldAlert, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { SignInForm } from "./SignInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Custom loading component to show while checking auth
   */
  loadingComponent?: React.ReactNode;
  /**
   * Whether to show the full-page sign-in screen or just block access
   */
  showSignIn?: boolean;
}

/**
 * Wrapper component that protects content based on website's userBaseType.
 * 
 * For 'agents' websites: Shows sign-in screen until authenticated
 * For 'all-or-guests' websites: Always renders children (auth is optional)
 * For 'all' websites: Always renders children (no auth support)
 */
export function ProtectedRoute({
  children,
  loadingComponent,
  showSignIn = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, requiresAuth, userBaseType } = useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent || <ProtectedRouteLoading />;
  }

  // If authentication is required and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return showSignIn ? <AgentSignInScreen /> : <AccessDeniedScreen />;
  }

  // Render children - either auth is not required, or user is authenticated
  return <>{children}</>;
}

function ProtectedRouteLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}

function AgentSignInScreen() {
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

function AccessDeniedScreen() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You must be signed in to access this content.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Please sign in with an authorized account to continue.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to check if content should be protected
 */
export function useProtectedContent() {
  const { isAuthenticated, isLoading, requiresAuth, supportsAuth } = useAuth();

  return {
    /**
     * Whether the content is accessible
     */
    canAccess: !requiresAuth || isAuthenticated,
    
    /**
     * Whether auth check is in progress
     */
    isChecking: isLoading,
    
    /**
     * Whether authentication is required for this website
     */
    requiresAuth,
    
    /**
     * Whether authentication is supported (for optional sign-in)
     */
    supportsAuth,
    
    /**
     * Whether user is currently authenticated
     */
    isAuthenticated,
  };
}
