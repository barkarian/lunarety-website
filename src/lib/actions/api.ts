"use server";

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
    return await AvailabilityService.getAvailability(WEBSITE_API_KEY, {
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
