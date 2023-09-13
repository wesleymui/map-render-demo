

export type SVGBBox = [x:number, y : number, w : number, h : number]

export function addPointToLocalBBox(x: number, y : number, b  : SVGBBox) {
    b[0] = Math.min(b[0], x)
    b[1] = Math.min(b[1], y)
    b[2] = Math.max(b[2], x- b[0])
    b[3] = Math.max(b[3], y-b[1])
}

export function mergeBBox(...boxes : [SVGBBox, ...[SVGBBox] ]) : SVGBBox {
    // this is top left bottom right
    let box : SVGBBox = boxes[0]
    for (let b of boxes) {
        let l = Math.min(box[0], b[0])
        let t = Math.min(box[1], b[1])
        let r = Math.max(box[0] + box[2], b[0] + b[2])
        let bot = Math.max(box[1] + box[3], b[1] + b[3])
        box = [
            l, t, r-l, bot-t
        ]
    }
    return box
}


// export interface ShapeData {
//     id : string,
//     name: string,
//     bbox: SVGBBox
// }