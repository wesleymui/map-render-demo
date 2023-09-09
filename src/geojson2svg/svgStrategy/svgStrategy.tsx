import { Converter } from "../strategy";
import { GeoJSON } from "geojson";
import { isGeometry, isGeometryCollection } from "../utility";

const STROKE_WIDTH = 7;
const STROKE_COLOR = "black";

class SVGStrategy extends Converter {
    // top left bottom right
    private box = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    };
    public createSVG(): Array<JSX.Element> {
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

    private svgOfFeatureCollection(
        features: GeoJSON.FeatureCollection
    ): Array<JSX.Element> {
        let ans: Array<JSX.Element> = [];
        for (let feature of features.features) {
            ans = ans.concat(...this.svgOfFeature(feature));
        }
        return ans;
    }

    private svgOfFeature(feature: GeoJSON.Feature): Array<JSX.Element> {
        // TODO: a feature has properties. They might be used here
        return this.svgOfGeometry(feature.geometry);
    }

    /**
     * Verify that a position is valid. A position is valid iff it has at least 2
     * coordinates and optionally has a third.
     * @param p A position to evaluate
     * @returns a triplet of points [p[0], p[1], p[2]]. If p[2] was undefined, it is -1
     * @throws An error of the position is malformed
     */
    private static isPosition(p: GeoJSON.Position): [number, number, number] {
        let ans: [number, number, number] = [-1, -1, -1];
        if (p.length === 2 || p.length === 3) {
            ans[0] = p[0];
            ans[1] = p[1];
            if (p[2] !== undefined) {
                ans[2] = p[2];
            }
            return ans;
        }
        throw new Error("Found malformed position " + p);
    }

    private buildPoint(p: GeoJSON.Position): JSX.Element {
        p = SVGStrategy.isPosition(p);
        this.addToBBox(p[0], p[1]);
        return (
            <circle
                cx={p[0]}
                cy={p[1]}
                r={`${STROKE_WIDTH}`}
                fill={`${STROKE_COLOR}`}
            />
        );
    }

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
                        let coords = SVGStrategy.isPosition(c);
                        this.addToBBox(coords[0], coords[1]);
                        return coords;
                    })
                    .map((c) => `${c[0]},${c[1]}`)
                    .join(" ")}
                strokeWidth={`${STROKE_WIDTH}`}
                stroke={`${STROKE_COLOR}`}
            />
        );
    }

    /**
     * Given a double array of coordinates, construct a polygon. Note that this returns a <path> element.
     * According to https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6, the first element is the
     * bounding shape. Subsequent elements are holes within that shape.
     *
     * @param coordinates The coordinates specifying the shape
     * @returns A path element drawing the shape
     */
    private buildPolygon(coordinates: GeoJSON.Position[][]): JSX.Element {
        if (coordinates.length < 1 || coordinates[0].length < 1) {
            throw new Error("No bounding polygon specified");
        }
        // TODO: check that all of the points are positions

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
        //TODO: modularize coloring
        return (
            <path
                d={d}
                fill-rule="evenodd"
                fill="white"
                stroke="black"
                strokeWidth={`${STROKE_WIDTH}`}
            />
        );
    }

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

    public getBBox(): [number, number, number, number] {
        return [
            this.box.top,
            this.box.left,
            this.box.bottom - this.box.top,
            this.box.right - this.box.left,
        ];
    }

    private addToBBox(x: number, y: number) {
        this.box.left = Math.min(this.box.left, x);
        this.box.right = Math.max(this.box.right, x);
        this.box.top = Math.min(this.box.top, y);
        this.box.bottom = Math.min(this.box.bottom, y);
    }
}

export { SVGStrategy };
