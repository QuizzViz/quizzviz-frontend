"use client";

import React from "react";
import { HeroLogo } from "@/components/HeroLogo";

export type HeroLogoWebGLProps = {
  size?: number;
  textureSrc?: string;
  rows?: number;
  cols?: number;
  className?: string;
};

// Temporary stub to prevent build errors when '@react-three/fiber' and 'three' are not installed.
// Renders the CSS-based HeroLogo so the app works. Once dependencies are installed,
// this file can be replaced with the WebGL implementation again.
export function HeroLogoWebGL({ size = 480, className = "" }: HeroLogoWebGLProps) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: px, height: px }}>
      <HeroLogo size="xl" />
    </div>
  );
}

export default HeroLogoWebGL;
