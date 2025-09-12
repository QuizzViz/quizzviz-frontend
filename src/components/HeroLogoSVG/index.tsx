"use client";

import React from "react";
import { useHeroLogoAnimation } from "./hooks/useHeroLogoAnimation";
import { Background } from "./parts/Background";
import { SvgDefs } from "./parts/SvgDefs";
import { ProcessingBlob } from "./parts/ProcessingBlob";
import { SlicesContent } from "./parts/Slices";

export type HeroLogoSVGProps = { size?: number | string; className?: string };

// Composes the animated logo SVG using small parts and a hook for effects
export default function HeroLogoSVG({ size = 800, className = "" }: HeroLogoSVGProps) {
  const { containerRef, blobRef, groupRef, slicesRef, spinRef } = useHeroLogoAnimation();
  const px = typeof size === "number" ? `${size}px` : size;

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: px, height: px, lineHeight: 0 }}>
      <Background />
      <svg
        viewBox="0 0 512 512"
        width={px}
        height={px}
        className="absolute inset-0 m-auto"
        style={{ display: "block", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.35))" }}
        role="img"
        aria-label="QuizzViz animated logo"
      >
        <ProcessingBlob ref={blobRef} />
        <g id="logo-group" style={{ transformOrigin: "256px 256px" }}>
          <g id="spin-wrapper" style={{ transformOrigin: "256px 256px" }}>
            <SlicesContent groupRef={groupRef} spinRef={spinRef} slicesRef={slicesRef} />
          </g>
        </g>
        <SvgDefs />
      </svg>
      <style>{`@keyframes svg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
