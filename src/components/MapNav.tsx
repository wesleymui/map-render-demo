// import { convertGeoJSON } from 'src/geojson2svg/index.ts';

// const converter = convertGeoJSON.createConverter(geoJSON)
// const svgData = converter.createSVG();

import React, { useRef, useState } from 'react';

// Define the expected props fields.
interface Props {
  svgContent: React.ReactNode; // SVG content as a React element
  width: number; // Width of the SVG container
  height: number; // Height of the SVG container
  viewBox: string; // Viewbox attribute for the SVG
}

const MapNav = ({ svgContent, width, height, viewBox }: Props) => {
  // Create a reference to the SVG element
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Define state variables for panning (pan) and zooming (zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  /**
   * Mouse drag handler for panning the SVG.
   * @param e mouse event to handle
   */
  const handleMouseDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.buttons !== 1) return; // Only handle left mouse button

    //makes sure that the movement is scaled accroding to the zoom level
    const dx = e.movementX / zoom;
    const dy = e.movementY / zoom;

    // Update pan state to adjust the position of the SVG content
    setPan({ x: pan.x + dx, y: pan.y + dy });
  };

  /**
   * Mouse wheel handler for zooming the SVG.
   * @param e mouse event to handle
   */
  const handleMouseWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    //makes sure the the svgRef is populated
    if (!svgRef.current) return;
    //cursorPoint is the mouse position within the SVG
    const cursorPoint = svgRef.current.createSVGPoint();
    cursorPoint.x = e.clientX;
    cursorPoint.y = e.clientY;

    //cursorPointMatrix is to have the cursor relateive to the SVGCoordinates
    const cursorPointMatrix = cursorPoint.matrixTransform(
      svgRef.current.getScreenCTM()!.inverse()
    );

    //zoomFactor is the amount of zooming that is done with relation to the deltaY of the mouse wheel
    const zoomFactor = Math.pow(1.1, e.deltaY * 0.01);
    const newZoom = zoom * zoomFactor;

    // Limit the zoom to a specific range (common pratice for zooming to make sure we dont over or under do it )
    setZoom(Math.min(Math.max(0.1, newZoom), 3));

    // Calculate scale delta for adjusting pan during zoom
    const scaleDelta = newZoom / zoom;

    // Calculate new pan values to keep the cursor point fixed
    const dx = (pan.x - cursorPointMatrix.x) * (1 - scaleDelta);
    const dy = (pan.y - cursorPointMatrix.y) * (1 - scaleDelta);

    // Update pan state to adjust the position of the SVG content
    setPan({ x: pan.x - dx, y: pan.y - dy });
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      ref={svgRef}
      onMouseMove={handleMouseDrag}
      onWheel={handleMouseWheel}
      style={{
        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        transformOrigin: '0 0',
      }}
    >
      {svgContent}
    </svg>
  );
};

export default MapNav;
