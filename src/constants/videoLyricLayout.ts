export type LyricVerticalAlign = 'top' | 'center' | 'bottom';

export type LyricHorizontalAlign = 'left' | 'center' | 'right';

export const LYRIC_VERTICAL_ORDER: LyricVerticalAlign[] = [
  'top',
  'center',
  'bottom',
];

export const LYRIC_HORIZONTAL_ORDER: LyricHorizontalAlign[] = [
  'left',
  'center',
  'right',
];

export const LYRIC_VERTICAL_LABELS: Record<LyricVerticalAlign, string> = {
  top: 'Top',
  center: 'Center',
  bottom: 'Bottom',
};

export const LYRIC_HORIZONTAL_LABELS: Record<LyricHorizontalAlign, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
};
