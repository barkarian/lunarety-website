import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookingsDetails } from "./BookingsDetails";
import { BookingsDetailsSkeleton } from "./BookingsDetailsSkeleton";

interface PageProps {
  params: Promise<{
    secretUUIDs: string;
  }>;
}

export default async function BookingsPage({ params }: PageProps) {
  const { secretUUIDs } = await params;
  
  // Parse comma-separated UUIDs
  const uuids = secretUUIDs.split(",").filter(Boolean);

  return (
    <main className="min-h-screen pattern-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to home
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">
              {uuids.length > 1 ? "Your Bookings" : "Your Booking"}
            </h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<BookingsDetailsSkeleton count={uuids.length} />}>
          <BookingsDetails secretUUIDs={uuids} />
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

