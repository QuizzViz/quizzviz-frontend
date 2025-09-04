"use client";

import React, { useEffect, useRef } from "react";

type HeroLogoSVGProps = {
  size?: number | string; // px or CSS size (e.g., "100%")
  className?: string;
};

export function HeroLogoSVG({ size = 800, className = "" }: HeroLogoSVGProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const blobRef = useRef<SVGPathElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const slicesRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const blob = blobRef.current;
    const group = groupRef.current;
    const slices = slicesRef.current;
    if (!container || !blob || !group || !slices) return;

    // Respect reduced motion
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slicesEls = [
      slices.querySelector<SVGGElement>("#slice-left"),
      slices.querySelector<SVGGElement>("#slice-right"),
      slices.querySelector<SVGGElement>("#slice-top"),
      slices.querySelector<SVGGElement>("#slice-bottom"),
    ].filter(Boolean) as SVGGElement[];

    const setOffscreen = () => {
      const offset = 320;
      const [left, right, top, bottom] = slicesEls;
      [left, right, top, bottom].forEach((el) => {
        if (!el) return;
        el.style.transition = "none";
        el.style.opacity = "0";
      });
      if (left) left.style.transform = `translate(${-offset}px, 0px)`;
      if (right) right.style.transform = `translate(${offset}px, 0px)`;
      if (top) top.style.transform = `translate(0px, ${-offset}px)`;
      if (bottom) bottom.style.transform = `translate(0px, ${offset}px)`;
    };

    const setCentered = () => {
      slicesEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "translate(0px, 0px)";
      });
    };

    if (reduce) {
      blob.style.opacity = "0";
      setCentered();
      return;
    }

    let cancelled = false;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (!cancelled) {
        // Reset state
        group.style.animation = "none";
        setOffscreen();
        // force reflow to apply 'transition: none' before enabling transitions
        void group.getBoundingClientRect();
        slicesEls.forEach((el) => {
          el.style.transition = "transform 900ms cubic-bezier(0.2,0.6,0.2,1), opacity 300ms ease-out";
        });

        // Initial short pause before starting the sequence so users can orient
        await sleep(400);

        // Phase 1: Blob processing (scale/opacity pulse ~1.2s)
        blob.style.transition = "transform 600ms ease-in-out, opacity 600ms ease-in-out, filter 600ms ease-in-out";
        blob.style.opacity = "0.9";
        blob.style.transformOrigin = "256px 256px";
        blob.style.transform = "scale(1)";
        blob.style.filter = "blur(0px)";
        await sleep(50);
        blob.style.transform = "scale(1.08)";
        blob.style.filter = "blur(2px)";
        await sleep(600);
        blob.style.transform = "scale(0.96)";
        blob.style.filter = "blur(1px)";
        await sleep(500);

        // Phase 2: Slices assemble with stagger (~1s)
        for (let i = 0; i < slicesEls.length; i++) {
          slicesEls[i].style.opacity = "1";
          slicesEls[i].style.transform = "translate(0px, 0px)";
          await sleep(120);
        }

        // Fade blob
        blob.style.opacity = "0";
        await sleep(300);

        // Phase 3: Rotate full logo (1.4s)
        group.style.animation = "svg-spin 1400ms ease-in-out forwards";
        await sleep(1500);

        // Pause with completed logo visible to let users process the animation
        await sleep(2000);

        // Reverse: reset slices offscreen and show blob again for next cycle
        blob.style.opacity = "0.9";
        setOffscreen();
        await sleep(300);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const px = typeof size === "number" ? `${size}px` : size;

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: px, height: px, lineHeight: 0 }}>
      {/* Minimal luxury background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(80% 80% at 50% 30%, rgba(255,255,255,0.06), rgba(0,0,0,0) 60%)",
      }} />

      <svg
        viewBox="0 0 512 512"
        width={px}
        height={px}
        className="absolute inset-0 m-auto"
        style={{ display: "block", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.35))" }}
        role="img"
        aria-label="QuizzViz animated logo"
      >
        {/* Processing blob (placeholder shape) */}
        <path
          ref={blobRef}
          id="processing-blob"
          fill="url(#lux-grad)"
          opacity="0.9"
          d="M256,96c64,0,152,32,152,104s-88,120-152,120S96,272,96,200,192,96,256,96Z"
        />

        {/* Final assembled logo using exact PNG colors via slices */}
        <g ref={groupRef} id="logo-group" style={{ transformOrigin: "256px 256px" }}>
          <g ref={slicesRef} id="logo-slices">
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

        <defs>
          {/* Clip paths to slice the PNG into 4 parts that animate from each side */}
          <clipPath id="clip-left" clipPathUnits="userSpaceOnUse">
            <rect x="0" y="0" width="256" height="512" />
          </clipPath>
          <clipPath id="clip-right" clipPathUnits="userSpaceOnUse">
            <rect x="256" y="0" width="256" height="512" />
          </clipPath>
          <clipPath id="clip-top" clipPathUnits="userSpaceOnUse">
            <rect x="0" y="0" width="512" height="256" />
          </clipPath>
          <clipPath id="clip-bottom" clipPathUnits="userSpaceOnUse">
            <rect x="0" y="256" width="512" height="256" />
          </clipPath>
          <radialGradient id="lux-grad" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <style>{`
        @keyframes svg-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default HeroLogoSVG;
