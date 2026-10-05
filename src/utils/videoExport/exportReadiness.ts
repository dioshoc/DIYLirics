import type { LyricLine, TrackMeta, VideoSettings } from '../../types/session';
import { resolveVideoBackground } from '../videoBackground';

export const getVideoExportBlockers = (
  track: TrackMeta,
  lines: LyricLine[],
  videoSettings: VideoSettings,
): string[] => {
  const blockers: string[] = [];

  if (!track.audioObjectUrl) {
    blockers.push('Upload audio in Options.');
  }

  const syncedCount = lines.filter((line) => line.startTimeSec !== null).length;
  if (syncedCount === 0) {
    blockers.push('Sync at least one lyric line in Liricks.');
  }

  const background = resolveVideoBackground(track, videoSettings);
  if (!background.url) {
    blockers.push('Set a track cover or custom background.');
  }

  return blockers;
};
