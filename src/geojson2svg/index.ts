import { Converter } from "./strategy";
import { SVGStrategy } from "./svgStrategy/svgStrategy";

namespace convertGeoJSON {
    export enum Strategy {
        SVG,
        LEAFLET,
    }
    export function createConverter(
        s: Strategy,
        g: GeoJSON.GeoJSON
    ): Converter {
        switch (s) {
            case Strategy.SVG: {
                return new SVGStrategy(g);
            }
            default:
                throw new Error("Unimplemented");
        }
    }
}

export { convertGeoJSON };
