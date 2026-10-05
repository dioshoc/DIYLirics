import { useEffect, useRef, useState } from 'react';

import { formatTimeSec } from '../../utils/time';
import styles from './AudioPlayer.module.scss';

type AudioPlayerProps = {
  src: string | null;
  onDuration: (durationSec: number) => void;
  onTimeUpdate?: (timeSec: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  audioRefExternal?: React.RefObject<HTMLAudioElement | null>;
  embedded?: boolean;
};

export const AudioPlayer = ({
  src,
  onDuration,
  onTimeUpdate,
  onPlayingChange,
  audioRefExternal,
  embedded = false,
}: AudioPlayerProps) => {
  const internalRef = useRef<HTMLAudioElement>(null);
  const audioRef = audioRefExternal ?? internalRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState<number | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentSec(0);
    setDurationSec(null);
    onPlayingChange?.(false);
    onTimeUpdate?.(0);
  }, [onPlayingChange, onTimeUpdate, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
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
  }, [audioRef, onDuration, onTimeUpdate, onPlayingChange, src]);

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

    try {
      await audio.play();
      setIsPlaying(true);
      onPlayingChange?.(true);
    } catch {
      setIsPlaying(false);
      onPlayingChange?.(false);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const next = Number(event.target.value);
    audio.currentTime = next;
    setCurrentSec(next);
    onTimeUpdate?.(next);
  };

  const maxSeek = durationSec ?? 0;

  const playerClassName = embedded
    ? `${styles.player} ${styles.playerEmbedded}`
    : styles.player;

  return (
    <div className={playerClassName}>
      <audio ref={audioRef} className={styles.hiddenAudio} src={src ?? undefined} preload="metadata" />
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
        <input
          className={styles.seek}
          type="range"
          min={0}
          max={maxSeek}
          step={0.01}
          value={Math.min(currentSec, maxSeek)}
          disabled={!src || !durationSec}
          aria-label="Seek position"
          onChange={handleSeek}
        />
        <span className={styles.time}>
          {formatTimeSec(currentSec)} / {formatTimeSec(durationSec)}
        </span>
      </div>
    </div>
  );
};
