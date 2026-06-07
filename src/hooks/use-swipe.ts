import { useCallback, useRef } from "react";

export const SECTIONS = ["now", "forecast", "alerts", "mochi"] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * Returns touch handlers that detect a horizontal swipe and advance the
 * active section left/right. Vertical scrolling is ignored.
 */
export function useSwipe(
  current: Section,
  set: (s: Section) => void,
  threshold = 65,
) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Ignore if more vertical than horizontal (user scrolling)
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < threshold) return;

      const idx = SECTIONS.indexOf(current);
      if (dx < 0 && idx < SECTIONS.length - 1) set(SECTIONS[idx + 1]); // swipe left  → next
      if (dx > 0 && idx > 0) set(SECTIONS[idx - 1]);                   // swipe right → prev
    },
    [current, set, threshold],
  );

  return { onTouchStart, onTouchEnd };
}
