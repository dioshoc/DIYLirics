import { useEffect, useRef, useState } from 'react';

export const useAudioDrivenTimeSec = (
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isPlaying: boolean,
  syncedTimeSec: number,
): number => {
  const [rafTimeSec, setRafTimeSec] = useState(syncedTimeSec);
  const syncedRef = useRef(syncedTimeSec);

  useEffect(() => {
    syncedRef.current = syncedTimeSec;
    if (!isPlaying) {
      setRafTimeSec(syncedTimeSec);
    }
  }, [syncedTimeSec, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let frameId = 0;
    const tick = () => {
      const audio = audioRef.current;
      const next = audio ? audio.currentTime : syncedRef.current;
      setRafTimeSec(next);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [audioRef, isPlaying]);

  return isPlaying ? rafTimeSec : syncedTimeSec;
};
