import { useEffect, useRef, useState } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import "./style.scss";

const PULL_THRESHOLD = 78;
const MAX_PULL_DISTANCE = 112;

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const trackingRef = useRef(false);
  const distanceRef = useRef(0);

  useEffect(() => {
    const canStartPull = (target) => {
      if (window.scrollY > 0 || refreshing) {
        return false;
      }

      return !target.closest(
        "input, textarea, select, button, a, [contenteditable='true']"
      );
    };

    const updateDistance = (distance) => {
      distanceRef.current = distance;
      setPullDistance(distance);
    };

    const refreshApp = async () => {
      setRefreshing(true);
      updateDistance(PULL_THRESHOLD);

      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map((registration) => registration.update())
          );
        }
      } catch {
        // reload anyway
      }

      const url = new URL(window.location.href);
      url.searchParams.set("gfcc_refresh", Date.now().toString());
      window.location.replace(url.toString());
    };

    const handleTouchStart = (event) => {
      const target = event.target;

      if (!canStartPull(target)) {
        trackingRef.current = false;
        return;
      }

      startYRef.current = event.touches[0].clientY;
      trackingRef.current = true;
      updateDistance(0);
    };

    const handleTouchMove = (event) => {
      if (!trackingRef.current || refreshing) {
        return;
      }

      const deltaY = event.touches[0].clientY - startYRef.current;

      if (deltaY <= 0 || window.scrollY > 0) {
        updateDistance(0);
        trackingRef.current = false;
        return;
      }

      const nextDistance = Math.min(MAX_PULL_DISTANCE, deltaY * 0.58);

      if (nextDistance > 8) {
        event.preventDefault();
      }

      updateDistance(nextDistance);
    };

    const handleTouchEnd = () => {
      if (!trackingRef.current || refreshing) {
        return;
      }

      trackingRef.current = false;

      if (distanceRef.current >= PULL_THRESHOLD) {
        refreshApp();
        return;
      }

      updateDistance(0);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [refreshing]);

  if (pullDistance <= 0 && !refreshing) {
    return null;
  }

  const ready = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      className={`pull-refresh ${ready ? "ready" : ""} ${refreshing ? "refreshing" : ""}`}
      style={{ "--pull-distance": `${pullDistance}px` }}
      aria-live="polite"
    >
      <div className="pull-refresh-indicator">
        <RefreshRoundedIcon fontSize="inherit" />
      </div>
      <span>
        {refreshing
          ? "Обновление..."
          : ready
            ? "Отпустите, чтобы обновить"
            : "Потяните вниз для обновления"}
      </span>
    </div>
  );
}
