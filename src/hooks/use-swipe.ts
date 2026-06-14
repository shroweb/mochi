import { useCallback, useRef } from "react";

export const SECTIONS = ["now", "forecast", "alerts", "mochi"] as const;
export type Section = (typeof SECTIONS)[number];

/** Walk up the DOM from `target` to `container`.
 *  Returns true if any ancestor is horizontally scrollable with overflow content,
 *  or carries a `data-no-swipe` attribute. */
function startsInScrollableOrBlocked(target: EventTarget | null, container: Element): boolean {
  let el = target as Element | null;
  while (el && el !== container) {
    if (el.getAttribute?.("data-no-swipe") != null) return true;
    const style = window.getComputedStyle(el);
    const ox = style.overflowX;
    if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Returns touch handlers that detect a horizontal swipe and advance the
 * active section left/right.
 *
 * Ignored when:
 * - the gesture is more vertical than horizontal (user scrolling)
 * - the touch starts inside a horizontally-scrollable child element
 * - the touch starts on an element (or ancestor) with `data-no-swipe`
 */
export function useSwipe(
  current: Section,
  set: (s: Section) => void,
  threshold = 72,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const blocked = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    blocked.current = startsInScrollableOrBlocked(e.target, e.currentTarget);
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (blocked.current) return;
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
