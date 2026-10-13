import { useCallback, useEffect, useRef, useState } from 'react';

import { useAudioWaveformPeaks } from '../../hooks/useAudioWaveformPeaks';
import { ClipRangeTimeline } from '../shared/ClipRangeTimeline';
import { SimpleWaveformSeek } from '../shared/SimpleWaveformSeek';
import { formatTimeSec } from '../../utils/time';
import { clampTiktokClipSettings } from '../../utils/tiktokExportWindow';
import styles from './AudioPlayer.module.scss';

export type AudioPlayerClipConfig = {
  contentEndSec: number;
  clipStartSec: number;
  clipDurationSec: number;
  onClipWindowChange: (startSec: number, durationSec: number) => void;
};

type AudioPlayerProps = {
  src: string | null;
  onDuration: (durationSec: number) => void;
  onTimeUpdate?: (timeSec: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  audioRefExternal?: React.RefObject<HTMLAudioElement | null>;
  embedded?: boolean;
  clipConfig?: AudioPlayerClipConfig | null;
};

export const AudioPlayer = ({
  src,
  onDuration,
  onTimeUpdate,
  onPlayingChange,
  audioRefExternal,
  embedded = false,
  clipConfig = null,
}: AudioPlayerProps) => {
  const internalRef = useRef<HTMLAudioElement>(null);
  const audioRef = audioRefExternal ?? internalRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(null);

  const clipWindow = clipConfig
    ? clampTiktokClipSettings(
        clipConfig.contentEndSec,
        clipConfig.clipDurationSec,
        clipConfig.clipStartSec,
      )
    : null;

  const clipStartSec = clipWindow?.clipStartSec ?? 0;
  const clipEndSec = clipWindow
    ? clipWindow.clipStartSec + clipWindow.clipDurationSec
    : null;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentSec(0);
    setDurationSec(null);
    onPlayingChange?.(false);
    onTimeUpdate?.(0);
  }, [onPlayingChange, onTimeUpdate, src]);

  const seekTo = useCallback(
    (timeSec: number) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      const maxSeek = durationSec ?? timeSec;
      const next = Math.min(Math.max(0, timeSec), maxSeek);
      audio.currentTime = next;
      setCurrentSec(next);
      onTimeUpdate?.(next);
    },
    [audioRef, clipConfig?.contentEndSec, durationSec, onTimeUpdate],
  );

  const pauseAtClipEnd = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || clipEndSec === null) {
      return;
    }
    audio.pause();
    audio.currentTime = clipEndSec;
    setCurrentSec(clipEndSec);
    onTimeUpdate?.(clipEndSec);
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [audioRef, clipEndSec, onPlayingChange, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
      if (
        clipEndSec !== null &&
        audio.currentTime >= clipEndSec - 0.05 &&
        !audio.paused
      ) {
        pauseAtClipEnd();
        return;
      }
      setCurrentSec(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (!Number.isFinite(audio.duration)) {
        return;
      }
      setDurationSec(audio.duration);
      onDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [
    audioRef,
    clipEndSec,
    onDuration,
    onTimeUpdate,
    onPlayingChange,
    pauseAtClipEnd,
    src,
  ]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !src) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
      return;
    }

    if (clipEndSec !== null) {
      if (audio.currentTime < clipStartSec || audio.currentTime >= clipEndSec) {
        seekTo(clipStartSec);
      }
    }

    try {
      await audio.play();
      setIsPlaying(true);
      onPlayingChange?.(true);
    } catch {
      setIsPlaying(false);
      onPlayingChange?.(false);
    }
  };

  const timelineEndSec = durationSec;
  const { peaks: waveformPeaks, isLoading: isWaveformLoading } =
    useAudioWaveformPeaks(src);

  const playerClassName = embedded
    ? `${styles.player} ${styles.playerEmbedded}`
    : styles.player;

  const clipMeta =
    clipWindow && timelineEndSec
      ? `Clip ${formatTimeSec(clipWindow.clipStartSec)}–${formatTimeSec(
          clipWindow.clipStartSec + clipWindow.clipDurationSec,
        )} (${Math.round(clipWindow.clipDurationSec)}s)`
      : null;

  return (
    <div className={playerClassName}>
      <audio
        ref={audioRef}
        className={styles.hiddenAudio}
        src={src ?? undefined}
        preload="metadata"
      />
      <div className={styles.row}>
        <button
          type="button"
          className={styles.playButton}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!src}
          onClick={handleTogglePlay}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        {clipConfig && timelineEndSec ? (
          <ClipRangeTimeline
            contentEndSec={clipConfig.contentEndSec}
            clipStartSec={clipConfig.clipStartSec}
            clipDurationSec={clipConfig.clipDurationSec}
            playheadSec={currentSec}
            waveformPeaks={waveformPeaks}
            isWaveformLoading={isWaveformLoading}
            onClipWindowChange={clipConfig.onClipWindowChange}
            onPlayheadSeek={seekTo}
          />
        ) : timelineEndSec ? (
          <SimpleWaveformSeek
            durationSec={timelineEndSec}
            playheadSec={currentSec}
            peaks={waveformPeaks}
            isWaveformLoading={isWaveformLoading}
            onSeek={seekTo}
          />
        ) : (
          <div className={styles.seekPlaceholder} aria-hidden />
        )}

        <div className={styles.timeBlock}>
          <span className={styles.time}>
            {formatTimeSec(currentSec)} / {formatTimeSec(timelineEndSec)}
          </span>
          {clipMeta ? (
            <span className={styles.clipMeta}>{clipMeta}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
