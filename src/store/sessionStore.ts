import { create } from 'zustand';

import { TIKTOK_CLIP_DURATION_DEFAULT_SEC } from '../constants/tiktokClip';
import type { VideoFormatId } from '../constants/videoFormats';
import type { TiktokCoverPosition } from '../constants/tiktokCoverLayout';
import {
  DEFAULT_LYRIC_ANIMATION_PRESET,
  type LyricAnimationPresetId,
} from '../constants/videoLyricAnimation';
import {
  DEFAULT_LYRIC_EFFECT_COLOR,
  type LyricEffectColorSettings,
} from '../constants/lyricEffectColors';
import {
  DEFAULT_LYRIC_VISUAL_EFFECTS,
  type LyricVisualEffects,
} from '../constants/videoLyricEffects';
import {
  DEFAULT_LYRIC_FONT_ID,
  type LyricFontId,
} from '../constants/videoLyricFonts';
import type { LyricFontSize } from '../constants/videoLyricFontSize';
import type {
  LyricHorizontalAlign,
  LyricVerticalAlign,
} from '../constants/videoLyricLayout';
import type { YoutubeCoverSide } from '../constants/youtubeCoverLayout';
import type {
  AppTab,
  LyricLine,
  LyricsProject,
  TrackMeta,
  VideoBackgroundSource,
  VideoSettings,
} from '../types/session';
import {
  linesToRawLyricsText,
  lyricsProjectToLines,
} from '../utils/importLyricsProject';
import { nudgeTime } from '../utils/time';
import {
  clampBackgroundMediaClipSettings,
  getDefaultBackgroundMediaClipDurationSec,
} from '../utils/backgroundMediaClip';
import { probeBackgroundMediaDurationSec } from '../utils/probeBackgroundMediaDuration';
import { clampTiktokClipSettings } from '../utils/tiktokExportWindow';
import { getCustomBackgroundKind } from '../utils/videoBackground';

type SessionState = {
  activeTab: AppTab;
  track: TrackMeta;
  lyricsRawText: string;
  lines: LyricLine[];
  syncCursor: number;
  lyricsEndTimeSec: number | null;
  videoSettings: VideoSettings;
  setActiveTab: (tab: AppTab) => void;
  setTitle: (title: string) => void;
  setArtist: (artist: string) => void;
  setAudioFile: (file: File | null) => void;
  setCoverFile: (file: File | null) => void;
  setDurationSec: (durationSec: number | null) => void;
  setLyricsRawText: (text: string) => void;
  setLines: (lines: LyricLine[]) => void;
  importLyricsProject: (project: LyricsProject) => void;
  setSyncCursor: (index: number) => void;
  markCurrentLine: (timeSec: number) => void;
  goToPreviousSyncLine: () => void;
  nudgeLineTime: (lineId: string, delta: number) => void;
  nudgeLyricsEndTime: (delta: number) => void;
  setVideoFormatId: (formatId: VideoFormatId) => void;
  setVideoBackgroundSource: (source: VideoBackgroundSource) => void;
  setYoutubeCoverSide: (side: YoutubeCoverSide) => void;
  setTiktokCoverPosition: (position: TiktokCoverPosition) => void;
  setTiktokClipDurationSec: (durationSec: number) => void;
  setTiktokClipStartSec: (startSec: number) => void;
  setTiktokClipWindow: (startSec: number, durationSec: number) => void;
  setLyricVerticalAlign: (align: LyricVerticalAlign) => void;
  setLyricHorizontalAlign: (align: LyricHorizontalAlign) => void;
  setLyricFontSize: (size: LyricFontSize) => void;
  setLyricFontId: (fontId: LyricFontId) => void;
  setLyricAnimationPreset: (preset: LyricAnimationPresetId) => void;
  setLyricEffects: (effects: LyricVisualEffects) => void;
  setLyricEffectColor: (color: LyricEffectColorSettings) => void;
  setShowTrackInfoUnderCover: (showTrackInfoUnderCover: boolean) => void;
  setCustomBackgroundFile: (file: File | null) => void;
  setCustomBackgroundMediaClipWindow: (
    clipStartSec: number,
    clipDurationSec: number,
  ) => void;
  setCustomBackgroundMediaDurationSec: (durationSec: number) => void;
};

const initialTrack: TrackMeta = {
  title: '',
  artist: '',
  audioFile: null,
  audioObjectUrl: null,
  coverFile: null,
  coverObjectUrl: null,
  durationSec: null,
};

const initialVideoSettings: VideoSettings = {
  formatId: 'youtube',
  backgroundSource: 'track_cover',
  youtubeCoverSide: 'right',
  tiktokCoverPosition: 'top',
  lyricVerticalAlign: 'center',
  lyricHorizontalAlign: 'center',
  lyricFontSize: 'medium',
  lyricFontId: DEFAULT_LYRIC_FONT_ID,
  lyricAnimationPreset: DEFAULT_LYRIC_ANIMATION_PRESET,
  lyricEffects: { ...DEFAULT_LYRIC_VISUAL_EFFECTS },
  lyricEffectColor: { ...DEFAULT_LYRIC_EFFECT_COLOR },
  tiktokClipDurationSec: TIKTOK_CLIP_DURATION_DEFAULT_SEC,
  tiktokClipStartSec: 0,
  showTrackInfoUnderCover: false,
  customBackgroundFile: null,
  customBackgroundObjectUrl: null,
  customBackgroundKind: null,
  customBackgroundDurationSec: null,
  customBackgroundClipStartSec: 0,
  customBackgroundClipDurationSec: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  activeTab: 'options',
  track: initialTrack,
  lyricsRawText: '',
  lines: [],
  syncCursor: 0,
  lyricsEndTimeSec: null,
  videoSettings: initialVideoSettings,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTitle: (title) =>
    set((state) => ({
      track: { ...state.track, title },
    })),

  setArtist: (artist) =>
    set((state) => ({
      track: { ...state.track, artist },
    })),

  setAudioFile: (file) => {
    const prevUrl = get().track.audioObjectUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }

    if (!file) {
      set({
        track: {
          ...get().track,
          audioFile: null,
          audioObjectUrl: null,
          durationSec: null,
        },
      });
      return;
    }

    set({
      track: {
        ...get().track,
        audioFile: file,
        audioObjectUrl: URL.createObjectURL(file),
        durationSec: null,
      },
    });
  },

  setCoverFile: (file) => {
    const prevUrl = get().track.coverObjectUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }

    if (!file) {
      set({
        track: {
          ...get().track,
          coverFile: null,
          coverObjectUrl: null,
        },
      });
      return;
    }

    set({
      track: {
        ...get().track,
        coverFile: file,
        coverObjectUrl: URL.createObjectURL(file),
      },
    });
  },

  setDurationSec: (durationSec) =>
    set((state) => {
      const mediaDuration = state.videoSettings.customBackgroundDurationSec;
      let videoSettings = state.videoSettings;
      if (durationSec && mediaDuration && mediaDuration > 0) {
        const clamped = clampBackgroundMediaClipSettings(
          durationSec,
          mediaDuration,
          videoSettings.customBackgroundClipDurationSec ||
            getDefaultBackgroundMediaClipDurationSec(
              durationSec,
              mediaDuration,
            ),
          videoSettings.customBackgroundClipStartSec,
        );
        videoSettings = {
          ...videoSettings,
          customBackgroundClipStartSec: clamped.clipStartSec,
          customBackgroundClipDurationSec: clamped.clipDurationSec,
        };
      }
      return {
        track: { ...state.track, durationSec },
        videoSettings,
      };
    }),

  setLyricsRawText: (text) => set({ lyricsRawText: text }),

  setLines: (lines) =>
    set({
      lines,
      syncCursor: 0,
      lyricsEndTimeSec: null,
    }),

  importLyricsProject: (project) => {
    const importedLines = lyricsProjectToLines(project);

    set((state) => ({
      lines: importedLines,
      lyricsRawText: linesToRawLyricsText(importedLines),
      lyricsEndTimeSec: project.meta.lyricsEndTimeSec,
      syncCursor: 0,
      track: {
        ...state.track,
        title: project.meta.title || state.track.title,
        artist: project.meta.artist || state.track.artist,
        durationSec: project.meta.durationSec ?? state.track.durationSec,
      },
    }));
  },

  setSyncCursor: (index) => {
    const { lines } = get();
    const maxIndex = lines.length;
    const clamped = Math.max(0, Math.min(index, maxIndex));
    set({ syncCursor: clamped });
  },

  markCurrentLine: (timeSec) => {
    const { lines, syncCursor, track } = get();
    if (lines.length === 0) {
      return;
    }

    const clampedTime = nudgeTime(timeSec, 0, track.durationSec);

    if (syncCursor >= lines.length) {
      set({ lyricsEndTimeSec: clampedTime });
      return;
    }

    const nextLines = lines.map((line, index) =>
      index === syncCursor
        ? { ...line, startTimeSec: clampedTime, endTimeSec: null }
        : line,
    );

    set({
      lines: nextLines,
      syncCursor: Math.min(syncCursor + 1, lines.length),
    });
  },

  goToPreviousSyncLine: () => {
    const { syncCursor } = get();
    if (syncCursor <= 0) {
      return;
    }
    set({ syncCursor: syncCursor - 1 });
  },

  nudgeLineTime: (lineId, delta) => {
    const { lines, track } = get();
    set({
      lines: lines.map((line) => {
        if (line.id !== lineId || line.startTimeSec === null) {
          return line;
        }

        return {
          ...line,
          startTimeSec: nudgeTime(
            line.startTimeSec,
            delta,
            track.durationSec,
          ),
        };
      }),
    });
  },

  nudgeLyricsEndTime: (delta) => {
    const { lyricsEndTimeSec, track } = get();
    if (lyricsEndTimeSec === null) {
      return;
    }

    set({
      lyricsEndTimeSec: nudgeTime(
        lyricsEndTimeSec,
        delta,
        track.durationSec,
      ),
    });
  },

  setVideoFormatId: (formatId) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, formatId },
    })),

  setVideoBackgroundSource: (backgroundSource) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, backgroundSource },
    })),

  setYoutubeCoverSide: (youtubeCoverSide) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, youtubeCoverSide },
    })),

  setTiktokCoverPosition: (tiktokCoverPosition) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, tiktokCoverPosition },
    })),

  setTiktokClipDurationSec: (tiktokClipDurationSec) =>
    set((state) => {
      const contentEnd = state.track.durationSec;
      if (!contentEnd) {
        return {
          videoSettings: {
            ...state.videoSettings,
            tiktokClipDurationSec,
          },
        };
      }

      const clamped = clampTiktokClipSettings(
        contentEnd,
        tiktokClipDurationSec,
        state.videoSettings.tiktokClipStartSec,
      );

      return {
        videoSettings: {
          ...state.videoSettings,
          tiktokClipDurationSec: clamped.clipDurationSec,
          tiktokClipStartSec: clamped.clipStartSec,
        },
      };
    }),

  setTiktokClipStartSec: (tiktokClipStartSec) =>
    set((state) => {
      const contentEnd = state.track.durationSec;
      if (!contentEnd) {
        return {
          videoSettings: {
            ...state.videoSettings,
            tiktokClipStartSec,
          },
        };
      }

      const clamped = clampTiktokClipSettings(
        contentEnd,
        state.videoSettings.tiktokClipDurationSec,
        tiktokClipStartSec,
      );

      return {
        videoSettings: {
          ...state.videoSettings,
          tiktokClipDurationSec: clamped.clipDurationSec,
          tiktokClipStartSec: clamped.clipStartSec,
        },
      };
    }),

  setTiktokClipWindow: (tiktokClipStartSec, tiktokClipDurationSec) =>
    set((state) => {
      const contentEnd = state.track.durationSec;
      if (!contentEnd) {
        return {
          videoSettings: {
            ...state.videoSettings,
            tiktokClipStartSec,
            tiktokClipDurationSec,
          },
        };
      }

      const clamped = clampTiktokClipSettings(
        contentEnd,
        tiktokClipDurationSec,
        tiktokClipStartSec,
      );

      return {
        videoSettings: {
          ...state.videoSettings,
          tiktokClipDurationSec: clamped.clipDurationSec,
          tiktokClipStartSec: clamped.clipStartSec,
        },
      };
    }),

  setLyricVerticalAlign: (lyricVerticalAlign) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricVerticalAlign },
    })),

  setLyricHorizontalAlign: (lyricHorizontalAlign) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricHorizontalAlign },
    })),

  setLyricFontSize: (lyricFontSize) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricFontSize },
    })),

  setLyricFontId: (lyricFontId) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricFontId },
    })),

  setLyricAnimationPreset: (lyricAnimationPreset) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricAnimationPreset },
    })),

  setLyricEffects: (lyricEffects) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricEffects },
    })),

  setLyricEffectColor: (lyricEffectColor) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, lyricEffectColor },
    })),

  setShowTrackInfoUnderCover: (showTrackInfoUnderCover) =>
    set((state) => ({
      videoSettings: { ...state.videoSettings, showTrackInfoUnderCover },
    })),

  setCustomBackgroundFile: (file) => {
    const prevUrl = get().videoSettings.customBackgroundObjectUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }

    if (!file) {
      set((state) => ({
        videoSettings: {
          ...state.videoSettings,
          customBackgroundFile: null,
          customBackgroundObjectUrl: null,
          customBackgroundKind: null,
          customBackgroundDurationSec: null,
          customBackgroundClipStartSec: 0,
          customBackgroundClipDurationSec: 0,
        },
      }));
      return;
    }

    const kind = getCustomBackgroundKind(file);
    if (!kind) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    set((state) => ({
      videoSettings: {
        ...state.videoSettings,
        backgroundSource: 'custom',
        customBackgroundFile: file,
        customBackgroundObjectUrl: objectUrl,
        customBackgroundKind: kind,
        customBackgroundDurationSec: null,
        customBackgroundClipStartSec: 0,
        customBackgroundClipDurationSec: 0,
      },
    }));

    void probeBackgroundMediaDurationSec(file, objectUrl).then((durationSec) => {
      set((state) => {
        if (state.videoSettings.customBackgroundObjectUrl !== objectUrl) {
          return state;
        }
        const timelineDurationSec =
          state.track.durationSec ?? durationSec;
        const defaultClipDuration = getDefaultBackgroundMediaClipDurationSec(
          timelineDurationSec,
          durationSec,
        );
        const clamped = clampBackgroundMediaClipSettings(
          timelineDurationSec,
          durationSec,
          defaultClipDuration,
          0,
        );
        return {
          videoSettings: {
            ...state.videoSettings,
            customBackgroundDurationSec: durationSec,
            customBackgroundClipStartSec: clamped.clipStartSec,
            customBackgroundClipDurationSec: clamped.clipDurationSec,
          },
        };
      });
    });
  },

  setCustomBackgroundMediaDurationSec: (customBackgroundDurationSec) =>
    set((state) => {
      const timelineDurationSec =
        state.track.durationSec ?? customBackgroundDurationSec;
      const clamped = clampBackgroundMediaClipSettings(
        timelineDurationSec,
        customBackgroundDurationSec,
        state.videoSettings.customBackgroundClipDurationSec ||
          getDefaultBackgroundMediaClipDurationSec(
            timelineDurationSec,
            customBackgroundDurationSec,
          ),
        state.videoSettings.customBackgroundClipStartSec,
      );
      return {
        videoSettings: {
          ...state.videoSettings,
          customBackgroundDurationSec,
          customBackgroundClipStartSec: clamped.clipStartSec,
          customBackgroundClipDurationSec: clamped.clipDurationSec,
        },
      };
    }),

  setCustomBackgroundMediaClipWindow: (
    customBackgroundClipStartSec,
    customBackgroundClipDurationSec,
  ) =>
    set((state) => {
      const mediaDuration = state.videoSettings.customBackgroundDurationSec;
      if (!mediaDuration) {
        return {
          videoSettings: {
            ...state.videoSettings,
            customBackgroundClipStartSec,
            customBackgroundClipDurationSec,
          },
        };
      }

      const timelineDurationSec = state.track.durationSec ?? mediaDuration;
      const clamped = clampBackgroundMediaClipSettings(
        timelineDurationSec,
        mediaDuration,
        customBackgroundClipDurationSec,
        customBackgroundClipStartSec,
      );

      return {
        videoSettings: {
          ...state.videoSettings,
          customBackgroundClipStartSec: clamped.clipStartSec,
          customBackgroundClipDurationSec: clamped.clipDurationSec,
        },
      };
    }),
}));
