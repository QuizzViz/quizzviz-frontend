import React from "react";

interface HeroLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap: Record<NonNullable<HeroLogoProps["size"]>, string> = {
  sm: "w-24 h-24",
  md: "w-36 h-36",
  lg: "w-48 h-48",
  xl: "w-64 h-64",
};

export function HeroLogo({ size = "lg", className = "" }: HeroLogoProps) {
  const box = sizeMap[size];

  return (
    <div className={`hero-logo tilt ${box} relative ${className}`} aria-label="QuizzViz animated hero logo">
      {/* Phase 1: Bubble creation/pulse */}
      <div className="hero-bubble" aria-hidden />

      {/* Phase 2: Processing orbit dots (brief, understated) */}
      <div className="hero-processing" aria-hidden>
        <div className="hero-orbit">
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* Energy trails sweeping in from sides */}
      <div className="hero-trails" aria-hidden>
        <i className="trail t1" />
        <i className="trail t2" />
        <i className="trail t3" />
      </div>

      {/* Phase 3: transient fragments converge, then vanish */}
      <div className="hero-fragments" aria-hidden>
        <div className="fragment f1" />
        <div className="fragment f2" />
        <div className="fragment f3" />
        <div className="fragment f4" />
      </div>

      {/* Final, single crisp logo */}
      <img
        src="/QuizzViz-logo.png"
        alt="QuizzViz Logo"
        className="final-logo"
      />

      {/* Shine sweep across the final logo */}
      <div className="logo-shine" aria-hidden />
    </div>
  );
}

export default HeroLogo;
