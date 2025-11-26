"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { RoomSelector } from "./RoomSelector";
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
    params.set("from", String(dateRange.from));
    params.set("to", String(dateRange.to));
    params.set("rooms", serializeRooms(rooms));

    router.push(`/?${params.toString()}`);
    onSearch?.();
  };

  return (
    <div
      className={`w-full glass rounded-2xl shadow-lg border border-border/50 p-3 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-3">
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
