"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPinIcon,
  StarIcon,
  CheckIcon,
  UsersIcon,
  BedIcon,
  InfoIcon,
  ClockIcon,
  ExternalLinkIcon,
  PlusIcon,
  MinusIcon,
  AlertCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { RoomSelector } from "@/components/search/RoomSelector";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { RichText } from "@/components/RichText";
import { useWebsite } from "@/components/providers/WebsiteProvider";

// Lazy load PropertyChat - only loads when AI is enabled
const PropertyChat = React.lazy(() => 
  import("@/components/chat/PropertyChat").then(mod => ({ default: mod.PropertyChat }))
);
import { getAvailability, createBooking } from "@/lib/actions/api";
import {
  type Property,
  type Room,
  type RoomOccupancy,
  type RoomPrice,
  type DateRangeNumber,
  parseRooms,
  serializeRooms,
  getDefaultDates,
  formatCurrency,
  calculateNights,
} from "@/lib/types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

interface PropertyDetailsProps {
  propertyId: string;
  searchParams: {
    from?: string;
    to?: string;
    rooms?: string;
  };
}

// Updated interface: each selection has a unique key combining roomId and occupancy
interface SelectedRoom {
  roomId: string;
  priceKey: string; // unique key: "adults-children" e.g. "2-0" for 2 adults, 0 children
  quantity: number;
  selectedPrice?: RoomPrice;
  isRequestOnly?: boolean;
}

// Helper to generate a unique key for a price option
function getPriceKey(price: RoomPrice | undefined): string {
  if (!price) return "request-only";
  return `${price.adults}-${price.children}`;
}

export function PropertyDetails({
  propertyId,
  searchParams,
}: PropertyDetailsProps) {
  const router = useRouter();
  const defaults = getDefaultDates();
  const { website } = useWebsite();

  // State
  const [property, setProperty] = React.useState<Property | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showPropertyDescriptionModal, setShowPropertyDescriptionModal] =
    React.useState(false);
  const [selectedRoomForModal, setSelectedRoomForModal] =
    React.useState<Room | null>(null);

  // Parse dates as YYYYMMDD numbers
  const [dateRange, setDateRange] = React.useState<DateRangeNumber | undefined>(
    () => {
      if (searchParams.from && searchParams.to) {
        return {
          from: parseInt(searchParams.from, 10),
          to: parseInt(searchParams.to, 10),
        };
      }
      return { from: defaults.from, to: defaults.to };
    }
  );

  const [rooms, setRooms] = React.useState<RoomOccupancy[]>(() =>
    parseRooms(searchParams.rooms)
  );

  const [selectedRooms, setSelectedRooms] = React.useState<SelectedRoom[]>([]);
  const [isBooking, setIsBooking] = React.useState(false);
  const [showBookingForm, setShowBookingForm] = React.useState(false);

  // Track if user has manually interacted with room selection
  // This prevents auto-select from running after user deselects all rooms
  const hasUserInteractedRef = React.useRef(false);

  // Guest info state
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");

  // Update URL when search params change
  const updateUrl = React.useCallback(
    (newDateRange: DateRangeNumber | undefined, newRooms: RoomOccupancy[]) => {
      if (!newDateRange?.from || !newDateRange?.to) return;

      const params = new URLSearchParams();
      params.set("from", String(newDateRange.from));
      params.set("to", String(newDateRange.to));
      params.set("rooms", serializeRooms(newRooms));

      router.replace(`/properties/${propertyId}?${params.toString()}`, {
        scroll: false,
      });
    },
    [propertyId, router]
  );

  // Fetch property availability
  const fetchProperty = React.useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAvailability({
        from: dateRange.from,
        to: dateRange.to,
        rooms,
        propertyIds: [parseInt(propertyId)],
      });

      if (result.properties && result.properties.length > 0) {
        setProperty(result.properties[0]);
      } else {
        setError("Property not found");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch property");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, rooms, propertyId]);

  React.useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Auto-select optimal room combination based on search params
  React.useEffect(() => {
    if (!property?.rooms || property.rooms.length === 0 || rooms.length === 0)
      return;

    // Only auto-select if no rooms are currently selected
    if (selectedRooms.length > 0) return;

    // Don't auto-select if user has manually interacted with selections
    if (hasUserInteractedRef.current) return;

    // For each requested room configuration, try to find a matching price option
    type RoomOption = {
      roomId: string;
      price: RoomPrice;
      priceKey: string;
      availUnits: number;
      isRequestOnly: boolean;
      matchedOccupancy: RoomOccupancy;
    };

    const newSelections: SelectedRoom[] = [];

    // Process each requested room occupancy
    for (const requestedRoom of rooms) {
      let bestOption: RoomOption | null = null;

      for (const room of property.rooms) {
        const availUnits = room.availUnits || 0;
        if (availUnits === 0) continue;

        // Check how many units are already allocated to this room
        const alreadyAllocated = newSelections
          .filter((s) => s.roomId === room.id)
          .reduce((sum, s) => sum + s.quantity, 0);

        if (alreadyAllocated >= availUnits) continue;

        // Check each price option for this room
        const prices = room.prices || [];
        if (prices.length > 0) {
          for (const price of prices) {
            // Check if this price option can accommodate the requested occupancy
            const canAccommodate =
              price.adults >= requestedRoom.adults &&
              (price.children || 0) >= requestedRoom.children;

            if (canAccommodate) {
              const option: RoomOption = {
                roomId: room.id,
                price,
                priceKey: getPriceKey(price),
                availUnits,
                isRequestOnly: price.price === 0,
                matchedOccupancy: requestedRoom,
              };

              // Prefer non-request-only, then lower price
              if (
                !bestOption ||
                (!option.isRequestOnly && bestOption.isRequestOnly) ||
                (option.isRequestOnly === bestOption.isRequestOnly &&
                  option.price.price < bestOption.price.price)
              ) {
                bestOption = option;
              }
            }
          }
        } else {
          // Room without prices - request only
          const canAccommodate =
            (room.maxAdults || room.maxGuests || 2) >= requestedRoom.adults &&
            (room.maxChildren || room.maxGuests || 0) >= requestedRoom.children;

          if (canAccommodate) {
            const option: RoomOption = {
              roomId: room.id,
              price: { adults: room.maxAdults || 2, children: 0, price: 0 },
              priceKey: getPriceKey({
                adults: room.maxAdults || 2,
                children: 0,
                price: 0,
              }),
              availUnits,
              isRequestOnly: true,
              matchedOccupancy: requestedRoom,
            };

            if (!bestOption) {
              bestOption = option;
            }
          }
        }
      }

      if (bestOption) {
        // Check if we already have a selection for this room + priceKey
        const existingSelection = newSelections.find(
          (s) =>
            s.roomId === bestOption!.roomId &&
            s.priceKey === bestOption!.priceKey
        );

        if (existingSelection) {
          // Increment quantity if we have capacity
          const room = property.rooms?.find(
            (r) => r.id === bestOption!.roomId
          );
          const currentTotal = newSelections
            .filter((s) => s.roomId === bestOption!.roomId)
            .reduce((sum, s) => sum + s.quantity, 0);

          if (currentTotal < (room?.availUnits || 1)) {
            existingSelection.quantity += 1;
          }
        } else {
          // Add new selection
          newSelections.push({
            roomId: bestOption.roomId,
            priceKey: bestOption.priceKey,
            quantity: 1,
            selectedPrice: bestOption.price,
            isRequestOnly: bestOption.isRequestOnly,
          });
        }
      }
    }

    if (newSelections.length > 0) {
      setSelectedRooms(newSelections);
    }
  }, [property, rooms, selectedRooms.length]);

  // Handle date/room changes
  const handleDateChange = (range: DateRangeNumber | undefined) => {
    setDateRange(range);
    setSelectedRooms([]);
    // Reset interaction flag so auto-select can run with new dates
    hasUserInteractedRef.current = false;
    if (range?.from && range?.to) {
      updateUrl(range, rooms);
    }
  };

  const handleRoomsChange = (newRooms: RoomOccupancy[]) => {
    setRooms(newRooms);
    setSelectedRooms([]);
    // Reset interaction flag so auto-select can run with new room config
    hasUserInteractedRef.current = false;
    updateUrl(dateRange, newRooms);
  };

  // Get total selected units for a specific room (across all occupancy options)
  const getTotalSelectedForRoom = React.useCallback(
    (roomId: string) => {
      return selectedRooms
        .filter((r) => r.roomId === roomId)
        .reduce((sum, r) => sum + r.quantity, 0);
    },
    [selectedRooms]
  );

  // Handle room selection with price option - now supports multiple occupancies per room
  const selectRoom = React.useCallback(
    (
      roomId: string,
      selectedPrice?: RoomPrice,
      isRequestOnly?: boolean,
      maxUnits?: number
    ) => {
      // Mark that user has manually interacted with selections
      hasUserInteractedRef.current = true;
      const priceKey = getPriceKey(selectedPrice);

      setSelectedRooms((prev) => {
        const existing = prev.find(
          (r) => r.roomId === roomId && r.priceKey === priceKey
        );

        if (existing) {
          // If clicking on already selected occupancy, deselect it
          return prev.filter(
            (r) => !(r.roomId === roomId && r.priceKey === priceKey)
          );
        } else {
          // Check if we have units available
          const currentTotalForRoom = prev
            .filter((r) => r.roomId === roomId)
            .reduce((sum, r) => sum + r.quantity, 0);

          const availableUnits = (maxUnits || 1) - currentTotalForRoom;

          if (availableUnits <= 0) {
            // No units available - don't add
            return prev;
          }

          // Add new selection
          return [
            ...prev,
            { roomId, priceKey, quantity: 1, selectedPrice, isRequestOnly },
          ];
        }
      });
    },
    []
  );

  // Update room quantity for a specific occupancy selection
  const updateRoomQuantity = React.useCallback(
    (roomId: string, priceKey: string, delta: number, maxUnits: number) => {
      setSelectedRooms((prev) => {
        // Calculate current total for this room (excluding the one being updated)
        const currentTotalExcluding = prev
          .filter((r) => r.roomId === roomId && r.priceKey !== priceKey)
          .reduce((sum, r) => sum + r.quantity, 0);

        return prev.map((r) => {
          if (r.roomId === roomId && r.priceKey === priceKey) {
            const maxAllowed = maxUnits - currentTotalExcluding;
            const newQuantity = Math.max(
              1,
              Math.min(maxAllowed, r.quantity + delta)
            );
            return { ...r, quantity: newQuantity };
          }
          return r;
        });
      });
    },
    []
  );

  // Stable callback for showing room modal
  const handleShowRoomDetails = React.useCallback((room: Room) => {
    setSelectedRoomForModal(room);
  }, []);

  // Check if a specific occupancy option is selected
  const isOccupancySelected = React.useCallback(
    (roomId: string, price: RoomPrice | undefined) => {
      const priceKey = getPriceKey(price);
      return selectedRooms.some(
        (r) => r.roomId === roomId && r.priceKey === priceKey
      );
    },
    [selectedRooms]
  );



  const hasRequestOnlyRooms = selectedRooms.some((r) => r.isRequestOnly);

  const nights =
    dateRange?.from && dateRange?.to
      ? calculateNights(dateRange.from, dateRange.to)
      : 0;

  // Calculate total number of rooms (accounting for quantities)
  const totalRoomCount = React.useMemo(() => {
    return selectedRooms.reduce((total, sr) => total + sr.quantity, 0);
  }, [selectedRooms]);

  const totalPrice = React.useMemo(() => {
    if (!property?.rooms) return 0;

    return selectedRooms.reduce((total, selected) => {
      const price = selected.selectedPrice?.price || 0;
      return total + price * selected.quantity;
    }, 0);
  }, [selectedRooms, property]);

  const formatDateForBooking = (dateNum: number): string => {
    const str = String(dateNum);
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(
      6,
      8
    )}`;
  };

  const handleBooking = async () => {
    if (
      !property ||
      !dateRange?.from ||
      !dateRange?.to ||
      selectedRooms.length === 0
    ) {
      return;
    }

    if (!guestName || !guestEmail) {
      alert("Please fill in your name and email");
      return;
    }

    setIsBooking(true);

    try {
      // Calculate total guests based on selected rooms and their quantities
      const totalGuests = selectedRooms.reduce((acc, sr) => {
        const adults = sr.selectedPrice?.adults || 2;
        const children = sr.selectedPrice?.children || 0;
        return acc + (adults + children) * sr.quantity;
      }, 0);

      // Expand rooms based on quantity (e.g., if quantity is 2, we need 2 entries)
      const expandedRooms = selectedRooms.flatMap((sr) => {
        return Array.from({ length: sr.quantity }, () => ({
          roomId: parseInt(sr.roomId, 10) || 0,
          adults: sr.selectedPrice?.adults || rooms[0]?.adults || 2,
          children: sr.selectedPrice?.children || rooms[0]?.children || 0,
        }));
      });

      const result = await createBooking({
        property: property.id,
        checkIn: formatDateForBooking(dateRange.from),
        checkOut: formatDateForBooking(dateRange.to),
        guestName,
        guestEmail,
        guestPhone,
        guests: totalGuests,
        totalPrice,
        status: "pending",
        rooms: expandedRooms,
      });

      if (result.booking?.id) {
        router.push(`/bookings/${result.booking.id}`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  if (error || !property) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {error || "Property not found"}
        </h3>
        <p className="text-muted-foreground">
          The property you&apos;re looking for is not available.
        </p>
      </div>
    );
  }

  const propertyImages = property.images || [];
  const hasLongDescription =
    property.longDescription?.root?.children &&
    property.longDescription.root.children.length > 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Image Carousel - Full Width */}
      <div className="w-full">
        <ImageCarousel
          images={propertyImages}
          aspectRatio="wide"
          showThumbnails={true}
          maxHeight={450}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Location */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{property.name}</h1>

                {/* Location with URL */}
                <div className="flex items-center gap-3 flex-wrap">
                  {(property.city || property.country || property.address) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {[property.address, property.city, property.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}

                  {property.locationUrl && (
                    <a
                      href={property.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      View on map
                    </a>
                  )}
                </div>
              </div>

              {property.rating && (
                <div className="flex items-center gap-1.5 bg-accent rounded-full px-3 py-1.5">
                  <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {property.rating.toFixed(1)}
                  </span>
                  {property.reviewCount && (
                    <span className="text-sm text-muted-foreground">
                      ({property.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Short Description + Info Icon */}
            {(property.shortDescription || property.description) && (
              <div className="flex items-start gap-3">
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {property.shortDescription || property.description}
                </p>

                {hasLongDescription && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPropertyDescriptionModal(true)}
                    className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-primary/10"
                    aria-label="View full description"
                  >
                    <InfoIcon className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Available Rooms */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
            <div className="space-y-4">
              {property.rooms && property.rooms.length > 0 ? (
                property.rooms.map((room) => {
                  const roomSelections = selectedRooms.filter(
                    (sr) => sr.roomId === room.id
                  );
                  const maxUnits = room.availUnits || 1;
                  const totalSelectedForRoom = getTotalSelectedForRoom(room.id);
                  const remainingUnits = maxUnits - totalSelectedForRoom;

                  return (
                    <RoomCard
                      key={room.id}
                      room={room}
                      roomId={room.id}
                      currency={property.currency}
                      roomSelections={roomSelections}
                      remainingUnits={remainingUnits}
                      maxUnits={maxUnits}
                      totalSelectedForRoom={totalSelectedForRoom}
                      onSelectRoom={selectRoom}
                      onUpdateRoomQuantity={updateRoomQuantity}
                      onShowDetails={handleShowRoomDetails}
                      checkIsOccupancySelected={isOccupancySelected}
                    />
                  );
                })
              ) : (
                <p className="text-muted-foreground">
                  No rooms available for the selected dates.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Book Your Stay</CardTitle>
              <CardDescription>
                Select your dates and rooms to proceed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateChange}
              />

              <RoomSelector rooms={rooms} onRoomsChange={handleRoomsChange} />

              {selectedRooms.length > 0 && (
                <>
                  <Separator />

                  {hasRequestOnlyRooms ? (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Price not available for this selection. Submit a request
                        and we&apos;ll get back to you with pricing.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {/* Show breakdown of selected rooms with occupancy details */}
                        {selectedRooms.map((sr) => {
                          const room = property.rooms?.find(
                            (r) => r.id === sr.roomId
                          );
                          if (!room) return null;

                          // Create occupancy label
                          const occupancyLabel = sr.selectedPrice
                            ? `${sr.selectedPrice.adults} adult${sr.selectedPrice.adults !== 1 ? "s" : ""}${
                                sr.selectedPrice.children > 0
                                  ? `, ${sr.selectedPrice.children} child${sr.selectedPrice.children !== 1 ? "ren" : ""}`
                                  : ""
                              }`
                            : "";

                          return (
                            <div
                              key={`${sr.roomId}-${sr.priceKey}`}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-muted-foreground truncate max-w-[180px]">
                                {sr.quantity > 1 && (
                                  <span className="font-medium text-foreground">
                                    {sr.quantity}×{" "}
                                  </span>
                                )}
                                {room.name}
                                {occupancyLabel && (
                                  <span className="text-xs ml-1">
                                    ({occupancyLabel})
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">
                                {sr.selectedPrice
                                  ? formatCurrency(
                                      sr.selectedPrice.price * sr.quantity,
                                      property.currency
                                    )
                                  : "—"}
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-sm pt-1">
                          <span className="text-muted-foreground">
                            {totalRoomCount} room
                            {totalRoomCount !== 1 ? "s" : ""} × {nights} night
                            {nights !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(totalPrice, property.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {showBookingForm && selectedRooms.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Full Name *</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email *</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestPhone">Phone (optional)</Label>
                    <Input
                      id="guestPhone"
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              {selectedRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center w-full">
                  Select at least one room to continue
                </p>
              ) : !showBookingForm ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowBookingForm(true)}
                  variant={hasRequestOnlyRooms ? "outline" : "default"}
                >
                  {hasRequestOnlyRooms ? "Submit Request" : "Continue to Booking"}
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBooking}
                    disabled={isBooking || !guestName || !guestEmail}
                    variant={hasRequestOnlyRooms ? "outline" : "default"}
                  >
                    {isBooking
                      ? "Processing..."
                      : hasRequestOnlyRooms
                        ? "Send Request"
                        : "Complete Booking"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Back
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Property Long Description Modal */}
      <Dialog
        open={showPropertyDescriptionModal}
        onOpenChange={setShowPropertyDescriptionModal}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{property.name}</DialogTitle>
            <DialogDescription>Full property description</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {property.longDescription && (
              <RichText
                data={property.longDescription as unknown as SerializedEditorState}
                className="prose prose-sm dark:prose-invert max-w-none"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Details Modal */}
      <Dialog
        open={!!selectedRoomForModal}
        onOpenChange={(open) => !open && setSelectedRoomForModal(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRoomForModal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedRoomForModal.name}
                </DialogTitle>
                <DialogDescription>Room details and information</DialogDescription>
              </DialogHeader>

              {/* Room Images Carousel */}
              {selectedRoomForModal.images &&
                selectedRoomForModal.images.length > 0 && (
                  <div className="mt-4">
                    <ImageCarousel
                      images={selectedRoomForModal.images}
                      aspectRatio="video"
                      showThumbnails={selectedRoomForModal.images.length > 3}
                    />
                  </div>
                )}

              {/* Room Info Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <RoomInfoCard
                  icon={<UsersIcon className="h-5 w-5" />}
                  label="Max Guests"
                  value={selectedRoomForModal.maxGuests?.toString() || "—"}
                />
                <RoomInfoCard
                  icon={<UsersIcon className="h-5 w-5" />}
                  label="Max Adults"
                  value={selectedRoomForModal.maxAdults?.toString() || "—"}
                />
                <RoomInfoCard
                  icon={<UsersIcon className="h-5 w-5" />}
                  label="Max Children"
                  value={selectedRoomForModal.maxChildren?.toString() || "—"}
                />
                {selectedRoomForModal.bedType && (
                  <RoomInfoCard
                    icon={<BedIcon className="h-5 w-5" />}
                    label="Bed Type"
                    value={selectedRoomForModal.bedType}
                  />
                )}
              </div>

              {/* Check-in Description */}
              {selectedRoomForModal.checkInDescription && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Check-in Information</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRoomForModal.checkInDescription}
                  </p>
                </div>
              )}

              {/* Long Description */}
              {selectedRoomForModal.longDescription && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Full Description</h4>
                    <RichText
                      data={
                        selectedRoomForModal.longDescription as unknown as SerializedEditorState
                      }
                      className="prose prose-sm dark:prose-invert max-w-none"
                    />
                  </div>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat - lazy loaded, only shows if AI is enabled */}
      {website?.ai?.supportsAi && property && (
        <React.Suspense fallback={null}>
          <PropertyChat
            propertyContext={{
              name: property.name,
              description: property.description,
              shortDescription: property.shortDescription,
              address: property.address,
              city: property.city,
              country: property.country,
              amenities: property.amenities,
              rooms: property.rooms?.map((room) => ({
                name: room.name,
                description: room.shortDescription || room.description,
                maxGuests: room.maxGuests,
                bedType: room.bedType,
              })),
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}

function RoomInfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-accent/50 rounded-lg text-center">
      <div className="text-primary mb-1">{icon}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// Occupancy option button with popover for unavailable state
function OccupancyButton({
  priceOption,
  isRequestOnly,
  isSelected,
  isBlockedByCapacity,
  isAvailable,
  maxUnits,
  maxGuests,
  currency,
  onSelectPrice,
}: {
  priceOption?: RoomPrice;
  isRequestOnly: boolean;
  isSelected: boolean;
  isBlockedByCapacity: boolean;
  isAvailable: boolean;
  maxUnits: number;
  maxGuests: number;
  currency?: string;
  onSelectPrice: (price?: RoomPrice, isRequestOnly?: boolean) => void;
}) {
  const buttonContent = (
    <div
      className={`
        flex flex-col items-center px-4 py-2 rounded-lg border transition-all w-full
        ${
          isSelected
            ? "border-primary bg-primary/10 ring-2 ring-primary"
            : isBlockedByCapacity
              ? "border-border bg-muted/50 cursor-not-allowed opacity-60"
              : "border-border hover:border-primary/50 hover:bg-accent cursor-pointer"
        }
        ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="flex items-center gap-1 text-sm">
        <UsersIcon className="h-3.5 w-3.5" />
        <span>
          {priceOption
            ? `${priceOption.adults} adult${priceOption.adults !== 1 ? "s" : ""}${
                priceOption.children > 0
                  ? `, ${priceOption.children} child${priceOption.children !== 1 ? "ren" : ""}`
                  : ""
              }`
            : `Up to ${maxGuests} guests`}
        </span>
      </div>
      {isRequestOnly ? (
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
          Request Only
        </span>
      ) : priceOption ? (
        <span className="text-sm font-bold text-primary mt-1">
          {formatCurrency(priceOption.price, currency)}
        </span>
      ) : null}
    </div>
  );

  // If blocked by capacity, wrap in popover
  if (isBlockedByCapacity && !isSelected) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" disabled={!isAvailable} className="flex flex-col">
            {buttonContent}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" side="top">
          <div className="flex gap-3">
            <AlertCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium">No rooms available</p>
              <p className="text-xs text-muted-foreground">
                You&apos;ve already selected all {maxUnits} available room
                {maxUnits !== 1 ? "s" : ""} for this room type. To select this
                occupancy option, first reduce the number of rooms selected in
                another occupancy option.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelectPrice(priceOption, isRequestOnly)}
      disabled={!isAvailable}
      className="flex flex-col"
    >
      {buttonContent}
    </button>
  );
}

function RoomCard({
  room,
  roomId,
  currency,
  roomSelections,
  remainingUnits,
  maxUnits,
  totalSelectedForRoom,
  onSelectRoom,
  onUpdateRoomQuantity,
  onShowDetails,
  checkIsOccupancySelected,
}: {
  room: Room;
  roomId: string;
  currency?: string;
  roomSelections: SelectedRoom[];
  remainingUnits: number;
  maxUnits: number;
  totalSelectedForRoom: number;
  onSelectRoom: (roomId: string, price?: RoomPrice, isRequestOnly?: boolean, maxUnits?: number) => void;
  onUpdateRoomQuantity: (roomId: string, priceKey: string, delta: number, maxUnits: number) => void;
  onShowDetails: (room: Room) => void;
  checkIsOccupancySelected: (roomId: string, price: RoomPrice | undefined) => boolean;
}) {
  // Use thumbnailUrl for grid view to save bandwidth
  const roomImage =
    room.images?.[0]?.thumbnailUrl || room.images?.[0]?.url || "/placeholder-room.jpg";
  const isAvailable =
    (room.availUnits || 0) > 0 || (room.availUnitsOfThisType || 0) > 0;
  const prices = room.prices || [];
  const hasRoomDetails =
    room.longDescription?.root?.children?.length ||
    room.checkInDescription ||
    (room.images && room.images.length > 1);
  const hasAnySelection = roomSelections.length > 0;

  // Helper to calculate max allowed for a specific occupancy
  const getMaxAllowedForOccupancy = (priceKey: string) => {
    const otherSelectionsTotal = roomSelections
      .filter((r) => r.priceKey !== priceKey)
      .reduce((sum, r) => sum + r.quantity, 0);
    return maxUnits - otherSelectionsTotal;
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Room Image */}
        <div
          className="sm:w-48 aspect-video sm:aspect-square flex-shrink-0 relative group cursor-pointer overflow-hidden bg-muted"
          onClick={() => onShowDetails(room)}
        >
          <Image
            src={roomImage}
            alt={room.name || "Room image"}
            fill
            sizes="(max-width: 640px) 100vw, 192px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {room.images && room.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
              +{room.images.length - 1} photos
            </div>
          )}
        </div>

        {/* Room Info */}
        <div className="flex-1 p-4 flex flex-col">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg">{room.name}</h3>
              <div className="flex items-center gap-2">
                {hasRoomDetails && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onShowDetails(room)}
                    className="h-8 w-8 rounded-full hover:bg-primary/10"
                    aria-label="View room details"
                  >
                    <InfoIcon className="h-4 w-4 text-primary" />
                  </Button>
                )}
                {hasAnySelection && (
                  <Badge className="bg-primary text-primary-foreground">
                    Selected
                  </Badge>
                )}
              </div>
            </div>

            {/* Short Description */}
            {(room.shortDescription || room.description) && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {room.shortDescription || room.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" />
                <span>Up to {room.maxGuests} guests</span>
              </div>
              {room.bedType && (
                <div className="flex items-center gap-1.5">
                  <BedIcon className="h-4 w-4" />
                  <span>{room.bedType}</span>
                </div>
              )}
              {room.availUnitsOfThisType && room.availUnitsOfThisType > 0 && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckIcon className="h-4 w-4" />
                  <span>{room.availUnitsOfThisType} available</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Options */}
          <div className="mt-auto pt-3 border-t space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Select occupancy:
            </p>

            {/* Occupancy selection grid */}
            <div className="flex flex-wrap gap-2">
              {prices.length > 0 ? (
                prices.map((priceOption, idx) => {
                  const isSelected = checkIsOccupancySelected(roomId, priceOption);
                  const isBlockedByCapacity = !isSelected && remainingUnits <= 0;
                  return (
                    <OccupancyButton
                      key={idx}
                      priceOption={priceOption}
                      isRequestOnly={priceOption.price === 0}
                      isSelected={isSelected}
                      isBlockedByCapacity={isBlockedByCapacity}
                      isAvailable={isAvailable}
                      maxUnits={maxUnits}
                      maxGuests={room.maxGuests}
                      currency={currency}
                      onSelectPrice={(price, isRequestOnly) => onSelectRoom(roomId, price, isRequestOnly, maxUnits)}
                    />
                  );
                })
              ) : (
                <OccupancyButton
                  priceOption={undefined}
                  isRequestOnly={true}
                  isSelected={checkIsOccupancySelected(roomId, undefined)}
                  isBlockedByCapacity={!checkIsOccupancySelected(roomId, undefined) && remainingUnits <= 0}
                  isAvailable={isAvailable}
                  maxUnits={maxUnits}
                  maxGuests={room.maxGuests}
                  currency={currency}
                  onSelectPrice={(price, isRequestOnly) => onSelectRoom(roomId, price, isRequestOnly, maxUnits)}
                />
              )}
            </div>

            {!isAvailable && (
              <Badge variant="destructive" className="mt-2">
                Sold Out
              </Badge>
            )}

            {/* Quantity selectors for each selected occupancy */}
            {hasAnySelection && (
              <div className="mt-3 pt-3 border-t border-dashed space-y-3">
                {/* Header showing total available */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Number of rooms:</span>
                  <span className="text-sm text-muted-foreground">
                    ({maxUnits} available)
                  </span>
                </div>

                {/* Individual quantity selectors for each selected occupancy */}
                {roomSelections.map((selection) => {
                  const isRequestOnly =
                    !selection.selectedPrice || selection.selectedPrice.price === 0;
                  const maxAllowed = getMaxAllowedForOccupancy(selection.priceKey);
                  const occupancyLabel = selection.selectedPrice
                    ? `${selection.selectedPrice.adults} adult${selection.selectedPrice.adults !== 1 ? "s" : ""}${
                        selection.selectedPrice.children > 0
                          ? `, ${selection.selectedPrice.children} child${selection.selectedPrice.children !== 1 ? "ren" : ""}`
                          : ""
                      }`
                    : "Request only";

                  return (
                    <div
                      key={selection.priceKey}
                      className="flex items-center justify-between bg-accent/30 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm">{occupancyLabel}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRoomQuantity(roomId, selection.priceKey, -1, maxUnits);
                          }}
                          disabled={selection.quantity <= 1}
                        >
                          <MinusIcon className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-semibold">
                          {selection.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRoomQuantity(roomId, selection.priceKey, 1, maxUnits);
                          }}
                          disabled={selection.quantity >= maxAllowed}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                        {!isRequestOnly && selection.selectedPrice && (
                          <span className="text-sm font-medium text-primary ml-2 min-w-[60px] text-right">
                            {formatCurrency(
                              selection.selectedPrice.price * selection.quantity,
                              currency
                            )}
                          </span>
                        )}
                        {isRequestOnly && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                            On request
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Total summary */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed">
                  <span className="text-muted-foreground">
                    Total selected: {totalSelectedForRoom} room
                    {totalSelectedForRoom !== 1 ? "s" : ""}
                  </span>
                  {remainingUnits > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {remainingUnits} more available
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PropertyDetailsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Carousel Skeleton */}
      <div className="aspect-[16/9] max-h-[500px] rounded-xl bg-muted animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
