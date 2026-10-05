import type { CSSProperties, RefObject } from 'react';
import { useMemo } from 'react';

import type { LyricAnimationPresetId } from '../../constants/videoLyricAnimation';
import { scaleLyricFontPx } from '../../constants/videoLyricFontSize';
import type { LyricFontSize } from '../../constants/videoLyricFontSize';
import { useAudioDrivenTimeSec } from '../../hooks/useAudioDrivenTimeSec';
import type { LyricsProject } from '../../types/session';
import { getActiveLyricStateAtTime } from '../../utils/activeLyricLine';
import {
  getLyricAnimationTransform,
  lyricAnimationTransformToStyle,
} from '../../utils/lyricAnimationTransform';
import animStyles from './LyricAnimation.module.scss';

type AnimatedPreviewLyricProps = {
  lines: LyricsProject['lines'];
  lyricsEndTimeSec: number | null;
  preset: LyricAnimationPresetId;
  className: string;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaybackActive: boolean;
  playbackTimeSec: number;
  lyricFontSize: LyricFontSize;
};

const PREVIEW_TRANSFORM_FONT_PX = 28;

export const AnimatedPreviewLyric = ({
  lines,
  lyricsEndTimeSec,
  preset,
  className,
  audioRef,
  isPlaybackActive,
  playbackTimeSec,
  lyricFontSize,
}: AnimatedPreviewLyricProps) => {
  const displayTimeSec = useAudioDrivenTimeSec(
    audioRef,
    isPlaybackActive,
    playbackTimeSec,
  );

  const lyricState = useMemo(
    () => getActiveLyricStateAtTime(lines, displayTimeSec, lyricsEndTimeSec),
    [lines, displayTimeSec, lyricsEndTimeSec],
  );

  const { text, lineStartSec, lineEndSec } = lyricState;

  if (!text) {
    return <p className={className} />;
  }

  if (preset === 'none') {
    return <p className={className}>{text}</p>;
  }

  const fontSize = scaleLyricFontPx(PREVIEW_TRANSFORM_FONT_PX, lyricFontSize);
  const animation = getLyricAnimationTransform(
    preset,
    displayTimeSec,
    lineStartSec,
    lineEndSec,
    fontSize,
  );
  const motionStyle = lyricAnimationTransformToStyle(animation);
  const style: CSSProperties = {
    ...motionStyle,
    display: 'inline-block',
    maxWidth: '100%',
  };

  return (
    <p className={`${className} ${animStyles.base}`} style={style}>
      {text}
    </p>
  );
};
