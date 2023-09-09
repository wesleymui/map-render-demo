import { Converter } from "./strategy";
import { SVGStrategy } from "./svgBuilder";

namespace convertGeoJSON {
    export function createConverter(g: GeoJSON.GeoJSON): Converter {
        return new SVGStrategy(g);
    }
}

export { convertGeoJSON };
