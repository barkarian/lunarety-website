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

interface BookingContactFormProps {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isModified: boolean;
  saveSuccess: boolean;
}

export function BookingContactForm({
  guestName,
  guestEmail,
  guestPhone,
  onGuestNameChange,
  onGuestEmailChange,
  onGuestPhoneChange,
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
            <Label htmlFor="guestName">Full Name</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => onGuestNameChange(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email</Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => onGuestEmailChange(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestPhone">Phone Number</Label>
          <Input
            id="guestPhone"
            type="tel"
            value={guestPhone}
            onChange={(e) => onGuestPhoneChange(e.target.value)}
            placeholder="+1 234 567 8900"
          />
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

