import { FC } from "react";

// Subtle radial background behind the SVG for depth
export const Background: FC = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{ background: "radial-gradient(80% 80% at 50% 30%, rgba(255,255,255,0.06), rgba(0,0,0,0) 60%)" }}
  />
);
