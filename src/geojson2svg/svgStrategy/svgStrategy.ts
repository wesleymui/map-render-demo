import { Converter } from "../strategy";
import { GeoJSON } from "geojson";
import { isGeometry, isGeometryCollection } from "../utility";

class SVGStrategy extends Converter {
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

    private svgOfGeometry(geometry: GeoJSON.Geometry): Array<JSX.Element> {
        if (isGeometryCollection(geometry)) {
            return geometry.geometries.map((g) => this.svgOfGeometry(g)).flat();
        }
        switch (geometry.type) {
            case "Point": {
                throw new Error("Unimplemented Point");
                break;
            }
            case "MultiPoint": {
                throw new Error("Unimplemented MultiPoint");

                break;
            }
            case "LineString": {
                throw new Error("Unimplemented LineString");

                break;
            }
            case "MultiLineString": {
                throw new Error("Unimplemented MultiLineString");

                break;
            }
            case "Polygon": {
                throw new Error("Unimplemented Polygon");

                break;
            }
            case "MultiPolygon": {
                throw new Error("Unimplemented MultiPolygon");

                break;
            }
        }
    }
}
