import type { CSSProperties, RefObject } from 'react';
import { useMemo } from 'react';

import type { VideoFormatId } from '../../../constants/videoFormats';
import { getVideoFormat } from '../../../constants/videoFormats';
import type { LyricAnimationPresetId } from '../../../constants/videoLyricAnimation';
import {
  resolveLyricEffectPalette,
  type LyricEffectColorSettings,
} from '../../../constants/lyricEffectColors';
import type { LyricVisualEffects } from '../../../constants/videoLyricEffects';
import { scaleLyricFontPx } from '../../../constants/videoLyricFontSize';
import type { LyricFontSize } from '../../../constants/videoLyricFontSize';
import { useAudioDrivenTimeSec } from '../../../hooks/useAudioDrivenTimeSec';
import { useGlowMotionTimeSec } from '../../../hooks/useGlowMotionTimeSec';
import type { LyricsProject } from '../../../types/session';
import { getActiveLyricStateAtTime } from '../../../utils/activeLyricLine';
import {
  getLyricAnimationTransform,
  lyricAnimationTransformToStyle,
} from '../../../utils/lyricAnimationTransform';
import {
  getLyricWordAnimationTransform,
  isWordRandomAnimationPreset,
  splitLyricIntoWords,
} from '../../../utils/lyricWordAnimation';
import { getLyricEffectPreviewStyle } from '../../../utils/lyricVisualEffectsStyle';
import animStyles from '../lyric/LyricAnimation.module.scss';
import { GlowLyricChars } from './GlowLyricChars';

type AnimatedPreviewLyricProps = {
  lines: LyricsProject['lines'];
  lyricsEndTimeSec: number | null;
  preset: LyricAnimationPresetId;
  className: string;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaybackActive: boolean;
  playbackTimeSec: number;
  lyricFontSize: LyricFontSize;
  lyricEffects: LyricVisualEffects;
  lyricEffectColor: LyricEffectColorSettings;
  videoFormatId: VideoFormatId;
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
  lyricEffects,
  lyricEffectColor,
  videoFormatId,
}: AnimatedPreviewLyricProps) => {
  const videoFormat = getVideoFormat(videoFormatId);
  const palette = resolveLyricEffectPalette(lyricEffectColor);
  const effectStyle = getLyricEffectPreviewStyle(lyricEffects, palette, {
    frameWidth: videoFormat.width,
    frameHeight: videoFormat.height,
  });
  const displayTimeSec = useAudioDrivenTimeSec(
    audioRef,
    isPlaybackActive,
    playbackTimeSec,
  );
  const glowTimeSec = useGlowMotionTimeSec(
    displayTimeSec,
    isPlaybackActive && lyricEffects.glow,
  );

  const lyricState = useMemo(
    () => getActiveLyricStateAtTime(lines, displayTimeSec, lyricsEndTimeSec),
    [lines, displayTimeSec, lyricsEndTimeSec],
  );

  const { text, lineId, lineStartSec, lineEndSec } = lyricState;
  const useGlowWave = lyricEffects.glow;

  const renderLyricContent = (content: string, charIndexOffset = 0) => {
    if (!useGlowWave) {
      return content;
    }
    return (
      <GlowLyricChars
        text={content}
        timeSec={glowTimeSec}
        lineId={lineId}
        lineCharCount={text.length}
        palette={palette}
        charIndexOffset={charIndexOffset}
      />
    );
  };

  if (!text) {
    return <p className={className} style={effectStyle} />;
  }

  if (preset === 'none') {
    return (
      <p className={className} style={effectStyle}>
        {renderLyricContent(text)}
      </p>
    );
  }

  const fontSize = scaleLyricFontPx(PREVIEW_TRANSFORM_FONT_PX, lyricFontSize);

  if (
    isWordRandomAnimationPreset(preset) &&
    lineStartSec !== null &&
    lineId !== null
  ) {
    const words = splitLyricIntoWords(text);
    return (
      <p className={`${className} ${animStyles.base}`} style={effectStyle}>
        {words.map((word, wordIndex) => {
          const animation = getLyricWordAnimationTransform(
            preset,
            displayTimeSec,
            lineStartSec,
            lineEndSec,
            fontSize,
            wordIndex,
            words.length,
            lineId,
          );
          const motionStyle: CSSProperties = {
            ...lyricAnimationTransformToStyle(animation),
            display: 'inline-block',
          };
          const charIndexOffset = words.slice(0, wordIndex).join(' ').length;

          return (
            <span key={`${lineId}-${wordIndex}`}>
              <span style={motionStyle}>
                {renderLyricContent(word, charIndexOffset)}
              </span>
              {wordIndex < words.length - 1
                ? renderLyricContent(' ', charIndexOffset + word.length)
                : null}
            </span>
          );
        })}
      </p>
    );
  }

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
    ...effectStyle,
    display: 'inline-block',
    maxWidth: '100%',
  };

  return (
    <p className={`${className} ${animStyles.base}`} style={style}>
      {renderLyricContent(text)}
    </p>
  );
};
