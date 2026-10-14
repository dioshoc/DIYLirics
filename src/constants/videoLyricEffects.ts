export type LyricEffectId = 'glow' | 'outline' | 'cutOut';

export type LyricVisualEffects = {
  glow: boolean;
  outline: boolean;
  cutOut: boolean;
};

export const LYRIC_OUTLINE_WIDTH_PX = 7;
export const LYRIC_OUTLINE_STROKE = '#FFFFFF';
export const LYRIC_TEXT_FACE_FILL = '#FFF6E8';

export const LYRIC_CUTOUT_FILL = '#F5DC00';
export const LYRIC_CUTOUT_STEP_PX = 1;
/** Beam length along the 45° cut-out direction (export pixels). */
export const LYRIC_CUTOUT_LENGTH_PX = 1000;

export const DEFAULT_LYRIC_VISUAL_EFFECTS: LyricVisualEffects = {
  glow: false,
  outline: false,
  cutOut: false,
};

export const LYRIC_EFFECT_LABELS: Record<LyricEffectId, string> = {
  glow: 'Glow',
  outline: 'Outline',
  cutOut: 'Cut out',
};

export const LYRIC_EFFECT_ORDER: LyricEffectId[] = [
  'glow',
  'outline',
  'cutOut',
];

export const lyricEffectsWithSingle = (
  effectId: LyricEffectId | null,
): LyricVisualEffects => ({
  glow: effectId === 'glow',
  outline: effectId === 'outline',
  cutOut: effectId === 'cutOut',
});

/** At most one effect may be active; first in LYRIC_EFFECT_ORDER wins if several are set. */
export const normalizeLyricVisualEffects = (
  effects: LyricVisualEffects,
): LyricVisualEffects => {
  const active = LYRIC_EFFECT_ORDER.find((id) => effects[id]);
  return lyricEffectsWithSingle(active ?? null);
};
