/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailabilityMedia } from './AvailabilityMedia';
import type { RichText } from './RichText';
import type { RoomPrice } from './RoomPrice';
export type AvailabilityRoom = {
    /**
     * Room ID
     */
    id: string;
    /**
     * Room name
     */
    name: string;
    /**
     * Channel manager room ID
     */
    channelRoomId: string;
    /**
     * Total price for the room
     */
    totalPrice: number;
    /**
     * Number of available units
     */
    availUnits: number;
    /**
     * Price breakdown by occupancy
     */
    prices: Array<RoomPrice>;
    /**
     * Short description of the room
     */
    description?: string | null;
    /**
     * Room images
     */
    images?: Array<AvailabilityMedia> | null;
    /**
     * Maximum number of guests
     */
    maxGuests?: number | null;
    /**
     * Maximum number of adults
     */
    maxAdults?: number | null;
    /**
     * Maximum number of children
     */
    maxChildren?: number | null;
    /**
     * Long description of the room (rich text)
     */
    longDescription?: RichText | null;
    /**
     * Check-in instructions for the room
     */
    checkInDescription?: string | null;
};

