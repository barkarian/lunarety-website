export interface RoomOccupancy {
  adults: number;
  children: number;
}

export interface SearchParams {
  from?: string;
  to?: string;
  rooms?: string;
}

// Date range with YYYYMMDD format (e.g., 20251231)
export interface DateRangeNumber {
  from: number | undefined;
  to?: number | undefined;
}

// Rich text type for Lexical content
export interface RichTextContent {
  root?: {
    type?: string;
    children?: Array<Record<string, unknown>>;
    direction?: 'ltr' | 'rtl' | null;
    format?: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
    indent?: number;
    version?: number;
  };
}

export interface PropertyContent {
  shortDescription?: string;
  longDescription?: RichTextContent;
  location?: {
    address?: string;
    url?: string;
  };
}

export interface MediaImage {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
}

export interface Property {
  id: number;
  channelPropertyId?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  longDescription?: RichTextContent;
  address?: string;
  city?: string;
  country?: string;
  locationUrl?: string;
  images?: MediaImage[];
  amenities?: string[];
  rating?: number;
  reviewCount?: number;
  pricePerNight?: number;
  currency?: string;
  rooms?: Room[];
  availability?: AvailabilityInfo;
  // New field from API - starting price for the property
  fromPrice?: number;
  content?: PropertyContent;
}

export interface RoomPrice {
  adults: number;
  children: number;
  price: number;
}

export interface Room {
  id: string;
  name: string;
  channelRoomId?: string;
  description?: string;
  shortDescription?: string;
  longDescription?: RichTextContent;
  checkInDescription?: string;
  maxGuests: number;
  maxAdults?: number;
  maxChildren?: number;
  bedType?: string;
  amenities?: string[];
  images?: MediaImage[];
  pricePerNight?: number;
  available?: boolean;
  quantity?: number;
  // New fields from API
  availUnitsOfThisType?: number;
  totalPrice?: number;
  prices?: RoomPrice[];
  availUnits?: number;
}

export interface AvailabilityInfo {
  available: boolean;
  minPrice?: number;
  maxPrice?: number;
  rooms?: Array<{
    roomId: number;
    available: boolean;
    price: number;
    availableCount: number;
  }>;
}

export interface BookingHolder {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
}

export interface BookingRoom {
  roomId: number | string;
  roomName: string;
  adults: number;
  children: number;
  price: number;
}

export interface RelatedBooking {
  id: string;
  secretUUID: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  checkIn: number;
  checkOut: number;
  guests: number;
  totalPrice: number;
  currency?: string;
  bookingHolder?: BookingHolder;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  rooms?: BookingRoom[];
}

export interface Booking {
  id: string;
  secretUUID: string;
  property: Property | number;
  checkIn: number; // YYYYMMDD format (e.g., 20251231)
  checkOut: number; // YYYYMMDD format (e.g., 20251231)
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  bookingHolder?: BookingHolder;
  guests: number;
  totalPrice: number;
  currency?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  rooms?: BookingRoom[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
  // Multi-room booking support
  mainBooking?: { id: string; secretUUID: string } | null;
  relatedBookings?: RelatedBooking[];
}

export function parseRooms(roomsParam: string | undefined): RoomOccupancy[] {
  if (!roomsParam) {
    return [{ adults: 2, children: 0 }];
  }

  try {
    const decoded = decodeURIComponent(roomsParam);
    return JSON.parse(decoded);
  } catch {
    return [{ adults: 2, children: 0 }];
  }
}

export function serializeRooms(rooms: RoomOccupancy[]): string {
  return encodeURIComponent(JSON.stringify(rooms));
}

/**
 * Convert Date to YYYYMMDD number format (e.g., 20251231)
 */
export function dateToNumber(date: Date): number {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return parseInt(`${year}${month}${day}`, 10);
}

/**
 * Convert YYYYMMDD number to Date object
 */
export function numberToDate(num: number): Date {
  const str = String(num);
  const year = parseInt(str.substring(0, 4), 10);
  const month = parseInt(str.substring(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(str.substring(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Format YYYYMMDD number to display string
 */
export function formatDateNumber(num: number, format: "short" | "long" = "short"): string {
  const date = numberToDate(num);
  if (format === "long") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get default dates: from = today + 3 days, to = today + 7 days
 * Returns YYYYMMDD format numbers
 */
export function getDefaultDates(): { from: number; to: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() + 3);

  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 7);

  return {
    from: dateToNumber(fromDate),
    to: dateToNumber(toDate),
  };
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate nights between two YYYYMMDD format dates
 */
export function calculateNights(from: number, to: number): number {
  const fromDate = numberToDate(from);
  const toDate = numberToDate(to);
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
