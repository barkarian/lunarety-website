/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookingsService {
    /**
     * Get Booking
     * Retrieves a specific booking by secret UUID, including any related bookings for multi-room reservations
     * @param websiteApiKey The unique API key for the website integration
     * @param bookingSecretUuid The secret UUID of the booking
     * @returns any Booking retrieved successfully
     * @throws ApiError
     */
    public static getBooking(
        websiteApiKey: string,
        bookingSecretUuid: string,
    ): CancelablePromise<{
        /**
         * The booking with populated relationships
         */
        booking?: {
            id?: string;
            secretUUID?: string;
            status?: string;
            checkIn?: number;
            checkOut?: number;
            guests?: number;
            totalPrice?: number;
            currency?: string;
            property?: Record<string, any>;
            bookingHolder?: {
                firstName?: string;
                lastName?: string;
                email?: string;
                phone?: string;
                countryCode?: string;
            };
            rooms?: Array<{
                roomId?: string;
                roomName?: string;
                adults?: number;
                children?: number;
                price?: number;
            }>;
            /**
             * Reference to the main booking if this is a related booking
             */
            mainBooking?: Record<string, any> | null;
            /**
             * Related bookings for multi-room reservations (only present on main bookings)
             */
            relatedBookings?: Array<{
                id?: string;
                secretUUID?: string;
                status?: string;
                checkIn?: number;
                checkOut?: number;
                guests?: number;
                totalPrice?: number;
                currency?: string;
                bookingHolder?: Record<string, any>;
                rooms?: Array<Record<string, any>>;
            }>;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/{websiteApiKey}/properties/bookings/{bookingSecretUUID}',
            path: {
                'websiteApiKey': websiteApiKey,
                'bookingSecretUUID': bookingSecretUuid,
            },
            errors: {
                404: `Website or booking not found`,
                500: `Failed to fetch booking`,
            },
        });
    }
    /**
     * Update Booking Contact Info
     * Updates the contact information of an existing booking using secret UUID. Only bookingHolder information can be updated.
     * @param websiteApiKey The unique API key for the website integration
     * @param bookingSecretUuid The secret UUID of the booking
     * @param requestBody
     * @returns any Booking updated successfully
     * @throws ApiError
     */
    public static updateBooking(
        websiteApiKey: string,
        bookingSecretUuid: string,
        requestBody: {
            /**
             * Partial booking data to update (only bookingHolder allowed)
             */
            booking: {
                bookingHolder?: {
                    firstName?: string;
                    lastName?: string;
                    email?: string;
                    phone?: string;
                    countryCode?: string;
                };
            };
        },
    ): CancelablePromise<{
        success?: boolean;
        booking?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/{websiteApiKey}/properties/bookings/{bookingSecretUUID}',
            path: {
                'websiteApiKey': websiteApiKey,
                'bookingSecretUUID': bookingSecretUuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request or restricted fields present`,
                404: `Website or booking not found`,
                500: `Failed to update booking`,
            },
        });
    }
    /**
     * Create Booking
     * Creates a new booking for a property. When multiple rooms are provided, the first room becomes the main booking and additional rooms are created as related bookings linked to the main booking.
     * @param websiteApiKey The unique API key for the website integration
     * @param requestBody
     * @returns any Booking created successfully
     * @throws ApiError
     */
    public static createBooking(
        websiteApiKey: string,
        requestBody: {
            /**
             * Booking data (matches Payload bookings collection schema)
             */
            booking: {
                /**
                 * Property ID
                 */
                property?: number;
                /**
                 * Check-in date (YYYY-MM-DD)
                 */
                checkIn?: string;
                /**
                 * Check-out date (YYYY-MM-DD)
                 */
                checkOut?: string;
                guestName?: string;
                guestEmail?: string;
                guests?: number;
                totalPrice?: number;
                status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
                /**
                 * Array of rooms to book with channel room IDs. First room becomes main booking, additional rooms become related bookings.
                 */
                rooms?: Array<{
                    /**
                     * The channel room ID (e.g., beds24 room ID)
                     */
                    channelRoomId: string;
                    /**
                     * Number of adults
                     */
                    adults: number;
                    /**
                     * Number of children
                     */
                    children: number;
                    /**
                     * Price for this specific room (optional)
                     */
                    price?: number;
                }>;
            };
        },
    ): CancelablePromise<{
        success?: boolean;
        /**
         * The main booking (first room)
         */
        booking?: Record<string, any>;
        /**
         * Additional bookings for extra rooms (if multiple rooms were requested)
         */
        relatedBookings?: Array<Record<string, any>>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/{websiteApiKey}/properties/bookings/create',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Booking data is required`,
                404: `Website not found`,
                500: `Failed to create booking`,
            },
        });
    }
}
