"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  StarIcon,
  CheckIcon,
  UsersIcon,
  BedIcon,
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
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { RoomSelector } from "@/components/search/RoomSelector";
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

interface PropertyDetailsProps {
  propertyId: string;
  searchParams: {
    from?: string;
    to?: string;
    rooms?: string;
  };
}

interface SelectedRoom {
  roomId: string;
  quantity: number;
  selectedPrice?: RoomPrice;
  isRequestOnly?: boolean;
}

export function PropertyDetails({
  propertyId,
  searchParams,
}: PropertyDetailsProps) {
  const router = useRouter();
  const defaults = getDefaultDates();

  // State
  const [property, setProperty] = React.useState<Property | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Parse dates as YYYYMMDD numbers
  const [dateRange, setDateRange] = React.useState<DateRangeNumber | undefined>(() => {
    if (searchParams.from && searchParams.to) {
      return {
        from: parseInt(searchParams.from, 10),
        to: parseInt(searchParams.to, 10),
      };
    }
    return { from: defaults.from, to: defaults.to };
  });

  const [rooms, setRooms] = React.useState<RoomOccupancy[]>(() =>
    parseRooms(searchParams.rooms)
  );

  const [selectedRooms, setSelectedRooms] = React.useState<SelectedRoom[]>([]);
  const [isBooking, setIsBooking] = React.useState(false);
  const [showBookingForm, setShowBookingForm] = React.useState(false);

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
        from: dateRange.from, // YYYYMMDD format
        to: dateRange.to, // YYYYMMDD format
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

  // Handle date/room changes
  const handleDateChange = (range: DateRangeNumber | undefined) => {
    setDateRange(range);
    setSelectedRooms([]);
    if (range?.from && range?.to) {
      updateUrl(range, rooms);
    }
  };

  const handleRoomsChange = (newRooms: RoomOccupancy[]) => {
    setRooms(newRooms);
    setSelectedRooms([]);
    updateUrl(dateRange, newRooms);
  };

  // Handle room selection with price option
  const selectRoom = (roomId: string, selectedPrice?: RoomPrice, isRequestOnly?: boolean) => {
    setSelectedRooms((prev) => {
      const existing = prev.find((r) => r.roomId === roomId);
      if (existing) {
        // If clicking the same option, deselect
        if (
          existing.selectedPrice?.adults === selectedPrice?.adults &&
          existing.selectedPrice?.children === selectedPrice?.children
        ) {
          return prev.filter((r) => r.roomId !== roomId);
        }
        // Otherwise update the selection
        return prev.map((r) =>
          r.roomId === roomId ? { ...r, selectedPrice, isRequestOnly } : r
        );
      } else {
        return [...prev, { roomId, quantity: 1, selectedPrice, isRequestOnly }];
      }
    });
  };

  // Check if any selected room is request only
  const hasRequestOnlyRooms = selectedRooms.some((r) => r.isRequestOnly);

  // Calculate total price
  const nights = dateRange?.from && dateRange?.to 
    ? calculateNights(dateRange.from, dateRange.to) 
    : 0;
  
  const totalPrice = React.useMemo(() => {
    if (!property?.rooms) return 0;

    return selectedRooms.reduce((total, selected) => {
      // Use the selected price option or fall back to room's totalPrice
      const price = selected.selectedPrice?.price || 0;
      return total + price * selected.quantity;
    }, 0);
  }, [selectedRooms, property]);

  // Convert YYYYMMDD to YYYY-MM-DD string for booking API
  const formatDateForBooking = (dateNum: number): string => {
    const str = String(dateNum);
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  };

  // Handle booking
  const handleBooking = async () => {
    if (!property || !dateRange?.from || !dateRange?.to || selectedRooms.length === 0) {
      return;
    }

    if (!guestName || !guestEmail) {
      alert("Please fill in your name and email");
      return;
    }

    setIsBooking(true);

    try {
      const totalGuests = rooms.reduce(
        (acc, room) => acc + room.adults + room.children,
        0
      );

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
        rooms: selectedRooms.map((sr) => {
          return {
            roomId: parseInt(sr.roomId, 10) || 0,
            adults: sr.selectedPrice?.adults || rooms[0]?.adults || 2,
            children: sr.selectedPrice?.children || rooms[0]?.children || 0,
          };
        }),
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

  const mainImage = property.images?.[0]?.url || "/placeholder-property.jpg";
  const galleryImages = property.images?.slice(1, 5) || [];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="aspect-[4/3] rounded-2xl bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url(${mainImage})` }}
        />
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: `url(${img.url})` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Location */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
                {(property.city || property.country) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPinIcon className="h-4 w-4" />
                    <span>
                      {[property.city, property.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
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

            {property.description && (
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            )}
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-sm"
                  >
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
                  const selectedRoom = selectedRooms.find(
                    (sr) => sr.roomId === room.id
                  );
                  return (
                    <RoomCard
                      key={room.id}
                      room={room}
                      currency={property.currency}
                      selectedRoom={selectedRoom}
                      onSelectPrice={(price, isRequestOnly) =>
                        selectRoom(room.id, price, isRequestOnly)
                      }
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
                        Price not available for this selection. Submit a request and we&apos;ll get back to you with pricing.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {selectedRooms.length} room
                            {selectedRooms.length !== 1 ? "s" : ""} × {nights} night
                            {nights !== 1 ? "s" : ""}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(totalPrice, property.currency)}
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
    </div>
  );
}

function RoomCard({
  room,
  currency,
  selectedRoom,
  onSelectPrice,
}: {
  room: Room;
  currency?: string;
  selectedRoom?: SelectedRoom;
  onSelectPrice: (price?: RoomPrice, isRequestOnly?: boolean) => void;
}) {
  const roomImage = room.images?.[0]?.url || "/placeholder-room.jpg";
  const isAvailable = (room.availUnits || 0) > 0 || (room.availUnitsOfThisType || 0) > 0;
  const prices = room.prices || [];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Room Image */}
        <div
          className="sm:w-48 aspect-video sm:aspect-square bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(${roomImage})` }}
        />

        {/* Room Info */}
        <div className="flex-1 p-4 flex flex-col">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg">{room.name}</h3>
              {selectedRoom && (
                <Badge className="bg-primary text-primary-foreground">
                  Selected
                </Badge>
              )}
            </div>

            {room.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {room.description}
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
          <div className="mt-auto pt-3 border-t space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Select occupancy:</p>
            <div className="flex flex-wrap gap-2">
              {prices.length > 0 ? (
                prices.map((priceOption, idx) => {
                  const isSelected =
                    selectedRoom?.selectedPrice?.adults === priceOption.adults &&
                    selectedRoom?.selectedPrice?.children === priceOption.children;
                  const isRequestOnly = priceOption.price === 0;

                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        onSelectPrice(priceOption, isRequestOnly)
                      }
                      disabled={!isAvailable}
                      className={`
                        flex flex-col items-center px-4 py-2 rounded-lg border transition-all
                        ${isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                        }
                        ${!isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <div className="flex items-center gap-1 text-sm">
                        <UsersIcon className="h-3.5 w-3.5" />
                        <span>
                          {priceOption.adults} adult{priceOption.adults !== 1 ? "s" : ""}
                          {priceOption.children > 0 &&
                            `, ${priceOption.children} child${priceOption.children !== 1 ? "ren" : ""}`}
                        </span>
                      </div>
                      {isRequestOnly ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                          Request Only
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-primary mt-1">
                          {formatCurrency(priceOption.price, currency)}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                // No prices available - request only
                <button
                  onClick={() => onSelectPrice(undefined, true)}
                  disabled={!isAvailable}
                  className={`
                    flex flex-col items-center px-4 py-2 rounded-lg border transition-all
                    ${selectedRoom?.isRequestOnly
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500"
                      : "border-border hover:border-amber-500/50 hover:bg-accent"
                    }
                    ${!isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <div className="flex items-center gap-1 text-sm">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>Up to {room.maxGuests} guests</span>
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                    Request Only
                  </span>
                </button>
              )}
            </div>

            {!isAvailable && (
              <Badge variant="destructive" className="mt-2">Sold Out</Badge>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
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
