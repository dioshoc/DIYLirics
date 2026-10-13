import { useEffect, useState } from 'react';

import { computeWaveformPeaks } from '../utils/audioWaveform';

export type WaveformPeaksState = {
  peaks: number[] | null;
  isLoading: boolean;
};

export const useAudioWaveformPeaks = (
  src: string | null,
  barCount = 280,
): WaveformPeaksState => {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setPeaks(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void computeWaveformPeaks(src, barCount)
      .then((nextPeaks) => {
        if (cancelled) {
          return;
        }
        setPeaks(nextPeaks);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setPeaks(null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [barCount, src]);

  return { peaks, isLoading };
};
