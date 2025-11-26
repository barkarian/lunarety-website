"use client";

import { CalendarIcon, UsersIcon, CreditCardIcon } from "lucide-react";
import { formatCurrency } from "@/lib/types";

interface BookingDatesInfoProps {
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency?: string;
}

export function BookingDatesInfo({
  checkIn,
  checkOut,
  guests,
  totalPrice,
  currency,
}: BookingDatesInfoProps) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return (
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
          {guests} guest{guests !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCardIcon className="h-4 w-4" />
          <span>Total Price</span>
        </div>
        <p className="text-lg font-semibold text-primary">
          {formatCurrency(totalPrice, currency)}
        </p>
      </div>
    </div>
  );
}

