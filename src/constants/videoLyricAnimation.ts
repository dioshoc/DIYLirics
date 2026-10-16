export type LyricAnimationPresetId =
  | 'none'
  | 'fade_in'
  | 'rise_up'
  | 'drop_down'
  | 'scale_in'
  | 'pop'
  | 'elastic'
  | 'glitch'
  | 'words_random_fade'
  | 'words_random_rise'
  | 'words_random_pop';

export const LYRIC_ANIMATION_DURATION_SEC = 0.45;

export type LyricAnimationPresetIdAnimated = Exclude<
  LyricAnimationPresetId,
  'none'
>;

export type LyricLineAnimationPresetId = Exclude<
  LyricAnimationPresetId,
  'none' | 'words_random_fade' | 'words_random_rise' | 'words_random_pop'
>;

export const LYRIC_ANIMATION_PRESET_ORDER: LyricAnimationPresetIdAnimated[] = [
  'fade_in',
  'rise_up',
  'drop_down',
  'scale_in',
  'pop',
  'elastic',
  'glitch',
  'words_random_fade',
  'words_random_rise',
  'words_random_pop',
];

export const LYRIC_ANIMATION_PRESET_LABELS: Record<
  LyricAnimationPresetIdAnimated,
  string
> = {
  fade_in: 'Fade in',
  rise_up: 'Rise up',
  drop_down: 'Drop down',
  scale_in: 'Scale in',
  pop: 'Pop',
  elastic: 'Elastic',
  glitch: 'Glitch',
  words_random_fade: 'Random words · fade',
  words_random_rise: 'Random words · rise',
  words_random_pop: 'Random words · pop',
};

export const DEFAULT_LYRIC_ANIMATION_PRESET: LyricAnimationPresetId = 'none';

const PRESET_ID_SET = new Set<string>([
  'none',
  ...LYRIC_ANIMATION_PRESET_ORDER,
]);

export const isLyricAnimationPresetId = (
  value: string,
): value is LyricAnimationPresetId => PRESET_ID_SET.has(value);

const REMOVED_LYRIC_ANIMATION_PRESET_IDS = new Set<string>([
  'blur_in',
  'bounce',
  'zoom_blur',
]);

export const resolveLyricAnimationPresetId = (
  value: string | undefined | null,
): LyricAnimationPresetId => {
  if (value && REMOVED_LYRIC_ANIMATION_PRESET_IDS.has(value)) {
    return DEFAULT_LYRIC_ANIMATION_PRESET;
  }
  if (value && isLyricAnimationPresetId(value)) {
    return value;
  }
  return DEFAULT_LYRIC_ANIMATION_PRESET;
};
