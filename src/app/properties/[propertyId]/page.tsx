import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyDetails } from "./PropertyDetails";
import { getAvailability } from "@/lib/actions/api";
import { getDefaultDates } from "@/lib/types";

interface PageProps {
  params: Promise<{
    propertyId: string;
  }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    rooms?: string;
  }>;
}

// Generate dynamic metadata for the property page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}): Promise<Metadata> {
  try {
    const { propertyId } = await params;
    const defaults = getDefaultDates();

    // Fetch the property to get its details
    const result = await getAvailability({
      from: defaults.from,
      to: defaults.to,
      rooms: [{ adults: 2, children: 0 }],
      propertyIds: [parseInt(propertyId)],
    });

    const property = result.properties?.[0];

    if (!property) {
      return {
        title: "Property Not Found",
        description: "The property you're looking for could not be found.",
      };
    }

    const title = property.name;
    const description =
      property.shortDescription ||
      property.description ||
      `Book ${property.name} - ${[property.city, property.country].filter(Boolean).join(", ")}`;
    const firstImage = property.images?.[0]?.url;

    return {
      title: `${title} | Lunarety`,
      description,
      openGraph: {
        title,
        description,
        images: firstImage ? [{ url: firstImage, alt: property.name }] : undefined,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: firstImage || undefined,
      },
    };
  } catch (error) {
    console.error("Failed to generate property metadata:", error);
    return {
      title: "Property | Lunarety",
      description: "View property details and book your stay.",
    };
  }
}

export default async function PropertyPage({
  params,
  searchParams,
}: PageProps) {
  const { propertyId } = await params;
  const search = await searchParams;

  return (
    <main className="min-h-screen pattern-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/?${new URLSearchParams(search as Record<string, string>).toString()}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to search
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<PropertyDetailsSkeleton />}>
          <PropertyDetails propertyId={propertyId} searchParams={search} />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lunarety. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function PropertyDetailsSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Image Gallery Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="aspect-square rounded-xl" />
        </div>
      </div>

      {/* Info Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

