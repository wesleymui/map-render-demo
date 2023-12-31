



export function getShapeName(p : GeoJSON.GeoJsonProperties) : string {

    for(let [k,v] of Object.entries(p as any)) {
        if (typeof v !== "string" || v.length == 0) {
            continue
        }
        if (/.*name.*/.test(k.toLowerCase()) && /^[\x00-\x7F]*$/.test(v as string)) {
            return v as string;
        }
    }
    return "Unclaimed Territory"

}
