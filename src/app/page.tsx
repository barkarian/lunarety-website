import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { PropertyResults } from "./PropertyResults";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    rooms?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen pattern-bg">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Find Your Perfect
              <span className="gradient-text block">Getaway</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover handpicked properties for your next adventure. Book with
              confidence and create unforgettable memories.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto animate-fade-in-up animation-delay-200">
            <Suspense fallback={<SearchBarSkeleton />}>
              <SearchBar />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<ResultsSkeleton />}>
            <PropertyResults searchParams={params} />
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
