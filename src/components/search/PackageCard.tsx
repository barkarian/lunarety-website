"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, CalendarIcon, PlaneIcon, ShipIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Package } from "@/lib/types";
import { formatCurrency, formatDateNumber } from "@/lib/types";

interface PackageCardProps {
  pkg: Package;
  searchParams?: string;
  className?: string;
}

export function PackageCard({
  pkg,
  searchParams,
  className,
}: PackageCardProps) {
  const href = `/packages/${pkg.id}${searchParams ? `?${searchParams}` : ""}`;

  // Use thumbnailUrl for grid view to save bandwidth
  const mainImage = pkg.content?.media?.[0]?.thumbnailUrl || pkg.content?.media?.[0]?.url || "/placeholder-property.jpg";
  const fromPrice = pkg.fromPrice;
  const isRequestOnly = fromPrice === 0 || fromPrice === undefined;

  // Get transportation icon
  const TransportIcon = pkg.meta?.transportation === 'plane' ? PlaneIcon : ShipIcon;

  // Format availability period
  const availabilityPeriod = pkg.content?.availabilityPeriod;
  const hasAvailability = availabilityPeriod?.from && availabilityPeriod?.to;

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={mainImage}
            alt={pkg.packageName || "Package image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Transportation Badge */}
          {pkg.meta?.transportation && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
              <TransportIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold capitalize">
                {pkg.meta.transportation}
              </span>
            </div>
          )}

          {/* Duration Badge */}
          {pkg.content?.durationInDaysOptions && Array.isArray(pkg.content.durationInDaysOptions) && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground backdrop-blur-sm rounded-full px-2.5 py-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">
                {pkg.content.durationInDaysOptions.join(" / ")} days
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Destination */}
          {pkg.destination && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium truncate">
                {pkg.destination.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {pkg.packageName}
          </h3>

          {/* Short Description */}
          {pkg.content?.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {pkg.content.shortDescription}
            </p>
          )}

          {/* Departures */}
          {pkg.departures && pkg.departures.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-xs">From:</span>
              <span className="text-xs font-medium">
                {pkg.departures.map(d => d.name).slice(0, 2).join(", ")}
                {pkg.departures.length > 2 && ` +${pkg.departures.length - 2}`}
              </span>
            </div>
          )}

          {/* Availability Period */}
          {hasAvailability && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {formatDateNumber(availabilityPeriod.from!)} — {formatDateNumber(availabilityPeriod.to!)}
              </span>
            </div>
          )}

          {/* Tags */}
          {pkg.meta?.tags && pkg.meta.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pkg.meta.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {pkg.meta.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{pkg.meta.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Price */}
          <div className="pt-2 border-t border-border/50 flex items-end justify-between">
            {isRequestOnly ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
                  Request Only
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs text-muted-foreground">from </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(fromPrice!, "EUR")}
                </span>
                <span className="text-sm text-muted-foreground"> / person</span>
              </div>
            )}

            <span className="text-xs font-medium text-primary group-hover:underline">
              {isRequestOnly ? "Make Request →" : "View Details →"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
