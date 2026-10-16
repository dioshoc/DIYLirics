import type { CSSProperties } from 'react';

import {
  hexToRgbaCss,
  type LyricEffectPalette,
} from '../constants/lyricEffectColors';
import type { LyricVisualEffects } from '../constants/videoLyricEffects';
import { buildCutOutTextShadowCss, getCutOutMaxStep } from './lyricCutOut';
import { getLyricGlowWaveFactor } from './lyricGlowWave';

const BASE_DROP_SHADOW = '0 0.17cqh 0.85cqh rgb(0 0 0 / 65%)';

export const getLyricGlowTextShadowCss = (
  factor: number,
  palette: LyricEffectPalette,
): string => {
  const intensity = 0.55 + factor * 0.45;
  const whiteAlpha = 0.42 + factor * 0.48;
  const secondaryAlpha = 0.24 + factor * 0.38;
  const accentAlpha = 0.12 + factor * 0.28;

  return [
    `0 0 ${(0.35 * intensity).toFixed(3)}cqh rgb(255 255 255 / ${whiteAlpha.toFixed(2)})`,
    `0 0 ${(1.1 * intensity).toFixed(3)}cqh ${hexToRgbaCss(palette.glowSecondary, secondaryAlpha)}`,
    `0 0 ${(2.2 * intensity).toFixed(3)}cqh ${hexToRgbaCss(palette.accent, accentAlpha)}`,
  ].join(', ');
};

export const getLyricGlowCharTextShadow = (
  charIndex: number,
  timeSec: number,
  lineId: string | null,
  lineCharCount: number,
  palette: LyricEffectPalette,
): string =>
  getLyricGlowTextShadowCss(
    getLyricGlowWaveFactor(charIndex, timeSec, lineId, lineCharCount),
    palette,
  );

export type LyricEffectPreviewContext = {
  frameWidth: number;
  frameHeight: number;
};

export const getLyricEffectPreviewStyle = (
  effects: LyricVisualEffects,
  palette: LyricEffectPalette,
  context?: LyricEffectPreviewContext,
): CSSProperties | undefined => {
  if (!effects.glow && !effects.outline && !effects.cutOut) {
    return undefined;
  }

  const shadows: string[] = [];
  if (effects.cutOut) {
    const frameHeight = context?.frameHeight ?? 1080;
    const cutOutShadow = buildCutOutTextShadowCss(
      getCutOutMaxStep(),
      frameHeight,
      palette.accent,
    );
    if (cutOutShadow) {
      shadows.push(cutOutShadow);
    }
  } else if (!effects.outline && !effects.glow) {
    shadows.push(BASE_DROP_SHADOW);
  }

  const style: CSSProperties = {
    textShadow:
      shadows.length > 0
        ? shadows.join(', ')
        : effects.outline
          ? 'none'
          : undefined,
  };

  if (effects.outline) {
    style.color = '#ffffff';
    style.WebkitTextStroke = `12px ${palette.outlineStroke}`;
    style.paintOrder = 'stroke fill';
  } else if (effects.cutOut) {
    style.color = '#ffffff';
  }

  return style;
};
