/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailabilityMedia } from './AvailabilityMedia';
import type { RichText } from './RichText';
export type AvailabilityPropertyContent = {
    /**
     * Short description of the property
     */
    shortDescription: string;
    /**
     * Long description of the property (rich text)
     */
    longDescription: RichText;
    /**
     * Property images
     */
    media: Array<AvailabilityMedia>;
    location: {
        /**
         * Property address
         */
        address: string;
        /**
         * Google Maps or location URL
         */
        url: string;
    };
};

