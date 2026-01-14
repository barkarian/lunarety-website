import { Suspense } from "react";

import { BackButton } from "@/components/ui/back-button";
import { BookingsDetails } from "./BookingsDetails";
import { BookingsDetailsSkeleton } from "./BookingsDetailsSkeleton";

interface PageProps {
  params: Promise<{
    secretUUID: string;
  }>;
}

export default async function BookingsPage({ params }: PageProps) {
  const { secretUUID } = await params;

  return (
    <main className="min-h-screen pattern-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BackButton label="Back" fallbackHref="/my-bookings" />
            <h1 className="text-lg font-semibold">Your Booking</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<BookingsDetailsSkeleton count={1} />}>
          <BookingsDetails secretUUID={secretUUID} />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lunarety. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

