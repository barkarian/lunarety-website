"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { useWebsiteStore } from "@/lib/store/website-store";

type AuthMode = "sign-in" | "sign-up";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultMode = "sign-in",
  onSuccess,
  title,
  description,
}: AuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>(defaultMode);
  const { getUserBaseType } = useWebsiteStore();
  const userBaseType = getUserBaseType();

  // Reset mode when modal opens
  React.useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [open, defaultMode]);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  // Determine if sign-up should be shown
  const showSignUp = userBaseType === "all-or-guests";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>
            {title || (mode === "sign-in" ? "Sign In" : "Create Account")}
          </DialogTitle>
          <DialogDescription>
            {description ||
              (mode === "sign-in"
                ? "Sign in to your account"
                : "Create a new guest account")}
          </DialogDescription>
        </DialogHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Auth Forms */}
        <div className="pt-2">
          {mode === "sign-in" ? (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={showSignUp ? () => setMode("sign-up") : undefined}
              showSwitchToSignUp={showSignUp}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setMode("sign-in")}
              showSwitchToSignIn={true}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Booking-specific auth modal with contextual messaging
interface BookingAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export function BookingAuthModal({
  open,
  onOpenChange,
  onSuccess,
  onContinueAsGuest,
}: BookingAuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>("sign-up");
  const { getUserBaseType } = useWebsiteStore();
  const userBaseType = getUserBaseType();

  // Reset mode when modal opens - default to sign-up for new users
  React.useEffect(() => {
    if (open) {
      setMode("sign-up");
    }
  }, [open]);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  // For all-or-guests, show sign-up option and continue as guest
  const showSignUp = userBaseType === "all-or-guests";
  const showContinueAsGuest = userBaseType === "all-or-guests" && onContinueAsGuest;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === "sign-up" ? "Create Account" : "Sign In to Continue"}
          </DialogTitle>
          <DialogDescription>
            {mode === "sign-up"
              ? "Create an account for easier booking management"
              : "Sign in to manage your bookings more easily"}
          </DialogDescription>
        </DialogHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Auth Forms */}
        <div className="pt-2">
          {mode === "sign-up" ? (
            <div>
              <SignUpForm
                onSuccess={handleSuccess}
                onSwitchToSignIn={() => setMode("sign-in")}
                showSwitchToSignIn={true}
              />
              
              {/* Continue as guest option */}
              {showContinueAsGuest && (
                <div className="px-6 pb-6 pt-0 border-t mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Or continue without an account
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onContinueAsGuest?.();
                        onOpenChange(false);
                      }}
                      className="w-full"
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <SignInForm
                onSuccess={handleSuccess}
                onSwitchToSignUp={showSignUp ? () => setMode("sign-up") : undefined}
                showSwitchToSignUp={showSignUp}
              />
              
              {/* Continue as guest option */}
              {showContinueAsGuest && (
                <div className="px-6 pb-6 pt-0 border-t mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Or continue without an account
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onContinueAsGuest?.();
                        onOpenChange(false);
                      }}
                      className="w-full"
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
