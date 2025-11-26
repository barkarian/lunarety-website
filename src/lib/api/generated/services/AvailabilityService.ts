/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PerformanceMetrics } from '../models/PerformanceMetrics';
import type { RoomOccupancy } from '../models/RoomOccupancy';
import type { WebsiteType } from '../models/WebsiteType';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AvailabilityService {
    /**
     * Get Property Availability
     * Retrieves availability information for properties based on check-in/check-out dates and room requirements. Uses the Beds24 channel manager integration.
     * @param websiteApiKey The unique API key for the website integration
     * @param requestBody
     * @returns any Availability retrieved successfully
     * @throws ApiError
     */
    public static getAvailability(
        websiteApiKey: string,
        requestBody: {
            websiteType: WebsiteType;
            period: {
                /**
                 * Check-in date timestamp (milliseconds)
                 */
                from: number;
                /**
                 * Check-out date timestamp (milliseconds)
                 */
                to: number;
                rooms: Array<RoomOccupancy>;
            };
            type?: 'paginated' | 'custom';
            page?: number;
            limit?: number;
            propertyIds?: Array<number>;
        },
    ): CancelablePromise<{
        properties: Array<Record<string, any>>;
        totalDocs: number;
        performance: PerformanceMetrics;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/{websiteApiKey}/properties/get-availability',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid period parameters`,
                404: `Website not found`,
                500: `Internal server error or Beds24 configuration missing`,
            },
        });
    }
}
