import type { LyricEffectPalette } from '../constants/lyricEffectColors';
import {
  LYRIC_OUTLINE_WIDTH_PX,
  type LyricVisualEffects,
} from '../constants/videoLyricEffects';
import { getLyricGlowWaveFactor } from './lyricGlowWave';
import {
  getCutOutMaxStep,
  paintCutOutBeam,
} from './lyricCutOut';

export type LyricCanvasEffectFrame = {
  width: number;
  height: number;
};

const withAlpha = (hex: string, alpha: number): string => {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const paintGlow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  faceFill: string,
  palette: LyricEffectPalette,
  timeSec: number,
  lineId: string | null,
  lineCharCount: number,
  charIndexOffset: number,
): void => {
  let cursorX = x;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const factor = getLyricGlowWaveFactor(
      charIndexOffset + i,
      timeSec,
      lineId,
      lineCharCount,
    );
    const charWidth = ctx.measureText(char).width;

    ctx.save();
    ctx.fillStyle = faceFill;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.shadowColor = withAlpha('#ffffff', 0.4 + factor * 0.5);
    ctx.shadowBlur = fontSize * (0.2 + factor * 0.22);
    ctx.fillText(char, cursorX, y);

    ctx.shadowColor = withAlpha(palette.glowSecondary, 0.22 + factor * 0.42);
    ctx.shadowBlur = fontSize * (0.5 + factor * 0.4);
    ctx.fillText(char, cursorX, y);

    ctx.shadowColor = withAlpha(palette.accent, 0.12 + factor * 0.28);
    ctx.shadowBlur = fontSize * (0.35 + factor * 0.25);
    ctx.fillText(char, cursorX, y);

    ctx.restore();
    cursorX += charWidth;
  }
};

const paintStickerOutline = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  outlineStroke: string,
): void => {
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = LYRIC_OUTLINE_WIDTH_PX;
  ctx.strokeStyle = outlineStroke;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.restore();
};

const paintFaceFill = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  effects: LyricVisualEffects,
  textFace: string,
): void => {
  const styled = effects.outline || effects.cutOut;
  const faceFill = effects.outline ? textFace : '#ffffff';

  ctx.save();
  ctx.fillStyle = faceFill;

  if (!styled) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = fontSize * 0.2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.04;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.fillText(text, x, y);
  ctx.restore();
};

export const paintLyricTextWithEffects = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  effects: LyricVisualEffects,
  palette: LyricEffectPalette,
  _frame: LyricCanvasEffectFrame,
  timeSec: number,
  lineId: string | null,
  lineCharCount: number,
  charIndexOffset = 0,
): void => {
  const faceFill = effects.outline ? palette.textFace : '#ffffff';

  if (effects.cutOut) {
    const maxStep = getCutOutMaxStep();
    paintCutOutBeam(ctx, text, x, y, maxStep, palette.accent);
  }

  if (effects.glow) {
    paintGlow(
      ctx,
      text,
      x,
      y,
      fontSize,
      faceFill,
      palette,
      timeSec,
      lineId,
      lineCharCount,
      charIndexOffset,
    );
  }

  if (effects.outline) {
    paintStickerOutline(ctx, text, x, y, palette.outlineStroke);
  }

  paintFaceFill(ctx, text, x, y, fontSize, effects, palette.textFace);
};
