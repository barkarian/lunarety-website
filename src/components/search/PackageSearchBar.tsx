"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, CalendarIcon, UsersIcon, MinusIcon, PlusIcon } from "lucide-react";
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
  type DateRangeNumber,
  numberToDate,
  dateToNumber,
  formatDateNumber,
} from "@/lib/types";

interface PackageSearchBarProps {
  onSearch?: () => void;
  className?: string;
}

export function PackageSearchBar({ onSearch, className }: PackageSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const [adults, setAdults] = React.useState(() => {
    const adultsParam = searchParams.get("adults");
    return adultsParam ? parseInt(adultsParam, 10) : 2;
  });

  const [children, setChildren] = React.useState(() => {
    const childrenParam = searchParams.get("children");
    return childrenParam ? parseInt(childrenParam, 10) : 0;
  });

  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [guestsOpen, setGuestsOpen] = React.useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (availabilityRange?.from) {
      params.set("availabilityFrom", String(availabilityRange.from));
    }
    if (availabilityRange?.to) {
      params.set("availabilityTo", String(availabilityRange.to));
    }
    params.set("adults", String(adults));
    params.set("children", String(children));

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

  const totalGuests = adults + children;

  return (
    <div
      className={`w-full glass rounded-2xl shadow-lg border border-border/50 p-3 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-3">
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

        {/* Guests Selector */}
        <div className="flex-1 lg:max-w-xs">
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-14 px-4 bg-transparent border-0 shadow-none hover:bg-accent/50"
              >
                <UsersIcon className="mr-3 h-5 w-5 opacity-60" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Travelers
                  </span>
                  <span className="text-sm">
                    {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                    {adults > 0 && (
                      <span className="text-muted-foreground">
                        {" "}({adults} adult{adults !== 1 ? "s" : ""}
                        {children > 0 && `, ${children} child${children !== 1 ? "ren" : ""}`})
                      </span>
                    )}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Adults</p>
                    <p className="text-xs text-muted-foreground">Age 18+</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                      className="h-8 w-8"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {adults}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAdults(Math.min(10, adults + 1))}
                      disabled={adults >= 10}
                      className="h-8 w-8"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Children</p>
                    <p className="text-xs text-muted-foreground">Age 0-17</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                      className="h-8 w-8"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {children}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setChildren(Math.min(8, children + 1))}
                      disabled={children >= 8}
                      className="h-8 w-8"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Button onClick={() => setGuestsOpen(false)} className="w-full">
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={handleSearch}
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
