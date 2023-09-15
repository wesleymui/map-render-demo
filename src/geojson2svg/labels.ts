



export function getShapeName(p : GeoJSON.GeoJsonProperties) : string {

    for(let [k,v] of Object.entries(p as any)) {
        if (/.*name.*/.test(k.toLowerCase()) && /^[\x00-\x7F]*$/.test(v as string)) {
            return v as string;
        }
    }
    return "Unclaimed Territory"

}
