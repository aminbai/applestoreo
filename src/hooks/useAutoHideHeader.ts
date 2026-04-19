import { useEffect, useRef, useState } from "react";

/**
 * Auto-hide a sticky header on scroll-down, reveal on scroll-up.
 * Returns a ref to attach to the scrollable container, plus `hidden` boolean.
 * If no container is provided/attached, falls back to window scroll.
 */
export function useAutoHideHeader<T extends HTMLElement = HTMLDivElement>(threshold = 10) {
  const containerRef = useRef<T | null>(null);
  const lastScrollY = useRef(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target: HTMLElement | Window = containerRef.current ?? window;

    const getY = () =>
      target instanceof Window ? window.scrollY : (target as HTMLElement).scrollTop;

    lastScrollY.current = getY();

    const onScroll = () => {
      const currentY = getY();
      const diff = currentY - lastScrollY.current;

      if (currentY < 40) {
        setHidden(false);
      } else if (diff > threshold) {
        setHidden(true);
        lastScrollY.current = currentY;
      } else if (diff < -threshold) {
        setHidden(false);
        lastScrollY.current = currentY;
      }
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { containerRef, hidden };
}
