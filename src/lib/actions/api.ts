"use server";

// Configure OpenAPI BASE URL for server-side requests
import "@/lib/api/config";

import { AvailabilityService } from "@/lib/api/generated/services/AvailabilityService";
import { PropertiesService } from "@/lib/api/generated/services/PropertiesService";
import { BookingsService } from "@/lib/api/generated/services/BookingsService";
import { WebsiteService } from "@/lib/api/generated/services/WebsiteService";
import type { RoomOccupancy } from "@/lib/api/generated/models/RoomOccupancy";
import { WebsiteType } from "@/lib/api/generated/models/WebsiteType";

const WEBSITE_API_KEY = process.env.WEBSITE_API_KEY!;
const API_BASE_URL = process.env.LUNARETY_URL || 'http://localhost:3000';

// Helper to resolve image URLs - prefix relative URLs with API base
function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // If it's already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a relative URL, prefix with API base
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

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
      const content = (prop.content || {}) as Record<string, unknown>;
      const location = (content.location || {}) as Record<string, unknown>;
      const propMedia = (content.media || prop.images || []) as Array<Record<string, unknown>>;
      
      return {
        id: prop.id as number,
        channelPropertyId: prop.channelPropertyId as string | undefined,
        name: (prop.name || prop.title || `Property ${prop.id}`) as string,
        description: (content.shortDescription || prop.description) as string | undefined,
        shortDescription: content.shortDescription as string | undefined,
        longDescription: content.longDescription as Record<string, unknown> | undefined,
        address: (location.address || prop.address) as string | undefined,
        city: prop.city as string | undefined,
        country: prop.country as string | undefined,
        locationUrl: location.url as string | undefined,
        images: propMedia.map((m) => ({ 
          url: resolveImageUrl(m.url as string), 
          thumbnailUrl: resolveImageUrl(m.thumbnailURL as string) || resolveImageUrl(m.url as string),
          alt: m.alt as string | undefined 
        })),
        amenities: prop.amenities as string[] | undefined,
        rating: prop.rating as number | undefined,
        reviewCount: prop.reviewCount as number | undefined,
        pricePerNight: prop.fromPrice as number | undefined,
        currency: (prop.currency || "EUR") as string,
        fromPrice: prop.fromPrice as number | undefined,
        content: {
          shortDescription: content.shortDescription as string | undefined,
          longDescription: content.longDescription as Record<string, unknown> | undefined,
          location: {
            address: location.address as string | undefined,
            url: location.url as string | undefined,
          },
        },
        rooms: rooms?.map((room) => {
          // Check for nested roomContent (legacy/custom format) or direct properties (API spec format)
          const roomContent = (room.roomContent || {}) as Record<string, unknown>;
          const config = (room.config || {}) as Record<string, { max?: number; maxAdults?: number; maxChildren?: number }>;
          const rates = (room.rates || {}) as Record<string, unknown>;
          const availability = (room.availability || {}) as Record<string, unknown>;
          
          // Media can be on roomContent.media or directly on room.images
          const nestedMedia = (roomContent.media || []) as Array<Record<string, unknown>>;
          const directImages = (room.images || []) as Array<Record<string, unknown>>;
          const media = nestedMedia.length > 0 ? nestedMedia : directImages;
          
          // Get description - check nested first, then direct
          const shortDesc = (roomContent.shortDescription || room.description) as string | undefined;
          const longDesc = (roomContent.longDescription || room.longDescription) as Record<string, unknown> | undefined;
          const checkInDesc = (roomContent.checkInDescription || room.checkInDescription) as string | undefined;
          
          // Get max guests - check config first, then direct properties
          const maxGuests = (config.pax?.max || room.maxGuests || 2) as number;
          const maxAdults = (config.pax?.maxAdults || room.maxAdults) as number | undefined;
          const maxChildren = (config.pax?.maxChildren || room.maxChildren) as number | undefined;
          
          return {
            id: room.id as string,
            name: (room.roomName || room.name) as string,
            channelRoomId: room.channelRoomId as string | undefined,
            description: shortDesc,
            shortDescription: shortDesc,
            longDescription: longDesc,
            checkInDescription: checkInDesc,
            maxGuests,
            maxAdults,
            maxChildren,
            images: media.map((m) => ({ 
              url: resolveImageUrl(m.url as string), 
              thumbnailUrl: resolveImageUrl(m.thumbnailURL as string) || resolveImageUrl(m.url as string),
              alt: m.alt as string | undefined 
            })),
            // Rates info - check nested rates or direct properties
            availUnitsOfThisType: (rates.availUnitsOfThisType || room.availUnitsOfThisType) as number | undefined,
            totalPrice: (rates.totalPrice || room.totalPrice) as number | undefined,
            prices: (rates.prices || room.prices) as Array<{ adults: number; children: number; price: number }> | undefined,
            availUnits: (availability.availUnits || room.availUnits) as number | undefined,
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

export async function getWebsiteConfig() {
  try {
    const response = await WebsiteService.validateWebsite(WEBSITE_API_KEY);
    
    // Resolve logo and favicon URLs if they exist
    const website = response.website;
    
    // The API returns media IDs, but we need URLs
    // We'll extend the response with URL fields for convenience
    const enhancedWebsite = {
      ...website,
      website: {
        ...website.website,
        logoUrl: website.website?.logo 
          ? `${API_BASE_URL}/api/media/${website.website.logo}` 
          : null,
        faviconUrl: website.website?.favicon 
          ? `${API_BASE_URL}/api/media/${website.website.favicon}` 
          : null,
      },
      seo: website.seo ? {
        ...website.seo,
        mediaUrls: website.seo.media?.map(
          (mediaId) => `${API_BASE_URL}/api/media/${mediaId}`
        ) || null,
      } : undefined,
    };
    
    return { website: enhancedWebsite };
  } catch (error) {
    console.error("Error validating website:", error);
    throw error;
  }
}
