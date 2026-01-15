"use server";

// Configure OpenAPI BASE URL for server-side requests
import "@/lib/api/config";

import { AvailabilityService } from "@/lib/api/generated/services/AvailabilityService";
import { PropertiesService } from "@/lib/api/generated/services/PropertiesService";
import { BookingsService } from "@/lib/api/generated/services/BookingsService";
import { WebsiteService } from "@/lib/api/generated/services/WebsiteService";
import { AuthenticationService } from "@/lib/api/generated/services/AuthenticationService";
import { PackagesService } from "@/lib/api/generated/services/PackagesService";
import type { RoomOccupancy } from "@/lib/api/generated/models/RoomOccupancy";
import { WebsiteType } from "@/lib/api/generated/models/WebsiteType";
import type { Package, PackageLocation, PackageOffer, MediaImage } from "@/lib/types";

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

export interface BookingRoomData {
  channelRoomId: string; // The channel room ID (e.g., beds24 room ID)
  adults: number;
  children: number;
  price?: number;
}

export interface BookingData {
  property?: number;
  checkIn?: number | string; // YYYYMMDD format (e.g., 20251231) or YYYY-MM-DD
  checkOut?: number | string; // YYYYMMDD format (e.g., 20251231) or YYYY-MM-DD
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guests?: number;
  totalPrice?: number;
  status?: "confirmed" | "cancelled" | "inquiry" | "on-hold" | "no-show";
  room: BookingRoomData;
}

export type CreateBookingRequestBody =
  Parameters<typeof BookingsService.createBooking>[1];

export type CreateBookingResponse = Awaited<
  ReturnType<typeof BookingsService.createBooking>
>;

interface BookingHolderUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
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

export async function getBooking(secretUUID: string) {
  try {
    return await BookingsService.getBooking(WEBSITE_API_KEY, secretUUID);
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
}

export async function updateBookingContact(
  secretUUID: string,
  bookingHolder: BookingHolderUpdate
) {
  try {
    return await BookingsService.updateBooking(WEBSITE_API_KEY, secretUUID, {
      booking: {
        bookingHolder,
      },
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
}

export async function createBooking(
  bookings: CreateBookingRequestBody["bookings"],
): Promise<CreateBookingResponse> {
  try {
    if (!bookings?.length) {
      throw new Error("At least one booking is required");
    }

    bookings.forEach((booking, index) => {
      if (!booking.room?.channelRoomId) {
        throw new Error(`room.channelRoomId is required for booking at index ${index}`);
      }
    });

    const toDateString = (value: BookingData["checkIn"]) =>
      value === undefined ? undefined : String(value);

    return await BookingsService.createBooking(WEBSITE_API_KEY, {
      bookings: bookings.map((booking) => ({
        ...booking,
        checkIn: toDateString(booking.checkIn),
        checkOut: toDateString(booking.checkOut),
        room: {
          channelRoomId: booking.room!.channelRoomId,
          adults: booking.room!.adults,
          children: booking.room!.children,
          price: booking.room!.price,
        },
      })),
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
    // Exclude sensitive API key from the ai config
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { websiteOpenrouterApiKey, ...safeAiConfig } = website.ai || {};
    
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
      ai: website.ai ? safeAiConfig : undefined,
    };
    
    return { website: enhancedWebsite };
  } catch (error) {
    console.error("Error validating website:", error);
    throw error;
  }
}

// Authentication actions
export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    type: "agent" | "guest";
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    country?: string | null;
  };
  token?: string;
  error?: string;
}

export async function signIn(data: SignInData): Promise<AuthResult> {
  try {
    const response = await AuthenticationService.signIn(WEBSITE_API_KEY, {
      email: data.email,
      password: data.password,
    });

    if (response.success && response.user && response.token) {
      return {
        success: true,
        user: {
          id: response.user.id!,
          email: response.user.email!,
          type: response.user.type!,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.phone,
          country: response.user.country,
        },
        token: response.token,
      };
    }

    return {
      success: false,
      error: "Invalid credentials",
    };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign in",
    };
  }
}

export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    const response = await AuthenticationService.signUp(WEBSITE_API_KEY, {
      email: data.email,
      password: data.password,
      type: "guest", // Always create guest accounts on sign-up
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      country: data.country,
    });

    if (response.success && response.user && response.token) {
      return {
        success: true,
        user: {
          id: response.user.id!,
          email: response.user.email!,
          type: response.user.type!,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.phone,
          country: response.user.country,
        },
        token: response.token,
      };
    }

    return {
      success: false,
      error: "Failed to create account",
    };
  } catch (error) {
    console.error("Error signing up:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create account",
    };
  }
}

export async function verifyAuth(token: string): Promise<AuthResult> {
  try {
    const response = await AuthenticationService.verifyAuth(
      WEBSITE_API_KEY,
      `Bearer ${token}`
    );

    if (response.success && response.user) {
      return {
        success: true,
        user: {
          id: response.user.id!,
          email: response.user.email!,
          type: response.user.type!,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.phone,
          country: response.user.country,
        },
      };
    }

    return {
      success: false,
      error: "Invalid or expired token",
    };
  } catch (error) {
    console.error("Error verifying auth:", error);
    return {
      success: false,
      error: "Invalid or expired token",
    };
  }
}

export async function refreshAuth(token: string): Promise<AuthResult> {
  try {
    const response = await AuthenticationService.refreshAuth(
      WEBSITE_API_KEY,
      `Bearer ${token}`
    );

    if (response.success && response.user && response.token) {
      return {
        success: true,
        user: {
          id: response.user.id!,
          email: response.user.email!,
          type: response.user.type!,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.phone,
          country: response.user.country,
        },
        token: response.token,
      };
    }

    return {
      success: false,
      error: "Failed to refresh token",
    };
  } catch (error) {
    console.error("Error refreshing auth:", error);
    return {
      success: false,
      error: "Failed to refresh token",
    };
  }
}

// User Bookings
export type UserBooking = NonNullable<
  Awaited<ReturnType<typeof BookingsService.getUserBookings>>["bookings"]
>[number];

export type UserBookingsResult = {
  success: boolean;
  bookings?: UserBooking[];
  pagination?: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
};

export async function getUserBookings(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<UserBookingsResult> {
  try {
    const response = await BookingsService.getUserBookings(
      WEBSITE_API_KEY,
      `Bearer ${token}`,
      page,
      limit
    );

    if (response.success && response.bookings) {
      return {
        success: true,
        bookings: response.bookings,
        pagination: response.pagination
          ? {
              page: response.pagination.page!,
              limit: response.pagination.limit!,
              totalDocs: response.pagination.totalDocs!,
              totalPages: response.pagination.totalPages!,
              hasNextPage: response.pagination.hasNextPage!,
              hasPrevPage: response.pagination.hasPrevPage!,
            }
          : undefined,
      };
    }

    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch bookings",
    };
  }
}

// Package API functions
export interface GetPackagesParams {
  page?: number;
  limit?: number;
  availabilityFrom?: number; // YYYYMMDD
  availabilityTo?: number; // YYYYMMDD
}

export interface GetPackagesResult {
  packages: Package[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Helper to transform API package response to our Package type
function transformPackage(pkg: Record<string, unknown>): Package {
  const content = (pkg.content || {}) as Record<string, unknown>;
  const meta = (pkg.meta || {}) as Record<string, unknown>;
  const availabilityPeriod = (content.availabilityPeriod || {}) as Record<string, unknown>;
  const media = (content.media || []) as Array<Record<string, unknown>>;
  
  // Transform departures - they may be populated objects or just IDs
  const rawDepartures = (pkg.departures || []) as Array<Record<string, unknown> | number>;
  const departures: PackageLocation[] = rawDepartures.map((dep) => {
    if (typeof dep === 'number') {
      return { id: dep, name: `Location ${dep}` };
    }
    return {
      id: dep.id as number,
      name: dep.name as string,
      type: dep.type as string | undefined,
      mapsUrl: dep.mapsUrl as string | undefined,
    };
  });
  
  // Transform destination
  const rawDestination = pkg.destination as Record<string, unknown> | number | undefined;
  let destination: PackageLocation | undefined;
  if (rawDestination) {
    if (typeof rawDestination === 'number') {
      destination = { id: rawDestination, name: `Location ${rawDestination}` };
    } else {
      destination = {
        id: rawDestination.id as number,
        name: rawDestination.name as string,
        type: rawDestination.type as string | undefined,
        mapsUrl: rawDestination.mapsUrl as string | undefined,
      };
    }
  }
  
  // Helper to transform linkedToDepartures
  const transformLinkedDepartures = (rawLinked: unknown): PackageLocation[] | undefined => {
    if (!rawLinked || !Array.isArray(rawLinked)) return undefined;
    return rawLinked.map((dep: Record<string, unknown> | number) => {
      if (typeof dep === 'number') {
        return { id: dep, name: `Location ${dep}` };
      }
      return {
        id: dep.id as number,
        name: dep.name as string,
        type: dep.type as string | undefined,
      };
    });
  };

  // Transform default offers
  const rawOffers = (pkg.defaultOffers || []) as Array<Record<string, unknown>>;
  const defaultOffers: PackageOffer[] = rawOffers.map((offer) => ({
    adults: offer.adults as number | undefined,
    children: offer.children as number | undefined,
    group: offer.group as string | undefined,
    total: offer.total as number | undefined,
    linkedToDepartures: transformLinkedDepartures(offer.linkedToDepartures),
  }));
  
  // Transform date ranges
  const rawDateRanges = (pkg.dateRanges || []) as Array<Record<string, unknown>>;
  const dateRanges = rawDateRanges.map((dr) => {
    const trip = dr.trip as Record<string, unknown> | undefined;
    const offers = dr.offers as Record<string, unknown> | undefined;
    
    // Transform custom offers with linkedToDepartures
    let customOffers: PackageOffer[] | undefined;
    if (offers?.customOffers && Array.isArray(offers.customOffers)) {
      customOffers = (offers.customOffers as Array<Record<string, unknown>>).map((co) => ({
        adults: co.adults as number | undefined,
        children: co.children as number | undefined,
        group: co.group as string | undefined,
        total: co.total as number | undefined,
        linkedToDepartures: transformLinkedDepartures(co.linkedToDepartures),
      }));
    }

    return {
      from: dr.from as number | undefined,
      to: dr.to as number | undefined,
      properties: dr.properties as number[] | undefined,
      trip: trip ? {
        hasCustomInfos: trip.hasCustomInfos as boolean | undefined,
        customDepartInfo: trip.customDepartInfo as string[] | undefined,
        customReturnInfo: trip.customReturnInfo as string | undefined,
      } : undefined,
      offers: offers ? {
        hasCustomOffers: offers.hasCustomOffers as boolean | undefined,
        customOffers,
      } : undefined,
    };
  });
  
  // Transform media with URLs
  const transformedMedia: MediaImage[] = media.map((m) => ({
    url: resolveImageUrl(m.url as string),
    thumbnailUrl: resolveImageUrl(m.thumbnailURL as string) || resolveImageUrl(m.url as string),
    alt: m.alt as string | undefined,
  }));

  return {
    id: pkg.id as number,
    packageName: pkg.packageName as string | undefined,
    fromPrice: pkg.fromPrice as number | undefined,
    order: pkg.order as number | undefined,
    departures,
    defaultDepartInfo: pkg.defaultDepartInfo as string[] | undefined,
    destination,
    defaultReturnInfo: pkg.defaultReturnInfo as string | undefined,
    meta: {
      transportation: meta.transportation as 'ship' | 'plane' | undefined,
      tags: meta.tags as string[] | undefined,
    },
    defaultOffers,
    dateRanges,
    content: {
      shortDescription: content.shortDescription as string | undefined,
      description: content.description as Record<string, unknown> | undefined,
      media: transformedMedia,
      durationInDaysOptions: content.durationInDaysOptions as number | null | undefined,
      availabilityPeriod: {
        from: availabilityPeriod.from as number | undefined,
        to: availabilityPeriod.to as number | undefined,
      },
    },
    website: pkg.website as number | undefined,
    updatedAt: pkg.updatedAt as string | undefined,
    createdAt: pkg.createdAt as string | undefined,
  };
}

export async function getWebsitePackages(params: GetPackagesParams = {}): Promise<GetPackagesResult> {
  try {
    const response = await PackagesService.getWebsitePackages(WEBSITE_API_KEY, {
      page: params.page || 1,
      limit: params.limit || 20,
      filters: {
        availabilityFrom: params.availabilityFrom,
        availabilityTo: params.availabilityTo,
      },
    });

    const rawPackages = (response as { packages?: unknown[] }).packages || [];
    const packages = (rawPackages as Array<Record<string, unknown>>).map(transformPackage);

    return {
      packages,
      totalDocs: response.totalDocs,
      totalPages: response.totalPages,
      page: response.page,
      limit: response.limit,
      hasNextPage: response.hasNextPage,
      hasPrevPage: response.hasPrevPage,
    };
  } catch (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }
}

export async function getPackageById(packageId: string): Promise<Package | null> {
  try {
    const response = await PackagesService.getPackageById(WEBSITE_API_KEY, packageId);
    const pkg = (response as { package?: Record<string, unknown> }).package;
    
    if (!pkg) {
      return null;
    }

    return transformPackage(pkg);
  } catch (error) {
    console.error("Error fetching package:", error);
    throw error;
  }
}

// Get properties by IDs for package detail page
export async function getPropertiesByIds(
  propertyIds: number[], 
  dateFrom?: number, 
  dateTo?: number,
  rooms?: RoomOccupancy[]
) {
  try {
    if (!propertyIds || propertyIds.length === 0) {
      return { properties: [] };
    }

    // Use getAvailability with specific property IDs to get room availability and pricing
    if (dateFrom && dateTo) {
      return await getAvailability({
        from: dateFrom,
        to: dateTo,
        rooms: rooms || [{ adults: 2, children: 0 }], // Use provided rooms or default
        propertyIds,
      });
    }

    // Fallback: get properties without availability/pricing
    const response = await PropertiesService.getProperties(WEBSITE_API_KEY, {
      websiteType: WebsiteType.PLATFORM_MARKETPLACE,
      type: "custom",
      propertyIds,
    });

    const rawProperties = (response as { properties?: unknown[] }).properties || [];
    const properties = (rawProperties as Array<Record<string, unknown>>).map((prop) => {
      const content = (prop.content || {}) as Record<string, unknown>;
      const location = (content.location || {}) as Record<string, unknown>;
      const propMedia = (content.media || prop.images || []) as Array<Record<string, unknown>>;

      return {
        id: prop.id as number,
        name: (prop.name || prop.title || `Property ${prop.id}`) as string,
        description: (content.shortDescription || prop.description) as string | undefined,
        shortDescription: content.shortDescription as string | undefined,
        address: (location.address || prop.address) as string | undefined,
        city: prop.city as string | undefined,
        country: prop.country as string | undefined,
        locationUrl: location.url as string | undefined,
        images: propMedia.map((m) => ({
          url: resolveImageUrl(m.url as string),
          thumbnailUrl: resolveImageUrl(m.thumbnailURL as string) || resolveImageUrl(m.url as string),
          alt: m.alt as string | undefined,
        })),
        currency: (prop.currency || "EUR") as string,
        fromPrice: prop.fromPrice as number | undefined,
        rooms: [],
      };
    });

    return { properties };
  } catch (error) {
    console.error("Error fetching properties by IDs:", error);
    throw error;
  }
}
