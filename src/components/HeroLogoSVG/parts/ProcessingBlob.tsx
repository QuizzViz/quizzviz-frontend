import React, { forwardRef } from "react";

// Pulse blob shown during the assembly phase
export const ProcessingBlob = forwardRef<SVGPathElement, {}>(function ProcessingBlob(_, ref) {
  return (
    <path
      ref={ref}
      id="processing-blob"
      fill="url(#lux-grad)"
      opacity="0"
      d="M256,96c64,0,152,32,152,104s-88,120-152,120S96,272,96,200,192,96,256,96Z"
    />
  );
});
