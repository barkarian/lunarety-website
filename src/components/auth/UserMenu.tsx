"use client";

import * as React from "react";
import { User, LogOut, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCountryByCode } from "@/components/ui/country-selector";

export function UserMenu() {
  const { user, isAuthenticated, isLoading, supportsAuth, supportsSignUp, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<"sign-in" | "sign-up">("sign-in");
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Don't show anything if auth is not supported
  if (!supportsAuth) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
    );
  }

  const handleSignIn = () => {
    setAuthModalMode("sign-in");
    setShowAuthModal(true);
    setMenuOpen(false);
  };

  const handleSignUp = () => {
    setAuthModalMode("sign-up");
    setShowAuthModal(true);
    setMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setMenuOpen(false);
  };

  // Not authenticated - show sign in button
  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSignIn}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
          {supportsSignUp && (
            <Button variant="default" size="sm" onClick={handleSignUp}>
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up
            </Button>
          )}
        </div>

        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          defaultMode={authModalMode}
        />
      </>
    );
  }

  // Authenticated - show user menu
  const country = user.country ? getCountryByCode(user.country) : null;
  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || user.email[0].toUpperCase();

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium">
              {user.firstName || user.email.split("@")[0]}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {user.type}
            </Badge>
            {country && (
              <span className="text-sm">
                {country.flag} {country.name}
              </span>
            )}
          </div>
        </div>

        <Separator />

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
