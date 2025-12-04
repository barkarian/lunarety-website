"use client";

import * as React from "react";
import Link from "next/link";
import { XCircleIcon, CheckCircle2Icon } from "lucide-react";

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
import { getBookings, updateBookingContact } from "@/lib/actions/api";
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
  secretUUIDs: string[];
}

export function BookingsDetails({ secretUUIDs }: BookingsDetailsProps) {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Editable fields - shared across all bookings
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");

  // Track if form has been modified
  const [isModified, setIsModified] = React.useState(false);

  // Fetch all bookings on mount
  React.useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true);
        const results = await getBookings(secretUUIDs);

        if (results && results.length > 0) {
          setBookings(results as Booking[]);
          
          // Initialize form with first booking's contact info
          const firstBooking = results[0] as Booking;
          const holder = firstBooking.bookingHolder;
          
          if (holder) {
            setFirstName(holder.firstName || "");
            setLastName(holder.lastName || "");
            setEmail(holder.email || "");
            setPhone(holder.phone || "");
            setCountryCode(holder.countryCode || "");
          } else {
            // Fallback to legacy fields
            const nameParts = (firstBooking.guestName || "").split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setEmail(firstBooking.guestEmail || "");
            setPhone(firstBooking.guestPhone || "");
          }
        } else {
          setError("No bookings found");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch bookings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, [secretUUIDs]);

  // Handle save - update all bookings with the same contact info
  const handleSave = async () => {
    if (bookings.length === 0) return;

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

      // Update all bookings in parallel
      const updatePromises = secretUUIDs.map(uuid =>
        updateBookingContact(uuid, bookingHolder)
      );

      await Promise.all(updatePromises);

      // Refresh bookings data
      const updatedBookings = await getBookings(secretUUIDs);
      setBookings(updatedBookings as Booking[]);

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
    return <BookingsDetailsSkeleton count={secretUUIDs.length} />;
  }

  if (error || bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <XCircleIcon className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {error || "Bookings not found"}
        </h3>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find these bookings. Please check the URL and try
          again.
        </p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  // Calculate totals across all bookings
  const totalPrice = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalGuests = bookings.reduce((sum, b) => sum + (b.guests || 0), 0);
  const currency = bookings[0]?.currency || "EUR";
  
  // Get unique statuses
  const statuses = [...new Set(bookings.map(b => b.status))];
  const overallStatus = statuses.length === 1 ? statuses[0] : "pending";

  // All bookings should have the same dates (from same order)
  const checkIn = bookings[0]?.checkIn;
  const checkOut = bookings[0]?.checkOut;
  const nights = calculateNights(checkIn, checkOut);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Overall Status Card */}
      <BookingStatusCard status={overallStatus} />

      {/* Summary Card when multiple bookings */}
      {bookings.length > 1 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <CheckCircle2Icon className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {bookings.length} Rooms Booked
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your reservation includes {bookings.length} room{bookings.length !== 1 ? "s" : ""} for {nights} night{nights !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Booking Cards */}
      {bookings.map((booking, index) => {
        const property =
          typeof booking.property === "object" ? booking.property : null;

        return (
          <Card key={booking.secretUUID || booking.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {bookings.length > 1 ? `Room ${index + 1}` : "Booking Details"}
                  </CardTitle>
                  <CardDescription>
                    Reference: <span className="font-mono text-xs">{booking.secretUUID?.slice(0, 8) || booking.id}...</span>
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
        );
      })}

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

