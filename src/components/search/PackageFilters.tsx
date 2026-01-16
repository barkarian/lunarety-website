"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterIcon, PlaneIcon, ShipIcon, BusIcon, TrainFrontIcon, XIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWebsite } from "@/components/providers/WebsiteProvider";

interface PackageFiltersProps {
  className?: string;
}

export function PackageFilters({ className }: PackageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterPackages, isLoading: websiteLoading } = useWebsite();

  // Get available filter options from website config
  const availableDays = filterPackages?.numberOfDays || [];
  const availableTransportation = filterPackages?.transportation || [];
  const availableTags = filterPackages?.tags || [];

  // Initialize state from URL params
  const [daysMin, setDaysMin] = React.useState<number | undefined>(() => {
    const param = searchParams.get("daysMin");
    return param ? parseInt(param, 10) : undefined;
  });

  const [daysMax, setDaysMax] = React.useState<number | undefined>(() => {
    const param = searchParams.get("daysMax");
    return param ? parseInt(param, 10) : undefined;
  });

  const [transportation, setTransportation] = React.useState<string | undefined>(() => {
    return searchParams.get("transportation") || undefined;
  });

  const [selectedTags, setSelectedTags] = React.useState<string[]>(() => {
    const param = searchParams.get("tags");
    return param ? param.split(",") : [];
  });

  const [daysOpen, setDaysOpen] = React.useState(false);
  const [transportOpen, setTransportOpen] = React.useState(false);
  const [tagsOpen, setTagsOpen] = React.useState(false);

  // Calculate min/max from available days
  const minAvailableDays = availableDays.length > 0 ? Math.min(...availableDays) : 1;
  const maxAvailableDays = availableDays.length > 0 ? Math.max(...availableDays) : 30;

  // Apply filters to URL
  const applyFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update days filters
    if (daysMin !== undefined) {
      params.set("daysMin", String(daysMin));
    } else {
      params.delete("daysMin");
    }
    
    if (daysMax !== undefined) {
      params.set("daysMax", String(daysMax));
    } else {
      params.delete("daysMax");
    }

    // Update transportation filter
    if (transportation) {
      params.set("transportation", transportation);
    } else {
      params.delete("transportation");
    }

    // Update tags filter
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    } else {
      params.delete("tags");
    }

    router.push(`/packages?${params.toString()}`);
  }, [router, searchParams, daysMin, daysMax, transportation, selectedTags]);

  // Clear all filters
  const clearAllFilters = () => {
    setDaysMin(undefined);
    setDaysMax(undefined);
    setTransportation(undefined);
    setSelectedTags([]);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete("daysMin");
    params.delete("daysMax");
    params.delete("transportation");
    params.delete("tags");
    router.push(`/packages?${params.toString()}`);
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Count active filters
  const activeFilterCount = [
    daysMin !== undefined || daysMax !== undefined,
    transportation !== undefined,
    selectedTags.length > 0,
  ].filter(Boolean).length;

  // Get display text for days range
  const getDaysDisplayText = () => {
    if (daysMin !== undefined && daysMax !== undefined) {
      return `${daysMin} - ${daysMax} days`;
    } else if (daysMin !== undefined) {
      return `${daysMin}+ days`;
    } else if (daysMax !== undefined) {
      return `Up to ${daysMax} days`;
    }
    return "Any duration";
  };

  // Get display text for transportation
  const getTransportDisplayText = () => {
    if (transportation === "airplane") return "By Airplane";
    if (transportation === "ship") return "By Ship";
    if (transportation === "bus") return "By Bus";
    if (transportation === "train") return "By Train";
    return "Any transport";
  };

  // Get transportation icon component
  const getTransportIcon = (type: string) => {
    switch (type) {
      case "airplane": return PlaneIcon;
      case "ship": return ShipIcon;
      case "bus": return BusIcon;
      case "train": return TrainFrontIcon;
      default: return null;
    }
  };

  // Get transportation label
  const getTransportLabel = (type: string) => {
    switch (type) {
      case "airplane": return "Airplane";
      case "ship": return "Ship";
      case "bus": return "Bus";
      case "train": return "Train";
      default: return type;
    }
  };

  if (websiteLoading) {
    return null;
  }

  // Don't render if no filter options available
  if (availableDays.length === 0 && availableTransportation.length === 0 && availableTags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
        <FilterIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Filters:</span>
      </div>

      {/* Days of Travelling Filter */}
      {availableDays.length > 0 && (
        <Popover open={daysOpen} onOpenChange={setDaysOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed",
                (daysMin !== undefined || daysMax !== undefined) && "border-primary bg-primary/5"
              )}
            >
              <span>{getDaysDisplayText()}</span>
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-4">
              <div className="font-medium">Trip Duration</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Min days</label>
                  <select
                    value={daysMin ?? ""}
                    onChange={(e) => setDaysMin(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Any</option>
                    {availableDays.map((day) => (
                      <option key={day} value={day} disabled={daysMax !== undefined && day > daysMax}>
                        {day} days
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-muted-foreground mt-5">—</div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Max days</label>
                  <select
                    value={daysMax ?? ""}
                    onChange={(e) => setDaysMax(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Any</option>
                    {availableDays.map((day) => (
                      <option key={day} value={day} disabled={daysMin !== undefined && day < daysMin}>
                        {day} days
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2">
                {availableDays.slice(0, 6).map((day) => (
                  <Button
                    key={day}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      daysMin === day && daysMax === day && "border-primary bg-primary/10"
                    )}
                    onClick={() => {
                      setDaysMin(day);
                      setDaysMax(day);
                    }}
                  >
                    {day} days
                  </Button>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDaysMin(undefined);
                    setDaysMax(undefined);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    applyFilters();
                    setDaysOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Transportation Filter */}
      {availableTransportation.length > 0 && (
        <Popover open={transportOpen} onOpenChange={setTransportOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed",
                transportation && "border-primary bg-primary/5"
              )}
            >
              {transportation && (() => {
                const Icon = getTransportIcon(transportation);
                return Icon ? <Icon className="mr-2 h-4 w-4" /> : null;
              })()}
              <span>{getTransportDisplayText()}</span>
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4" align="start">
            <div className="space-y-3">
              <div className="font-medium">Transportation</div>
              <div className="space-y-2">
                <Button
                  variant={transportation === undefined ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setTransportation(undefined)}
                >
                  Any transportation
                </Button>
                {availableTransportation.map((type) => {
                  const Icon = getTransportIcon(type);
                  return (
                    <Button
                      key={type}
                      variant={transportation === type ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setTransportation(type)}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      By {getTransportLabel(type)}
                    </Button>
                  );
                })}
              </div>
              <div className="flex justify-end pt-2 border-t">
                <Button
                  size="sm"
                  onClick={() => {
                    applyFilters();
                    setTransportOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed",
                selectedTags.length > 0 && "border-primary bg-primary/5"
              )}
            >
              <span>
                {selectedTags.length > 0 
                  ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                  : "Tags"
                }
              </span>
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-3">
              <div className="font-medium">Tags</div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTags.includes(tag) 
                        ? "hover:bg-primary/80" 
                        : "hover:bg-accent"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <XIcon className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    applyFilters();
                    setTagsOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear all filters button */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground hover:text-foreground"
          onClick={clearAllFilters}
        >
          <XIcon className="mr-1 h-4 w-4" />
          Clear all
        </Button>
      )}

      {/* Active filter badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-2">
          {selectedTags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                const newTags = selectedTags.filter(t => t !== tag);
                setSelectedTags(newTags);
                const params = new URLSearchParams(searchParams.toString());
                if (newTags.length > 0) {
                  params.set("tags", newTags.join(","));
                } else {
                  params.delete("tags");
                }
                router.push(`/packages?${params.toString()}`);
              }}
            >
              {tag}
              <XIcon className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {selectedTags.length > 3 && (
            <Badge variant="secondary">
              +{selectedTags.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
