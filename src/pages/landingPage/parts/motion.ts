import { Variants } from "framer-motion";

// Hallmark · redesign v3 · macrostructure: Bento Grid · genre: modern-minimal
// (dark variant — Vercel / Linear / YC-startup register) · brand gradient
// (green #22c55e → blue #3b82f6 → purple #a855f7) and pure-black paper are
// explicit, user-directed overrides of the genre's default light-paper /
// no-gradient-text rules — this is the QuizzViz logo colour, used through
// the whole codebase, not a generated gradient. Every other colour value on
// the page is unchanged from the previous pass. Real interactivity via
// framer-motion, already a project dependency.

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// Restrained, opacity-only reveal — used where a page already has motion
// elsewhere (a drawn connector, a hover state) and doesn't need a second
// fade+slide on top of it.
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

export const viewportOnce = { once: true, margin: "-80px" };

// Shared brand gradient classes — reproduce the exact site gradient
// (linear-gradient(135deg, #22c55e, #3b82f6)) plus a purple third stop for
// hero / CTA moments, using only standard Tailwind color utilities.
export const brand = {
  textGradient: "gradient-text", // defined in globals.css — reused, not redeclared
  bgGradient: "bg-gradient-to-br from-green-500 to-blue-500",
  bgGradientTriple: "bg-gradient-to-br from-green-500 via-blue-500 to-purple-500",
  ring: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
};
