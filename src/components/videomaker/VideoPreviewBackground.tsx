import { useEffect, useRef } from 'react';

import type { ResolvedVideoBackground } from '../../utils/videoBackground';
import styles from './VideomakerPanel.module.scss';

type VideoPreviewBackgroundProps = {
  background: ResolvedVideoBackground;
  playbackTimeSec?: number;
  isPlaybackActive?: boolean;
};

export const VideoPreviewBackground = ({
  background,
  playbackTimeSec = 0,
  isPlaybackActive = false,
}: VideoPreviewBackgroundProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || background.kind !== 'video') {
      return;
    }

    if (isPlaybackActive) {
      if (video.paused) {
        void video.play();
      }
      return;
    }

    video.pause();
  }, [background.kind, isPlaybackActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || background.kind !== 'video') {
      return;
    }

    if (Math.abs(video.currentTime - playbackTimeSec) < 0.2) {
      return;
    }

    video.currentTime = playbackTimeSec;
  }, [background.kind, playbackTimeSec]);
  if (!background.url || !background.kind) {
    return (
      <div className={styles.previewBgFallback} aria-hidden>
        No background
      </div>
    );
  }

  if (background.kind === 'video') {
    return (
      <video
        ref={videoRef}
        className={styles.previewBgMedia}
        src={background.url}
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
    );
  }

  return (
    <img
      className={styles.previewBgMedia}
      src={background.url}
      alt=""
      aria-hidden
    />
  );
};
