import { Suspense } from "react";
import type { Metadata } from "next";

import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { PackageDetails } from "./PackageDetails";
import { getPackageById } from "@/lib/actions/api";

interface PageProps {
  params: Promise<{
    packageId: string;
  }>;
  searchParams: Promise<{
    availabilityFrom?: string;
    availabilityTo?: string;
    adults?: string;
    children?: string;
  }>;
}

// Generate dynamic metadata for the package page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ packageId: string }>;
}): Promise<Metadata> {
  try {
    const { packageId } = await params;

    // Fetch the package to get its details
    const pkg = await getPackageById(packageId);

    if (!pkg) {
      return {
        title: "Package Not Found",
        description: "The package you're looking for could not be found.",
      };
    }

    const title = pkg.packageName || "Tour Package";
    const description =
      pkg.content?.shortDescription ||
      `Book ${pkg.packageName} - Travel to ${pkg.destination?.name || "amazing destinations"}`;
    const firstImage = pkg.content?.media?.[0]?.url;

    return {
      title: `${title} | Lunarety`,
      description,
      openGraph: {
        title,
        description,
        images: firstImage ? [{ url: firstImage, alt: pkg.packageName }] : undefined,
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
    console.error("Failed to generate package metadata:", error);
    return {
      title: "Package | Lunarety",
      description: "View package details and book your trip.",
    };
  }
}

export default async function PackagePage({
  params,
  searchParams,
}: PageProps) {
  const { packageId } = await params;
  const search = await searchParams;

  return (
    <main className="min-h-screen pattern-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <BackButton label="Back to packages" fallbackHref="/packages" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<PackageDetailsSkeleton />}>
          <PackageDetails packageId={packageId} searchParams={search} />
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

function PackageDetailsSkeleton() {
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
