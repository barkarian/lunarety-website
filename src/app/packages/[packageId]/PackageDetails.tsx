"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  BedIcon,
  AlertCircleIcon,
  PlusIcon,
  MinusIcon,
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
import { RoomSelector } from "@/components/search/RoomSelector";
import {
  BookingContactForm,
  validateBookingContactData,
  type BookingContactData,
  type AuthenticatedBookingData,
} from "@/components/booking/BookingContactForm";
import {
  getPackageById,
  getPropertiesByIds,
} from "@/lib/actions/api";
import {
  type Package,
  type PackageDateRange,
  type PackageOffer,
  type PackageLocation,
  type Property,
  type RoomPrice,
  type RoomOccupancy,
  formatCurrency,
  formatDateNumber,
  calculateNights,
  parseRooms,
  serializeRooms,
} from "@/lib/types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

interface PackageDetailsProps {
  packageId: string;
  searchParams: {
    availabilityFrom?: string;
    availabilityTo?: string;
    rooms?: string;
  };
}

// Booking step enum - now includes departure selection
type BookingStep = "select-departure" | "select-date" | "select-offer" | "select-property" | "select-room" | "review";

export function PackageDetails({
  packageId,
  searchParams,
}: PackageDetailsProps) {
  const router = useRouter();
  
  // State
  const [pkg, setPkg] = React.useState<Package | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = React.useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = React.useState<Property | null>(null);
  const [selectedRoomForModal, setSelectedRoomForModal] = React.useState<{
    room: { id: string; name: string; images?: Array<{ url: string; thumbnailUrl?: string; alt?: string }>; maxGuests?: number; maxAdults?: number; maxChildren?: number; bedType?: string; shortDescription?: string; description?: string; longDescription?: unknown; checkInDescription?: string };
    property: Property;
  } | null>(null);

  // Parse rooms from search params
  const initialRooms = React.useMemo(() => parseRooms(searchParams.rooms), [searchParams.rooms]);

  // Interface for selected room with quantity support
  interface SelectedRoom {
    roomId: string;
    channelRoomId: string;
    priceKey: string; // unique key: "adults-children" e.g. "2-0"
    quantity: number;
    selectedPrice?: RoomPrice;
    isRequestOnly?: boolean;
  }

  // Helper to generate a unique key for a price option
  const getPriceKey = (price: RoomPrice | undefined): string => {
    if (!price) return "request-only";
    return `${price.adults}-${price.children}`;
  };

  // Booking flow state
  const [currentStep, setCurrentStep] = React.useState<BookingStep>("select-departure");
  const [selectedDeparture, setSelectedDeparture] = React.useState<PackageLocation | null>(null);
  const [selectedDateRange, setSelectedDateRange] = React.useState<PackageDateRange | null>(null);
  const [selectedOffer, setSelectedOffer] = React.useState<PackageOffer | null>(null);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
  const [selectedRooms, setSelectedRooms] = React.useState<SelectedRoom[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(false);
  
  // Rooms configuration state
  const [rooms, setRooms] = React.useState<RoomOccupancy[]>(initialRooms);

  // Booking form state
  const [showBookingForm, setShowBookingForm] = React.useState(false);
  const [contactData, setContactData] = React.useState<BookingContactData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "",
  });
  const [authenticatedData, setAuthenticatedData] = React.useState<AuthenticatedBookingData | null>(null);
  const [bookingError, setBookingError] = React.useState<string | null>(null);
  const [isBooking, setIsBooking] = React.useState(false);

  // Update URL when rooms change
  const updateUrl = React.useCallback(
    (newRooms: RoomOccupancy[]) => {
      const params = new URLSearchParams();
      if (searchParams.availabilityFrom) {
        params.set("availabilityFrom", searchParams.availabilityFrom);
      }
      if (searchParams.availabilityTo) {
        params.set("availabilityTo", searchParams.availabilityTo);
      }
      params.set("rooms", serializeRooms(newRooms));

      router.replace(`/packages/${packageId}?${params.toString()}`, {
        scroll: false,
      });
    },
    [packageId, router, searchParams.availabilityFrom, searchParams.availabilityTo]
  );

  // Handle rooms change - update URL and re-fetch properties if needed
  const handleRoomsChange = React.useCallback(
    (newRooms: RoomOccupancy[]) => {
      setRooms(newRooms);
      updateUrl(newRooms);
      
      // Reset room selections when guest configuration changes
      setSelectedRooms([]);
      setSelectedProperty(null);
      
      // Go back to property selection step if we were further along
      if (currentStep === "select-room" || currentStep === "review") {
        setCurrentStep("select-property");
      }
      
      // If we're at property selection step, re-fetch properties with new room config
      if (selectedDateRange && selectedDateRange.properties && selectedDateRange.properties.length > 0) {
        setIsLoadingProperties(true);
        getPropertiesByIds(selectedDateRange.properties, selectedDateRange.from, selectedDateRange.to, newRooms)
          .then(result => setProperties(result.properties || []))
          .catch(() => setProperties([]))
          .finally(() => setIsLoadingProperties(false));
      }
    },
    [updateUrl, selectedDateRange, currentStep]
  );

  // Fetch package data (only on mount or packageId change)
  React.useEffect(() => {
    async function fetchPackage() {
      setIsLoading(true);
      setError(null);

      try {
        const packageData = await getPackageById(packageId);
        if (packageData) {
          setPkg(packageData);
          // Auto-select first departure if available
          if (packageData.departures && packageData.departures.length >= 1) {
            const firstDeparture = packageData.departures[0];
            setSelectedDeparture(firstDeparture);
            setCurrentStep("select-date");
            
            // Auto-select first available date for this departure
            const availableDates = getAvailableDateRangesForDeparture(packageData, firstDeparture);
            if (availableDates.length > 0) {
              const firstDate = availableDates[0];
              setSelectedDateRange(firstDate);
              setCurrentStep("select-offer");
              
              // Auto-select first available offer for this date
              const availableOffers = getAvailableOffersForDateRange(packageData, firstDate, firstDeparture);
              if (availableOffers.length > 0) {
                setSelectedOffer(availableOffers[0]);
                setCurrentStep("select-property");
                // Fetch properties with initial rooms
                if (firstDate.properties && firstDate.properties.length > 0) {
                  getPropertiesByIds(firstDate.properties, firstDate.from, firstDate.to, initialRooms)
                    .then(result => setProperties(result.properties || []))
                    .catch(() => setProperties([]));
                }
              }
            }
          }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]);

  // Fetch properties when date range is selected - now with rooms configuration
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
        dateRange.to,
        rooms // Pass rooms configuration
      );
      setProperties(result.properties || []);
    } catch (e) {
      console.error("Failed to fetch properties:", e);
      setProperties([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [rooms]);

  // Handle departure selection (Step 1)
  const handleDepartureSelect = (departure: PackageLocation) => {
    setSelectedDeparture(departure);
    setSelectedProperty(null);
    setSelectedRooms([]);
    setShowBookingForm(false);
    
    // Get available date ranges for the new departure
    const availableDates = pkg ? getAvailableDateRangesForDeparture(pkg, departure) : [];
    
    // Check if previous selected date is still available for this departure
    const previousDateStillAvailable = selectedDateRange && availableDates.some(
      dateRange => dateRange.from === selectedDateRange.from && dateRange.to === selectedDateRange.to
    );
    
    const dateToUse = previousDateStillAvailable 
      ? selectedDateRange 
      : (availableDates.length > 0 ? availableDates[0] : null);
    
    if (!dateToUse) {
      // No dates available, reset and stay on date selection
      setSelectedDateRange(null);
      setSelectedOffer(null);
      setCurrentStep("select-date");
      return;
    }
    
    if (!previousDateStillAvailable) {
      setSelectedDateRange(dateToUse);
    }
    
    // Get available offers for the date
    const availableOffers = pkg ? getAvailableOffersForDateRange(pkg, dateToUse, departure) : [];
    
    // Check if previous offer is still available
    const previousOfferStillAvailable = selectedOffer && availableOffers.some(
      offer => offer.group === selectedOffer.group && offer.adults === selectedOffer.adults && offer.children === selectedOffer.children
    );
    
    if (previousOfferStillAvailable) {
      // Keep the previous offer selection
      setCurrentStep("select-property");
      // Fetch properties
      if (dateToUse.properties && dateToUse.properties.length > 0) {
        fetchProperties(dateToUse);
      }
    } else if (availableOffers.length > 0) {
      // Auto-select first available offer
      setSelectedOffer(availableOffers[0]);
      setCurrentStep("select-property");
      // Fetch properties
      if (dateToUse.properties && dateToUse.properties.length > 0) {
        fetchProperties(dateToUse);
      }
    } else {
      // No offers available
      setSelectedOffer(null);
      setCurrentStep("select-offer");
    }
  };

  // Handle date range selection (Step 2)
  const handleDateRangeSelect = (dateRange: PackageDateRange) => {
    setSelectedDateRange(dateRange);
    setSelectedProperty(null);
    setSelectedRooms([]);
    setShowBookingForm(false);
    
    if (!pkg || !selectedDeparture) {
      setSelectedOffer(null);
      setCurrentStep("select-offer");
      return;
    }
    
    // Get available offers for the new date
    const availableOffers = getAvailableOffersForDateRange(pkg, dateRange, selectedDeparture);
    
    // Check if previous offer is still available
    const previousOfferStillAvailable = selectedOffer && availableOffers.some(
      offer => offer.group === selectedOffer.group && offer.adults === selectedOffer.adults && offer.children === selectedOffer.children
    );
    
    if (previousOfferStillAvailable) {
      // Keep the previous offer selection
      setCurrentStep("select-property");
      // Fetch properties
      if (dateRange.properties && dateRange.properties.length > 0) {
        fetchProperties(dateRange);
      }
    } else if (availableOffers.length > 0) {
      // Auto-select first available offer
      setSelectedOffer(availableOffers[0]);
      setCurrentStep("select-property");
      // Fetch properties
      if (dateRange.properties && dateRange.properties.length > 0) {
        fetchProperties(dateRange);
      }
    } else {
      // No offers available
      setSelectedOffer(null);
      setCurrentStep("select-offer");
    }
  };

  // Handle offer selection (Step 3)
  const handleOfferSelect = (offer: PackageOffer) => {
    setSelectedOffer(offer);
    setShowBookingForm(false);
    setCurrentStep("select-property");
    
    // Fetch properties for this date range
    if (selectedDateRange) {
      fetchProperties(selectedDateRange);
    }
  };

  // Handle property selection (Step 4) - with auto-selection of optimal rooms
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingForm(false);
    
    // Auto-select optimal room combination based on rooms configuration
    const autoSelectedRooms = autoSelectRoomsForProperty(property, rooms);
    setSelectedRooms(autoSelectedRooms);
    
    if (autoSelectedRooms.length > 0 && isRoomSelectionComplete(autoSelectedRooms, rooms)) {
      setCurrentStep("review");
    } else {
      setCurrentStep("select-room");
    }
  };

  // Auto-select optimal room combination for a property based on room configuration
  const autoSelectRoomsForProperty = (property: Property, roomConfig: RoomOccupancy[]): SelectedRoom[] => {
    if (!property.rooms || property.rooms.length === 0 || roomConfig.length === 0) {
      return [];
    }

    type RoomOption = {
      roomId: string;
      channelRoomId: string;
      price: RoomPrice;
      priceKey: string;
      availUnits: number;
      isRequestOnly: boolean;
      matchedOccupancy: RoomOccupancy;
    };

    const newSelections: SelectedRoom[] = [];

    // Process each requested room occupancy
    for (const requestedRoom of roomConfig) {
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
                channelRoomId: room.channelRoomId || '',
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
              channelRoomId: room.channelRoomId || '',
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
            channelRoomId: bestOption.channelRoomId,
            priceKey: bestOption.priceKey,
            quantity: 1,
            selectedPrice: bestOption.price,
            isRequestOnly: bestOption.isRequestOnly,
          });
        }
      }
    }

    return newSelections;
  };

  // Check if the current room selection is complete (matches the room configuration)
  const isRoomSelectionComplete = React.useCallback((selections: SelectedRoom[], roomConfig: RoomOccupancy[]): boolean => {
    // Total rooms needed equals the number of room configurations
    const requiredRooms = roomConfig.length;
    
    // Total rooms selected (accounting for quantity)
    const selectedTotal = selections.reduce((sum, s) => sum + s.quantity, 0);
    
    return selectedTotal >= requiredRooms;
  }, []);

  // Get validation message for room selection
  const getRoomSelectionValidation = React.useMemo(() => {
    const requiredRooms = rooms.length;
    const selectedTotal = selectedRooms.reduce((sum, s) => sum + s.quantity, 0);
    
    if (selectedTotal === 0) {
      return { isValid: false, message: `Select ${requiredRooms} room${requiredRooms !== 1 ? 's' : ''} to continue` };
    }
    
    if (selectedTotal < requiredRooms) {
      const remaining = requiredRooms - selectedTotal;
      return { isValid: false, message: `Select ${remaining} more room${remaining !== 1 ? 's' : ''} (${selectedTotal}/${requiredRooms} selected)` };
    }
    
    return { isValid: true, message: `${selectedTotal} room${selectedTotal !== 1 ? 's' : ''} selected` };
  }, [rooms.length, selectedRooms]);

  // Handle room selection (Step 5) - supports multiple selections
  const selectRoom = React.useCallback((
    roomId: string,
    channelRoomId: string,
    selectedPrice?: RoomPrice,
    isRequestOnly?: boolean,
    maxUnits?: number
  ) => {
    const priceKey = getPriceKey(selectedPrice);

    setSelectedRooms((prev) => {
      const existing = prev.find(
        (r) => r.roomId === roomId && r.priceKey === priceKey
      );

      if (existing) {
        // If clicking on already selected occupancy, deselect it
        const newRooms = prev.filter(
          (r) => !(r.roomId === roomId && r.priceKey === priceKey)
        );
        // Check if the new selection is complete
        const newTotal = newRooms.reduce((sum, s) => sum + s.quantity, 0);
        if (newTotal < rooms.length) {
          setCurrentStep("select-room");
        }
        return newRooms;
      } else {
        // Check if we have units available
        const currentTotalForRoom = prev
          .filter((r) => r.roomId === roomId)
          .reduce((sum, r) => sum + r.quantity, 0);

        const availableUnits = (maxUnits || 1) - currentTotalForRoom;

        if (availableUnits <= 0) {
          return prev;
        }

        // Add new selection
        const newRooms = [
          ...prev,
          { roomId, channelRoomId, priceKey, quantity: 1, selectedPrice, isRequestOnly },
        ];
        
        // Check if the new selection is complete
        const newTotal = newRooms.reduce((sum, s) => sum + s.quantity, 0);
        if (newTotal >= rooms.length) {
          setCurrentStep("review");
        }
        return newRooms;
      }
    });
  }, [rooms.length]);

  // Update room quantity for a specific occupancy selection
  const updateRoomQuantity = React.useCallback(
    (roomId: string, priceKey: string, delta: number, maxUnits: number) => {
      setSelectedRooms((prev) => {
        const currentTotalExcluding = prev
          .filter((r) => r.roomId === roomId && r.priceKey !== priceKey)
          .reduce((sum, r) => sum + r.quantity, 0);

        const newRooms = prev.map((r) => {
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
        
        // Check if the new selection is complete
        const newTotal = newRooms.reduce((sum, s) => sum + s.quantity, 0);
        if (newTotal >= rooms.length) {
          setCurrentStep("review");
        } else {
          setCurrentStep("select-room");
        }
        
        return newRooms;
      });
    },
    [rooms.length]
  );

  // Get total selected units for a specific room
  const getTotalSelectedForRoom = React.useCallback(
    (roomId: string) => {
      return selectedRooms
        .filter((r) => r.roomId === roomId)
        .reduce((sum, r) => sum + r.quantity, 0);
    },
    [selectedRooms]
  );

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

  // Check if the booking has request-only components
  const hasRequestOnly = selectedRooms.some((r) => r.isRequestOnly);

  // Calculate total price
  const tripOfferPrice = selectedOffer?.total || 0;
  const accommodationPrice = React.useMemo(() => {
    return selectedRooms.reduce((total, selected) => {
      const price = selected.selectedPrice?.price || 0;
      return total + price * selected.quantity;
    }, 0);
  }, [selectedRooms]);
  const totalPrice = tripOfferPrice + accommodationPrice;

  // Calculate total number of rooms selected
  const totalRoomCount = React.useMemo(() => {
    return selectedRooms.reduce((total, sr) => total + sr.quantity, 0);
  }, [selectedRooms]);

  // Calculate totals for display
  const totalGuests = rooms.reduce((acc, room) => acc + room.adults + room.children, 0);
  const nights = selectedDateRange?.from && selectedDateRange?.to 
    ? calculateNights(selectedDateRange.from, selectedDateRange.to) 
    : 0;

  // Check if booking form is valid
  const isBookingFormValid = React.useMemo(() => {
    if (authenticatedData && authenticatedData.userType === "guest") {
      return true;
    }
    return (
      contactData.firstName &&
      contactData.lastName &&
      contactData.email &&
      contactData.phone &&
      contactData.countryCode
    );
  }, [authenticatedData, contactData]);

  // Handle booking
  const handleBookNow = () => {
    setBookingError(null);

    // Validate contact data if needed
    const needsGuestContactInfo = !authenticatedData || authenticatedData.userType === "agent";
    if (needsGuestContactInfo) {
      const validationError = validateBookingContactData(contactData);
      if (validationError) {
        setBookingError(validationError);
        return;
      }
    }

    setIsBooking(true);

    // For now, just console.log the booking details
    console.log("=== BOOKING DETAILS ===");
    console.log("Package:", pkg?.packageName);
    console.log("Selected Departure:", selectedDeparture);
    console.log("Selected Date Range:", selectedDateRange);
    console.log("Selected Offer:", selectedOffer);
    console.log("Selected Property:", selectedProperty?.name);
    console.log("Selected Rooms:", selectedRooms);
    console.log("Rooms Configuration:", rooms);
    console.log("Contact Data:", contactData);
    console.log("Authenticated Data:", authenticatedData);
    console.log("Trip Offer Price:", tripOfferPrice);
    console.log("Accommodation Price:", accommodationPrice);
    console.log("Total Price:", totalPrice);
    console.log("Is Request Only:", hasRequestOnly);
    console.log("======================");

    // Simulate processing
    setTimeout(() => {
      setIsBooking(false);
      // In a real implementation, you would navigate to booking confirmation
    }, 1000);
  };

  // Helper function to get available date ranges for a specific departure
  const getAvailableDateRangesForDeparture = (packageData: Package, departure: PackageLocation): PackageDateRange[] => {
    if (!packageData?.dateRanges || !departure) return [];
    
    return packageData.dateRanges.filter(dateRange => {
      if (!dateRange.linkedToDepartures || dateRange.linkedToDepartures.length === 0) {
        return true;
      }
      return dateRange.linkedToDepartures.some(dep => dep.id === departure.id);
    });
  };

  // Helper function to get available offers for a specific date range and departure
  const getAvailableOffersForDateRange = (packageData: Package, dateRange: PackageDateRange, departure: PackageLocation): PackageOffer[] => {
    if (!packageData || !dateRange || !departure) return [];
    
    // Get offers from custom offers or default offers
    let offers: PackageOffer[];
    if (dateRange.offers?.hasCustomOffers && dateRange.offers.customOffers) {
      offers = dateRange.offers.customOffers;
    } else {
      offers = packageData.defaultOffers || [];
    }
    
    // Filter offers: show only offers with no linkedToDepartures OR linked to selected departure
    return offers.filter(offer => {
      if (!offer.linkedToDepartures || offer.linkedToDepartures.length === 0) {
        return true;
      }
      return offer.linkedToDepartures.some(dep => dep.id === departure.id);
    });
  };

  // Get available date ranges for selected departure, filtered by linkedToDepartures
  const getAvailableDateRanges = (): PackageDateRange[] => {
    if (!pkg?.dateRanges || !selectedDeparture) return [];
    return getAvailableDateRangesForDeparture(pkg, selectedDeparture);
  };

  // Get available offers for selected date range, filtered by departure
  const getAvailableOffers = (): PackageOffer[] => {
    if (!selectedDateRange || !pkg || !selectedDeparture) return [];
    return getAvailableOffersForDateRange(pkg, selectedDateRange, selectedDeparture);
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
  const availableDateRanges = getAvailableDateRanges();
  const availableOffers = getAvailableOffers();
  const hasDepartures = pkg.departures && pkg.departures.length > 0;
  const hasMultipleDepartures = pkg.departures && pkg.departures.length > 1;

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
                  {pkg.content?.durationInDaysOptions && Array.isArray(pkg.content.durationInDaysOptions) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {pkg.content.durationInDaysOptions.join(" / ")} days
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

          <Separator />

          {/* Booking Flow */}
          <div className="space-y-6">
            {/* Step 1: Select Departure Point */}
            {hasDepartures && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === "select-departure" 
                      ? "bg-primary text-primary-foreground" 
                      : selectedDeparture 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedDeparture ? <CheckIcon className="h-4 w-4" /> : "1"}
                  </div>
                  <h2 className="text-xl font-semibold">Select Departure Point</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pkg.departures!.map((departure, idx) => {
                    const isSelected = selectedDeparture?.id === departure.id;
                    const departInfo = pkg.defaultDepartInfo?.[idx];

                    return (
                      <button
                        key={departure.id}
                        onClick={() => handleDepartureSelect(departure)}
                        className={`
                          p-4 rounded-xl border-2 transition-all text-left
                          ${isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MapPinIcon className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{departure.name}</span>
                        </div>
                        {departInfo && (
                          <p className="text-sm text-muted-foreground">
                            {departInfo}
                          </p>
                        )}
                        {isSelected && (
                          <div className="mt-2">
                            <Badge className="bg-primary text-primary-foreground">
                              Selected
                            </Badge>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Select Date Range */}
            {(currentStep !== "select-departure" || selectedDeparture) && (
              <div className={currentStep === "select-departure" && !selectedDeparture ? "opacity-50 pointer-events-none" : ""}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === "select-date" 
                      ? "bg-primary text-primary-foreground" 
                      : selectedDateRange 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedDateRange ? <CheckIcon className="h-4 w-4" /> : hasMultipleDepartures ? "2" : "1"}
                  </div>
                  <h2 className="text-xl font-semibold">Select Travel Dates</h2>
                </div>

                {availableDateRanges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableDateRanges.map((dateRange, idx) => {
                      const isSelected = selectedDateRange === dateRange;
                      const rangeNights = dateRange.from && dateRange.to 
                        ? calculateNights(dateRange.from, dateRange.to) 
                        : 0;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleDateRangeSelect(dateRange)}
                          disabled={currentStep === "select-departure" && !selectedDeparture}
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
                          {rangeNights > 0 && (
                            <Badge variant="secondary" className="mt-2">
                              {rangeNights} nights
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No available dates for this departure. Please select a different departure point.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Select Offer */}
            {(currentStep === "select-offer" || currentStep === "select-property" || currentStep === "select-room" || currentStep === "review") && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === "select-offer" 
                      ? "bg-primary text-primary-foreground" 
                      : selectedOffer 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {selectedOffer ? <CheckIcon className="h-4 w-4" /> : hasMultipleDepartures ? "3" : "2"}
                  </div>
                  <h2 className="text-xl font-semibold">Select Trip Option</h2>
                </div>

                {availableOffers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableOffers.map((offer, idx) => {
                      const isSelected = selectedOffer === offer;
                      const offerTotalGuests = (offer.adults || 0) + (offer.children || 0);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOfferSelect(offer)}
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
                              {offer.group || `${offerTotalGuests} Travelers`}
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
                    No trip options available for this departure. Please select a different departure point.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Select Property */}
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
                    {selectedProperty ? <CheckIcon className="h-4 w-4" /> : hasMultipleDepartures ? "4" : "3"}
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
                      const hasPropertyDetails = property.longDescription?.root?.children?.length || 
                        property.amenities?.length || 
                        (property.images && property.images.length > 1);

                      return (
                        <div
                          key={property.id}
                          className={`
                            rounded-xl border-2 overflow-hidden transition-all
                            ${isSelected 
                              ? "border-primary ring-2 ring-primary/20" 
                              : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          <button
                            onClick={() => handlePropertySelect(property)}
                            className="w-full text-left"
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
                              {property.images && property.images.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                  +{property.images.length - 1} photos
                                </div>
                              )}
                            </div>
                          </button>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <button
                                onClick={() => handlePropertySelect(property)}
                                className="text-left flex-1"
                              >
                                <h3 className="font-semibold">{property.name}</h3>
                              </button>
                              {hasPropertyDetails && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPropertyForModal(property);
                                  }}
                                  className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-primary/10"
                                  aria-label="View property details"
                                >
                                  <InfoIcon className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                            </div>
                            {property.city && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3" />
                                {property.city}
                              </p>
                            )}
                            {property.shortDescription && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {property.shortDescription}
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
                        </div>
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

            {/* Step 5: Select Room */}
            {(currentStep === "select-room" || currentStep === "review") && selectedProperty && (
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep === "select-room" 
                        ? "bg-primary text-primary-foreground" 
                        : getRoomSelectionValidation.isValid 
                          ? "bg-green-500 text-white" 
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {getRoomSelectionValidation.isValid ? <CheckIcon className="h-4 w-4" /> : hasMultipleDepartures ? "5" : "4"}
                    </div>
                    <h2 className="text-xl font-semibold">Select Room at {selectedProperty.name}</h2>
                  </div>
                  {/* Validation status badge */}
                  <Badge 
                    variant={getRoomSelectionValidation.isValid ? "default" : "secondary"}
                    className={getRoomSelectionValidation.isValid ? "bg-green-500" : ""}
                  >
                    {getRoomSelectionValidation.message}
                  </Badge>
                </div>

                {selectedProperty.rooms && selectedProperty.rooms.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProperty.rooms.map((room) => {
                      const roomSelections = selectedRooms.filter(sr => sr.roomId === room.id);
                      const hasAnySelection = roomSelections.length > 0;
                      const roomImage = room.images?.[0]?.thumbnailUrl || room.images?.[0]?.url;
                      const maxUnits = room.availUnits || 1;
                      const totalSelectedForRoom = getTotalSelectedForRoom(room.id);
                      const remainingUnits = maxUnits - totalSelectedForRoom;
                      const prices = room.prices || [];
                      const isAvailable = (room.availUnits || 0) > 0 || (room.availUnitsOfThisType || 0) > 0;

                      // Helper to calculate max allowed for a specific occupancy
                      const getMaxAllowedForOccupancy = (priceKey: string) => {
                        const otherSelectionsTotal = roomSelections
                          .filter((r) => r.priceKey !== priceKey)
                          .reduce((sum, r) => sum + r.quantity, 0);
                        return maxUnits - otherSelectionsTotal;
                      };

                      return (
                        <Card key={room.id} className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            {/* Room Image */}
                            <button
                              className="sm:w-48 aspect-video sm:aspect-square flex-shrink-0 relative group overflow-hidden bg-muted"
                              onClick={() => setSelectedRoomForModal({ room, property: selectedProperty })}
                            >
                              {roomImage && (
                                <Image
                                  src={roomImage}
                                  alt={room.name}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 192px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              )}
                              {room.images && room.images.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                                  +{room.images.length - 1} photos
                                </div>
                              )}
                            </button>

                            {/* Room Info */}
                            <div className="flex-1 p-4 flex flex-col">
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{room.name}</h3>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setSelectedRoomForModal({ room, property: selectedProperty })}
                                      className="h-8 w-8 rounded-full hover:bg-primary/10"
                                      aria-label="View room details"
                                    >
                                      <InfoIcon className="h-4 w-4 text-primary" />
                                    </Button>
                                    {hasAnySelection && (
                                      <Badge className="bg-primary text-primary-foreground">
                                        Selected
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {room.shortDescription && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {room.shortDescription}
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
                                      const isSelected = isOccupancySelected(room.id, priceOption);
                                      const isBlockedByCapacity = !isSelected && remainingUnits <= 0;
                                      const isRequestOnly = priceOption.price === 0;

                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => selectRoom(room.id, room.channelRoomId || '', priceOption, isRequestOnly, maxUnits)}
                                          disabled={!isAvailable || (isBlockedByCapacity && !isSelected)}
                                          className={`
                                            flex flex-col items-center px-4 py-2 rounded-lg border transition-all
                                            ${isSelected
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
                                              {priceOption.adults} adult{priceOption.adults !== 1 ? "s" : ""}
                                              {priceOption.children > 0 && `, ${priceOption.children} child${priceOption.children !== 1 ? "ren" : ""}`}
                                            </span>
                                          </div>
                                          {isRequestOnly ? (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                              Request Only
                                            </span>
                                          ) : (
                                            <span className="text-sm font-bold text-primary mt-1">
                                              {formatCurrency(priceOption.price, selectedProperty.currency)}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => selectRoom(room.id, room.channelRoomId || '', undefined, true, maxUnits)}
                                      disabled={!isAvailable || (remainingUnits <= 0 && !isOccupancySelected(room.id, undefined))}
                                      className={`
                                        flex flex-col items-center px-4 py-2 rounded-lg border transition-all
                                        ${isOccupancySelected(room.id, undefined)
                                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                                          : "border-border hover:border-primary/50 hover:bg-accent cursor-pointer"
                                        }
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
                                  <Badge variant="destructive" className="mt-2">
                                    Sold Out
                                  </Badge>
                                )}

                                {/* Quantity selectors for each selected occupancy */}
                                {hasAnySelection && (
                                  <div className="mt-3 pt-3 border-t border-dashed space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Number of rooms:</span>
                                      <span className="text-sm text-muted-foreground">
                                        ({maxUnits} available)
                                      </span>
                                    </div>

                                    {roomSelections.map((selection) => {
                                      const isRequestOnly = !selection.selectedPrice || selection.selectedPrice.price === 0;
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
                                                updateRoomQuantity(room.id, selection.priceKey, -1, maxUnits);
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
                                                updateRoomQuantity(room.id, selection.priceKey, 1, maxUnits);
                                              }}
                                              disabled={selection.quantity >= maxAllowed}
                                            >
                                              <PlusIcon className="h-3 w-3" />
                                            </Button>
                                            {!isRequestOnly && selection.selectedPrice && (
                                              <span className="text-sm font-medium text-primary ml-2 min-w-[60px] text-right">
                                                {formatCurrency(selection.selectedPrice.price * selection.quantity, selectedProperty.currency)}
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
                                        Total selected: {totalSelectedForRoom} room{totalSelectedForRoom !== 1 ? "s" : ""}
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
              {/* Guests & Rooms Selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Guests & Rooms
                </label>
                <RoomSelector
                  rooms={rooms}
                  onRoomsChange={handleRoomsChange}
                />
              </div>

              <Separator />

              {/* Selected Departure */}
              {selectedDeparture && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <MapPinIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Departure</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDeparture.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Date Range */}
              {selectedDateRange && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <CalendarIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Travel Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDateRange.from && formatDateNumber(selectedDateRange.from)} — {selectedDateRange.to && formatDateNumber(selectedDateRange.to)}
                    </p>
                    {nights > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {nights} night{nights !== 1 ? "s" : ""}
                      </p>
                    )}
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

              {/* Selected Property & Rooms */}
              {selectedProperty && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <BedIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedProperty.name}</p>
                    {selectedRooms.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {selectedRooms.map((sr) => {
                          const room = selectedProperty.rooms?.find(r => r.id === sr.roomId);
                          if (!room) return null;
                          return (
                            <p key={`${sr.roomId}-${sr.priceKey}`} className="text-sm text-muted-foreground">
                              {sr.quantity > 1 && `${sr.quantity}× `}{room.name}
                            </p>
                          );
                        })}
                        {hasRequestOnly ? (
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-1 inline-block">
                            Request Only
                          </span>
                        ) : accommodationPrice > 0 && (
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(accommodationPrice, selectedProperty.currency)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rooms Summary */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <UsersIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {totalGuests} guest{totalGuests !== 1 ? "s" : ""} · {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Request Only Warning */}
              {selectedRooms.length > 0 && hasRequestOnly && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Price not available for this selection. Submit a request
                    and we&apos;ll get back to you with pricing.
                  </p>
                </div>
              )}

              {/* Price Breakdown - only show if not request only */}
              {selectedRooms.length > 0 && !hasRequestOnly && (tripOfferPrice > 0 || accommodationPrice > 0) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {tripOfferPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trip Package</span>
                        <span>{formatCurrency(tripOfferPrice, "EUR")}</span>
                      </div>
                    )}
                    {accommodationPrice > 0 && selectedProperty && (
                      <>
                        {selectedRooms.map((sr) => {
                          const room = selectedProperty.rooms?.find(r => r.id === sr.roomId);
                          if (!room || !sr.selectedPrice) return null;
                          return (
                            <div key={`${sr.roomId}-${sr.priceKey}`} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate max-w-[180px]">
                                {sr.quantity > 1 && `${sr.quantity}× `}{room.name}
                              </span>
                              <span>{formatCurrency(sr.selectedPrice.price * sr.quantity, selectedProperty.currency)}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-sm pt-1">
                          <span className="text-muted-foreground">
                            {totalRoomCount} room{totalRoomCount !== 1 ? "s" : ""} × {nights} night{nights !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </>
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

              {/* Booking Contact Form */}
              {showBookingForm && selectedRooms.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <BookingContactForm
                    onContactDataChange={setContactData}
                    onAuthenticatedDataChange={setAuthenticatedData}
                    disabled={isBooking}
                  />
                  
                  {/* Booking Error */}
                  {bookingError && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                      <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              {currentStep !== "review" || !getRoomSelectionValidation.isValid ? (
                <div className="w-full text-center">
                  <p className="text-sm text-muted-foreground">
                    {currentStep === "select-departure" && "Select a departure point to continue"}
                    {currentStep === "select-date" && "Select travel dates to continue"}
                    {currentStep === "select-offer" && "Select a trip option to continue"}
                    {currentStep === "select-property" && "Select accommodation to continue"}
                    {(currentStep === "select-room" || currentStep === "review") && !getRoomSelectionValidation.isValid && getRoomSelectionValidation.message}
                  </p>
                </div>
              ) : !showBookingForm ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowBookingForm(true)}
                  variant={hasRequestOnly ? "outline" : "default"}
                >
                  {hasRequestOnly ? "Submit Request" : "Continue to Booking"}
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBookNow}
                    disabled={isBooking || !isBookingFormValid}
                    variant={hasRequestOnly ? "outline" : "default"}
                  >
                    {isBooking
                      ? "Processing..."
                      : hasRequestOnly
                        ? "Send Request"
                        : "Complete Booking"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowBookingForm(false);
                      setBookingError(null);
                    }}
                  >
                    Back
                  </Button>
                </>
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

      {/* Property Details Modal */}
      <Dialog
        open={!!selectedPropertyForModal}
        onOpenChange={(open) => !open && setSelectedPropertyForModal(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedPropertyForModal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedPropertyForModal.name}</DialogTitle>
                <DialogDescription>
                  {selectedPropertyForModal.city && (
                    <span className="flex items-center gap-1 mt-1">
                      <MapPinIcon className="h-3 w-3" />
                      {[selectedPropertyForModal.address, selectedPropertyForModal.city, selectedPropertyForModal.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* Property Images Carousel */}
              {selectedPropertyForModal.images && selectedPropertyForModal.images.length > 0 && (
                <div className="mt-4">
                  <ImageCarousel
                    images={selectedPropertyForModal.images}
                    aspectRatio="video"
                    showThumbnails={selectedPropertyForModal.images.length > 3}
                    peekMode={true}
                  />
                </div>
              )}

              {/* Short Description */}
              {selectedPropertyForModal.shortDescription && (
                <div className="mt-4">
                  <p className="text-muted-foreground">
                    {selectedPropertyForModal.shortDescription}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {selectedPropertyForModal.amenities && selectedPropertyForModal.amenities.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Amenities</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedPropertyForModal.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm">
                        <CheckIcon className="h-4 w-4 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long Description */}
              {selectedPropertyForModal.longDescription && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Full Description</h4>
                  <RichText
                    data={selectedPropertyForModal.longDescription as unknown as SerializedEditorState}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  />
                </div>
              )}

              {/* Select Button */}
              <div className="mt-6 pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => {
                    handlePropertySelect(selectedPropertyForModal);
                    setSelectedPropertyForModal(null);
                  }}
                >
                  Select This Accommodation
                </Button>
              </div>
            </>
          )}
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
                <DialogTitle className="text-xl">{selectedRoomForModal.room.name}</DialogTitle>
                <DialogDescription>Room details and information</DialogDescription>
              </DialogHeader>

              {/* Room Images Carousel */}
              {selectedRoomForModal.room.images && selectedRoomForModal.room.images.length > 0 && (
                <div className="mt-4">
                  <ImageCarousel
                    images={selectedRoomForModal.room.images}
                    aspectRatio="video"
                    showThumbnails={selectedRoomForModal.room.images.length > 3}
                    peekMode={true}
                  />
                </div>
              )}

              {/* Room Info Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-3 bg-accent/50 rounded-lg text-center">
                  <div className="text-primary mb-1"><UsersIcon className="h-5 w-5" /></div>
                  <span className="text-xs text-muted-foreground">Max Guests</span>
                  <span className="font-semibold">{selectedRoomForModal.room.maxGuests || "—"}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-accent/50 rounded-lg text-center">
                  <div className="text-primary mb-1"><UsersIcon className="h-5 w-5" /></div>
                  <span className="text-xs text-muted-foreground">Max Adults</span>
                  <span className="font-semibold">{selectedRoomForModal.room.maxAdults || "—"}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-accent/50 rounded-lg text-center">
                  <div className="text-primary mb-1"><UsersIcon className="h-5 w-5" /></div>
                  <span className="text-xs text-muted-foreground">Max Children</span>
                  <span className="font-semibold">{selectedRoomForModal.room.maxChildren || "—"}</span>
                </div>
                {selectedRoomForModal.room.bedType && (
                  <div className="flex flex-col items-center justify-center p-3 bg-accent/50 rounded-lg text-center">
                    <div className="text-primary mb-1"><BedIcon className="h-5 w-5" /></div>
                    <span className="text-xs text-muted-foreground">Bed Type</span>
                    <span className="font-semibold">{selectedRoomForModal.room.bedType}</span>
                  </div>
                )}
              </div>

              {/* Check-in Description */}
              {selectedRoomForModal.room.checkInDescription && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Check-in Information</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRoomForModal.room.checkInDescription}
                  </p>
                </div>
              )}

              {/* Long Description */}
              {selectedRoomForModal.room.longDescription && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Full Description</h4>
                  <RichText
                    data={selectedRoomForModal.room.longDescription as unknown as SerializedEditorState}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  />
                </div>
              )}

              {/* Select Button */}
              <div className="mt-6 pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => {
                    const room = selectedRoomForModal.room;
                    const property = selectedRoomForModal.property;
                    const fullRoom = property.rooms?.find(r => r.id === room.id);
                    const bestPrice = fullRoom?.prices?.[0];
                    const isRequestOnly = !bestPrice || bestPrice.price === 0;
                    const maxUnits = fullRoom?.availUnits || 1;
                    selectRoom(room.id, fullRoom?.channelRoomId || '', bestPrice, isRequestOnly, maxUnits);
                    setSelectedRoomForModal(null);
                  }}
                >
                  Select This Room
                </Button>
              </div>
            </>
          )}
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
