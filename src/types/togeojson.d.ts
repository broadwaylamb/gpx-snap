declare module "togeojson" {

    import {FeatureCollection} from "geojson";

    export function gpx(doc: Document): FeatureCollection
}
