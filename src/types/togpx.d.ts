declare module "togpx" {

    import {Feature, GeoJSON} from "geojson";

    const togpx: {
        (geojson: GeoJSON, options?: {
            creator?: string,
            metadata?: any,
            featureTitle?: (props?: any) => string,
            featureDescription?: (props?: any) => string,
            featureLink?: (props?: any) => string,
            featureCoordTimes?: ((feature: Feature) => string[]) | string
        }): string;
    };

    export = togpx;
}
