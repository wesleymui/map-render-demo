import React, { useState } from 'react';

// Define the expected props fields.
interface Props {
  svgContent: React.ReactNode; // SVG content as a React element
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
    const cursorPointX = e.nativeEvent.offsetX / zoom;
    const cursorPointY = e.nativeEvent.offsetY / zoom;

    // Calculate the new zoom value, based on how much the scroll wheel was turned
    const zoomFactor = Math.pow(1.1, e.deltaY * 0.01);
    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 3);

    // Calculate the new viewBox values while respecting the cursor as the pivot
    const newX = cursorPointX - (cursorPointX - pan.x) * zoomFactor;
    const newY = cursorPointY - (cursorPointY - pan.y) * zoomFactor;

    // Calculate the bounds of the content based on the newZoom
    const contentWidth = width / newZoom;
    const contentHeight = height / newZoom;

    // Ensure the content stays within the bounds of the SVG container
    const maxPanX = width - contentWidth;
    const maxPanY = height - contentHeight;

    // Update pan and zoom while respecting the bounds
    setZoom(newZoom);
    setPan({
      x: Math.min(Math.max(newX, maxPanX), 0),
      y: Math.min(Math.max(newY, maxPanY), 0),
    });

    const viewBoxWidth = width / newZoom;
    const viewBoxHeight = height / newZoom;

    // Fix the typo here: `${newY}` should be `${newX}`
    setViewBox(`${pan.x} ${pan.y} ${viewBoxWidth} ${viewBoxHeight}`);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only handle left mouse button
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setPanStart(null);
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      const newX = pan.x - dx / zoom;
      const newY = pan.y - dy / zoom;

      // Calculate the bounds of the content based on the current zoom
      const contentWidth = width / zoom;
      const contentHeight = height / zoom;

      // Ensure the content stays within the bounds of the SVG container
      const maxPanX = width - contentWidth;
      const maxPanY = height - contentHeight;

      // Update pan while respecting the bounds
      setPan({
        x: Math.min(Math.max(newX, maxPanX), 0),
        y: Math.min(Math.max(newY, maxPanY), 0),
      });

      const viewBoxWidth = width / zoom;
      const viewBoxHeight = height / zoom;
      setViewBox(`${pan.x} ${pan.y} ${viewBoxWidth} ${viewBoxHeight}`);
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
