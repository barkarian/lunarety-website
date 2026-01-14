"use client";

import * as React from "react";
import { User, Mail, Phone, CheckCircle, LogIn, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountrySelector, getCountryByCode } from "@/components/ui/country-selector";
import { BookingAuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/providers/AuthProvider";

export interface BookingContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

export interface AuthenticatedBookingData {
  userId: number;
  userType: "guest" | "agent";
}

interface BookingContactFormProps {
  /** Callback when manual contact data changes */
  onContactDataChange: (data: BookingContactData) => void;
  /** Callback when authenticated booking data is available */
  onAuthenticatedDataChange?: (data: AuthenticatedBookingData | null) => void;
  /** Initial contact data */
  initialData?: Partial<BookingContactData>;
  /** Whether the form is disabled */
  disabled?: boolean;
}

export function BookingContactForm({
  onContactDataChange,
  onAuthenticatedDataChange,
  initialData,
  disabled = false,
}: BookingContactFormProps) {
  const { user, isAuthenticated, userBaseType, supportsAuth, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [useManualForm, setUseManualForm] = React.useState(false);

  // Form state for manual entry (guest contact info)
  const [formData, setFormData] = React.useState<BookingContactData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    countryCode: initialData?.countryCode || "",
  });

  // Notify parent when form data changes
  React.useEffect(() => {
    onContactDataChange(formData);
  }, [formData, onContactDataChange]);

  // Notify parent about authenticated user data
  // For agents: always pass agent info (they book on behalf of guests)
  // For guests: only pass when not using manual form
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Agents always pass their ID (they're booking on behalf of guests)
      if (user.type === "agent") {
        onAuthenticatedDataChange?.({
          userId: user.id,
          userType: user.type,
        });
      } else if (!useManualForm) {
        // Guest users only when not using manual form
        onAuthenticatedDataChange?.({
          userId: user.id,
          userType: user.type,
        });
      } else {
        onAuthenticatedDataChange?.(null);
      }
    } else {
      onAuthenticatedDataChange?.(null);
    }
  }, [isAuthenticated, user, useManualForm, onAuthenticatedDataChange]);

  const handleInputChange = (field: keyof BookingContactData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCountryChange = (countryCode: string) => {
    setFormData((prev) => ({ ...prev, countryCode }));
  };

  const handleAuthSuccess = () => {
    setUseManualForm(false);
    setShowAuthModal(false);
  };

  const handleContinueAsGuest = () => {
    setUseManualForm(true);
    setShowAuthModal(false);
  };

  const handleSwitchToManual = () => {
    setUseManualForm(true);
    signOut();
  };

  // For 'all' type websites or when auth is not supported, always show manual form
  if (!supportsAuth) {
    return <ManualContactForm formData={formData} onInputChange={handleInputChange} onCountryChange={handleCountryChange} disabled={disabled} />;
  }

  // If authenticated as AGENT, show agent badge + guest contact form
  // Agents book on behalf of guests, so they need to enter guest info
  if (isAuthenticated && user && user.type === "agent") {
    return (
      <div className="space-y-4">
        {/* Agent indicator */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Booking as Agent: {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize">
            Agent
          </Badge>
        </div>

        {/* Guest contact form - agents must enter guest info */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Enter guest contact details:
          </p>
          <ManualContactForm
            formData={formData}
            onInputChange={handleInputChange}
            onCountryChange={handleCountryChange}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  // If authenticated as GUEST and not using manual form, show logged-in state
  if (isAuthenticated && user && user.type === "guest" && !useManualForm) {
    const country = user.country ? getCountryByCode(user.country) : null;

    return (
      <div className="space-y-4">
        {/* Logged in indicator */}
        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user.type} Account
          </Badge>
        </div>

        {/* User details display */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {user.phone && (
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              <span>{user.phone}</span>
            </div>
          )}
          {country && (
            <div>
              <span className="text-muted-foreground">Country:</span>{" "}
              <span>
                {country.flag} {country.name}
              </span>
            </div>
          )}
        </div>

        {/* Option to use different contact info */}
        {userBaseType === "all-or-guests" && (
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSwitchToManual}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Use different contact information
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show sign-in prompt or manual form
  return (
    <div className="space-y-4">
      {/* Sign-in prompt for all-or-guests */}
      {supportsAuth && !useManualForm && userBaseType === "all-or-guests" && (
        <div className="p-4 bg-accent/30 rounded-lg border border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <LogIn className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Have an account?</p>
              <p className="text-xs text-muted-foreground">
                Sign in for easier booking management
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In or Sign Up
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUseManualForm(true)}
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      )}

      {/* Sign-in required for agents-only websites */}
      {supportsAuth && !useManualForm && userBaseType === "agents" && (
        <div className="p-4 bg-accent/30 rounded-lg border border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <LogIn className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Sign in required</p>
              <p className="text-xs text-muted-foreground">
                Please sign in with your agent account to continue
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </Button>
        </div>
      )}

      {/* Manual contact form */}
      {useManualForm && (
        <>
          {userBaseType === "all-or-guests" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Enter your contact details
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs"
                >
                  Sign in instead
                </Button>
              </div>
              <Separator />
            </>
          )}
          <ManualContactForm
            formData={formData}
            onInputChange={handleInputChange}
            onCountryChange={handleCountryChange}
            disabled={disabled}
          />
        </>
      )}

      {/* Auth modal */}
      <BookingAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
        onContinueAsGuest={userBaseType === "all-or-guests" ? handleContinueAsGuest : undefined}
      />
    </div>
  );
}

interface ManualContactFormProps {
  formData: BookingContactData;
  onInputChange: (field: keyof BookingContactData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryChange: (countryCode: string) => void;
  disabled?: boolean;
}

function ManualContactForm({
  formData,
  onInputChange,
  onCountryChange,
  disabled = false,
}: ManualContactFormProps) {
  return (
    <div className="space-y-4">
      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="booking-firstName">First Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="booking-firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={onInputChange("firstName")}
              className="pl-10"
              disabled={disabled}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking-lastName">Last Name *</Label>
          <Input
            id="booking-lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={onInputChange("lastName")}
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="booking-email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="booking-email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={onInputChange("email")}
            className="pl-10"
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="booking-phone">Phone *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="booking-phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={onInputChange("phone")}
            className="pl-10"
            disabled={disabled}
            required
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label>Country *</Label>
        <CountrySelector
          value={formData.countryCode}
          onChange={onCountryChange}
          disabled={disabled}
          placeholder="Select your country"
        />
      </div>
    </div>
  );
}

// Validation helper
export function validateBookingContactData(data: BookingContactData): string | null {
  if (!data.firstName.trim()) return "First name is required";
  if (!data.lastName.trim()) return "Last name is required";
  if (!data.email.trim()) return "Email is required";
  if (!data.phone.trim()) return "Phone is required";
  if (!data.countryCode) return "Country is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return "Please enter a valid email address";

  return null;
}
