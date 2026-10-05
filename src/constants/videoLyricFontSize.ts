export type LyricFontSize = 'small' | 'medium' | 'large';

export const LYRIC_FONT_SIZE_ORDER: LyricFontSize[] = [
  'small',
  'medium',
  'large',
];

export const LYRIC_FONT_SIZE_LABELS: Record<LyricFontSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

/** Multiplier vs default (medium = 1). Small −20%, large +20%. */
export const LYRIC_FONT_SIZE_SCALE: Record<LyricFontSize, number> = {
  small: 0.8,
  medium: 1,
  large: 1.2,
};

export const getLyricFontScale = (size: LyricFontSize): number =>
  LYRIC_FONT_SIZE_SCALE[size];

export const scaleLyricFontPx = (
  baseFontSizePx: number,
  size: LyricFontSize,
): number => baseFontSizePx * getLyricFontScale(size);
