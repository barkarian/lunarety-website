import { getAvailability } from "@/lib/actions/api";
import { PropertyGrid } from "@/components/search/PropertyGrid";
import {
  parseRooms,
  getDefaultDates,
  serializeRooms,
  calculateNights,
  formatDateNumber,
  numberToDate,
} from "@/lib/types";
import type { Property } from "@/lib/types";

interface PropertyResultsProps {
  searchParams: {
    from?: string;
    to?: string;
    rooms?: string;
  };
}

export async function PropertyResults({ searchParams }: PropertyResultsProps) {
  const defaults = getDefaultDates();
  
  // Parse dates as YYYYMMDD numbers
  const from = searchParams.from
    ? parseInt(searchParams.from, 10)
    : defaults.from;
  const to = searchParams.to 
    ? parseInt(searchParams.to, 10) 
    : defaults.to;
  const rooms = parseRooms(searchParams.rooms);

  const nights = calculateNights(from, to);

  // Build search params string for property links
  const urlParams = new URLSearchParams();
  urlParams.set("from", String(from));
  urlParams.set("to", String(to));
  urlParams.set("rooms", serializeRooms(rooms));
  const searchParamsString = urlParams.toString();

  let properties: Property[] = [];
  let error: string | null = null;

  try {
    const result = await getAvailability({
      from, // YYYYMMDD format
      to, // YYYYMMDD format
      rooms,
    });
    console.log({result});

    properties = result.properties || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch properties";
    console.error("Error fetching availability:", e);
  }

  const totalGuests = rooms.reduce(
    (acc, room) => acc + room.adults + room.children,
    0
  );

  // Convert to dates for display formatting
  const fromDate = numberToDate(from);
  const toDate = numberToDate(to);

  return (
    <div className="space-y-6 animate-fade-in-up animation-delay-300">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Available Properties</h2>
          <p className="text-muted-foreground mt-1">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"}{" "}
            for {nights} night{nights !== 1 ? "s" : ""} · {totalGuests} guest
            {totalGuests !== 1 ? "s" : ""} · {rooms.length} room
            {rooms.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
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
        <PropertyGrid
          properties={properties}
          searchParams={searchParamsString}
        />
      )}
    </div>
  );
}
