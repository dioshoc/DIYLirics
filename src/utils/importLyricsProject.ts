import { nanoid } from 'nanoid';

import type { LyricLine, LyricsProject } from '../types/session';

export type ImportLyricsResult =
  | { ok: true; project: LyricsProject }
  | { ok: false; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseLine = (value: unknown): LyricsProject['lines'][number] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const text = typeof value.text === 'string' ? value.text : '';
  const startTimeSec = value.startTimeSec;

  if (!text.trim() || typeof startTimeSec !== 'number' || !Number.isFinite(startTimeSec)) {
    return null;
  }

  const endTimeSec =
    typeof value.endTimeSec === 'number' && Number.isFinite(value.endTimeSec)
      ? value.endTimeSec
      : null;

  const id = typeof value.id === 'string' && value.id.trim() ? value.id : nanoid();

  return {
    id,
    text,
    startTimeSec,
    endTimeSec,
  };
};

export const parseLyricsProjectJson = (raw: string): ImportLyricsResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, message: 'Invalid JSON file.' };
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    return { ok: false, message: 'Unsupported project version.' };
  }

  if (!Array.isArray(parsed.lines) || parsed.lines.length === 0) {
    return { ok: false, message: 'Project has no synced lines.' };
  }

  const lines: LyricsProject['lines'] = [];

  for (let index = 0; index < parsed.lines.length; index += 1) {
    const line = parseLine(parsed.lines[index]);
    if (!line) {
      return {
        ok: false,
        message: `Invalid line at index ${index}.`,
      };
    }
    lines.push(line);
  }

  const meta = isRecord(parsed.meta) ? parsed.meta : {};

  const project: LyricsProject = {
    version: 1,
    meta: {
      title: typeof meta.title === 'string' ? meta.title : '',
      artist: typeof meta.artist === 'string' ? meta.artist : '',
      audioFileName:
        typeof meta.audioFileName === 'string' ? meta.audioFileName : null,
      coverArtFileName:
        typeof meta.coverArtFileName === 'string' ? meta.coverArtFileName : null,
      durationSec:
        typeof meta.durationSec === 'number' && Number.isFinite(meta.durationSec)
          ? meta.durationSec
          : null,
      lyricsEndTimeSec:
        typeof meta.lyricsEndTimeSec === 'number' &&
        Number.isFinite(meta.lyricsEndTimeSec)
          ? meta.lyricsEndTimeSec
          : null,
    },
    lines,
  };

  return { ok: true, project };
};

export const lyricsProjectToLines = (project: LyricsProject): LyricLine[] =>
  project.lines.map((line) => ({
    id: line.id,
    text: line.text,
    startTimeSec: line.startTimeSec,
    endTimeSec: line.endTimeSec,
  }));

export const linesToRawLyricsText = (lines: LyricLine[]): string =>
  lines.map((line) => line.text).join('\n');
