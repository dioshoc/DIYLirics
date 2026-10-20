import { useEffect, useRef } from 'react';

import type { ResolvedVideoBackground } from '../../../utils/videoBackground';
import styles from '../panel/VideomakerPanel.module.scss';

type CoverSplitBackdropProps = {
  backdrop: ResolvedVideoBackground;
  playbackTimeSec?: number;
  isPlaybackActive?: boolean;
};

export const CoverSplitBackdrop = ({
  backdrop,
  playbackTimeSec = 0,
  isPlaybackActive = false,
}: CoverSplitBackdropProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || backdrop.kind !== 'video') {
      return;
    }

    if (isPlaybackActive) {
      if (video.paused) {
        void video.play();
      }
      return;
    }

    video.pause();
  }, [backdrop.kind, isPlaybackActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || backdrop.kind !== 'video') {
      return;
    }

    if (Math.abs(video.currentTime - playbackTimeSec) < 0.2) {
      return;
    }

    video.currentTime = playbackTimeSec;
  }, [backdrop.kind, playbackTimeSec]);

  if (!backdrop.url || !backdrop.kind) {
    return null;
  }

  if (backdrop.kind === 'video') {
    return (
      <video
        ref={videoRef}
        className={styles.coverSplitBgImage}
        src={backdrop.url}
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
    );
  }

  return (
    <img
      className={styles.coverSplitBgImage}
      src={backdrop.url}
      alt=""
      aria-hidden
    />
  );
};
