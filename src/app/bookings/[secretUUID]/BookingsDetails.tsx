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
import { getBooking, updateBookingContact } from "@/lib/actions/api";
import type { Booking, BookingHolder } from "@/lib/types";
import { calculateNights } from "@/lib/types";

import { BookingStatusCard } from "./BookingStatusCard";
import { BookingPropertyInfo } from "./BookingPropertyInfo";
import { BookingDatesInfo } from "./BookingDatesInfo";
import { BookingRoomsList } from "./BookingRoomsList";
import { BookingContactForm } from "./BookingContactForm";
import { BookingHelpSection } from "./BookingHelpSection";
import { BookingsDetailsSkeleton } from "./BookingsDetailsSkeleton";

interface BookingsDetailsProps {
  secretUUID: string;
}

export function BookingsDetails({ secretUUID }: BookingsDetailsProps) {
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Editable fields
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");

  // Track if form has been modified
  const [isModified, setIsModified] = React.useState(false);

  // Fetch booking on mount
  React.useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true);
        const result = await getBooking(secretUUID);

        if (result?.booking) {
          const bookingData = result.booking as Booking;
          setBooking(bookingData);
          
          // Initialize form with booking's contact info
          const holder = bookingData.bookingHolder;
          
          if (holder) {
            setFirstName(holder.firstName || "");
            setLastName(holder.lastName || "");
            setEmail(holder.email || "");
            setPhone(holder.phone || "");
            setCountryCode(holder.countryCode || "");
          } else {
            // Fallback to legacy fields
            const nameParts = (bookingData.guestName || "").split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setEmail(bookingData.guestEmail || "");
            setPhone(bookingData.guestPhone || "");
          }
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
  }, [secretUUID]);

  // Handle save - update booking contact info
  const handleSave = async () => {
    if (!booking) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const bookingHolder: BookingHolder = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        countryCode: countryCode || undefined,
      };

      await updateBookingContact(secretUUID, bookingHolder);

      // Refresh booking data
      const updatedResult = await getBooking(secretUUID);
      if (updatedResult?.booking) {
        setBooking(updatedResult.booking as Booking);
      }

      setSaveSuccess(true);
      setIsModified(false);
      setTimeout(() => setSaveSuccess(false), 3000);
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
    return <BookingsDetailsSkeleton count={1} />;
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

  const property = typeof booking.property === "object" ? booking.property : null;
  const nights = calculateNights(booking.checkIn, booking.checkOut);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Status Card */}
      <BookingStatusCard status={booking.status} />

      {/* Booking Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Booking Details</CardTitle>
              <CardDescription>
                Reference: <span className="font-mono text-xs">{booking.id}...</span>
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

      {/* Contact Information (Editable) - Shared across all bookings */}
      <BookingContactForm
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        countryCode={countryCode}
        onFirstNameChange={(value) => handleFieldChange(setFirstName, value)}
        onLastNameChange={(value) => handleFieldChange(setLastName, value)}
        onEmailChange={(value) => handleFieldChange(setEmail, value)}
        onPhoneChange={(value) => handleFieldChange(setPhone, value)}
        onCountryCodeChange={(value) => handleFieldChange(setCountryCode, value)}
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

