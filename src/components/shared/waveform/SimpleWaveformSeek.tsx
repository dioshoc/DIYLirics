import { useRef } from 'react';

import { usePointerTimelineSeek } from '../../../hooks/usePointerTimelineSeek';
import { clampTime } from '../../../utils/time';
import { WaveformBars } from './WaveformBars';
import styles from './ClipRangeTimeline.module.scss';

type SimpleWaveformSeekProps = {
  durationSec: number;
  playheadSec: number;
  peaks: number[] | null;
  isWaveformLoading?: boolean;
  onSeek: (timeSec: number) => void;
};

export const SimpleWaveformSeek = ({
  durationSec,
  playheadSec,
  peaks,
  isWaveformLoading = false,
  onSeek,
}: SimpleWaveformSeekProps) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const {
    handleSeekPointerDown,
    handleSeekPointerMove,
    handleSeekPointerEnd,
    handleSeekPointerCancel,
  } = usePointerTimelineSeek(trackRef, durationSec, onSeek);

  const playheadPercent =
    durationSec > 0 ? clampTime(playheadSec / durationSec, 0, 1) * 100 : 0;

  return (
    <div
      ref={trackRef}
      className={styles.track}
      role="slider"
      aria-label="Seek position"
      aria-valuemin={0}
      aria-valuemax={durationSec}
      aria-valuenow={playheadSec}
      tabIndex={0}
      onPointerDown={handleSeekPointerDown}
      onPointerMove={handleSeekPointerMove}
      onPointerUp={handleSeekPointerEnd}
      onPointerCancel={handleSeekPointerCancel}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 5 : 1;
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          onSeek(playheadSec - step);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          onSeek(playheadSec + step);
        }
      }}
    >
      <div className={styles.waveformLayer}>
        <WaveformBars peaks={peaks} isLoading={isWaveformLoading} />
      </div>
      <div
        className={styles.playhead}
        data-playhead="true"
        style={{ left: `${playheadPercent}%` }}
        aria-hidden
      />
    </div>
  );
};
