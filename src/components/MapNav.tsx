import React, { useEffect, useRef, useState } from 'react';

// Define the expected props fields.
interface Props {
  svgContent: React.ReactNode[]; // SVG content as a React element
  width: number; // Width of the SVG container
  height: number; // Height of the SVG container
  initialViewBox: string; // Initial viewBox attribute for the SVG
}

// this is to check if this is a rerender or a map change
let lastMapElements: React.ReactNode[] = []


const MapNav = ({ svgContent, width, height, initialViewBox }: Props) => {
  const initialViewBoxArray = initialViewBox.split(' ');
  const initialViewBoxX = parseFloat(initialViewBoxArray[0]);
  const initialViewBoxY = parseFloat(initialViewBoxArray[1]);
  const initialViewBoxWidth = parseFloat(initialViewBoxArray[2]);
  const initialViewBoxHeight = parseFloat(initialViewBoxArray[3]);
  let svgRef = useRef<SVGSVGElement|null>(null)

  // Compute the initial viewBox value

  // Define state variables for viewBox, zoom, and pan
  let initialFactor = Math.max(initialViewBoxWidth, initialViewBoxHeight)
  const [viewBox, setViewBox] = useState(`${initialViewBoxX} ${initialViewBoxY} ${initialFactor} ${initialFactor}`);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({
    x: initialViewBoxX,
    y: initialViewBoxY,
  });
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleMouseWheel = (e: WheelEvent) => {
    const cursorPointX = e.offsetX;
    const cursorPointY = e.offsetY;

    const zoomFactor = Math.pow(1.05, e.deltaY * -0.01);

    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 3);

    const viewBoxWidth = getViewBoxWidth();
    const viewBoxHeight = getViewBoxHeight();

    const oldPointXInViewBox = (cursorPointX * viewBoxWidth) / width;
    const oldPointYInViewBox = (cursorPointY * viewBoxHeight) / height;

    const newPointXInViewBox =
      (cursorPointX * (viewBoxWidth / newZoom)) / width;
    const newPointYInViewBox =
      (cursorPointY * (viewBoxHeight / newZoom)) / height;

    const deltaX = newPointXInViewBox - oldPointXInViewBox;
    const deltaY = newPointYInViewBox - oldPointYInViewBox;

    const newX = getViewBoxX() - deltaX;
    const newY = getViewBoxY() - deltaY;

    setZoom(1);
    setPan({ x: newX, y: newY });
    setViewBox(
      `${newX} ${newY} ${viewBoxWidth / newZoom} ${viewBoxHeight / newZoom}`
    );
  };

  const getViewBoxX = (): number => {
    if (viewBox) {
      const viewBoxArray = viewBox.split(' ');
      return parseFloat(viewBoxArray[0]);
    }
    return 0;
  };

  const getViewBoxY = (): number => {
    if (viewBox) {
      const viewBoxArray = viewBox.split(' ');
      return parseFloat(viewBoxArray[1]);
    }
    return 0;
  };

  const getViewBoxWidth = (): number => {
    if (viewBox) {
      const viewBoxArray = viewBox.split(' ');
      return parseFloat(viewBoxArray[2]);
    }
    return width;
  };

  const getViewBoxHeight = (): number => {
    if (viewBox) {
      const viewBoxArray = viewBox.split(' ');
      return parseFloat(viewBoxArray[3]);
    }
    return height;
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only handle the left mouse button
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setPanStart(null);
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panStart) {
      //how much did we move relative to the last panStart
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      //new pan x and y based on the delta mouse move and the zoom level
      let currvb = viewBox.split(" ").map(x => parseFloat(x))
      const panScalingFactorX = currvb[2] / width;
      const panScalingFactorY = currvb[3] / height;
      // console.log('Pan scaling factor', panScalingFactorX, panScalingFactorY);

      const newX = pan.x - (dx/zoom ) * panScalingFactorX
      const newY = pan.y - (dy/zoom ) * panScalingFactorY

      // console.log('Mouse location', newX, newY);

      setPan({ x: newX, y: newY });

      setViewBox(`${newX} ${newY} ${getViewBoxWidth()} ${getViewBoxHeight()}`);

      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  useEffect(() => {
    if (svgRef.current === null) {
      return
    }
    svgRef.current.addEventListener("wheel", (e) => {
      e.preventDefault()
      e.stopPropagation()
      handleMouseWheel(e)
      return false
    }, {passive: false})

  })


  useEffect(() => {
    let el = svgRef.current
    if (el && svgContent != lastMapElements) {
      setViewBox(`${initialViewBoxX} ${initialViewBoxY} ${initialFactor} ${initialFactor}`)
      setPan({
        x: initialViewBoxX,
        y: initialViewBoxY,
      })
      lastMapElements = svgContent
    }
  })


  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      ref={svgRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ 
        cursor: panStart ? 'grabbing' : 'grab',
        width: `${width}px`,
        height: `${height}px`
      }}
      
    >
      {svgContent}
    </svg>
  );
};

export default MapNav;
