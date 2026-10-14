import {
  LYRIC_EFFECT_BG_TINT_OPACITY,
  hexToRgbaCanvas,
  type LyricEffectColorSettings,
  hasActiveLyricVisualEffect,
  resolveLyricEffectPalette,
} from '../constants/lyricEffectColors';
import type { LyricVisualEffects } from '../constants/videoLyricEffects';

export const drawLyricEffectBackgroundTint = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effects: LyricVisualEffects,
  colorSettings: LyricEffectColorSettings,
): void => {
  if (!hasActiveLyricVisualEffect(effects)) {
    return;
  }

  const palette = resolveLyricEffectPalette(colorSettings);
  const tint = hexToRgbaCanvas(palette.backgroundTint, LYRIC_EFFECT_BG_TINT_OPACITY);

  ctx.save();
  ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${tint.a})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};
