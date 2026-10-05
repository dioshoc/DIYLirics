import type { LyricLine, LyricsProject, TrackMeta } from '../types/session';

const withComputedEnds = (
  lines: LyricLine[],
  durationSec: number | null,
  lyricsEndTimeSec: number | null,
): LyricsProject['lines'] => {
  const synced = lines.filter(
    (line): line is LyricLine & { startTimeSec: number } =>
      line.startTimeSec !== null,
  );

  return synced.map((line, index) => {
    const next = synced[index + 1];
    const isLast = index === synced.length - 1;
    const endTimeSec =
      line.endTimeSec ??
      (isLast && lyricsEndTimeSec !== null
        ? lyricsEndTimeSec
        : next?.startTimeSec ?? durationSec);

    return {
      id: line.id,
      text: line.text,
      startTimeSec: line.startTimeSec,
      endTimeSec,
    };
  });
};

export const buildLyricsProject = (
  meta: TrackMeta,
  lines: LyricLine[],
  lyricsEndTimeSec: number | null = null,
): LyricsProject => ({
  version: 1,
  meta: {
    title: meta.title,
    artist: meta.artist,
    audioFileName: meta.audioFile?.name ?? null,
    coverArtFileName: meta.coverFile?.name ?? null,
    durationSec: meta.durationSec,
    lyricsEndTimeSec,
  },
  lines: withComputedEnds(lines, meta.durationSec, lyricsEndTimeSec),
});

export const downloadJson = (project: LyricsProject, fileName: string): void => {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
