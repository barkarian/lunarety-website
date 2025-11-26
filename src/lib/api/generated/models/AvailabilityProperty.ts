/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailabilityPropertyContent } from './AvailabilityPropertyContent';
import type { AvailabilityRoom } from './AvailabilityRoom';
export type AvailabilityProperty = {
    /**
     * Property ID
     */
    id: number;
    /**
     * Property title
     */
    title: string;
    /**
     * Starting price for the requested stay
     */
    fromPrice: number;
    /**
     * Property content including description, media, and location
     */
    content?: AvailabilityPropertyContent;
    /**
     * Available rooms with pricing
     */
    rooms: Array<AvailabilityRoom>;
};

