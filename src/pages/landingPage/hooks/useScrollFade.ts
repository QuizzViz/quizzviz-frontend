import { useEffect, useRef } from "react";

// Sets up an IntersectionObserver to toggle `.visible` on elements with `.scroll-fade`
function useScrollFade() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Delay enabling fade-ins so they don't happen immediately on load
    const enableDelayMs = 2000; // adjust as desired

    const options: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const toUnregister = new Set<Element>();

    const setupObserver = () => {
      observerRef.current = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !toUnregister.has(entry.target)) {
            // Add visible once, then stop observing so it won't fade again
            entry.target.classList.add("visible");
            toUnregister.add(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, options);

      // Observe all fade targets after the delay
      document
        .querySelectorAll(".scroll-fade")
        .forEach((el) => observerRef.current?.observe(el));
    };

    const timer = window.setTimeout(setupObserver, enableDelayMs);

    return () => {
      window.clearTimeout(timer);
      observerRef.current?.disconnect();
      toUnregister.clear();
    };
  }, []);
}

export default useScrollFade
