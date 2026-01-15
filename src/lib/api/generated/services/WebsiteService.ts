/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FilterLocation } from '../models/FilterLocation';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WebsiteService {
    /**
     * Validate Website API Key
     * Validates the website API key and returns website configuration with populated filter locations
     * @param websiteApiKey The unique API key for the website integration
     * @returns any Website found and validated
     * @throws ApiError
     */
    public static validateWebsite(
        websiteApiKey: string,
    ): CancelablePromise<{
        website: {
            /**
             * The unique identifier for the website
             */
            id: number;
            /**
             * The user ID of the website owner (depth=0)
             */
            websiteOwner: number;
            /**
             * The type of marketplace website
             */
            type: 'platformMarketplace' | 'managerMarketplace' | 'ownerMarketplace';
            /**
             * Defines which user types can use this website (all = anyone, all-or-guests = guests and agents, agents = agents only)
             */
            userBaseType?: 'all' | 'all-or-guests' | 'agents' | null;
            /**
             * Platform properties (only for platformMarketplace type)
             */
            platformProperties?: {
                /**
                 * Array of property IDs
                 */
                docs?: Array<number>;
                hasNextPage?: boolean;
                totalDocs?: number;
            };
            /**
             * Manager properties (only for managerMarketplace type)
             */
            managerProperties?: {
                /**
                 * Array of property IDs
                 */
                docs?: Array<number>;
                hasNextPage?: boolean;
                totalDocs?: number;
            };
            /**
             * Owner properties (only for ownerMarketplace type)
             */
            ownerProperties?: {
                /**
                 * Array of property IDs
                 */
                docs?: Array<number>;
                hasNextPage?: boolean;
                totalDocs?: number;
            };
            /**
             * The API key for the website
             */
            websiteApiKey: string;
            /**
             * Website assets configuration
             */
            website?: {
                /**
                 * The name of the website
                 */
                websiteName: string;
                /**
                 * Media ID for the logo
                 */
                logo?: number | null;
                /**
                 * Media ID for the favicon
                 */
                favicon?: number | null;
            };
            /**
             * AI configuration
             */
            ai: {
                /**
                 * Whether AI features are enabled
                 */
                supportsAi: boolean;
                /**
                 * OpenRouter API key for AI features
                 */
                websiteOpenrouterApiKey?: string | null;
            };
            /**
             * SEO configuration
             */
            seo?: {
                /**
                 * SEO title
                 */
                title?: string | null;
                /**
                 * SEO description
                 */
                description?: string | null;
                /**
                 * SEO keywords
                 */
                keywords?: Array<string> | null;
                /**
                 * Array of media IDs for SEO
                 */
                media?: Array<number> | null;
            };
            /**
             * Channel manager configuration
             */
            channelManagerConfig?: {
                /**
                 * Enabled channel managers
                 */
                channelManagers?: Array<'beds24'> | null;
                beds24?: {
                    /**
                     * Beds24 user ID
                     */
                    channelUserId?: string | null;
                    /**
                     * Filtered property IDs for Beds24
                     */
                    filterChannelPropertyIds?: Array<string> | null;
                };
            };
            /**
             * Auto-populated filter options from packages (only for platformMarketplace)
             */
            filterPackages?: {
                /**
                 * Array of unique departure locations from packages (populated)
                 */
                departures?: Array<FilterLocation> | null;
                /**
                 * Array of unique destination locations from packages (populated)
                 */
                destinations?: Array<FilterLocation> | null;
                /**
                 * Array of unique duration options (in days) from packages
                 */
                numberOfDays?: Array<number> | null;
                /**
                 * Array of unique transportation types from packages
                 */
                transportation?: Array<'bus' | 'plane'> | null;
                /**
                 * Array of unique tags from packages
                 */
                tags?: Array<string> | null;
            };
            /**
             * Auto-populated filter options from properties
             */
            filterProperties?: {
                /**
                 * Array of unique destination locations from properties (populated)
                 */
                destinations?: Array<FilterLocation> | null;
            };
            /**
             * Last update timestamp
             */
            updatedAt: string;
            /**
             * Creation timestamp
             */
            createdAt: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/{websiteApiKey}',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            errors: {
                404: `Website not found`,
                500: `Internal server error`,
            },
        });
    }
}
