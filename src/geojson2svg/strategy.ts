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

    /**
     * Get the bounding box for the last created SVG. If no SVG was previously
     * created, returns [0,0,0,0].
     *
     * @returns An array denoting the bounding box. This is of the form [x, y, width, height]
     */
    public abstract getBBox(): [number, number, number, number];
}

export { Converter };
