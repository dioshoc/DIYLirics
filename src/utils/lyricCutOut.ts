import {
  LYRIC_CUTOUT_LENGTH_PX,
  LYRIC_CUTOUT_STEP_PX,
} from '../constants/videoLyricEffects';

/** ~45° beam down-right, like reference cut-out shadow. */
export const CUTOUT_DIR_X = 0.707;
export const CUTOUT_DIR_Y = 0.707;

const offsetAtStep = (step: number): { x: number; y: number } => ({
  x: step * LYRIC_CUTOUT_STEP_PX * CUTOUT_DIR_X,
  y: step * LYRIC_CUTOUT_STEP_PX * CUTOUT_DIR_Y,
});

export const getCutOutMaxStep = (): number =>
  Math.ceil(LYRIC_CUTOUT_LENGTH_PX / LYRIC_CUTOUT_STEP_PX);

export const paintCutOutBeam = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxStep: number,
  fillColor: string,
): void => {
  if (maxStep <= 0) {
    return;
  }

  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fillColor;

  for (let step = maxStep; step >= 1; step -= 1) {
    const { x: dx, y: dy } = offsetAtStep(step);
    ctx.fillText(text, x + dx, y + dy);
  }

  ctx.restore();
};

export const buildCutOutTextShadowCss = (
  maxStep: number,
  frameHeight: number,
  fillColor: string,
): string => {
  if (maxStep <= 0 || frameHeight <= 0) {
    return '';
  }

  const parts: string[] = [];
  const stepCqh = (LYRIC_CUTOUT_STEP_PX / frameHeight) * 100;

  for (let step = 1; step <= maxStep; step += 1) {
    const d = step * stepCqh;
    parts.push(`${d.toFixed(3)}cqh ${d.toFixed(3)}cqh 0 ${fillColor}`);
  }

  return parts.join(', ');
};
