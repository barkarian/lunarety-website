"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  UsersIcon,
  MapPinIcon,
  CreditCardIcon,
  BedIcon,
  SaveIcon,
  Loader2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { getBooking, updateBooking } from "@/lib/actions/api";
import { formatCurrency } from "@/lib/types";
import type { Booking, Property } from "@/lib/types";

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
  const [notes, setNotes] = React.useState("");

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
          setNotes(result.booking.notes || "");
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
    Math.abs(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const statusConfig = {
    pending: {
      icon: ClockIcon,
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      label: "Pending Confirmation",
      description:
        "Your booking is being reviewed. You'll receive confirmation shortly.",
    },
    confirmed: {
      icon: CheckCircle2Icon,
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      label: "Confirmed",
      description: "Your booking is confirmed. We look forward to hosting you!",
    },
    cancelled: {
      icon: XCircleIcon,
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      label: "Cancelled",
      description: "This booking has been cancelled.",
    },
    completed: {
      icon: CheckCircle2Icon,
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: "Completed",
      description: "Thank you for staying with us!",
    },
  };

  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Status Card */}
      <Card className={`${status.color} border-2`}>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <StatusIcon className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{status.label}</h2>
              <p className="text-sm opacity-80">{status.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {property && (
            <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
              {property.images?.[0]?.url && (
                <div
                  className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                  style={{
                    backgroundImage: `url(${property.images[0].url})`,
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {property.name}
                </h3>
                {(property.city || property.country) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {[property.city, property.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Dates & Guests Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Check-in</span>
              </div>
              <p className="text-lg font-semibold">
                {checkInDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">From 3:00 PM</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Check-out</span>
              </div>
              <p className="text-lg font-semibold">
                {checkOutDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">Until 11:00 AM</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                <span>Guests</span>
              </div>
              <p className="text-lg font-semibold">
                {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCardIcon className="h-4 w-4" />
                <span>Total Price</span>
              </div>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(booking.totalPrice, booking.currency)}
              </p>
            </div>
          </div>

          {/* Booked Rooms */}
          {booking.rooms && booking.rooms.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BedIcon className="h-4 w-4" />
                  Booked Rooms
                </h4>
                <div className="space-y-2">
                  {booking.rooms.map((room, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{room.roomName}</p>
                        <p className="text-sm text-muted-foreground">
                          {room.adults} adult{room.adults !== 1 ? "s" : ""}
                          {room.children > 0 &&
                            `, ${room.children} child${room.children !== 1 ? "ren" : ""}`}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(room.price, booking.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact Information (Editable) */}
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
                onChange={(e) =>
                  handleFieldChange(setGuestName, e.target.value)
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) =>
                  handleFieldChange(setGuestEmail, e.target.value)
                }
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
              onChange={(e) => handleFieldChange(setGuestPhone, e.target.value)}
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
            onClick={handleSave}
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

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="text-center">
            <h4 className="font-semibold mb-2">Need Help?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              If you need to modify your dates, cancel your booking, or have any
              questions, please contact our support team.
            </p>
            <Button variant="outline">Contact Support</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6 space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-6 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6 space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

