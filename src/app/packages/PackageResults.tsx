import { getWebsitePackages } from "@/lib/actions/api";
import { PackageGrid } from "@/components/search/PackageGrid";
import {
  numberToDate,
  dateToNumber,
  parseRooms,
  serializeRooms,
} from "@/lib/types";
import type { Package } from "@/lib/types";

interface PackageResultsProps {
  searchParams: {
    departure?: string;
    availabilityFrom?: string;
    availabilityTo?: string;
    rooms?: string;
    // Filter params
    daysMin?: string;
    daysMax?: string;
    transportation?: string;
    tags?: string;
  };
}

export async function PackageResults({ searchParams }: PackageResultsProps) {
  // Default availability window: today to 3 months from now
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  
  const defaultFrom = dateToNumber(today);
  const defaultTo = dateToNumber(threeMonthsLater);

  // Parse departure filter
  const departureId = searchParams.departure
    ? parseInt(searchParams.departure, 10)
    : undefined;

  // Parse dates as YYYYMMDD numbers
  const availabilityFrom = searchParams.availabilityFrom
    ? parseInt(searchParams.availabilityFrom, 10)
    : defaultFrom;
  const availabilityTo = searchParams.availabilityTo
    ? parseInt(searchParams.availabilityTo, 10)
    : defaultTo;
  
  // Parse rooms configuration
  const rooms = parseRooms(searchParams.rooms);
  const totalGuests = rooms.reduce((acc, room) => acc + room.adults + room.children, 0);

  // Parse filter params
  const daysMin = searchParams.daysMin
    ? parseInt(searchParams.daysMin, 10)
    : undefined;
  const daysMax = searchParams.daysMax
    ? parseInt(searchParams.daysMax, 10)
    : undefined;
  const transportation = searchParams.transportation as 'ship' | 'plane' | undefined;
  const tags = searchParams.tags ? searchParams.tags.split(",") : undefined;

  // Build search params string for package links
  const urlParams = new URLSearchParams();
  if (departureId) {
    urlParams.set("departure", String(departureId));
  }
  urlParams.set("availabilityFrom", String(availabilityFrom));
  urlParams.set("availabilityTo", String(availabilityTo));
  urlParams.set("rooms", serializeRooms(rooms));
  const searchParamsString = urlParams.toString();

  let packages: Package[] = [];
  let error: string | null = null;

  try {
    const result = await getWebsitePackages({
      availabilityFrom,
      availabilityTo,
      departureIds: departureId ? [departureId] : undefined,
      transportation,
      tags,
    });
    let fetchedPackages = result.packages || [];

    // Client-side filtering for days of travelling
    // Filter by durationInDaysOptions in package content
    if (daysMin !== undefined || daysMax !== undefined) {
      fetchedPackages = fetchedPackages.filter((pkg) => {
        const durationOptions = pkg.content?.durationInDaysOptions;
        if (!durationOptions || durationOptions.length === 0) {
          // If package doesn't have duration info, include it (or exclude based on preference)
          return true;
        }
        // Check if any of the package's duration options fall within the filter range
        return durationOptions.some((days) => {
          const meetsMin = daysMin === undefined || days >= daysMin;
          const meetsMax = daysMax === undefined || days <= daysMax;
          return meetsMin && meetsMax;
        });
      });
    }

    packages = fetchedPackages;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch packages";
    console.error("Error fetching packages:", e);
  }

  // Convert to dates for display formatting
  const fromDate = numberToDate(availabilityFrom);
  const toDate = numberToDate(availabilityTo);

  return (
    <div className="space-y-6 animate-fade-in-up animation-delay-300">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Available Packages</h2>
          <p className="text-muted-foreground mt-1">
            {packages.length} package{packages.length !== 1 ? "s" : ""}{" "}
            for {totalGuests} traveler{totalGuests !== 1 ? "s" : ""} · {rooms.length} room{rooms.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            Available:{" "}
            {fromDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            —{" "}
            {toDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try again or adjust your search criteria.
          </p>
        </div>
      ) : (
        <PackageGrid
          packages={packages}
          searchParams={searchParamsString}
        />
      )}
    </div>
  );
}
