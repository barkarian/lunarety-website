"use client";

import * as React from "react";
import Link from "next/link";
import { XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBooking, updateBooking } from "@/lib/actions/api";
import type { Booking } from "@/lib/types";

import { BookingStatusCard } from "./BookingStatusCard";
import { BookingPropertyInfo } from "./BookingPropertyInfo";
import { BookingDatesInfo } from "./BookingDatesInfo";
import { BookingRoomsList } from "./BookingRoomsList";
import { BookingContactForm } from "./BookingContactForm";
import { BookingHelpSection } from "./BookingHelpSection";
import { BookingDetailsSkeleton } from "./BookingDetailsSkeleton";

interface BookingDetailsProps {
  bookingId: string;
}

export function BookingDetails({ bookingId }: BookingDetailsProps) {
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Editable fields
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");

  // Track if form has been modified
  const [isModified, setIsModified] = React.useState(false);

  // Fetch booking on mount
  React.useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true);
        const result = await getBooking(bookingId);

        if (result.booking) {
          setBooking(result.booking as Booking);
          setGuestName(result.booking.guestName || "");
          setGuestEmail(result.booking.guestEmail || "");
          setGuestPhone(result.booking.guestPhone || "");
        } else {
          setError("Booking not found");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch booking");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId]);

  // Handle save
  const handleSave = async () => {
    if (!booking) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const result = await updateBooking(bookingId, {
        guestName,
        guestEmail,
        guestPhone,
      });

      if (result.booking) {
        setBooking(result.booking as Booking);
        setSaveSuccess(true);
        setIsModified(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update booking");
    } finally {
      setIsSaving(false);
    }
  };

  // Update modified state when fields change
  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setIsModified(true);
  };

  if (isLoading) {
    return <BookingDetailsSkeleton />;
  }

  if (error || !booking) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <XCircleIcon className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {error || "Booking not found"}
        </h3>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find this booking. Please check the URL and try
          again.
        </p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  const property =
    typeof booking.property === "object" ? booking.property : null;
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const nights = Math.ceil(
    Math.abs(checkOutDate.getTime() - checkInDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Status Card */}
      <BookingStatusCard status={booking.status} />

      {/* Booking Reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Booking Details</CardTitle>
              <CardDescription>
                Reference: <span className="font-mono">{booking.id}</span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {nights} night{nights !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Info */}
          {property && <BookingPropertyInfo property={property} />}

          <Separator />

          {/* Dates & Guests Grid */}
          <BookingDatesInfo
            checkIn={booking.checkIn}
            checkOut={booking.checkOut}
            guests={booking.guests}
            totalPrice={booking.totalPrice}
            currency={booking.currency}
          />

          {/* Booked Rooms */}
          {booking.rooms && booking.rooms.length > 0 && (
            <>
              <Separator />
              <BookingRoomsList
                rooms={booking.rooms}
                currency={booking.currency}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact Information (Editable) */}
      <BookingContactForm
        guestName={guestName}
        guestEmail={guestEmail}
        guestPhone={guestPhone}
        onGuestNameChange={(value) => handleFieldChange(setGuestName, value)}
        onGuestEmailChange={(value) => handleFieldChange(setGuestEmail, value)}
        onGuestPhoneChange={(value) => handleFieldChange(setGuestPhone, value)}
        onSave={handleSave}
        isSaving={isSaving}
        isModified={isModified}
        saveSuccess={saveSuccess}
      />

      {/* Help Section */}
      <BookingHelpSection />
    </div>
  );
}
