"use client";

import * as React from "react";
import { CheckCircle2Icon, SaveIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common country codes
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+44", country: "UK" },
  { code: "+30", country: "GR" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+39", country: "IT" },
  { code: "+34", country: "ES" },
  { code: "+31", country: "NL" },
  { code: "+32", country: "BE" },
  { code: "+41", country: "CH" },
  { code: "+43", country: "AT" },
  { code: "+46", country: "SE" },
  { code: "+47", country: "NO" },
  { code: "+45", country: "DK" },
  { code: "+358", country: "FI" },
  { code: "+48", country: "PL" },
  { code: "+420", country: "CZ" },
  { code: "+351", country: "PT" },
  { code: "+353", country: "IE" },
  { code: "+61", country: "AU" },
  { code: "+64", country: "NZ" },
  { code: "+81", country: "JP" },
  { code: "+82", country: "KR" },
  { code: "+86", country: "CN" },
  { code: "+91", country: "IN" },
  { code: "+971", country: "AE" },
  { code: "+966", country: "SA" },
  { code: "+55", country: "BR" },
  { code: "+52", country: "MX" },
  { code: "+27", country: "ZA" },
];

interface BookingContactFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isModified: boolean;
  saveSuccess: boolean;
}

export function BookingContactForm({
  firstName,
  lastName,
  email,
  phone,
  countryCode,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onCountryCodeChange,
  onSave,
  isSaving,
  isModified,
  saveSuccess,
}: BookingContactFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          You can update your contact details below. Changes to check-in,
          check-out dates or booking status require contacting support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="John"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={onCountryCodeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((cc) => (
                  <SelectItem key={cc.code} value={cc.code}>
                    {cc.code} {cc.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="234 567 8900"
              className="flex-1"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div>
          {saveSuccess && (
            <span className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2Icon className="h-4 w-4" />
              Changes saved successfully
            </span>
          )}
        </div>
        <Button
          onClick={onSave}
          disabled={!isModified || isSaving}
          className="min-w-32"
        >
          {isSaving ? (
            <>
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

