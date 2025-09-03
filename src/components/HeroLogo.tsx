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
    <div className={`hero-logo ${box} relative ${className}`} aria-label="QuizzViz animated hero logo">
      {/* Phase 1: Bubble creation/pulse */}
      <div className="hero-bubble phase-bubble" />

      {/* Phase 2: Processing orbit dots */}
      <div className="hero-processing phase-process">
        <div className="hero-orbit">
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* Phase 3: Logo fragments assemble */}
      <div className="hero-fragments phase-frag">
        <div className="fragment f1" />
        <div className="fragment f2" />
        <div className="fragment f3" />
        <div className="fragment f4" />
      </div>

      {/* Show a crisp base image during assembled phase so it looks perfect */}
      <img
        src="/QuizzViz-logo.png"
        alt="QuizzViz Logo"
        className="absolute inset-0 w-full h-full object-contain phase-frag"
        aria-hidden
      />
    </div>
  );
}

export default HeroLogo;
