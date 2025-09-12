import { FC } from "react";

// Gradients and clip paths used by the animated logo
export const SvgDefs: FC = () => (
  <defs>
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
);
