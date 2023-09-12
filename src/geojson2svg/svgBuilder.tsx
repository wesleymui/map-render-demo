import { Converter } from "./converter";
import { GeoJSON } from "geojson";
import { isGeometry, isGeometryCollection } from "./utility";
import L from "leaflet";

const STROKE_WIDTH = 0.1;
const STROKE_COLOR = "black";

class SVGBuilder extends Converter {
    // keeps track of the box that bounds the current map
    private box = {
        top: Infinity,
        bottom: -Infinity,
        left: Infinity,
        right: -Infinity,
    };
    //
    private elementNumber = 0;

    /**
     * This returns the index of the next SVG element and increments an internal counter.
     *
     * @returns The key for the next SVG element
     */
    private getNextKey(): string {
        this.elementNumber++;
        return this.elementNumber.toString();
    }

    /**
     * Create an SVG using the GeoJSON inputted in the constructor. Note that calls to this
     * will recompute both the SVG and the bounding box.
     *
     * @returns A <svg></svg> populated with svg elements.
     */
    public createSVG(): Array<JSX.Element> {
        this.elementNumber = 0;
        this.box = {
            top: Infinity,
            bottom: -Infinity,
            left: Infinity,
            right: -Infinity,
        };

        switch (this.mapData.type) {
            case "Feature":
                return this.svgOfFeature(this.mapData);

            case "FeatureCollection":
                return this.svgOfFeatureCollection(this.mapData);
            default: {
                if (isGeometry(this.mapData)) {
                    return this.svgOfGeometry(this.mapData);
                } else {
                    throw new Error(
                        "Programmer did not catch a type: " + this.mapData
                    );
                }
            }
        }
    }

    /**
     * Create the SVG elements that define a GeoJSON FeatureCollection.
     * It is assumed that calls to this contribute to building the SVG map
     * corresponding to this GeoJSON.
     *
     * @param features A GeoJSON FeatureCollection
     * @returns An array of SVG elements that correspond to the FeatureCollection
     */
    private svgOfFeatureCollection(
        features: GeoJSON.FeatureCollection
    ): Array<JSX.Element> {
        let ans: Array<JSX.Element> = [];
        for (let feature of features.features) {
            ans = ans.concat(...this.svgOfFeature(feature));
        }
        return ans;
    }

    /**
     * Create the SVG elements that define a GeoJSON Feature.
     *
     * @param feature
     * @returns
     */
    private svgOfFeature(feature: GeoJSON.Feature): Array<JSX.Element> {
        // TODO: a feature has properties. They might be used here
        return this.svgOfGeometry(feature.geometry);
    }

    /**
     * Verify that a position is valid. A position is valid iff it has at least 2
     * coordinates and optionally has a third. This function will also negate the
     * second coordinate so that screen coordinates and Earth coordinates are
     * oriented in the correct way.
     *
     * @param p A position to evaluate
     * @returns a triplet of points [p[0], p[1], p[2]]. If p[2] was undefined, it is -1
     * @throws An error of the position is malformed
     */
    private isPosition(p: GeoJSON.Position): [number, number, number] {
        let ans: [number, number, number] = [-1, -1, -1];
        if (p.length === 2 || p.length === 3) {
            ans[0] = p[0];
            ans[1] = p[1] * -1;
            this.addToBBox(ans[0], ans[1]);

            if (p[2] !== undefined) {
                ans[2] = p[2];
            }
            return ans;
        }
        throw new Error("Found malformed position " + p);
    }

    /**
     * Build a point. A point is described by a position. Its corresponding
     * SVG representation is a small circle. It is assumed that calls to this
     * contribute to building the SVG map corresponding to this GeoJSON.
     *
     * @param p The position to draw the circle at
     * @returns An SVG circle
     */
    private buildPoint(p: GeoJSON.Position): JSX.Element {
        p = this.isPosition(p);
        return (
            <circle
                cx={p[0]}
                cy={p[1]}
                r={`${STROKE_WIDTH}%`}
                fill={`${STROKE_COLOR}`}
                key={this.getNextKey()}
            />
        );
    }

    /**
     * Build a line. A line is described by an array of position. Its
     * corresponding SVG representation is a polyline. It is assumed
     * that calls to this contribute to building the SVG map corresponding
     * to this GeoJSON.
     *
     * @param coordinates
     * @returns A SVG polyline
     */
    private buildLine(coordinates: GeoJSON.Position[]): JSX.Element {
        if (coordinates.length < 2) {
            throw new Error(
                "Found LineString with less than 2 points: " + coordinates
            );
        }
        return (
            <polyline
                points={coordinates
                    .map((c) => {
                        return this.isPosition(c);
                    })
                    .map((c) => `${c[0]},${c[1]}`)
                    .join(" ")}
                strokeWidth={`${STROKE_WIDTH}%`}
                stroke={`${STROKE_COLOR}`}
                key={this.getNextKey()}
            />
        );
    }

    /**
     * Given a double array of coordinates, construct a polygon. Note that this returns a <path> element.
     * According to https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6, the first element is the
     * bounding shape. Subsequent elements are holes within that shape. It is assumed that calls to this
     * contribute to building the SVG map corresponding to this GeoJSON.
     *
     * @param coordinates The coordinates specifying the shape
     * @returns A path element drawing the shape
     */
    private buildPolygon(coordinates: GeoJSON.Position[][]): JSX.Element {
        if (coordinates.length < 1 || coordinates[0].length < 1) {
            throw new Error("No bounding polygon specified");
        }
        coordinates = coordinates.map((shp) => {
            return shp.map((p) => this.isPosition(p));
        });

        let boundingShape = coordinates[0];
        // note that the zeroth path is counter clockwise
        // and all other paths are counter

        let d = `M${boundingShape[0][0]} ${boundingShape[0][1]} `;
        for (let i = 1; i < boundingShape.length; i++) {
            d += `L${boundingShape[i][0]} ${boundingShape[i][1]} `;
        }
        d += "z ";

        // expand bbox
        boundingShape.forEach((p) => this.addToBBox(p[0], p[1]));

        // TODO: verify that items after the zeroth are indeed counter
        // if items are not counter, we MUST preprocess tehm to make them counter clockwise

        for (let polyno = 1; polyno < coordinates.length; polyno++) {
            let hole = coordinates[polyno];
            d += `M${hole[0][0]} ${hole[0][1]} `;
            for (let i = 1; i < hole.length; i++) {
                d += `L${hole[i][0]} ${hole[i][1]} `;
            }
            d += "z ";
        }
        return (
            <path
                d={d}
                fillRule="evenodd"
                fill="white"
                stroke="black"
                strokeWidth={`${STROKE_WIDTH}%`}
                key={this.getNextKey()}
            />
        );
    }

    /**
     * Construct the SVG element(s) corresponding to some GeoJSON.Geometry.
     * @param geometry Some GeoJSON.Geometry
     * @returns An array of SVG elements
     */
    private svgOfGeometry(geometry: GeoJSON.Geometry): Array<JSX.Element> {
        if (isGeometryCollection(geometry)) {
            return geometry.geometries.map((g) => this.svgOfGeometry(g)).flat();
        }
        switch (geometry.type) {
            case "Point": {
                return [this.buildPoint(geometry.coordinates)];
            }
            case "MultiPoint": {
                return geometry.coordinates.map((c) => this.buildPoint(c));
            }
            case "LineString": {
                return [this.buildLine(geometry.coordinates)];
            }
            case "MultiLineString": {
                return geometry.coordinates.map((pline) =>
                    this.buildLine(pline)
                );
            }
            case "Polygon": {
                return [this.buildPolygon(geometry.coordinates)];
            }
            case "MultiPolygon": {
                return geometry.coordinates.map((poly) =>
                    this.buildPolygon(poly)
                );
            }
        }
    }

    /**
     * Get the bounding box of the last computed SVG. Calls to
     * `createSVG()` may change the output of this function.
     * @returns
     */
    public getBBox(): [number, number, number, number] {
        if (this.box.left === Infinity) {
            return [0, 0, 0, 0];
        }
        return [
            this.box.left,
            this.box.top,
            this.box.right - this.box.left,
            this.box.bottom - this.box.top,
        ];
    }

    /**
     * Add a point to the bounding box, expanding the bounding box
     * when necessary.
     * @param x The x coordinate of the point
     * @param y The y coordinate of the point
     */
    private addToBBox(x: number, y: number) {
        this.box.left = Math.min(this.box.left, x);
        this.box.right = Math.max(this.box.right, x);
        this.box.top = Math.min(this.box.top, y);
        this.box.bottom = Math.max(this.box.bottom, y);
    }

    /**
     * Render this GeoJSON using Leaflet. This function does not affect
     * the internal state of this object.
     * @param enclosingDiv The div that should enclose the map
     * @returns A L.Map object corresponding to the newly created map
     */
    public renderWithLeaflet(enclosingDiv: HTMLDivElement): L.Map {
        let map = L.map(enclosingDiv);
        L.geoJSON(this.mapData).addTo(map);

        return map;
    }
}

export { SVGBuilder };
