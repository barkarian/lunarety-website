"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, MapPinIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "./DateRangePicker";
import { RoomSelector } from "./RoomSelector";
import { useWebsite } from "@/components/providers/WebsiteProvider";
import {
  type RoomOccupancy,
  type DateRangeNumber,
  parseRooms,
  serializeRooms,
  getDefaultDates,
} from "@/lib/types";

interface SearchBarProps {
  onSearch?: () => void;
  className?: string;
}

export function SearchBar({ onSearch, className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterProperties, isLoading: websiteLoading } = useWebsite();

  // Get available destinations from website filters
  const destinations = filterProperties?.destinations || [];

  // Initialize destination from URL (optional filter)
  const [destinationId, setDestinationId] = React.useState<string | undefined>(() => {
    const destinationParam = searchParams.get("destination");
    return destinationParam || undefined;
  });

  // Initialize state from URL params or defaults
  const [dateRange, setDateRange] = React.useState<DateRangeNumber | undefined>(
    () => {
      const fromParam = searchParams.get("from");
      const toParam = searchParams.get("to");

      if (fromParam && toParam) {
        return {
          from: parseInt(fromParam, 10),
          to: parseInt(toParam, 10),
        };
      }

      return getDefaultDates();
    }
  );

  const [rooms, setRooms] = React.useState<RoomOccupancy[]>(() => {
    const roomsParam = searchParams.get("rooms");
    return parseRooms(roomsParam || undefined);
  });

  const handleSearch = () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const params = new URLSearchParams();
    if (destinationId) {
      params.set("destination", destinationId);
    }
    params.set("from", String(dateRange.from));
    params.set("to", String(dateRange.to));
    params.set("rooms", serializeRooms(rooms));

    router.push(`/?${params.toString()}`);
    onSearch?.();
  };

  // Get the selected destination name for display
  const selectedDestination = destinations.find(d => String(d.id) === destinationId);

  return (
    <div
      className={`w-full glass rounded-2xl shadow-lg border border-border/50 p-3 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Destination Filter - Optional */}
        {destinations.length > 0 && (
          <>
            <div className="flex-1 lg:max-w-xs">
              <Select 
                value={destinationId || "all"} 
                onValueChange={(value) => setDestinationId(value === "all" ? undefined : value)}
                disabled={websiteLoading}
              >
                <SelectTrigger 
                  className={cn(
                    "w-full justify-start text-left font-normal h-14 px-4 bg-transparent border-0 shadow-none hover:bg-accent/50",
                    !destinationId && "text-muted-foreground"
                  )}
                >
                  <MapPinIcon className="mr-3 h-5 w-5 opacity-60 shrink-0" />
                  <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                    <span className="text-xs font-medium text-muted-foreground">
                      Destination
                    </span>
                    <SelectValue placeholder="All destinations">
                      {selectedDestination?.name || "All destinations"}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All destinations</SelectItem>
                  {destinations.map((destination) => (
                    <SelectItem key={destination.id} value={String(destination.id)}>
                      {destination.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-px bg-border hidden lg:block" />
          </>
        )}

        <div className="flex-1">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="bg-transparent border-0 shadow-none hover:bg-accent/50"
          />
        </div>

        <div className="w-px bg-border hidden lg:block" />

        <div className="flex-1 lg:max-w-xs">
          <RoomSelector
            rooms={rooms}
            onRoomsChange={setRooms}
            className="bg-transparent border-0 shadow-none hover:bg-accent/50"
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={!dateRange?.from || !dateRange?.to}
          size="lg"
          className="h-14 px-8 rounded-xl text-base font-semibold"
        >
          <SearchIcon className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}
