"use server";

// Configure OpenAPI BASE URL for server-side requests
import "@/lib/api/config";

import { AvailabilityService } from "@/lib/api/generated/services/AvailabilityService";
import { PropertiesService } from "@/lib/api/generated/services/PropertiesService";
import { BookingsService } from "@/lib/api/generated/services/BookingsService";
import type { RoomOccupancy } from "@/lib/api/generated/models/RoomOccupancy";
import { WebsiteType } from "@/lib/api/generated/models/WebsiteType";

const WEBSITE_API_KEY = process.env.WEBSITE_API_KEY!;

interface AvailabilityParams {
  from: number; // YYYYMMDD format (e.g., 20251231)
  to: number; // YYYYMMDD format (e.g., 20251231)
  rooms: RoomOccupancy[];
  propertyIds?: number[];
  page?: number;
  limit?: number;
}

interface BookingData {
  property?: number;
  checkIn?: string;
  checkOut?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guests?: number;
  totalPrice?: number;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  rooms?: Array<{
    roomId: number;
    adults: number;
    children: number;
  }>;
}

export async function getAvailability(params: AvailabilityParams) {
  try {
    const response = await AvailabilityService.getAvailability(WEBSITE_API_KEY, {
      websiteType: WebsiteType.PLATFORM_MARKETPLACE,
      period: {
        from: params.from,
        to: params.to,
        rooms: params.rooms,
      },
      type: params.propertyIds?.length ? "custom" : "paginated",
      page: params.page || 1,
      limit: params.limit || 20,
      propertyIds: params.propertyIds,
    });

    // Transform API response to our Property type
    // The API returns a different structure than swagger types, so we need to cast
    const rawProperties = (response as { properties?: unknown[] }).properties || [];
    
    const properties = (rawProperties as Array<Record<string, unknown>>).map((prop) => {
      const rooms = prop.rooms as Array<Record<string, unknown>> | undefined;
      
      return {
        id: prop.id as number,
        channelPropertyId: prop.channelPropertyId as string | undefined,
        name: (prop.name || `Property ${prop.id}`) as string,
        description: prop.description as string | undefined,
        address: prop.address as string | undefined,
        city: prop.city as string | undefined,
        country: prop.country as string | undefined,
        images: prop.images as Array<{ url: string; alt?: string }> | undefined,
        amenities: prop.amenities as string[] | undefined,
        rating: prop.rating as number | undefined,
        reviewCount: prop.reviewCount as number | undefined,
        pricePerNight: prop.fromPrice as number | undefined,
        currency: (prop.currency || "EUR") as string,
        fromPrice: prop.fromPrice as number | undefined,
        rooms: rooms?.map((room) => {
          const roomContent = (room.roomContent || {}) as Record<string, unknown>;
          const config = (room.config || {}) as Record<string, { max?: number; maxAdults?: number; maxChildren?: number }>;
          const rates = (room.rates || {}) as Record<string, unknown>;
          const availability = (room.availability || {}) as Record<string, unknown>;
          const media = (roomContent.media || []) as Array<Record<string, unknown>>;
          
          return {
            id: room.id as string,
            name: (room.roomName || room.name) as string,
            channelRoomId: room.channelRoomId as string | undefined,
            description: (roomContent.shortDescription || roomContent.longDescription) as string | undefined,
            maxGuests: (config.pax?.max || 2) as number,
            maxAdults: config.pax?.maxAdults as number | undefined,
            maxChildren: config.pax?.maxChildren as number | undefined,
            images: media.map((m) => ({ url: m.url as string, alt: m.alt as string | undefined })),
            // Rates info
            availUnitsOfThisType: rates.availUnitsOfThisType as number | undefined,
            totalPrice: rates.totalPrice as number | undefined,
            prices: rates.prices as Array<{ adults: number; children: number; price: number }> | undefined,
            availUnits: availability.availUnits as number | undefined,
          };
        }) || [],
      };
    });

    return { properties };
  } catch (error) {
    console.error("Error fetching availability:", error);
    throw error;
  }
}

export async function getProperties(params: {
  propertyIds?: number[];
  page?: number;
  limit?: number;
  fromDate?: number; // YYYYMMDD format
  toDate?: number; // YYYYMMDD format
}) {
  try {
    return await PropertiesService.getProperties(WEBSITE_API_KEY, {
      websiteType: WebsiteType.PLATFORM_MARKETPLACE,
      type: params.propertyIds?.length ? "custom" : "paginated",
      page: params.page || 1,
      limit: params.limit || 20,
      propertyIds: params.propertyIds,
      rates: params.fromDate
        ? {
            fromDate: params.fromDate,
            toDate: params.toDate,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
}

export async function getBooking(bookingId: string) {
  try {
    return await BookingsService.getBooking(WEBSITE_API_KEY, bookingId);
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
}

export async function updateBooking(
  bookingId: string,
  bookingData: Partial<BookingData>
) {
  try {
    return await BookingsService.updateBooking(WEBSITE_API_KEY, bookingId, {
      booking: bookingData,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
}

export async function createBooking(bookingData: BookingData) {
  try {
    return await BookingsService.createBooking(WEBSITE_API_KEY, {
      booking: bookingData,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}
