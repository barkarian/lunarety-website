/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Populated location object for filter options
 */
export type FilterLocation = {
    /**
     * Location ID
     */
    id: number;
    /**
     * Location name
     */
    name: string;
    /**
     * Type of location
     */
    type: FilterLocation.type;
    /**
     * Parent area (for area type locations)
     */
    parentArea?: (number | FilterLocation) | null;
    /**
     * Parent country (for area type locations)
     */
    parentCountry?: (number | FilterLocation) | null;
    /**
     * Parent continent (for country type locations)
     */
    parentContinent?: (number | FilterLocation) | null;
    /**
     * Google Maps URL or other maps link
     */
    mapsUrl?: string | null;
    /**
     * Last update timestamp
     */
    updatedAt: string;
    /**
     * Creation timestamp
     */
    createdAt: string;
};
export namespace FilterLocation {
    /**
     * Type of location
     */
    export enum type {
        AREA = 'area',
        COUNTRY = 'country',
        CONTINENT = 'continent',
    }
}

