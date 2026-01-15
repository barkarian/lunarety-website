import { getWebsitePackages } from "@/lib/actions/api";
import { PackageGrid } from "@/components/search/PackageGrid";
import {
  numberToDate,
  dateToNumber,
} from "@/lib/types";
import type { Package } from "@/lib/types";

interface PackageResultsProps {
  searchParams: {
    availabilityFrom?: string;
    availabilityTo?: string;
    adults?: string;
    children?: string;
  };
}

export async function PackageResults({ searchParams }: PackageResultsProps) {
  // Default availability window: today to 3 months from now
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  
  const defaultFrom = dateToNumber(today);
  const defaultTo = dateToNumber(threeMonthsLater);

  // Parse dates as YYYYMMDD numbers
  const availabilityFrom = searchParams.availabilityFrom
    ? parseInt(searchParams.availabilityFrom, 10)
    : defaultFrom;
  const availabilityTo = searchParams.availabilityTo
    ? parseInt(searchParams.availabilityTo, 10)
    : defaultTo;
  
  const adults = searchParams.adults ? parseInt(searchParams.adults, 10) : 2;
  const children = searchParams.children ? parseInt(searchParams.children, 10) : 0;

  // Build search params string for package links
  const urlParams = new URLSearchParams();
  urlParams.set("availabilityFrom", String(availabilityFrom));
  urlParams.set("availabilityTo", String(availabilityTo));
  urlParams.set("adults", String(adults));
  urlParams.set("children", String(children));
  const searchParamsString = urlParams.toString();

  let packages: Package[] = [];
  let error: string | null = null;

  try {
    const result = await getWebsitePackages({
      availabilityFrom,
      availabilityTo,
    });
    packages = result.packages || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch packages";
    console.error("Error fetching packages:", e);
  }

  const totalGuests = adults + children;

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
            for {totalGuests} traveler{totalGuests !== 1 ? "s" : ""}
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
