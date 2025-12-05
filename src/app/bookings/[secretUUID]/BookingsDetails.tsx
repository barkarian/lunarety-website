"use client";

import * as React from "react";
import Link from "next/link";
import { XCircleIcon, ChevronDownIcon, ChevronUpIcon, BedDoubleIcon, UsersIcon } from "lucide-react";

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
import type { Booking, BookingHolder, RelatedBooking } from "@/lib/types";
import { calculateNights, formatCurrency } from "@/lib/types";

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

// Contact form state for a single booking
interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  isModified: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
}

export function BookingsDetails({ secretUUID }: BookingsDetailsProps) {
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Separate contact form states for main booking and related bookings
  const [mainContactForm, setMainContactForm] = React.useState<ContactFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "",
    isModified: false,
    isSaving: false,
    saveSuccess: false,
  });

  const [relatedContactForms, setRelatedContactForms] = React.useState<Map<string, ContactFormState>>(
    new Map()
  );

  // Track which related bookings are expanded
  const [expandedRelated, setExpandedRelated] = React.useState<Set<string>>(new Set());

  // Initialize contact form from booking holder
  const initContactFormFromBooking = (
    b: Booking | RelatedBooking
  ): ContactFormState => {
    const holder = b.bookingHolder;
    if (holder) {
      return {
        firstName: holder.firstName || "",
        lastName: holder.lastName || "",
        email: holder.email || "",
        phone: holder.phone || "",
        countryCode: holder.countryCode || "",
        isModified: false,
        isSaving: false,
        saveSuccess: false,
      };
    }
    // Fallback to legacy fields
    const nameParts = (b.guestName || "").split(" ");
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: b.guestEmail || "",
      phone: b.guestPhone || "",
      countryCode: "",
      isModified: false,
      isSaving: false,
      saveSuccess: false,
    };
  };

  // Fetch booking on mount
  React.useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true);
        const result = await getBooking(secretUUID);

        if (result?.booking) {
          const bookingData = result.booking as Booking;
          setBooking(bookingData);

          // Initialize main booking contact form
          setMainContactForm(initContactFormFromBooking(bookingData));

          // Initialize related bookings contact forms
          if (bookingData.relatedBookings && bookingData.relatedBookings.length > 0) {
            const relatedForms = new Map<string, ContactFormState>();
            bookingData.relatedBookings.forEach((rb) => {
              relatedForms.set(rb.secretUUID, initContactFormFromBooking(rb));
            });
            setRelatedContactForms(relatedForms);
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

  // Handle save for main booking
  const handleSaveMainBooking = async () => {
    if (!booking) return;

    setMainContactForm((prev) => ({ ...prev, isSaving: true, saveSuccess: false }));

    try {
      const bookingHolder: BookingHolder = {
        firstName: mainContactForm.firstName || undefined,
        lastName: mainContactForm.lastName || undefined,
        email: mainContactForm.email || undefined,
        phone: mainContactForm.phone || undefined,
        countryCode: mainContactForm.countryCode || undefined,
      };

      await updateBookingContact(secretUUID, bookingHolder);

      // Refresh booking data
      const updatedResult = await getBooking(secretUUID);
      if (updatedResult?.booking) {
        setBooking(updatedResult.booking as Booking);
      }

      setMainContactForm((prev) => ({
        ...prev,
        isSaving: false,
        saveSuccess: true,
        isModified: false,
      }));
      setTimeout(() => {
        setMainContactForm((prev) => ({ ...prev, saveSuccess: false }));
      }, 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update booking");
      setMainContactForm((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Handle save for related booking
  const handleSaveRelatedBooking = async (relatedSecretUUID: string) => {
    const formState = relatedContactForms.get(relatedSecretUUID);
    if (!formState) return;

    setRelatedContactForms((prev) => {
      const newMap = new Map(prev);
      newMap.set(relatedSecretUUID, { ...formState, isSaving: true, saveSuccess: false });
      return newMap;
    });

    try {
      const bookingHolder: BookingHolder = {
        firstName: formState.firstName || undefined,
        lastName: formState.lastName || undefined,
        email: formState.email || undefined,
        phone: formState.phone || undefined,
        countryCode: formState.countryCode || undefined,
      };

      await updateBookingContact(relatedSecretUUID, bookingHolder);

      // Refresh booking data
      const updatedResult = await getBooking(secretUUID);
      if (updatedResult?.booking) {
        const bookingData = updatedResult.booking as Booking;
        setBooking(bookingData);

        // Update related forms with new data
        if (bookingData.relatedBookings) {
          const relatedBooking = bookingData.relatedBookings.find(
            (rb) => rb.secretUUID === relatedSecretUUID
          );
          if (relatedBooking) {
            const updatedForm = initContactFormFromBooking(relatedBooking);
            setRelatedContactForms((prev) => {
              const newMap = new Map(prev);
              newMap.set(relatedSecretUUID, {
                ...updatedForm,
                saveSuccess: true,
              });
              return newMap;
            });
          }
        }
      }

      setTimeout(() => {
        setRelatedContactForms((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(relatedSecretUUID);
          if (current) {
            newMap.set(relatedSecretUUID, { ...current, saveSuccess: false });
          }
          return newMap;
        });
      }, 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update booking");
      setRelatedContactForms((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(relatedSecretUUID);
        if (current) {
          newMap.set(relatedSecretUUID, { ...current, isSaving: false });
        }
        return newMap;
      });
    }
  };

  // Update main contact form field
  const updateMainFormField = (field: keyof ContactFormState, value: string) => {
    setMainContactForm((prev) => ({
      ...prev,
      [field]: value,
      isModified: true,
    }));
  };

  // Update related contact form field
  const updateRelatedFormField = (
    relatedSecretUUID: string,
    field: keyof ContactFormState,
    value: string
  ) => {
    setRelatedContactForms((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(relatedSecretUUID);
      if (current) {
        newMap.set(relatedSecretUUID, {
          ...current,
          [field]: value,
          isModified: true,
        });
      }
      return newMap;
    });
  };

  // Toggle expanded state for related booking
  const toggleRelatedExpanded = (relatedSecretUUID: string) => {
    setExpandedRelated((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(relatedSecretUUID)) {
        newSet.delete(relatedSecretUUID);
      } else {
        newSet.add(relatedSecretUUID);
      }
      return newSet;
    });
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
  const hasRelatedBookings = booking.relatedBookings && booking.relatedBookings.length > 0;
  const totalBookings = 1 + (booking.relatedBookings?.length || 0);
  const totalPrice =
    booking.totalPrice +
    (booking.relatedBookings?.reduce((sum, rb) => sum + rb.totalPrice, 0) || 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Status Card */}
      <BookingStatusCard status={booking.status} />

      {/* Multi-room summary if applicable */}
      {hasRelatedBookings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <BedDoubleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Multi-Room Reservation</p>
                  <p className="text-sm text-muted-foreground">
                    {totalBookings} rooms booked for {nights} night{nights !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalPrice, booking.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Booking Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {hasRelatedBookings ? "Room 1 (Main Booking)" : "Booking Details"}
              </CardTitle>
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

      {/* Main Booking Contact Information (Editable) */}
      <BookingContactForm
        firstName={mainContactForm.firstName}
        lastName={mainContactForm.lastName}
        email={mainContactForm.email}
        phone={mainContactForm.phone}
        countryCode={mainContactForm.countryCode}
        onFirstNameChange={(value) => updateMainFormField("firstName", value)}
        onLastNameChange={(value) => updateMainFormField("lastName", value)}
        onEmailChange={(value) => updateMainFormField("email", value)}
        onPhoneChange={(value) => updateMainFormField("phone", value)}
        onCountryCodeChange={(value) => updateMainFormField("countryCode", value)}
        onSave={handleSaveMainBooking}
        isSaving={mainContactForm.isSaving}
        isModified={mainContactForm.isModified}
        saveSuccess={mainContactForm.saveSuccess}
      />

      {/* Related Bookings (Additional Rooms) */}
      {hasRelatedBookings && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Additional Rooms
          </h3>
          <p className="text-sm text-muted-foreground">
            Each room can have different contact information. Expand a room to view details and edit contact info.
          </p>

          {booking.relatedBookings!.map((relatedBooking, index) => {
            const isExpanded = expandedRelated.has(relatedBooking.secretUUID);
            const formState = relatedContactForms.get(relatedBooking.secretUUID);
            const relatedProperty =
              typeof relatedBooking.rooms?.[0] === "object"
                ? property
                : null;

            return (
              <Card key={relatedBooking.secretUUID} className="overflow-hidden">
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleRelatedExpanded(relatedBooking.secretUUID)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                          {index + 2}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            Room {index + 2}
                            {relatedBooking.rooms?.[0]?.roomName &&
                              ` - ${relatedBooking.rooms[0].roomName}`}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {relatedBooking.bookingHolder?.firstName
                              ? `${relatedBooking.bookingHolder.firstName} ${relatedBooking.bookingHolder.lastName || ""}`
                              : relatedBooking.guestName || "Guest"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            relatedBooking.status === "confirmed"
                              ? "default"
                              : relatedBooking.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {relatedBooking.status}
                        </Badge>
                        <span className="font-semibold">
                          {formatCurrency(relatedBooking.totalPrice, relatedBooking.currency)}
                        </span>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="pt-0 space-y-4">
                    <Separator />

                    {/* Room Details */}
                    <BookingDatesInfo
                      checkIn={relatedBooking.checkIn}
                      checkOut={relatedBooking.checkOut}
                      guests={relatedBooking.guests}
                      totalPrice={relatedBooking.totalPrice}
                      currency={relatedBooking.currency}
                    />

                    {relatedBooking.rooms && relatedBooking.rooms.length > 0 && (
                      <>
                        <Separator />
                        <BookingRoomsList
                          rooms={relatedBooking.rooms}
                          currency={relatedBooking.currency}
                        />
                      </>
                    )}

                    {/* Contact Form for Related Booking */}
                    {formState && (
                      <>
                        <Separator />
                        <div className="pt-2">
                          <h4 className="font-medium mb-3">Contact Information for Room {index + 2}</h4>
                          <BookingContactForm
                            firstName={formState.firstName}
                            lastName={formState.lastName}
                            email={formState.email}
                            phone={formState.phone}
                            countryCode={formState.countryCode}
                            onFirstNameChange={(value) =>
                              updateRelatedFormField(relatedBooking.secretUUID, "firstName", value)
                            }
                            onLastNameChange={(value) =>
                              updateRelatedFormField(relatedBooking.secretUUID, "lastName", value)
                            }
                            onEmailChange={(value) =>
                              updateRelatedFormField(relatedBooking.secretUUID, "email", value)
                            }
                            onPhoneChange={(value) =>
                              updateRelatedFormField(relatedBooking.secretUUID, "phone", value)
                            }
                            onCountryCodeChange={(value) =>
                              updateRelatedFormField(relatedBooking.secretUUID, "countryCode", value)
                            }
                            onSave={() => handleSaveRelatedBooking(relatedBooking.secretUUID)}
                            isSaving={formState.isSaving}
                            isModified={formState.isModified}
                            saveSuccess={formState.saveSuccess}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <BookingHelpSection />
    </div>
  );
}
