"use client";

import * as React from "react";
import Image from "next/image";
import {
  MapPinIcon,
  CalendarIcon,
  PlaneIcon,
  ShipIcon,
  UsersIcon,
  CheckIcon,
  InfoIcon,
  Loader2Icon,
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { RichText } from "@/components/RichText";
import {
  getPackageById,
  getPropertiesByIds,
} from "@/lib/actions/api";
import {
  type Package,
  type PackageDateRange,
  type PackageOffer,
  type Property,
  type RoomPrice,
  formatCurrency,
  formatDateNumber,
  calculateNights,
} from "@/lib/types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

interface PackageDetailsProps {
  packageId: string;
  searchParams: {
    availabilityFrom?: string;
    availabilityTo?: string;
    adults?: string;
    children?: string;
  };
}

// Booking step enum
type BookingStep = "select-date" | "select-offer" | "select-property" | "select-room" | "review";

export function PackageDetails({
  packageId,
  searchParams,
}: PackageDetailsProps) {
  // State
  const [pkg, setPkg] = React.useState<Package | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = React.useState(false);

  // Booking flow state
  const [currentStep, setCurrentStep] = React.useState<BookingStep>("select-date");
  const [selectedDateRange, setSelectedDateRange] = React.useState<PackageDateRange | null>(null);
  const [selectedOffer, setSelectedOffer] = React.useState<PackageOffer | null>(null);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<{
    roomId: string;
    channelRoomId: string;
    price: RoomPrice | null;
  } | null>(null);
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(false);

  // Parse search params
  const adults = searchParams.adults ? parseInt(searchParams.adults, 10) : 2;
  const children = searchParams.children ? parseInt(searchParams.children, 10) : 0;

  // Fetch package data
  React.useEffect(() => {
    async function fetchPackage() {
      setIsLoading(true);
      setError(null);

      try {
        const packageData = await getPackageById(packageId);
        if (packageData) {
          setPkg(packageData);
        } else {
          setError("Package not found");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch package");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPackage();
  }, [packageId]);

  // Fetch properties when date range is selected
  const fetchProperties = React.useCallback(async (dateRange: PackageDateRange) => {
    if (!dateRange.properties || dateRange.properties.length === 0) {
      setProperties([]);
      return;
    }

    setIsLoadingProperties(true);
    try {
      const result = await getPropertiesByIds(
        dateRange.properties,
        dateRange.from,
        dateRange.to
      );
      setProperties(result.properties || []);
    } catch (e) {
      console.error("Failed to fetch properties:", e);
      setProperties([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  // Handle date range selection
  const handleDateRangeSelect = (dateRange: PackageDateRange) => {
    setSelectedDateRange(dateRange);
    setSelectedOffer(null);
    setSelectedProperty(null);
    setSelectedRoom(null);
    setCurrentStep("select-offer");
  };

  // Handle offer selection
  const handleOfferSelect = (offer: PackageOffer) => {
    setSelectedOffer(offer);
    setCurrentStep("select-property");
    
    // Fetch properties for this date range
    if (selectedDateRange) {
      fetchProperties(selectedDateRange);
    }
  };

  // Handle property selection
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setSelectedRoom(null);
    setCurrentStep("select-room");
  };

  // Handle room selection
  const handleRoomSelect = (roomId: string, channelRoomId: string, price: RoomPrice | null) => {
    setSelectedRoom({ roomId, channelRoomId, price });
    setCurrentStep("review");
  };

  // Calculate total price
  const tripOfferPrice = selectedOffer?.total || 0;
  const accommodationPrice = selectedRoom?.price?.price || 0;
  const totalPrice = tripOfferPrice + accommodationPrice;

  // Handle booking
  const handleBookNow = () => {
    console.log("=== BOOKING DETAILS ===");
    console.log("Package:", pkg?.packageName);
    console.log("Selected Date Range:", selectedDateRange);
    console.log("Selected Offer:", selectedOffer);
    console.log("Selected Property:", selectedProperty?.name);
    console.log("Selected Room:", selectedRoom);
    console.log("Trip Offer Price:", tripOfferPrice);
    console.log("Accommodation Price:", accommodationPrice);
    console.log("Total Price:", totalPrice);
    console.log("Travelers:", { adults, children });
    console.log("======================");
  };

  // Get available offers for selected date range
  const getAvailableOffers = (): PackageOffer[] => {
    if (!selectedDateRange || !pkg) return [];
    
    // Check if date range has custom offers
    if (selectedDateRange.offers?.hasCustomOffers && selectedDateRange.offers.customOffers) {
      return selectedDateRange.offers.customOffers;
    }
    
    // Fall back to default offers
    return pkg.defaultOffers || [];
  };

  if (isLoading) {
    return <PackageDetailsSkeleton />;
  }

  if (error || !pkg) {
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
          {error || "Package not found"}
        </h3>
        <p className="text-muted-foreground">
          The package you&apos;re looking for is not available.
        </p>
      </div>
    );
  }

  const packageImages = pkg.content?.media || [];
  const hasDescription = pkg.content?.description?.root?.children && 
    pkg.content.description.root.children.length > 0;

  const TransportIcon = pkg.meta?.transportation === 'plane' ? PlaneIcon : ShipIcon;
  const availableOffers = getAvailableOffers();

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Image Carousel */}
      <div className="w-full">
        <ImageCarousel
          images={packageImages}
          aspectRatio="wide"
          showThumbnails={true}
          maxHeight={450}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Package Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Basic Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{pkg.packageName}</h1>

                {/* Destination */}
                {pkg.destination && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{pkg.destination.name}</span>
                  </div>
                )}

                {/* Meta badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {pkg.meta?.transportation && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TransportIcon className="h-3 w-3" />
                      <span className="capitalize">{pkg.meta.transportation}</span>
                    </Badge>
                  )}
                  {pkg.content?.durationInDaysOptions && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {pkg.content.durationInDaysOptions} days
                    </Badge>
                  )}
                  {pkg.meta?.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Short Description */}
            {pkg.content?.shortDescription && (
              <div className="flex items-start gap-3">
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {pkg.content.shortDescription}
                </p>

                {hasDescription && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDescriptionModal(true)}
                    className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-primary/10"
                    aria-label="View full description"
                  >
                    <InfoIcon className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Departures */}
          {pkg.departures && pkg.departures.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Departure Points</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pkg.departures.map((dep, idx) => (
                  <div 
                    key={dep.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/30"
                  >
                    <MapPinIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{dep.name}</p>
                      {pkg.defaultDepartInfo?.[idx] && (
                        <p className="text-sm text-muted-foreground">
                          {pkg.defaultDepartInfo[idx]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Booking Flow */}
          <div className="space-y-6">
            {/* Step 1: Select Date Range */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === "select-date" 
                    ? "bg-primary text-primary-foreground" 
                    : selectedDateRange 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {selectedDateRange ? <CheckIcon className="h-4 w-4" /> : "1"}
                </div>
                <h2 className="text-xl font-semibold">Select Travel Dates</h2>
              </div>

              {pkg.dateRanges && pkg.dateRanges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pkg.dateRanges.map((dateRange, idx) => {
                    const isSelected = selectedDateRange === dateRange;
                    const nights = dateRange.from && dateRange.to 
                      ? calculateNights(dateRange.from, dateRange.to) 
                      : 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateRangeSelect(dateRange)}
                        className={`
                          p-4 rounded-xl border-2 transition-all text-left
                          ${isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            {dateRange.from && formatDateNumber(dateRange.from)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>to</span>
                          <span className="font-medium">
                            {dateRange.to && formatDateNumber(dateRange.to)}
                          </span>
                        </div>
                        {nights > 0 && (
                          <Badge variant="secondary" className="mt-2">
                            {nights} nights
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No available dates for this package.
                </p>
              )}
            </div>

            {/* Step 2: Select Offer */}
            {(currentStep !== "select-date" || selectedDateRange) && (
              <div className={currentStep === "select-date" ? "opacity-50 pointer-events-none" : ""}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === "select-offer" 
                      ? "bg-primary text-primary-foreground" 
                      : selectedOffer 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedOffer ? <CheckIcon className="h-4 w-4" /> : "2"}
                  </div>
                  <h2 className="text-xl font-semibold">Select Trip Option</h2>
                </div>

                {availableOffers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableOffers.map((offer, idx) => {
                      const isSelected = selectedOffer === offer;
                      const totalGuests = (offer.adults || 0) + (offer.children || 0);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOfferSelect(offer)}
                          disabled={currentStep === "select-date"}
                          className={`
                            p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <UsersIcon className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {offer.group || `${totalGuests} Travelers`}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {offer.adults} adult{offer.adults !== 1 ? "s" : ""}
                            {offer.children && offer.children > 0 && (
                              <>, {offer.children} child{offer.children !== 1 ? "ren" : ""}</>
                            )}
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {offer.total ? formatCurrency(offer.total, "EUR") : "Request Price"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No trip options available. Please select a date range first.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Select Property */}
            {(currentStep === "select-property" || currentStep === "select-room" || currentStep === "review") && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === "select-property" 
                      ? "bg-primary text-primary-foreground" 
                      : selectedProperty 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedProperty ? <CheckIcon className="h-4 w-4" /> : "3"}
                  </div>
                  <h2 className="text-xl font-semibold">Select Accommodation</h2>
                </div>

                {isLoadingProperties ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading accommodations...</span>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {properties.map((property) => {
                      const isSelected = selectedProperty?.id === property.id;
                      const mainImage = property.images?.[0]?.thumbnailUrl || property.images?.[0]?.url;

                      return (
                        <button
                          key={property.id}
                          onClick={() => handlePropertySelect(property)}
                          className={`
                            rounded-xl border-2 overflow-hidden transition-all text-left
                            ${isSelected 
                              ? "border-primary ring-2 ring-primary/20" 
                              : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          <div className="relative aspect-video bg-muted">
                            {mainImage && (
                              <Image
                                src={mainImage}
                                alt={property.name}
                                fill
                                className="object-cover"
                              />
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <CheckIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold mb-1">{property.name}</h3>
                            {property.city && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3" />
                                {property.city}
                              </p>
                            )}
                            {property.fromPrice !== undefined && property.fromPrice > 0 && (
                              <p className="text-sm mt-2">
                                <span className="text-muted-foreground">from </span>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(property.fromPrice, property.currency)}
                                </span>
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No accommodations available for this date range.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Select Room */}
            {(currentStep === "select-room" || currentStep === "review") && selectedProperty && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === "select-room" 
                      ? "bg-primary text-primary-foreground" 
                      : selectedRoom 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedRoom ? <CheckIcon className="h-4 w-4" /> : "4"}
                  </div>
                  <h2 className="text-xl font-semibold">Select Room at {selectedProperty.name}</h2>
                </div>

                {selectedProperty.rooms && selectedProperty.rooms.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProperty.rooms.map((room) => {
                      const isSelected = selectedRoom?.roomId === room.id;
                      const roomImage = room.images?.[0]?.thumbnailUrl || room.images?.[0]?.url;
                      const bestPrice = room.prices?.[0]; // Get first price option

                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomSelect(room.id, room.channelRoomId || '', bestPrice || null)}
                          className={`
                            w-full flex gap-4 p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            {roomImage && (
                              <Image
                                src={roomImage}
                                alt={room.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{room.name}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                  <UsersIcon className="h-3 w-3" />
                                  Up to {room.maxGuests} guests
                                </p>
                              </div>
                              {isSelected && (
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <CheckIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            {bestPrice && (
                              <p className="text-lg font-bold text-primary mt-2">
                                {formatCurrency(bestPrice.price, selectedProperty.currency)}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No rooms available at this property.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Booking Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>
                Review your selections and complete booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Date Range */}
              {selectedDateRange && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <CalendarIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Travel Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDateRange.from && formatDateNumber(selectedDateRange.from)} — {selectedDateRange.to && formatDateNumber(selectedDateRange.to)}
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Offer */}
              {selectedOffer && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <UsersIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Trip Package</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOffer.group || `${(selectedOffer.adults || 0) + (selectedOffer.children || 0)} Travelers`}
                    </p>
                    {tripOfferPrice > 0 && (
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatCurrency(tripOfferPrice, "EUR")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Property & Room */}
              {selectedProperty && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <MapPinIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedProperty.name}</p>
                    {selectedRoom && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {selectedProperty.rooms?.find(r => r.id === selectedRoom.roomId)?.name}
                        </p>
                        {accommodationPrice > 0 && (
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(accommodationPrice, selectedProperty.currency)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              {(tripOfferPrice > 0 || accommodationPrice > 0) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {tripOfferPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trip Package</span>
                        <span>{formatCurrency(tripOfferPrice, "EUR")}</span>
                      </div>
                    )}
                    {accommodationPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accommodation</span>
                        <span>{formatCurrency(accommodationPrice, "EUR")}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalPrice, "EUR")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {currentStep === "review" && selectedRoom ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>
              ) : (
                <div className="w-full text-center">
                  <p className="text-sm text-muted-foreground">
                    {currentStep === "select-date" && "Select travel dates to continue"}
                    {currentStep === "select-offer" && "Select a trip option to continue"}
                    {currentStep === "select-property" && "Select accommodation to continue"}
                    {currentStep === "select-room" && "Select a room to continue"}
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Description Modal */}
      <Dialog
        open={showDescriptionModal}
        onOpenChange={setShowDescriptionModal}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{pkg.packageName}</DialogTitle>
            <DialogDescription>Full package description</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {pkg.content?.description && (
              <RichText
                data={pkg.content.description as unknown as SerializedEditorState}
                className="prose prose-sm dark:prose-invert max-w-none"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageDetailsSkeleton() {
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
