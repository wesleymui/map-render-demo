import React, { useState } from 'react';

// Define the expected props fields.
interface Props {
  svgContent: React.ReactNode[]; // SVG content as a React element
  width: number; // Width of the SVG container
  height: number; // Height of the SVG container
  initialViewBox?: string; // Initial viewBox attribute for the SVG (optional)
}

const MapNav = ({ svgContent, width, height, initialViewBox }: Props) => {
  // Compute the initial viewBox value
  const initialViewBoxValue = initialViewBox || `0 0 ${width} ${height}`;

  // Define state variables for viewBox, zoom, and pan
  const [viewBox, setViewBox] = useState(initialViewBoxValue);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleMouseWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    // Get the mouse cursor's x and y coordinates relative to the SVG element
    const cursorPointX = e.nativeEvent.offsetX;
    const cursorPointY = e.nativeEvent.offsetY;

    //calculate  the new zoom factor based on the wheel deltaY. negated because we want to make sure that zooming in is bigger etc.
    const zoomFactor = Math.pow(1.1, e.deltaY * -0.01);

    //Restrict the zoom level to be between 0.1 and 3 so we dont get too small or too big.
    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 3);

    //calcthe point under the cursor for the current zoom level.
    const oldScaledX = cursorPointX / zoom;
    const oldScaledY = cursorPointY / zoom;

    //calc the point under the cursor for the new zoom level.
    const newScaledX = cursorPointX / newZoom;
    const newScaledY = cursorPointY / newZoom;

    //calc the difference in x and y between the old and new zoom levels.
    //this will help us adjust the pan to make zooming focus around the cursor.
    const deltaX = newScaledX - oldScaledX;
    const deltaY = newScaledY - oldScaledY;

    //ADjust the pan to make sure that we take in count the mouse cursor + zoom
    const newX = pan.x - deltaX;
    const newY = pan.y - deltaY;

    setZoom(newZoom);

    //update the pan state with the new pan x and y values.
    setPan({ x: newX, y: newY });

    //set the new width and height of the viewBox based on the new zoom level.
    const viewBoxWidth = width / newZoom;
    const viewBoxHeight = height / newZoom;

    setViewBox(`${newX} ${newY} ${viewBoxWidth} ${viewBoxHeight}`);
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
      const newX = pan.x - dx / zoom;
      const newY = pan.y - dy / zoom;

      console.log('Mouse location', newX, newY);

      setPan({ x: newX, y: newY });

      const viewBoxWidth = width / zoom;
      const viewBoxHeight = height / zoom;
      setViewBox(`${newX} ${newY} ${viewBoxWidth} ${viewBoxHeight}`);

      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      onWheel={handleMouseWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ cursor: panStart ? 'grabbing' : 'grab' }}
    >
      {svgContent}
    </svg>
  );
};

export default MapNav;
