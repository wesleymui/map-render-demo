import { Converter } from "./converter";
import { SVGBuilder } from "./svgBuilder";
import { SVGBBox } from "./SVGBBox";

/**
 * This namespace encapsulates everything needed to convert
 * a GeoJSON object to SVG.
 */
namespace convertGeoJSON {
    /**
     * Create a converter for a GeoJSON object.
     *
     * @param g A GeoJSON to convert
     * @returns A `Converter` object
     */
    export function createConverter(g: GeoJSON.GeoJSON): Converter {
        return new SVGBuilder(g);
    }

    

}

export { convertGeoJSON };
