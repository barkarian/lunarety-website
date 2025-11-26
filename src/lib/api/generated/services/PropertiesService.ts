/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WebsiteType } from '../models/WebsiteType';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PropertiesService {
    /**
     * Get Properties
     * Retrieves properties based on website type and optional filters. Supports both paginated and custom property ID queries.
     * @param websiteApiKey The unique API key for the website integration
     * @param requestBody
     * @returns any Properties retrieved successfully
     * @throws ApiError
     */
    public static getProperties(
        websiteApiKey: string,
        requestBody: {
            websiteType: WebsiteType;
            /**
             * Query type
             */
            type?: 'paginated' | 'custom';
            /**
             * Page number (for paginated type)
             */
            page?: number;
            /**
             * Items per page (for paginated type)
             */
            limit?: number;
            /**
             * Specific property IDs to fetch
             */
            propertyIds?: Array<number>;
            rates?: {
                /**
                 * Start date timestamp (milliseconds)
                 */
                fromDate?: number;
                /**
                 * End date timestamp (milliseconds)
                 */
                toDate?: number;
            };
        },
    ): CancelablePromise<{
        /**
         * Paginated properties result
         */
        properties?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/website/{websiteApiKey}/properties',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
