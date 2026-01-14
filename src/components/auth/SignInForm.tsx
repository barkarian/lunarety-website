"use client";

import * as React from "react";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/lib/actions/api";
import {
  useAuthStore,
  isUserTypeAllowed,
  getUserTypeMismatchError,
} from "@/lib/store/auth-store";
import { useWebsiteStore } from "@/lib/store/website-store";

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  showSwitchToSignUp?: boolean;
}

export function SignInForm({
  onSuccess,
  onSwitchToSignUp,
  showSwitchToSignUp = true,
}: SignInFormProps) {
  const { setAuth, setLoading, setError, isLoading, error, clearAuth } =
    useAuthStore();
  const { getUserBaseType } = useWebsiteStore();
  const userBaseType = getUserBaseType();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    // Validation
    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({ email, password });

      if (result.success && result.user && result.token) {
        // Check if user type matches website requirements
        if (!isUserTypeAllowed(result.user.type, userBaseType)) {
          const mismatchError = getUserTypeMismatchError(
            result.user.type,
            userBaseType
          );
          setLocalError(mismatchError || "Account type not allowed on this website");
          clearAuth();
          return;
        }

        setAuth(result.token, result.user);
        onSuccess?.();
      } else {
        setLocalError(result.error || "Invalid credentials");
      }
    } catch {
      setLocalError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {showSwitchToSignUp && userBaseType === "all-or-guests" && onSwitchToSignUp && (
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-primary hover:underline font-medium"
              >
                Create one
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
