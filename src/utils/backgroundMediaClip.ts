import { BACKGROUND_MEDIA_CLIP_MIN_SEC } from '../constants/backgroundMediaClip';
import { clampTime } from './time';

/** Clip window on the song timeline; segment length capped by source media duration. */
export const clampBackgroundMediaClipSettings = (
  timelineDurationSec: number,
  mediaDurationSec: number,
  clipDurationSec: number,
  clipStartSec: number,
): { clipDurationSec: number; clipStartSec: number } => {
  if (timelineDurationSec <= 0 || mediaDurationSec <= 0) {
    return { clipDurationSec: 0, clipStartSec: 0 };
  }

  const durationMax = Math.min(mediaDurationSec, timelineDurationSec);
  const durationMin = Math.min(BACKGROUND_MEDIA_CLIP_MIN_SEC, durationMax);
  const clipDuration = clampTime(clipDurationSec, durationMin, durationMax);
  const maxStart = Math.max(0, timelineDurationSec - clipDuration);
  const clipStart = clampTime(clipStartSec, 0, maxStart);

  return { clipDurationSec: clipDuration, clipStartSec: clipStart };
};

export const getDefaultBackgroundMediaClipDurationSec = (
  timelineDurationSec: number,
  mediaDurationSec: number,
): number => {
  if (timelineDurationSec <= 0 || mediaDurationSec <= 0) {
    return 0;
  }
  return Math.min(mediaDurationSec, timelineDurationSec);
};

/** Map song time to a position inside the trimmed media file. */
export const resolveBackgroundMediaPlaybackTimeSec = (
  songTimeSec: number,
  songClipStartSec: number,
  songClipDurationSec: number,
  mediaDurationSec: number,
): number => {
  if (songClipDurationSec <= 0 || mediaDurationSec <= 0) {
    return 0;
  }

  const relative = songTimeSec - songClipStartSec;
  if (relative < 0) {
    return 0;
  }

  const loopSpan = Math.min(songClipDurationSec, mediaDurationSec);
  const offset = ((relative % loopSpan) + loopSpan) % loopSpan;
  return Math.min(offset, Math.max(0, mediaDurationSec - 0.001));
};

export const isBackgroundVideoClipable = (
  backgroundSource: string,
  kind: string | null,
  file: File | null,
): boolean =>
  backgroundSource === 'custom' && kind === 'video' && Boolean(file);

export const isBackgroundMediaClipable = (
  backgroundSource: string,
  kind: string | null,
  file: File | null,
): boolean => {
  if (isBackgroundVideoClipable(backgroundSource, kind, file)) {
    return true;
  }
  if (backgroundSource !== 'custom' || !kind || !file) {
    return false;
  }
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
};
