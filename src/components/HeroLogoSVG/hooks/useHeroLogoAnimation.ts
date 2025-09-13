"use client";

import { useEffect, useRef } from "react";

// Encapsulates the animation logic and exposes refs to be attached on elements
export function useHeroLogoAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const blobRef = useRef<SVGPathElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const slicesRef = useRef<SVGGElement | null>(null);
  const spinRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const blob = blobRef.current;
    const group = groupRef.current;
    const slices = slicesRef.current;
    const spin = spinRef.current;
    if (!container || !blob || !group || !slices || !spin) return;

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
      // Configurable scale for the "big" resting state
      const BIG_SCALE = 1.32;

      // Initial state: show fully formed logo, enlarged, hold for 5s (no blob)
      spin.style.animation = "none";
      group.style.transition = "none";
      group.style.transform = `scale(${BIG_SCALE})`;
      blob.style.transition = "opacity 200ms ease";
      blob.style.opacity = "0";
      setCentered();
      await sleep(5000);

      while (!cancelled) {
        // Prepare animation
        spin.style.animation = "none";
        group.style.transition = "none";
        group.style.transform = "scale(1)";
        setOffscreen();
        void spin.getBoundingClientRect();
        slicesEls.forEach((el) => {
          el.style.transition = "transform 900ms cubic-bezier(0.2,0.6,0.2,1), opacity 300ms ease-out";
        });

        // Blob intro pulses
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

        // Bring slices together
        for (let i = 0; i < slicesEls.length; i++) {
          slicesEls[i].style.opacity = "1";
          slicesEls[i].style.transform = "translate(0px, 0px)";
          await sleep(120);
        }

        // Hide blob and spin
        blob.style.opacity = "0";
        await sleep(300);
        spin.style.animation = "svg-spin 1400ms ease-in-out forwards";
        await sleep(1500);

        // Subtle scale pop to BIG_SCALE
        group.style.transition = "transform 520ms cubic-bezier(.22,.61,.36,1)";
        group.style.transform = `scale(${BIG_SCALE})`;
        await sleep(2000);

        // Ensure fully formed enlarged state, then hold for 40 seconds (no blob)
        group.style.transition = "transform 2ms ease-out";
        group.style.transform = `scale(${BIG_SCALE})`;
        setCentered();
        blob.style.opacity = "0";

        const HOLD_AFTER_ANIMATION_MS = 20000;
        await sleep(HOLD_AFTER_ANIMATION_MS);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return { containerRef, blobRef, groupRef, slicesRef, spinRef };
}
