export const LYRIC_GLOW_SOURCE_COUNT = 4;

/** Character positions per second — constant for preview and export. */
export const LYRIC_GLOW_CHARS_PER_SEC = 3.2;

type GlowSource = {
  initialPos: number;
  direction: -1 | 1;
  phaseSec: number;
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededUnit = (hash: number, slot: number): number => {
  const mixed = Math.imul(hash ^ Math.imul(slot + 1, 0x9e3779b1), 0x85ebca6b);
  return (mixed >>> 0) / 4294967296;
};

const buildGlowSources = (lineId: string, lineCharCount: number): GlowSource[] => {
  const hash = hashString(`lyric-glow|${lineId}`);
  const span = Math.max(0, lineCharCount - 1);

  return Array.from({ length: LYRIC_GLOW_SOURCE_COUNT }, (_, index) => ({
    initialPos: seededUnit(hash, index * 3) * span,
    direction: seededUnit(hash, index * 3 + 1) > 0.5 ? 1 : -1,
    phaseSec: seededUnit(hash, index * 3 + 2) * 24,
  }));
};

const reflectAlongLine = (position: number, max: number): number => {
  if (max <= 0) {
    return 0;
  }
  const period = max * 2;
  let wrapped = position % period;
  if (wrapped < 0) {
    wrapped += period;
  }
  return wrapped > max ? period - wrapped : wrapped;
};

const getGlowSourceCharPosition = (
  source: GlowSource,
  timeSec: number,
  lineCharCount: number,
): number => {
  const span = Math.max(0, lineCharCount - 1);
  if (span === 0) {
    return 0;
  }

  const travel =
    (timeSec + source.phaseSec) * LYRIC_GLOW_CHARS_PER_SEC * source.direction;
  return reflectAlongLine(source.initialPos + travel, span);
};

/** 0 = dim, 1 = bright; combines ~4 moving peaks (deterministic per lineId). */
export const getLyricGlowWaveFactor = (
  charIndex: number,
  timeSec: number,
  lineId: string | null,
  lineCharCount: number,
): number => {
  if (lineCharCount <= 0) {
    return 0.26;
  }

  const sources = buildGlowSources(lineId ?? '__default', lineCharCount);
  let peak = 0;

  sources.forEach((source) => {
    const pos = getGlowSourceCharPosition(source, timeSec, lineCharCount);
    const dist = Math.abs(charIndex - pos);
    const contribution = Math.max(0, 1 - dist * 0.55);
    peak = Math.max(peak, contribution);
  });

  return 0.26 + peak * 0.74;
};
