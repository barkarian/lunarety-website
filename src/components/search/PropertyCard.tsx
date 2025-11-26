"use client";

import * as React from "react";
import Link from "next/link";
import { MapPinIcon, StarIcon, UsersIcon, BedIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/types";

interface PropertyCardProps {
  property: Property;
  searchParams?: string;
  className?: string;
}

export function PropertyCard({
  property,
  searchParams,
  className,
}: PropertyCardProps) {
  const href = `/properties/${property.id}${searchParams ? `?${searchParams}` : ""}`;

  const mainImage = property.images?.[0]?.url || "/placeholder-property.jpg";
  const minPrice = property.availability?.minPrice || property.pricePerNight;
  const isAvailable = property.availability?.available !== false;

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${mainImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {!isAvailable && (
              <Badge variant="destructive" className="backdrop-blur-sm">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Rating */}
          {property.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
              <StarIcon className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold">
                {property.rating.toFixed(1)}
              </span>
              {property.reviewCount && (
                <span className="text-xs text-muted-foreground">
                  ({property.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Location */}
          {(property.city || property.country) && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium truncate">
                {[property.city, property.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {property.name}
          </h3>

          {/* Quick Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.rooms && property.rooms.length > 0 && (
              <div className="flex items-center gap-1.5">
                <BedIcon className="h-4 w-4" />
                <span>
                  {property.rooms.length} room
                  {property.rooms.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {property.rooms?.[0]?.maxGuests && (
              <div className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" />
                <span>Up to {property.rooms[0].maxGuests} guests</span>
              </div>
            )}
          </div>

          {/* Amenities Preview */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{property.amenities.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Price */}
          <div className="pt-2 border-t border-border/50 flex items-end justify-between">
            {minPrice !== undefined ? (
              <div>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(minPrice, property.currency)}
                </span>
                <span className="text-sm text-muted-foreground"> / night</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Price on request
              </span>
            )}

            <span className="text-xs font-medium text-primary group-hover:underline">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

