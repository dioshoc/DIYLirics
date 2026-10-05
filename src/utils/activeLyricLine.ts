import type { LyricsProject } from '../types/session';

export type ActiveLyricState = {
  text: string;
  lineId: string | null;
  lineStartSec: number | null;
  lineEndSec: number | null;
};

const resolveLineEndSec = (
  lines: LyricsProject['lines'],
  activeIndex: number,
  lyricsEndTimeSec: number | null,
): number | null => {
  const nextLine = lines[activeIndex + 1];
  if (nextLine) {
    return nextLine.startTimeSec;
  }
  return lyricsEndTimeSec;
};

export const getActiveLyricStateAtTime = (
  lines: LyricsProject['lines'],
  timeSec: number,
  lyricsEndTimeSec: number | null = null,
): ActiveLyricState => {
  const empty: ActiveLyricState = {
    text: '',
    lineId: null,
    lineStartSec: null,
    lineEndSec: null,
  };

  if (lines.length === 0) {
    return empty;
  }

  if (lyricsEndTimeSec !== null && timeSec >= lyricsEndTimeSec) {
    return empty;
  }

  if (timeSec < lines[0].startTimeSec) {
    return empty;
  }

  let activeIndex = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startTimeSec <= timeSec) {
      activeIndex = index;
    }
  }

  const active = lines[activeIndex];
  return {
    text: active?.text ?? '',
    lineId: active?.id ?? null,
    lineStartSec: active?.startTimeSec ?? null,
    lineEndSec: resolveLineEndSec(lines, activeIndex, lyricsEndTimeSec),
  };
};

export const getActiveLyricTextAtTime = (
  lines: LyricsProject['lines'],
  timeSec: number,
  lyricsEndTimeSec: number | null = null,
): string =>
  getActiveLyricStateAtTime(lines, timeSec, lyricsEndTimeSec).text;
