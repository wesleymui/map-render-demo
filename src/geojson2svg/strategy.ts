import { GeoJSON } from "geojson";
import React from "react";

abstract class Converter {
    public mapData: Readonly<GeoJSON.GeoJSON>;
    constructor(mapData: GeoJSON.GeoJSON) {
        this.mapData = mapData;
    }

    /**
     * Given the original mapData, create react SVG elements for each feature
     *
     * @returns an array of react svg elements
     */
    public abstract createSVG(): Array<JSX.Element>;
}

export { Converter };
