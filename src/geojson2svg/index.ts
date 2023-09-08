import { Converter } from "./strategy";

namespace convertGeoJSON {
    export enum Strategy {
        SVG,
        LEAFLET,
    }
    export function createConverter(s: Strategy): Converter {
        switch (s) {
            case Strategy.SVG: {
                
                break;
            }
            default:
                throw new Error("Unimplemented");
        }
    }
}

export type { convertGeoJSON };
