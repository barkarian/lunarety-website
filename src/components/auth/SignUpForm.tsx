"use client";

import * as React from "react";
import { Loader2, Mail, Lock, User, Phone, AlertCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountrySelector } from "@/components/ui/country-selector";
import { signUp } from "@/lib/actions/api";
import { useAuthStore } from "@/lib/store/auth-store";
import { useWebsiteStore } from "@/lib/store/website-store";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  showSwitchToSignIn?: boolean;
}

export function SignUpForm({
  onSuccess,
  onSwitchToSignIn,
  showSwitchToSignIn = true,
}: SignUpFormProps) {
  const { setAuth, setLoading, setError, isLoading, error } = useAuthStore();
  const { getUserBaseType } = useWebsiteStore();
  const userBaseType = getUserBaseType();

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Sign-up is only available for all-or-guests websites
  const canSignUp = userBaseType === "all-or-guests";

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCountryChange = (countryCode: string) => {
    setFormData((prev) => ({ ...prev, country: countryCode }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    // Validation
    const { firstName, lastName, email, phone, country, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !phone || !country || !password) {
      setLocalError("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        firstName,
        lastName,
        email,
        phone,
        country,
        password,
      });

      if (result.success && result.user && result.token) {
        setAuth(result.token, result.user);
        onSuccess?.();
      } else {
        setLocalError(result.error || "Failed to create account");
      }
    } catch {
      setLocalError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  if (!canSignUp) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign Up Not Available</CardTitle>
          <CardDescription>
            Account creation is not available on this website. Please sign in with an existing account.
          </CardDescription>
        </CardHeader>
        {showSwitchToSignIn && onSwitchToSignIn && (
          <CardFooter>
            <Button onClick={onSwitchToSignIn} className="w-full">
              Go to Sign In
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Guest Account
          </Badge>
        </div>
        <CardDescription>
          Sign up to manage your bookings more easily
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {displayError && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange("email")}
                className="pl-10"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={handleChange("phone")}
                className="pl-10"
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label>Country *</Label>
            <CountrySelector
              value={formData.country}
              onChange={handleCountryChange}
              disabled={isLoading}
              placeholder="Select your country"
            />
          </div>

          {/* Password Fields */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange("password")}
                className="pl-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="pl-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          {showSwitchToSignIn && onSwitchToSignIn && (
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
