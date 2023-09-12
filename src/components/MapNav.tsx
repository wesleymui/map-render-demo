import React, { useState } from 'react';

// Define the expected props fields.
interface Props {
  svgContent: React.ReactNode[]; // SVG content as a React element
  width: number; // Width of the SVG container
  height: number; // Height of the SVG container
  initialViewBox: string; // Initial viewBox attribute for the SVG
}

const MapNav = ({ svgContent, width, height, initialViewBox }: Props) => {
  const initialViewBoxArray = initialViewBox.split(' ');
  const initialViewBoxX = parseFloat(initialViewBoxArray[0]);
  const initialViewBoxY = parseFloat(initialViewBoxArray[1]);
  const initialViewBoxWidth = parseFloat(initialViewBoxArray[2]);
  const initialViewBoxHeight = parseFloat(initialViewBoxArray[3]);

  // Compute the initial viewBox value

  // Define state variables for viewBox, zoom, and pan
  const [viewBox, setViewBox] = useState(initialViewBox);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({
    x: initialViewBoxX,
    y: initialViewBoxY,
  });
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleMouseWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const cursorPointX = e.nativeEvent.offsetX;
    const cursorPointY = e.nativeEvent.offsetY;

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
      const panScalingFactorX = initialViewBoxWidth / width;
      const panScalingFactorY = initialViewBoxHeight / height;
      // console.log('Pan scaling factor', panScalingFactorX, panScalingFactorY);

      const newX = pan.x - (dx / zoom) * panScalingFactorX;
      const newY = pan.y - (dy / zoom) * panScalingFactorY;

      // console.log('Mouse location', newX, newY);

      setPan({ x: newX, y: newY });

      setViewBox(`${newX} ${newY} ${getViewBoxWidth()} ${getViewBoxHeight()}`);

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
