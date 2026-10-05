import { nanoid } from 'nanoid';

import type { LyricLine } from '../types/session';

export const parseLyricsText = (raw: string): LyricLine[] =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => ({
      id: nanoid(),
      text,
      startTimeSec: null,
      endTimeSec: null,
    }));
