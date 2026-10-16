import type { CSSProperties, RefObject } from 'react';

import type { VideoFormatId } from '../../../constants/videoFormats';
import type { TiktokCoverPosition } from '../../../constants/tiktokCoverLayout';
import { getLyricFontCssFamily, type LyricFontId } from '../../../constants/videoLyricFonts';
import type { LyricFontSize } from '../../../constants/videoLyricFontSize';
import type {
  LyricHorizontalAlign,
  LyricVerticalAlign,
} from '../../../constants/videoLyricLayout';
import type { YoutubeCoverSide } from '../../../constants/youtubeCoverLayout';
import type { VideoBackgroundSource, LyricsProject } from '../../../types/session';
import type { ResolvedVideoBackground } from '../../../utils/videoBackground';
import type { LyricAnimationPresetId } from '../../../constants/videoLyricAnimation';
import type { LyricEffectColorSettings } from '../../../constants/lyricEffectColors';
import type { LyricVisualEffects } from '../../../constants/videoLyricEffects';
import { LyricEffectBackgroundTint } from './LyricEffectBackgroundTint';
import { formatTrackInfoLabel } from '../../../utils/formatTrackInfoLabel';
import { AnimatedPreviewLyric } from './AnimatedPreviewLyric';
import { VideoPreviewBackground } from './VideoPreviewBackground';
import styles from '../panel/VideomakerPanel.module.scss';

type VideoPreviewFrameProps = {
  formatId: VideoFormatId;
  backgroundSource: VideoBackgroundSource;
  coverArtUrl: string | null;
  background: ResolvedVideoBackground;
  lines: LyricsProject['lines'];
  lyricsEndTimeSec: number | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  youtubeCoverSide: YoutubeCoverSide;
  tiktokCoverPosition: TiktokCoverPosition;
  playbackTimeSec: number;
  backgroundPlaybackTimeSec?: number;
  isPlaybackActive: boolean;
  lyricVerticalAlign: LyricVerticalAlign;
  lyricHorizontalAlign: LyricHorizontalAlign;
  lyricFontSize: LyricFontSize;
  lyricFontId: LyricFontId;
  lyricAnimationPreset: LyricAnimationPresetId;
  lyricEffects: LyricVisualEffects;
  lyricEffectColor: LyricEffectColorSettings;
  artist: string;
  title: string;
  showTrackInfoUnderCover: boolean;
};

const useCoverSplitLayout = (
  backgroundSource: VideoBackgroundSource,
  coverArtUrl: string | null,
  background: ResolvedVideoBackground,
): boolean =>
  backgroundSource === 'track_cover' &&
  Boolean(coverArtUrl) &&
  background.kind === 'image';

export const VideoPreviewFrame = ({
  formatId,
  backgroundSource,
  coverArtUrl,
  background,
  lines,
  lyricsEndTimeSec,
  audioRef,
  youtubeCoverSide,
  tiktokCoverPosition,
  playbackTimeSec,
  backgroundPlaybackTimeSec,
  isPlaybackActive,
  lyricVerticalAlign,
  lyricHorizontalAlign,
  lyricFontSize,
  lyricFontId,
  lyricAnimationPreset,
  lyricEffects,
  lyricEffectColor,
  artist,
  title,
  showTrackInfoUnderCover,
}: VideoPreviewFrameProps) => {
  const trackInfoLabel = formatTrackInfoLabel(artist, title);
  const isCoverSplit = useCoverSplitLayout(
    backgroundSource,
    coverArtUrl,
    background,
  );
  const lyricElement = (className: string) => (
    <AnimatedPreviewLyric
      lines={lines}
      lyricsEndTimeSec={lyricsEndTimeSec}
      preset={lyricAnimationPreset}
      className={className}
      audioRef={audioRef}
      isPlaybackActive={isPlaybackActive}
      playbackTimeSec={playbackTimeSec}
      lyricFontSize={lyricFontSize}
      lyricEffects={lyricEffects}
      lyricEffectColor={lyricEffectColor}
      videoFormatId={formatId}
    />
  );
  const lyricFontStyle = {
    '--lyric-font-family': getLyricFontCssFamily(lyricFontId),
  } as CSSProperties;

  const lyricLayoutProps = {
    'data-lyric-v': lyricVerticalAlign,
    'data-lyric-h': lyricHorizontalAlign,
    'data-lyric-size': lyricFontSize,
  };
  if (isCoverSplit && coverArtUrl) {
    const isTiktokCoverSplit = formatId === 'tiktok';

    return (
      <div
        className={styles.previewBox}
        data-format={formatId}
        data-layout="cover-split"
        data-cover-side={
          formatId === 'youtube' ? youtubeCoverSide : undefined
        }
        data-cover-position={
          formatId === 'tiktok' ? tiktokCoverPosition : undefined
        }
        {...lyricLayoutProps}
        style={lyricFontStyle}
      >
        <div className={styles.coverSplitBg} aria-hidden>
          <img
            className={styles.coverSplitBgImage}
            src={coverArtUrl}
            alt=""
          />
          <div className={styles.coverSplitBgScrim} />
          <LyricEffectBackgroundTint
            effects={lyricEffects}
            colorSettings={lyricEffectColor}
          />
        </div>
        <div className={styles.coverSplitForeground}>
          <div className={styles.coverSplitCoverColumn}>
            <img
              className={styles.coverSplitCard}
              src={coverArtUrl}
              alt="Release cover"
            />
            {showTrackInfoUnderCover && trackInfoLabel ? (
              <p className={styles.coverSplitTrackInfo}>{trackInfoLabel}</p>
            ) : null}
          </div>
          {!isTiktokCoverSplit
            ? lyricElement(styles.coverSplitLyric)
            : null}
        </div>
        {isTiktokCoverSplit ? (
          <div className={styles.previewLyricOverlay}>
            {lyricElement(styles.previewLyric)}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={styles.previewBox}
      data-format={formatId}
      data-layout="full"
      {...lyricLayoutProps}
      style={lyricFontStyle}
    >
      <VideoPreviewBackground
        background={background}
        playbackTimeSec={backgroundPlaybackTimeSec ?? playbackTimeSec}
        isPlaybackActive={isPlaybackActive}
      />
      <LyricEffectBackgroundTint
        effects={lyricEffects}
        colorSettings={lyricEffectColor}
      />
      <div className={styles.previewLyricOverlay}>
        {lyricElement(styles.previewLyric)}
      </div>
    </div>
  );
};
