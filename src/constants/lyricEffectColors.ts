import type { LyricVisualEffects } from './videoLyricEffects';

export const LYRIC_EFFECT_BG_TINT_OPACITY = 0.1;

export type LyricEffectColorSchemeId =
  | 'golden-hour'
  | 'arctic-blue'
  | 'coral-kiss'
  | 'mint-frost'
  | 'lavender-dream'
  | 'peach-sorbet'
  | 'neon-cyan'
  | 'cherry-bloom'
  | 'citrus-lime'
  | 'sunset-amber'
  | 'polar-night'
  | 'cotton-candy'
  | 'custom';

export type LyricEffectColorSettings = {
  schemeId: LyricEffectColorSchemeId;
  customAccent: string;
};

export type LyricEffectPalette = {
  accent: string;
  glowSecondary: string;
  outlineStroke: string;
  textFace: string;
  backgroundTint: string;
};

export const DEFAULT_LYRIC_EFFECT_COLOR: LyricEffectColorSettings = {
  schemeId: 'golden-hour',
  customAccent: '#f5dc00',
};

type SchemeDefinition = {
  id: Exclude<LyricEffectColorSchemeId, 'custom'>;
  label: string;
  palette: LyricEffectPalette;
};

export const LYRIC_EFFECT_COLOR_SCHEMES: SchemeDefinition[] = [
  {
    id: 'golden-hour',
    label: 'Golden hour',
    palette: {
      accent: '#f5dc00',
      glowSecondary: '#8cb4ff',
      outlineStroke: '#ffffff',
      textFace: '#fff6e8',
      backgroundTint: '#2a2200',
    },
  },
  {
    id: 'arctic-blue',
    label: 'Arctic blue',
    palette: {
      accent: '#6ec8ff',
      glowSecondary: '#b8e8ff',
      outlineStroke: '#f0f8ff',
      textFace: '#eef8ff',
      backgroundTint: '#001a2e',
    },
  },
  {
    id: 'coral-kiss',
    label: 'Coral kiss',
    palette: {
      accent: '#ff6b7a',
      glowSecondary: '#ffb3bc',
      outlineStroke: '#fff0f2',
      textFace: '#fff5f6',
      backgroundTint: '#2a0810',
    },
  },
  {
    id: 'mint-frost',
    label: 'Mint frost',
    palette: {
      accent: '#5dffb8',
      glowSecondary: '#b8ffe0',
      outlineStroke: '#f0fff8',
      textFace: '#edfff6',
      backgroundTint: '#082018',
    },
  },
  {
    id: 'lavender-dream',
    label: 'Lavender dream',
    palette: {
      accent: '#c4a8ff',
      glowSecondary: '#e4d4ff',
      outlineStroke: '#f8f2ff',
      textFace: '#f6f0ff',
      backgroundTint: '#1a1028',
    },
  },
  {
    id: 'peach-sorbet',
    label: 'Peach sorbet',
    palette: {
      accent: '#ffb088',
      glowSecondary: '#ffd4b8',
      outlineStroke: '#fff5ee',
      textFace: '#fff8f2',
      backgroundTint: '#281408',
    },
  },
  {
    id: 'neon-cyan',
    label: 'Neon cyan',
    palette: {
      accent: '#00e5ff',
      glowSecondary: '#7af0ff',
      outlineStroke: '#e8fcff',
      textFace: '#e8ffff',
      backgroundTint: '#002228',
    },
  },
  {
    id: 'cherry-bloom',
    label: 'Cherry bloom',
    palette: {
      accent: '#ff8ec4',
      glowSecondary: '#ffc0e0',
      outlineStroke: '#fff0f8',
      textFace: '#fff5fa',
      backgroundTint: '#280818',
    },
  },
  {
    id: 'citrus-lime',
    label: 'Citrus lime',
    palette: {
      accent: '#b8ff4a',
      glowSecondary: '#dcff9e',
      outlineStroke: '#f8fff0',
      textFace: '#f6ffe8',
      backgroundTint: '#182800',
    },
  },
  {
    id: 'sunset-amber',
    label: 'Sunset amber',
    palette: {
      accent: '#ff9a3c',
      glowSecondary: '#ffc48a',
      outlineStroke: '#fff4e8',
      textFace: '#fff6ee',
      backgroundTint: '#281400',
    },
  },
  {
    id: 'polar-night',
    label: 'Polar night',
    palette: {
      accent: '#e8f0ff',
      glowSecondary: '#a8c4ff',
      outlineStroke: '#ffffff',
      textFace: '#f4f8ff',
      backgroundTint: '#0a0e18',
    },
  },
  {
    id: 'cotton-candy',
    label: 'Cotton candy',
    palette: {
      accent: '#ff9cf0',
      glowSecondary: '#c8b8ff',
      outlineStroke: '#fff5fd',
      textFace: '#fff8fe',
      backgroundTint: '#200818',
    },
  },
];

export const LYRIC_EFFECT_COLOR_SCHEME_ORDER: LyricEffectColorSchemeId[] = [
  ...LYRIC_EFFECT_COLOR_SCHEMES.map((entry) => entry.id),
  'custom',
];

const normalizeHex = (hex: string): string => {
  const trimmed = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return DEFAULT_LYRIC_EFFECT_COLOR.customAccent;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const value = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const channel = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

const mixHex = (a: string, b: string, ratio: number): string => {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  const t = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t,
  );
};

const contrastBackgroundTint = (accent: string): string => {
  const { r, g, b } = hexToRgb(accent);
  return rgbToHex(255 - r * 0.65, 255 - g * 0.65, 255 - b * 0.65);
};

const outlineStrokeFromAccent = (accent: string): string =>
  mixHex(normalizeHex(accent), '#000000', 0.22);

const paletteFromAccent = (accentHex: string): LyricEffectPalette => {
  const accent = normalizeHex(accentHex);
  return {
    accent,
    glowSecondary: mixHex(accent, '#ffffff', 0.45),
    outlineStroke: outlineStrokeFromAccent(accent),
    textFace: mixHex(accent, '#ffffff', 0.88),
    backgroundTint: contrastBackgroundTint(accent),
  };
};

const withAccentDerivedOutline = (
  palette: LyricEffectPalette,
): LyricEffectPalette => ({
  ...palette,
  outlineStroke: outlineStrokeFromAccent(palette.accent),
});

export const resolveLyricEffectPalette = (
  settings: LyricEffectColorSettings,
): LyricEffectPalette => {
  if (settings.schemeId === 'custom') {
    return paletteFromAccent(settings.customAccent);
  }
  const match = LYRIC_EFFECT_COLOR_SCHEMES.find(
    (entry) => entry.id === settings.schemeId,
  );
  const base = match?.palette ?? LYRIC_EFFECT_COLOR_SCHEMES[0].palette;
  return withAccentDerivedOutline(base);
};

export const isLyricEffectColorSchemeId = (
  value: string,
): value is LyricEffectColorSchemeId =>
  LYRIC_EFFECT_COLOR_SCHEME_ORDER.includes(value as LyricEffectColorSchemeId);

export const normalizeLyricEffectColorSettings = (
  raw?: Partial<LyricEffectColorSettings>,
): LyricEffectColorSettings => ({
  schemeId:
    raw?.schemeId && isLyricEffectColorSchemeId(raw.schemeId)
      ? raw.schemeId
      : DEFAULT_LYRIC_EFFECT_COLOR.schemeId,
  customAccent: normalizeHex(
    raw?.customAccent ?? DEFAULT_LYRIC_EFFECT_COLOR.customAccent,
  ),
});

export const hasActiveLyricVisualEffect = (
  effects: LyricVisualEffects,
): boolean => effects.glow || effects.outline || effects.cutOut;

export const hexToRgbaCss = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
};

export const hexToRgbaCanvas = (
  hex: string,
  alpha: number,
): { r: number; g: number; b: number; a: number } => {
  const { r, g, b } = hexToRgb(hex);
  return { r, g, b, a: alpha };
};
