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
     * Validates the website API key and returns website configuration
     * @param websiteApiKey The unique API key for the website integration
     * @returns any Website found and validated
     * @throws ApiError
     */
    public static validateWebsite(
        websiteApiKey: string,
    ): CancelablePromise<{
        /**
         * The website configuration object
         */
        website?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/website/{websiteApiKey}',
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
