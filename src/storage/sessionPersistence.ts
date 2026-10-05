import type { VideoFormatId } from '../constants/videoFormats';
import type { TiktokCoverPosition } from '../constants/tiktokCoverLayout';
import {
  DEFAULT_LYRIC_FONT_ID,
  type LyricFontId,
  isLyricFontId,
} from '../constants/videoLyricFonts';
import {
  DEFAULT_LYRIC_ANIMATION_PRESET,
  type LyricAnimationPresetId,
  isLyricAnimationPresetId,
} from '../constants/videoLyricAnimation';
import type { LyricFontSize } from '../constants/videoLyricFontSize';
import type {
  LyricHorizontalAlign,
  LyricVerticalAlign,
} from '../constants/videoLyricLayout';
import type { YoutubeCoverSide } from '../constants/youtubeCoverLayout';
import { useSessionStore } from '../store/sessionStore';
import type {
  AppTab,
  LyricLine,
  TrackMeta,
  VideoBackgroundKind,
  VideoBackgroundSource,
  VideoSettings,
} from '../types/session';
import { getCustomBackgroundKind } from '../utils/videoBackground';
import {
  deleteSessionBlob,
  loadSessionBlob,
  saveSessionBlob,
  type SessionBlobKey,
} from './sessionBlobDb';

const LOCAL_STORAGE_KEY = 'diylirics.session.v1';

type PersistedSessionV1 = {
  version: 1;
  activeTab: AppTab;
  track: {
    title: string;
    artist: string;
    durationSec: number | null;
  };
  lyricsRawText: string;
  lines: LyricLine[];
  syncCursor: number;
  lyricsEndTimeSec?: number | null;
  videoSettings: {
    formatId: VideoFormatId;
    backgroundSource: VideoBackgroundSource;
    youtubeCoverSide?: YoutubeCoverSide;
    tiktokCoverPosition?: TiktokCoverPosition;
    lyricVerticalAlign?: LyricVerticalAlign;
    lyricHorizontalAlign?: LyricHorizontalAlign;
    lyricFontSize?: LyricFontSize;
    lyricFontId?: LyricFontId;
    lyricAnimationPreset?: LyricAnimationPresetId;
    showTrackInfoUnderCover?: boolean;
    customBackgroundKind: VideoBackgroundKind | null;
  };
};

let persistencePaused = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;

const fileToObjectUrl = (file: File): string => URL.createObjectURL(file);

const resolvePersistedLyricFontId = (
  value: LyricFontId | undefined,
): LyricFontId => {
  if (!value || !isLyricFontId(value)) {
    return DEFAULT_LYRIC_FONT_ID;
  }
  return value;
};

const buildTrackFromBlobs = async (
  meta: PersistedSessionV1['track'],
): Promise<TrackMeta> => {
  const audioFile = await loadSessionBlob('audio');
  const coverFile = await loadSessionBlob('cover');

  return {
    title: meta.title,
    artist: meta.artist,
    durationSec: meta.durationSec,
    audioFile,
    audioObjectUrl: audioFile ? fileToObjectUrl(audioFile) : null,
    coverFile,
    coverObjectUrl: coverFile ? fileToObjectUrl(coverFile) : null,
  };
};

const buildVideoSettingsFromBlob = async (
  persisted: PersistedSessionV1['videoSettings'],
): Promise<VideoSettings> => {
  const customBackgroundFile = await loadSessionBlob('customBackground');
  const kindFromFile = customBackgroundFile
    ? getCustomBackgroundKind(customBackgroundFile)
    : null;

  return {
    formatId: persisted.formatId,
    backgroundSource: persisted.backgroundSource,
    youtubeCoverSide: persisted.youtubeCoverSide ?? 'right',
    tiktokCoverPosition: persisted.tiktokCoverPosition ?? 'top',
    lyricVerticalAlign: persisted.lyricVerticalAlign ?? 'center',
    lyricHorizontalAlign: persisted.lyricHorizontalAlign ?? 'center',
    lyricFontSize: persisted.lyricFontSize ?? 'medium',
    lyricFontId: resolvePersistedLyricFontId(persisted.lyricFontId),
    lyricAnimationPreset: isLyricAnimationPresetId(
      persisted.lyricAnimationPreset ?? '',
    )
      ? persisted.lyricAnimationPreset!
      : DEFAULT_LYRIC_ANIMATION_PRESET,
    showTrackInfoUnderCover: persisted.showTrackInfoUnderCover ?? false,
    customBackgroundKind:
      kindFromFile ?? persisted.customBackgroundKind ?? null,
    customBackgroundFile,
    customBackgroundObjectUrl: customBackgroundFile
      ? fileToObjectUrl(customBackgroundFile)
      : null,
  };
};

const syncBlob = async (
  key: SessionBlobKey,
  file: File | null,
): Promise<void> => {
  if (file) {
    await saveSessionBlob(key, file);
    return;
  }
  await deleteSessionBlob(key);
};

const persistState = async (): Promise<void> => {
  if (persistencePaused) {
    return;
  }

  const state = useSessionStore.getState();
  const payload: PersistedSessionV1 = {
    version: 1,
    activeTab: state.activeTab,
    track: {
      title: state.track.title,
      artist: state.track.artist,
      durationSec: state.track.durationSec,
    },
    lyricsRawText: state.lyricsRawText,
    lines: state.lines,
    syncCursor: state.syncCursor,
    lyricsEndTimeSec: state.lyricsEndTimeSec,
    videoSettings: {
      formatId: state.videoSettings.formatId,
      backgroundSource: state.videoSettings.backgroundSource,
      youtubeCoverSide: state.videoSettings.youtubeCoverSide,
      tiktokCoverPosition: state.videoSettings.tiktokCoverPosition,
      lyricVerticalAlign: state.videoSettings.lyricVerticalAlign,
      lyricHorizontalAlign: state.videoSettings.lyricHorizontalAlign,
      lyricFontSize: state.videoSettings.lyricFontSize,
      lyricFontId: state.videoSettings.lyricFontId,
      lyricAnimationPreset: state.videoSettings.lyricAnimationPreset,
      showTrackInfoUnderCover: state.videoSettings.showTrackInfoUnderCover,
      customBackgroundKind: state.videoSettings.customBackgroundKind,
    },
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));

  await Promise.all([
    syncBlob('audio', state.track.audioFile),
    syncBlob('cover', state.track.coverFile),
    syncBlob('customBackground', state.videoSettings.customBackgroundFile),
  ]);
};

const schedulePersist = (): void => {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    void persistState();
  }, 400);
};

export const restoreSessionFromStorage = async (): Promise<boolean> => {
  persistencePaused = true;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as PersistedSessionV1;
    if (parsed.version !== 1) {
      return false;
    }

    const track = await buildTrackFromBlobs(parsed.track);
    const videoSettings = await buildVideoSettingsFromBlob(parsed.videoSettings);

    useSessionStore.setState({
      activeTab: parsed.activeTab,
      track,
      lyricsRawText: parsed.lyricsRawText,
      lines: parsed.lines,
      syncCursor: Math.min(parsed.syncCursor, parsed.lines.length),
      lyricsEndTimeSec: parsed.lyricsEndTimeSec ?? null,
      videoSettings,
    });

    return true;
  } catch {
    return false;
  } finally {
    persistencePaused = false;
  }
};

export const startPersistenceSubscriber = (): void => {
  if (unsubscribe) {
    return;
  }

  unsubscribe = useSessionStore.subscribe(() => {
    schedulePersist();
  });
};

export const stopPersistenceSubscriber = (): void => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
};
