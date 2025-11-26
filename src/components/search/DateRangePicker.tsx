"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
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

interface DateRangePickerProps {
  dateRange: DateRangeNumber | undefined;
  onDateRangeChange: (range: DateRangeNumber | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert number range to Date range for the calendar
  const calendarDateRange: DateRange | undefined = React.useMemo(() => {
    if (!dateRange?.from) return undefined;
    return {
      from: numberToDate(dateRange.from),
      to: dateRange.to ? numberToDate(dateRange.to) : undefined,
    };
  }, [dateRange]);

  // Handle calendar selection and convert back to numbers
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (!range) {
      onDateRangeChange(undefined);
      return;
    }

    const newRange: DateRangeNumber = {
      from: range.from ? dateToNumber(range.from) : undefined,
      to: range.to ? dateToNumber(range.to) : undefined,
    };

    onDateRangeChange(newRange);

    // Close popover when both dates are selected
    if (range.from && range.to) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-14 px-4",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 opacity-60" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              Check-in / Check-out
            </span>
            <span className="text-sm">
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {formatDateNumber(dateRange.from)} —{" "}
                    {formatDateNumber(dateRange.to)}
                  </>
                ) : (
                  formatDateNumber(dateRange.from)
                )
              ) : (
                "Select dates"
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
          disabled={{ before: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
