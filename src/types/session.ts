import type { VideoFormatId } from '../constants/videoFormats';
import type { TiktokCoverPosition } from '../constants/tiktokCoverLayout';
import type { LyricAnimationPresetId } from '../constants/videoLyricAnimation';
import type { LyricFontId } from '../constants/videoLyricFonts';
import type { LyricFontSize } from '../constants/videoLyricFontSize';
import type {
  LyricHorizontalAlign,
  LyricVerticalAlign,
} from '../constants/videoLyricLayout';
import type { YoutubeCoverSide } from '../constants/youtubeCoverLayout';

export type AppTab = 'options' | 'liricks' | 'videomaker';

export type TrackMeta = {
  title: string;
  artist: string;
  audioFile: File | null;
  audioObjectUrl: string | null;
  coverFile: File | null;
  coverObjectUrl: string | null;
  durationSec: number | null;
};

export type LyricLine = {
  id: string;
  text: string;
  startTimeSec: number | null;
  endTimeSec: number | null;
};

export type LyricsProject = {
  version: 1;
  meta: {
    title: string;
    artist: string;
    audioFileName: string | null;
    coverArtFileName: string | null;
    durationSec: number | null;
    lyricsEndTimeSec: number | null;
  };
  lines: Array<{
    id: string;
    text: string;
    startTimeSec: number;
    endTimeSec: number | null;
  }>;
};

export type VideoBackgroundSource = 'track_cover' | 'custom';

export type VideoBackgroundKind = 'image' | 'video';

export type VideoSettings = {
  formatId: VideoFormatId;
  backgroundSource: VideoBackgroundSource;
  youtubeCoverSide: YoutubeCoverSide;
  tiktokCoverPosition: TiktokCoverPosition;
  lyricVerticalAlign: LyricVerticalAlign;
  lyricHorizontalAlign: LyricHorizontalAlign;
  lyricFontSize: LyricFontSize;
  lyricFontId: LyricFontId;
  lyricAnimationPreset: LyricAnimationPresetId;
  showTrackInfoUnderCover: boolean;
  customBackgroundFile: File | null;
  customBackgroundObjectUrl: string | null;
  customBackgroundKind: VideoBackgroundKind | null;
};
