import { GeoJSON } from "geojson";
import { Map } from "leaflet";
import React from "react";

abstract class Converter {
    public mapData: Readonly<GeoJSON.GeoJSON>;
    constructor(mapData: GeoJSON.GeoJSON) {
        this.mapData = mapData;
    }

    /**
     * Given the original mapData, create react SVG elements for each feature. Implementations
     * should naturally try to cache results internally.
     *
     * @param precision A number between 0 and 1, with 1 rendering nothing and 0 rendering everything
     * @param refresh If refresh is a true, force the entire geoJSON to be recalculated
     * @returns An array of renderable SVG elements
     */
    public abstract createSVG(precision: number, refresh?: boolean): Array<JSX.Element>;

    /**
     * Get the bounding box for the last created SVG. If no SVG was previously
     * created, returns [0,0,0,0].
     *
     * @returns An array denoting the bounding box. This is of the form [x, y, width, height]
     */
    public abstract getBBox(): [number, number, number, number];

    /**
     * Given an enclosing div, render this.mapData in the div using Leaflet.
     *
     * @param d The div to attach the map to
     * @returns The associated Leaflet map
     */
    public abstract renderWithLeaflet(enclosingDiv: HTMLDivElement): L.Map;
}

export { Converter };
