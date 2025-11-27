/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Lexical rich text content
 */
export type RichText = {
    root?: {
        type?: string;
        children?: Array<Record<string, any>>;
        direction?: RichText.direction | null;
        format?: RichText.format | null;
        indent?: number;
        version?: number;
    };
};
export namespace RichText {
    export enum direction {
        LTR = 'ltr',
        RTL = 'rtl',
    }
    export enum format {
        LEFT = 'left',
        START = 'start',
        CENTER = 'center',
        RIGHT = 'right',
        END = 'end',
        JUSTIFY = 'justify',
    }
}

