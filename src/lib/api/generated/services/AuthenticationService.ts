/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Verify authentication and get user info
     * Verifies the JWT token from the Authorization header and returns the authenticated user's information.
     * @param websiteApiKey The unique API key for the website integration (also used as JWT secret)
     * @param authorization Bearer token received from sign-in or sign-up
     * @returns any Token is valid, user info returned
     * @throws ApiError
     */
    public static verifyAuth(
        websiteApiKey: string,
        authorization: string,
    ): CancelablePromise<{
        success?: boolean;
        user?: {
            id?: number;
            email?: string;
            type?: 'agent' | 'guest';
            firstName?: string | null;
            lastName?: string | null;
            phone?: string | null;
            country?: string | null;
        };
        /**
         * The website ID the user is authenticated for
         */
        websiteId?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/{websiteApiKey}/auth',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            headers: {
                'Authorization': authorization,
            },
            errors: {
                401: `Invalid or expired token`,
                404: `Website or user not found`,
                500: `Failed to verify authentication`,
            },
        });
    }
    /**
     * Refresh authentication token
     * Issues a new JWT token for an authenticated user. Requires a valid (non-expired) token.
     * @param websiteApiKey The unique API key for the website integration (also used as JWT secret)
     * @param authorization Bearer token to refresh
     * @returns any New token issued successfully
     * @throws ApiError
     */
    public static refreshAuth(
        websiteApiKey: string,
        authorization: string,
    ): CancelablePromise<{
        success?: boolean;
        /**
         * New JWT token
         */
        token?: string;
        user?: {
            id?: number;
            email?: string;
            type?: 'agent' | 'guest';
            firstName?: string | null;
            lastName?: string | null;
            phone?: string | null;
            country?: string | null;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/{websiteApiKey}/auth',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            headers: {
                'Authorization': authorization,
            },
            errors: {
                401: `Invalid or expired token`,
                404: `Website or user not found`,
                500: `Failed to refresh token`,
            },
        });
    }
    /**
     * Sign in an agent or guest user
     * Authenticates a user and returns a JWT token. Only users of type 'agent' or 'guest' who are associated with the website can sign in.
     * @param websiteApiKey The unique API key for the website integration (also used as JWT secret)
     * @param requestBody
     * @returns any User authenticated successfully
     * @throws ApiError
     */
    public static signIn(
        websiteApiKey: string,
        requestBody: {
            /**
             * User email address
             */
            email: string;
            /**
             * User password
             */
            password: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        user?: {
            id?: number;
            email?: string;
            type?: 'agent' | 'guest';
            firstName?: string | null;
            lastName?: string | null;
            phone?: string | null;
            country?: string | null;
        };
        /**
         * JWT token for authentication
         */
        token?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/{websiteApiKey}/sign-in',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
                401: `Invalid credentials or user not associated with website`,
                404: `Website not found`,
                500: `Failed to authenticate user`,
            },
        });
    }
    /**
     * Register a new agent or guest user
     * Creates a new user account of type 'agent' or 'guest' associated with the website. The websiteApiKey is used as the JWT secret.
     * @param websiteApiKey The unique API key for the website integration (also used as JWT secret)
     * @param requestBody
     * @returns any User created successfully
     * @throws ApiError
     */
    public static signUp(
        websiteApiKey: string,
        requestBody: {
            /**
             * User email address
             */
            email: string;
            /**
             * User password (minimum 6 characters)
             */
            password: string;
            /**
             * Type of user to create
             */
            type: 'agent' | 'guest';
            /**
             * User's first name
             */
            firstName: string;
            /**
             * User's last name
             */
            lastName: string;
            /**
             * User's phone number
             */
            phone: string;
            /**
             * User's country code (e.g., US, GR, UK)
             */
            country: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        user?: {
            id?: number;
            email?: string;
            type?: 'agent' | 'guest';
            firstName?: string;
            lastName?: string;
            phone?: string;
            country?: string;
        };
        /**
         * JWT token for authentication
         */
        token?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/{websiteApiKey}/sign-up',
            path: {
                'websiteApiKey': websiteApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
                404: `Website not found`,
                409: `User with this email already exists`,
                500: `Failed to create user`,
            },
        });
    }
}
