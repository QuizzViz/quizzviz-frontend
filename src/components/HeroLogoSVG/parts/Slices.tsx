import React, { forwardRef } from "react";

// Renders the final assembled logo using 4 clipped PNG slices
export const Slices = forwardRef<{
  group: SVGGElement | null;
  spin: SVGGElement | null;
  slices: SVGGElement | null;
}, { groupRef: React.Ref<SVGGElement>; spinRef: React.Ref<SVGGElement>; slicesRef: React.Ref<SVGGElement> }>(
  function Slices(_, __) {
    // This component is ref-only; actual refs are attached at usage site via props
    return null;
  }
) as any;

// Concrete component that actually renders DOM with attached refs
export function SlicesContent({ groupRef, spinRef, slicesRef }: { groupRef: React.Ref<SVGGElement>; spinRef: React.Ref<SVGGElement>; slicesRef: React.Ref<SVGGElement> }) {
  return (
    <g ref={groupRef as any} id="logo-group" style={{ transformOrigin: "256px 256px" }}>
      <g ref={spinRef as any} id="spin-wrapper" style={{ transformOrigin: "256px 256px" }}>
        <g ref={slicesRef as any} id="logo-slices">
          <g id="slice-left">
            <image href="/QuizzViz-logo.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" clipPath="url(#clip-left)" />
          </g>
          <g id="slice-right">
            <image href="/QuizzViz-logo.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" clipPath="url(#clip-right)" />
          </g>
          <g id="slice-top">
            <image href="/QuizzViz-logo.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" clipPath="url(#clip-top)" />
          </g>
          <g id="slice-bottom">
            <image href="/QuizzViz-logo.png" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" clipPath="url(#clip-bottom)" />
          </g>
        </g>
      </g>
    </g>
  );
}
