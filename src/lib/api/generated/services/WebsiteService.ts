/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WebsiteService {
    /**
     * Validate Website API Key
     * Validates the website API key and returns website configuration (depth=0, excludes sensitive fields)
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
                 * Media ID for the logo
                 */
                logo?: number | null;
                /**
                 * Media ID for the favicon
                 */
                favicon?: number | null;
            };
            /**
             * AI configuration (API key excluded for security)
             */
            ai: {
                /**
                 * Whether AI features are enabled
                 */
                supportsAi: boolean;
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
