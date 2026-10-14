import { useEffect, useRef, useState } from 'react';

/** Smooth glow motion in preview (wall clock), anchored to synced playback time. */
export const useGlowMotionTimeSec = (
  syncedTimeSec: number,
  isAnimating: boolean,
): number => {
  const anchorRef = useRef({ timeSec: syncedTimeSec, atMs: performance.now() });
  const [motionTimeSec, setMotionTimeSec] = useState(syncedTimeSec);

  useEffect(() => {
    anchorRef.current = { timeSec: syncedTimeSec, atMs: performance.now() };
    if (!isAnimating) {
      setMotionTimeSec(syncedTimeSec);
    }
  }, [syncedTimeSec, isAnimating]);

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    let frameId = 0;
    const tick = () => {
      const { timeSec, atMs } = anchorRef.current;
      setMotionTimeSec(timeSec + (performance.now() - atMs) / 1000);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating]);

  return isAnimating ? motionTimeSec : syncedTimeSec;
};
