"use client";

import { MapPinIcon } from "lucide-react";
import type { Property } from "@/lib/types";

interface BookingPropertyInfoProps {
  property: Property;
}

export function BookingPropertyInfo({ property }: BookingPropertyInfoProps) {
  return (
    <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
      {property.images?.[0]?.url && (
        <div
          className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
          style={{
            backgroundImage: `url(${property.images[0].url})`,
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{property.name}</h3>
        {(property.city || property.country) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {[property.city, property.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

