"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, CalendarIcon, MapPinIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomSelector } from "./RoomSelector";
import { useWebsite } from "@/components/providers/WebsiteProvider";
import {
  type DateRangeNumber,
  type RoomOccupancy,
  numberToDate,
  dateToNumber,
  formatDateNumber,
  parseRooms,
  serializeRooms,
} from "@/lib/types";

interface PackageSearchBarProps {
  onSearch?: () => void;
  className?: string;
}

export function PackageSearchBar({ onSearch, className }: PackageSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterPackages, isLoading: websiteLoading } = useWebsite();

  // Get available departure locations from website filters
  const departures = filterPackages?.departures || [];

  // Initialize departure from URL or default to first available
  const [departureId, setDepartureId] = React.useState<string | undefined>(() => {
    const departureParam = searchParams.get("departure");
    if (departureParam) return departureParam;
    return undefined; // Will be set in useEffect when departures load
  });

  // Set default departure when departures are loaded
  React.useEffect(() => {
    if (!departureId && departures.length > 0) {
      setDepartureId(String(departures[0].id));
    }
  }, [departures, departureId]);

  // Initialize state from URL params or defaults
  const [availabilityRange, setAvailabilityRange] = React.useState<DateRangeNumber | undefined>(
    () => {
      const fromParam = searchParams.get("availabilityFrom");
      const toParam = searchParams.get("availabilityTo");

      if (fromParam && toParam) {
        return {
          from: parseInt(fromParam, 10),
          to: parseInt(toParam, 10),
        };
      }

      // Default: next 3 months availability window
      const today = new Date();
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      
      return {
        from: dateToNumber(today),
        to: dateToNumber(threeMonthsLater),
      };
    }
  );

  const [rooms, setRooms] = React.useState<RoomOccupancy[]>(() => {
    const roomsParam = searchParams.get("rooms");
    return parseRooms(roomsParam || undefined);
  });

  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const handleSearch = () => {
    if (!departureId) return; // Departure is required

    const params = new URLSearchParams();
    params.set("departure", departureId);
    if (availabilityRange?.from) {
      params.set("availabilityFrom", String(availabilityRange.from));
    }
    if (availabilityRange?.to) {
      params.set("availabilityTo", String(availabilityRange.to));
    }
    params.set("rooms", serializeRooms(rooms));

    router.push(`/packages?${params.toString()}`);
    onSearch?.();
  };

  // Convert number range to Date range for the calendar
  const calendarDateRange: DateRange | undefined = React.useMemo(() => {
    if (!availabilityRange?.from) return undefined;
    return {
      from: numberToDate(availabilityRange.from),
      to: availabilityRange.to ? numberToDate(availabilityRange.to) : undefined,
    };
  }, [availabilityRange]);

  const handleCalendarSelect = (
    range: DateRange | undefined,
    triggerDate: Date
  ) => {
    if (!range) {
      setAvailabilityRange(undefined);
      return;
    }

    // If we already have a complete range, start fresh
    if (availabilityRange?.from && availabilityRange?.to) {
      const newRange: DateRangeNumber = {
        from: dateToNumber(triggerDate),
        to: undefined,
      };
      setAvailabilityRange(newRange);
      return;
    }

    const newRange: DateRangeNumber = {
      from: range.from ? dateToNumber(range.from) : undefined,
      to: range.to ? dateToNumber(range.to) : undefined,
    };

    setAvailabilityRange(newRange);

    // Close popover when both dates are selected
    if (range.from && range.to) {
      setDatePickerOpen(false);
    }
  };

  // Get the selected departure name for display
  const selectedDeparture = departures.find(d => String(d.id) === departureId);

  return (
    <div
      className={`w-full glass rounded-2xl shadow-lg border border-border/50 p-3 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Departure Point Selector - Required */}
        <div className="flex-1 lg:max-w-xs">
          <Select 
            value={departureId} 
            onValueChange={setDepartureId}
            disabled={websiteLoading || departures.length === 0}
          >
            <SelectTrigger 
              className={cn(
                "w-full justify-start text-left font-normal h-14 px-4 bg-transparent border-0 shadow-none hover:bg-accent/50",
                !departureId && "text-muted-foreground"
              )}
            >
              <MapPinIcon className="mr-3 h-5 w-5 opacity-60 shrink-0" />
              <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                <span className="text-xs font-medium text-muted-foreground">
                  Departing from
                </span>
                <SelectValue placeholder="Select departure point">
                  {selectedDeparture?.name || "Select departure point"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {departures.map((departure) => (
                <SelectItem key={departure.id} value={String(departure.id)}>
                  {departure.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px bg-border hidden lg:block" />

        {/* Availability Date Range */}
        <div className="flex-1">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-14 px-4 bg-transparent border-0 shadow-none hover:bg-accent/50",
                  !availabilityRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 opacity-60" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    I can travel between
                  </span>
                  <span className="text-sm">
                    {availabilityRange?.from ? (
                      availabilityRange.to ? (
                        <>
                          {formatDateNumber(availabilityRange.from)} —{" "}
                          {formatDateNumber(availabilityRange.to)}
                        </>
                      ) : (
                        formatDateNumber(availabilityRange.from)
                      )
                    ) : (
                      "Select availability window"
                    )}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={calendarDateRange?.from}
                selected={calendarDateRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                showOutsideDays={false}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-px bg-border hidden lg:block" />

        {/* Guests & Rooms Selector */}
        <div className="flex-1 lg:max-w-xs">
          <RoomSelector
            rooms={rooms}
            onRoomsChange={setRooms}
            className="bg-transparent border-0 shadow-none hover:bg-accent/50"
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={!departureId || departures.length === 0}
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
