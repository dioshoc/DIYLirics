export const clampTime = (
  value: number,
  min: number,
  max: number | null,
): number => {
  const upper = max ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(value, min), upper);
};

export const formatTimeSec = (sec: number | null): string => {
  if (sec === null || Number.isNaN(sec)) {
    return '—';
  }

  const totalMs = Math.round(sec * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centis = Math.floor((totalMs % 1000) / 10);

  const pad2 = (n: number) => n.toString().padStart(2, '0');

  if (minutes > 0) {
    return `${minutes}:${pad2(seconds)}.${pad2(centis)}`;
  }

  return `${seconds}.${pad2(centis)}`;
};

export const nudgeTime = (
  current: number,
  delta: number,
  durationSec: number | null,
): number => clampTime(current + delta, 0, durationSec);
