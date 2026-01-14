"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  CalendarX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/components/providers/AuthProvider";
import { getUserBookings, type UserBooking } from "@/lib/actions/api";

// Date utilities
function formatDateFromNumber(dateNum: number | undefined): string {
  if (!dateNum) return "N/A";
  // dateNum is in YYYYMMDD format
  const dateStr = String(dateNum);
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  return format(new Date(year, month, day), "MMM d, yyyy");
}

// Status badge styles
function getStatusBadgeVariant(
  status: string | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "default";
    case "inquiry":
    case "on-hold":
      return "secondary";
    case "cancelled":
    case "no-show":
      return "destructive";
    default:
      return "outline";
  }
}

// Booking Card Component
function BookingCard({ booking }: { booking: UserBooking }) {
  const router = useRouter();

  const handleClick = () => {
    if (booking.secretUUID) {
      router.push(`/bookings/${booking.secretUUID}`);
    }
  };

  const checkIn = booking.resource?.checkIn;
  const checkOut = booking.resource?.checkOut;
  const adults = booking.resource?.adults || 0;
  const children = booking.resource?.children || 0;
  const totalGuests = adults + children;
  const totalPrice = booking.pricing?.totalAmount;

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-card rounded-xl border p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Booking info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header with status and booking name */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
              {booking.status || "Unknown"}
            </Badge>
            {booking.reservationName && (
              <span className="text-sm text-muted-foreground truncate">
                {booking.reservationName}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {formatDateFromNumber(checkIn)} — {formatDateFromNumber(checkOut)}
            </span>
          </div>

          {/* Guests */}
          {totalGuests > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span>
                {adults} adult{adults !== 1 ? "s" : ""}
                {children > 0 && `, ${children} child${children !== 1 ? "ren" : ""}`}
              </span>
            </div>
          )}

          {/* Source/OTA info */}
          {booking.ota && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="capitalize">{booking.ota}</span>
            </div>
          )}
        </div>

        {/* Right: Price and arrow */}
        <div className="flex items-center gap-4">
          {totalPrice !== undefined && totalPrice > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold">€{totalPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </button>
  );
}

// Skeleton for loading state
function BookingCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right space-y-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <CalendarX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven&apos;t made any bookings yet. Start exploring properties to make your first
        reservation.
      </p>
      <Link href="/">
        <Button>Browse Properties</Button>
      </Link>
    </div>
  );
}

// Main Page Component
export default function MyBookingsPage() {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read page from URL, default to 1
  const currentPage = Number(searchParams.get("page")) || 1;

  const [bookings, setBookings] = React.useState<UserBooking[]>([]);
  const [pagination, setPagination] = React.useState<{
    page: number;
    totalPages: number;
    totalDocs: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Function to update page in URL
  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page"); // Clean URL for page 1
    } else {
      params.set("page", String(page));
    }
    const queryString = params.toString();
    router.push(`/my-bookings${queryString ? `?${queryString}` : ""}`);
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch bookings
  React.useEffect(() => {
    async function fetchBookings() {
      if (!token) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getUserBookings(token, currentPage, ITEMS_PER_PAGE);

        if (result.success && result.bookings) {
          setBookings(result.bookings);
          if (result.pagination) {
            setPagination(result.pagination);
          }
        } else {
          setError(result.error || "Failed to fetch bookings");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error fetching bookings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated && token) {
      fetchBookings();
    }
  }, [isAuthenticated, token, currentPage]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen pattern-bg">
        <header className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-6 w-28" />
              <div className="w-32" />
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen pattern-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BackButton label="Back" fallbackHref="/" />
            <h1 className="text-lg font-semibold">My Bookings</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setPage(1)}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && bookings.length === 0 && <EmptyState />}

        {/* Bookings list */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="space-y-6">
            {/* Results count */}
            {pagination && (
              <p className="text-sm text-muted-foreground">
                Showing {bookings.length} of {pagination.totalDocs} booking
                {pagination.totalDocs !== 1 ? "s" : ""}
              </p>
            )}

            {/* Bookings */}
            <div className="space-y-4 stagger-children">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lunarety. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
