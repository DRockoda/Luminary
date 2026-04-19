import { useCallback, useRef, type TouchEvent } from "react";

const THRESHOLD = 50;

export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const startX = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.changedTouches[0]?.clientX ?? 0;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const dx = endX - startX.current;
      if (dx < -THRESHOLD) onSwipeLeft?.();
      else if (dx > THRESHOLD) onSwipeRight?.();
    },
    [onSwipeLeft, onSwipeRight],
  );

  return { onTouchStart, onTouchEnd };
}
