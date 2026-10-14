import type { LyricAnimationPresetId } from '../constants/videoLyricAnimation';
import type { LyricAnimationPresetIdAnimated } from '../constants/videoLyricAnimation';
import {
  getLyricAnimationTransform,
  type LyricAnimationTransform,
} from './lyricAnimationTransform';

export type WordRandomAnimationPresetId =
  | 'words_random_fade'
  | 'words_random_rise'
  | 'words_random_pop';

const WORD_RANDOM_PRESET_SET = new Set<string>([
  'words_random_fade',
  'words_random_rise',
  'words_random_pop',
]);

const WORD_RANDOM_BASE_PRESET: Record<
  WordRandomAnimationPresetId,
  LyricAnimationPresetIdAnimated
> = {
  words_random_fade: 'fade_in',
  words_random_rise: 'rise_up',
  words_random_pop: 'pop',
};

const WORD_RANDOM_TIMING_SCALE = 1.3;

/** Fast per-word pop-in while the line is still a scramble. */
export const WORD_RANDOM_ENTER_SEC = 0.18 * WORD_RANDOM_TIMING_SCALE;

const HIDDEN_TRANSFORM: LyricAnimationTransform = {
  opacity: 0,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0,
  blurPx: 0,
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const isWordRandomAnimationPreset = (
  preset: LyricAnimationPresetId,
): preset is WordRandomAnimationPresetId =>
  WORD_RANDOM_PRESET_SET.has(preset);

export const splitLyricIntoWords = (text: string): string[] =>
  text.trim().split(/\s+/).filter(Boolean);

const computeBurstSec = (wordCount: number): number => {
  const base = 0.22 + wordCount * 0.028;
  return Math.min(0.5, Math.max(0.26, base)) * WORD_RANDOM_TIMING_SCALE;
};

const buildWordStartOffsets = (
  lineSeed: string,
  wordCount: number,
): number[] => {
  const rng = createRng(hashString(`${lineSeed}|word-burst-v2`));
  const burst = computeBurstSec(wordCount);
  const latestStart = Math.max(0.05, burst - WORD_RANDOM_ENTER_SEC);

  return Array.from({ length: wordCount }, () => rng() * latestStart);
};

const wordStartOffsetCache = new Map<string, number[]>();

const getWordStartOffsets = (
  lineSeed: string,
  wordCount: number,
): number[] => {
  const cacheKey = `${lineSeed}|${wordCount}`;
  const cached = wordStartOffsetCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const offsets = buildWordStartOffsets(lineSeed, wordCount);
  wordStartOffsetCache.set(cacheKey, offsets);
  return offsets;
};

export const getLyricWordAnimationTransform = (
  preset: WordRandomAnimationPresetId,
  timeSec: number,
  lineStartSec: number,
  lineEndSec: number | null,
  fontSize: number,
  wordIndex: number,
  wordCount: number,
  lineSeed: string,
): LyricAnimationTransform => {
  if (wordCount <= 0) {
    return HIDDEN_TRANSFORM;
  }

  const basePreset = WORD_RANDOM_BASE_PRESET[preset];
  const startOffsets = getWordStartOffsets(lineSeed, wordCount);
  const wordStartSec = lineStartSec + (startOffsets[wordIndex] ?? 0);

  if (timeSec < wordStartSec) {
    return HIDDEN_TRANSFORM;
  }

  return getLyricAnimationTransform(
    basePreset,
    timeSec,
    wordStartSec,
    lineEndSec,
    fontSize,
    { enterDurationSec: WORD_RANDOM_ENTER_SEC },
  );
};
