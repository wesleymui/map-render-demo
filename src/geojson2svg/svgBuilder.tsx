import { Converter } from "./converter";
import { GeoJSON } from "geojson";
import { SVGBBox , addPointToLocalBBox, mergeBBox} from "./SVGBBox";
import { isGeometry, isGeometryCollection } from "./utility";
import L from "leaflet";
import { getShapeName } from "./labels";
import { url } from "inspector";

const STROKE_WIDTH = 0.1;
const STROKE_COLOR = "black";
const MAX_VAL = Number.MAX_SAFE_INTEGER
const COLORS = [
    "#4ED893",
    "#CDD539",
    "#ED3C7B",
    "#5393F5",
    "#7FED75",
    "#EDBE43",
    "#EC6CE4",
    "#D66363"
]




class SVGBuilder extends Converter {
    private elementNumber = 0;
    private colorNumber = 0;
    private bbox : SVGBBox = [0,0,0,0]

    /**
     * This returns the index of the next SVG element and increments an internal counter.
     *
     * @returns The key for the next SVG element
     */
    private getNextKey(): string {
        this.elementNumber++;
        return this.elementNumber.toString();
    }
    private getNextColor() : string{
        this.colorNumber++;
        return COLORS[this.colorNumber % COLORS.length]
    }

    /**
     * Create an SVG using the GeoJSON inputted in the constructor. Note that calls to this
     * will recompute both the SVG and the bounding box.
     *
     * @returns A <svg></svg> populated with svg elements.
     */
    public createSVG(): Array<JSX.Element> {
        this.elementNumber = 0;

        let prelude = [
            <defs>
                <filter x="-0.1" y="-0.1" width="1.3" height="1.3" id="textbg">
                <feMorphology in="SourceAlpha" result="MORPH" operator="dilate" radius="2" />
                <feColorMatrix in="MORPH" result="WHITENED" type="matrix" values="-1 0 0 0 1, 0 -1 0 0 1, 0 0 -1 0 1, 0 0 0 1 0"/>
                <feMerge>
                    <feMergeNode in="WHITENED"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
                </filter>
            </defs>
        ]
        switch (this.mapData.type) {
            case "Feature":{
                let [[els,txt], bbox] = this.svgOfFeature(this.mapData);
                this.bbox = bbox
                els.push(txt)
                els.unshift(...prelude)
                return els
            }


            case "FeatureCollection": {
                let [els, bbox] =this.svgOfFeatureCollection(this.mapData);
                this.bbox = bbox
                els.unshift(...prelude)
                return els
            }
            default: {
                if (isGeometry(this.mapData)) {
                    let [els, bbox] =this.svgOfGeometry(this.mapData);
                    this.bbox = bbox
                    els.unshift(...prelude)
                    return els
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
    ): [Array<JSX.Element>, SVGBBox] {
        let layers : [Array<JSX.Element>[], JSX.Element[]] = [[],[]]
        let bbox : SVGBBox = [MAX_VAL, MAX_VAL, 0,0]
        let first = true
        for (let feature of features.features) {
            let t = this.svgOfFeature(feature);
            layers[0] = layers[0].concat(t[0][0])
            layers[1].push(t[0][1])
            if (first) {
                bbox = t[1]
                first = false;
            } else {
                bbox = mergeBBox(bbox, t[1])
            }
        }
        let ans : JSX.Element[] = []
        // flatten manually
        for (let s of layers[0]) {
            ans = ans.concat(s)
        }
        ans = ans.concat(layers[1])
        return [ans, bbox];
    }

    /**
     * Create the SVG elements that define a GeoJSON Feature.
     *
     * @param feature
     * @returns
     */
    private svgOfFeature(feature: GeoJSON.Feature): [[Array<JSX.Element>, JSX.Element], SVGBBox] {
        let [els, bbox] = this.svgOfGeometry(feature.geometry);
        let n = getShapeName(feature.properties)
        let shapeId = this.getNextKey()
        let animateId = this.getNextKey()
        els = [<g id={`${shapeId}`} fill={this.getNextColor()}>
            {els}
            {/* <rect 
                x={`${bbox[0]}`} 
                y={`${bbox[1]}`} 
                width={`${bbox[2]}`} 
                height={`${bbox[3]}`}
                fillOpacity={0}
                fill="#ffffffff"
                stroke="black"
                strokeWidth={1}></rect> */}
        </g>]
        els.push(
            <animate 
                href={`#${animateId}`} 
                attributeName="visibility" 
                values="visible;hidden" 
                begin={`${shapeId}.mousedown`} 
                end={`${shapeId}.mouseup`} 
                cursor={"pointer"}
                dur="indefinite" 
                fill="remove"
            />);
        return [[
            els, 
            <text 
                x={`${bbox[0]+bbox[2]/2}`} 
                y={`${bbox[1]+bbox[3]/2}`} 
                dominantBaseline="middle" 
                textAnchor="middle" 
                fontSize={`${STROKE_WIDTH * 10}px`} 
                key={this.getNextKey()}
                id={`${animateId}`}
                visibility={"hidden"}
                style={{
                    filter: "url(#textbg)"
                }}
                // style={'filter:url("#textbg")'}
            >
                {n}
            </text>], bbox]
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
    private buildPoint(p: GeoJSON.Position): [JSX.Element, SVGBBox]  {
        p = this.isPosition(p);
        return [(
            <circle
                cx={p[0]}
                cy={p[1]}
                r={`${STROKE_WIDTH}%`}
                fill={`${STROKE_COLOR}`}
                key={this.getNextKey()}
            />
        ), [p[0], p[1], 0,0]]
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
    private buildLine(coordinates: GeoJSON.Position[]): [JSX.Element, SVGBBox] {
        if (coordinates.length < 2) {
            throw new Error(
                "Found LineString with less than 2 points: " + coordinates
            );
        }
        let b : SVGBBox = [MAX_VAL, MAX_VAL,0,0]
        return [(
            <polyline
                points={coordinates
                    .map((c) => {
                        return this.isPosition(c);
                    })
                    .map((c) => {
                        addPointToLocalBBox(c[0], c[1], b)
                        return `${c[0]},${c[1]}`
                    })
                    .join(" ")}
                strokeWidth={`${STROKE_WIDTH}%`}
                stroke={`${STROKE_COLOR}`}
                key={this.getNextKey()}
            />
        ), b]
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
    private buildPolygon(coordinates: GeoJSON.Position[][]): [JSX.Element, SVGBBox] {
        if (coordinates.length < 1 || coordinates[0].length < 1) {
            throw new Error("No bounding polygon specified");
        }
        coordinates = coordinates.map((shp) => {
            return shp.map((p) => this.isPosition(p));
        });

        let boundingShape = coordinates[0];
        // note that the zeroth path is counter clockwise
        // and all other paths are counter
        let b : SVGBBox= [boundingShape[0][0],boundingShape[0][1],0,0]
        let d = `M${boundingShape[0][0]} ${boundingShape[0][1]} `;
        for (let i = 1; i < boundingShape.length; i++) {
            let npoint = boundingShape[i]
            d += `L${npoint[0]} ${npoint[1]} `;
            addPointToLocalBBox(npoint[0], npoint[1], b)
        }
        d += "z ";


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
        return [(
            <path
                d={d}
                fillRule="evenodd"
                // fill="white"
                stroke="black"
                strokeWidth={`${STROKE_WIDTH}%`}
                key={this.getNextKey()}
            />
        ), b]
    }

    /**
     * Construct the SVG element(s) corresponding to some GeoJSON.Geometry.
     * @param geometry Some GeoJSON.Geometry
     * @returns An array of SVG elements and a bounding box containing all elements
     */
    private svgOfGeometry(geometry: GeoJSON.Geometry): [Array<JSX.Element>, SVGBBox] {
        let elements : Array<JSX.Element>= []
        let b : SVGBBox = [MAX_VAL,MAX_VAL,0,0]
        if (isGeometryCollection(geometry)) {
            geometry.geometries.forEach((g, i) => {
                let t = this.svgOfGeometry(g)
                elements.concat(t[0])
                if (i === 0) {
                    b = t[1]
                } else {
                    b = mergeBBox(b, t[1])
                }
                
            })
            return [elements, b]
        }
        switch (geometry.type) {
            case "Point": {
                let t = this.buildPoint(geometry.coordinates)
                return [[t[0]], t[1]];
            }
            case "MultiPoint": {
                geometry.coordinates.forEach((c,i) => {
                    let t = this.buildPoint(c)
                    elements.push(t[0])
                    if (i === 0) {
                        b = t[1]
                    } else {
                        b = mergeBBox(b, t[1])
                    }
                });
                return [elements, b]
            }
            case "LineString": {
                let t = this.buildLine(geometry.coordinates)
                return [[t[0]], t[1]];
            }
            case "MultiLineString": {
                geometry.coordinates.forEach((pline,i) => {
                    let t = this.buildLine(pline)
                    elements.push(t[0])
                    if (i === 0) {
                        b = t[1]
                    } else {
                        b = mergeBBox(b, t[1])
                    }
                });
                return [elements, b]
            }
            case "Polygon": {
                let t = this.buildPolygon(geometry.coordinates)
                return [[t[0]], t[1]];
            }
            case "MultiPolygon": {
                geometry.coordinates.forEach((poly, i) => {
                    let t = this.buildPolygon(poly)
                    elements.push(t[0])
                    if (i === 0) {
                        b = t[1]
                    } else {
                        b = mergeBBox(b, t[1])
                    }    
                });
                
                return [elements, b]
            }
        }
    }

    /**
     * Get the bounding box of the last computed SVG. Calls to
     * `createSVG()` may change the output of this function.
     * @returns
     */
    public getBBox(): [number, number, number, number] {
        return this.bbox
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
