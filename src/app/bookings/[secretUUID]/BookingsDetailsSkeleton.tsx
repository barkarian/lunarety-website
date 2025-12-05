"use client";

interface BookingsDetailsSkeletonProps {
  count?: number;
}

export function BookingsDetailsSkeleton({ count = 1 }: BookingsDetailsSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Status Card Skeleton */}
      <div className="bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Summary Card Skeleton (only for multiple bookings) */}
      {count > 1 && (
        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-56 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Booking Card Skeletons */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border p-6 space-y-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Contact Form Skeleton */}
      <div className="bg-card rounded-2xl border p-6 space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

