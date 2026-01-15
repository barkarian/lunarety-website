"use client";

import * as React from "react";

import { PackageCard } from "./PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Package } from "@/lib/types";

interface PackageGridProps {
  packages: Package[];
  isLoading?: boolean;
  searchParams?: string;
  className?: string;
}

export function PackageGrid({
  packages,
  isLoading,
  searchParams,
  className,
}: PackageGridProps) {
  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PackageCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">No packages found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Try adjusting your search criteria or dates to find available
          packages.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children ${className}`}
    >
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          searchParams={searchParams}
        />
      ))}
    </div>
  );
}

function PackageCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
      <Skeleton className="aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="pt-2 border-t border-border/50 flex justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
