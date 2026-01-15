import { Suspense } from "react";
import { PackageSearchBar } from "@/components/search/PackageSearchBar";
import { PackageResults } from "./PackageResults";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedContent } from "@/components/auth/ProtectedContent";

interface PageProps {
  searchParams: Promise<{
    departure?: string;
    availabilityFrom?: string;
    availabilityTo?: string;
    rooms?: string;
  }>;
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <ProtectedContent>
      <main className="min-h-screen pattern-bg">
        {/* Hero Section */}
        <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Discover Amazing
                <span className="block text-primary">Travel Packages</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore handpicked tour packages for your next adventure. 
                Select your travel window and find the perfect journey.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto animate-fade-in-up animation-delay-200">
              <Suspense fallback={<SearchBarSkeleton />}>
                <PackageSearchBar />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<ResultsSkeleton />}>
              <PackageResults searchParams={params} />
            </Suspense>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Lunarety. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </ProtectedContent>
  );
}

function SearchBarSkeleton() {
  return (
    <div className="w-full glass rounded-2xl shadow-lg border border-border/50 p-3">
      <div className="flex flex-col lg:flex-row gap-3">
        <Skeleton className="h-14 flex-1" />
        <Skeleton className="h-14 flex-1 lg:max-w-xs" />
        <Skeleton className="h-14 w-32" />
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl overflow-hidden border border-border/50"
          >
            <Skeleton className="aspect-[4/3]" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
