/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PackagesService {
    /**
     * Get Website Packages
     * Retrieves paginated website packages for platform marketplace websites.
     * Only available for websites with type "platformMarketplace".
     *
     * **Filtering:**
     * - Filter by departure and destination locations
     * - Filter by availability period (packages that overlap with the given date range)
     * - Filter by transportation type (ship/plane)
     * - Filter by tags
     *
     * **Important Notes:**
     * - Packages with `content.availabilityPeriod.to` in the past are automatically excluded
     * - Locations (departures, destination) are populated with depth=1
     * - Properties within dateRanges are NOT populated to reduce bandwidth
     *
     * **Date Format:**
     * - All dates use YYYYMMDD format as numbers (e.g., 20251011 for October 11, 2025)
     *
     * @param websiteApiKey The unique API key for the website integration
     * @param requestBody
     * @returns any Packages retrieved successfully
     * @throws ApiError
     */
    public static getWebsitePackages(
        websiteApiKey: string,
        requestBody?: {
            /**
             * Page number (1-based)
             */
            page?: number;
            /**
             * Items per page
             */
            limit?: number;
            /**
             * Optional filters to narrow down results
             */
            filters?: {
                /**
                 * Filter by departure location IDs (returns packages that have ANY of these departures)
                 */
                departureIds?: Array<number>;
                /**
                 * Filter by destination location IDs (returns packages that have ANY of these destinations)
                 */
                destinationIds?: Array<number>;
                /**
                 * Start of availability search period (YYYYMMDD format).
                 * Returns packages that have availability overlapping with this range.
                 * For example, if searching 20251011-20251030, a package available 20251025-20251105 will be included.
                 *
                 */
                availabilityFrom?: number;
                /**
                 * End of availability search period (YYYYMMDD format).
                 * Used together with availabilityFrom to find packages with overlapping availability.
                 *
                 */
                availabilityTo?: number;
                /**
                 * Filter by transportation type
                 */
                transportation?: 'ship' | 'plane';
                /**
                 * Filter by tags (returns packages that have ANY of these tags)
                 */
                tags?: Array<string>;
            };
        },
    ): CancelablePromise<{
        /**
         * Array of website packages with populated locations
         */
        packages: Array<{
            /**
             * Package ID
             */
            id?: number;
            /**
             * Name of the package
             */
            packageName?: string;
            /**
             * Starting price
             */
            fromPrice?: number;
            /**
             * Display order
             */
            order?: number;
            /**
             * Departure locations (populated with depth=1)
             */
            departures?: Array<{
                id?: number;
                name?: string;
                type?: 'area' | 'country' | 'continent';
                mapsUrl?: string | null;
            }>;
            /**
             * Default departure information (1:1 with departures)
             */
            defaultDepartInfo?: Array<string>;
            /**
             * Destination location (populated with depth=1)
             */
            destination?: {
                id?: number;
                name?: string;
                type?: 'area' | 'country' | 'continent';
                mapsUrl?: string | null;
            };
            /**
             * Default return information
             */
            defaultReturnInfo?: string;
            meta?: {
                transportation?: 'ship' | 'plane';
                tags?: Array<string>;
            };
            /**
             * Default pricing offers
             */
            defaultOffers?: Array<{
                adults?: number;
                children?: number;
                group?: string;
                total?: number;
            }>;
            /**
             * Available date ranges (properties NOT populated)
             */
            dateRanges?: Array<{
                /**
                 * Start date (YYYYMMDD)
                 */
                from?: number;
                /**
                 * End date (YYYYMMDD)
                 */
                to?: number;
                /**
                 * Property IDs (not populated)
                 */
                properties?: Array<number>;
                trip?: {
                    hasCustomInfos?: boolean;
                    customDepartInfo?: Array<string>;
                    customReturnInfo?: string;
                };
                offers?: {
                    hasCustomOffers?: boolean;
                    customOffers?: Array<Record<string, any>>;
                };
            }>;
            content?: {
                shortDescription?: string;
                /**
                 * Rich text content
                 */
                description?: Record<string, any>;
                /**
                 * Media IDs
                 */
                media?: Array<number>;
                durationInDaysOptions?: number | null;
                availabilityPeriod?: {
                    /**
                     * Earliest available date (YYYYMMDD)
                     */
                    from?: number;
                    /**
                     * Latest available date (YYYYMMDD)
                     */
                    to?: number;
                };
            };
            /**
             * Website ID (not populated)
             */
            website?: number;
            updatedAt?: string;
            createdAt?: string;
        }>;
        /**
         * Total number of packages matching the query
         */
        totalDocs: number;
        /**
         * Total number of pages
         */
        totalPages: number;
        /**
         * Current page number
         */
        page: number;
        /**
         * Items per page
         */
        limit: number;
        /**
         * Whether there is a next page
         */
        hasNextPage: boolean;
        /**
         * Whether there is a previous page
         */
        hasPrevPage: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/{websiteApiKey}/packages',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Website is not a platform marketplace`,
                404: `Website not found`,
                500: `Internal server error`,
            },
        });
    }
}
