import {
  TIKTOK_CLIP_DURATION_MAX_SEC,
  TIKTOK_CLIP_DURATION_MIN_SEC,
} from '../constants/tiktokClip';
import type { VideoFormatId } from '../constants/videoFormats';
import type { VideoSettings } from '../types/session';
import { clampTime } from './time';

export type TiktokExportWindow = {
  startSec: number;
  durationSec: number;
  endSec: number;
};

export const resolveLyricsContentEndSec = (
  lyricsEndTimeSec: number | null,
  durationSec: number | null,
): number | null => {
  const end = lyricsEndTimeSec ?? durationSec;
  if (end === null || !Number.isFinite(end) || end <= 0) {
    return null;
  }
  return end;
};

export const clampTiktokClipSettings = (
  contentEndSec: number,
  clipDurationSec: number,
  clipStartSec: number,
): { clipDurationSec: number; clipStartSec: number } => {
  const durationMax = Math.min(TIKTOK_CLIP_DURATION_MAX_SEC, contentEndSec);
  const durationMin = Math.min(TIKTOK_CLIP_DURATION_MIN_SEC, contentEndSec);
  const clipDuration = clampTime(clipDurationSec, durationMin, durationMax);
  const maxStart = Math.max(0, contentEndSec - clipDuration);
  const clipStart = clampTime(clipStartSec, 0, maxStart);

  return { clipDurationSec: clipDuration, clipStartSec: clipStart };
};

export const resolveTiktokExportWindow = (
  formatId: VideoFormatId,
  videoSettings: VideoSettings,
  contentEndSec: number,
): TiktokExportWindow => {
  if (formatId !== 'tiktok') {
    return {
      startSec: 0,
      durationSec: contentEndSec,
      endSec: contentEndSec,
    };
  }

  const { clipDurationSec, clipStartSec } = clampTiktokClipSettings(
    contentEndSec,
    videoSettings.tiktokClipDurationSec,
    videoSettings.tiktokClipStartSec,
  );

  return {
    startSec: clipStartSec,
    durationSec: clipDurationSec,
    endSec: clipStartSec + clipDurationSec,
  };
};

export const getTiktokClipDurationSliderBounds = (
  contentEndSec: number,
): { min: number; max: number } => {
  const max = Math.min(TIKTOK_CLIP_DURATION_MAX_SEC, contentEndSec);
  const min = Math.min(TIKTOK_CLIP_DURATION_MIN_SEC, contentEndSec);
  return { min, max };
};
