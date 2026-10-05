export type LyricAnimationPresetId =
  | 'none'
  | 'fade_in'
  | 'rise_up'
  | 'drop_down'
  | 'scale_in'
  | 'pop'
  | 'blur_in'
  | 'bounce'
  | 'elastic'
  | 'glitch'
  | 'zoom_blur';

export const LYRIC_ANIMATION_DURATION_SEC = 0.45;

export type LyricAnimationPresetIdAnimated = Exclude<
  LyricAnimationPresetId,
  'none'
>;

export const LYRIC_ANIMATION_PRESET_ORDER: LyricAnimationPresetIdAnimated[] = [
  'fade_in',
  'rise_up',
  'drop_down',
  'scale_in',
  'pop',
  'blur_in',
  'bounce',
  'elastic',
  'glitch',
  'zoom_blur',
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
  blur_in: 'Blur in',
  bounce: 'Bounce',
  elastic: 'Elastic',
  glitch: 'Glitch',
  zoom_blur: 'Zoom blur',
};

export const DEFAULT_LYRIC_ANIMATION_PRESET: LyricAnimationPresetId = 'none';

const PRESET_ID_SET = new Set<string>([
  'none',
  ...LYRIC_ANIMATION_PRESET_ORDER,
]);

export const isLyricAnimationPresetId = (
  value: string,
): value is LyricAnimationPresetId => PRESET_ID_SET.has(value);
