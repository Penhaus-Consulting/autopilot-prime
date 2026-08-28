import { useEffect, useRef, useState } from "react";

/**
 * Custom pull-to-refresh hook for mobile.
 * Detects a downward drag at the top of the page (scrollY === 0)
 * and invokes `onRefresh` when the pull exceeds the threshold.
 * Returns { distance, refreshing } for visual feedback.
 */
export function usePullToRefresh(onRefresh, { threshold = 70, maxPull = 100 } = {}) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;
  refreshingRef.current = refreshing;

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) {
        pulling.current = false;
        return;
      }
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        distanceRef.current = 0;
        setDistance(0);
        return;
      }
      const d = Math.min(delta * 0.5, maxPull);
      distanceRef.current = d;
      setDistance(d);
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (distanceRef.current >= threshold) {
        setRefreshing(true);
        setDistance(threshold);
        distanceRef.current = threshold;
        try {
          await onRefreshRef.current();
        } finally {
          setRefreshing(false);
          setDistance(0);
          distanceRef.current = 0;
        }
      } else {
        setDistance(0);
        distanceRef.current = 0;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [threshold, maxPull]);

  return { distance, refreshing };
}