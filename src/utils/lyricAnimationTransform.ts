import type { CSSProperties } from 'react';

import type {
  LyricAnimationPresetId,
  LyricLineAnimationPresetId,
} from '../constants/videoLyricAnimation';
import { LYRIC_ANIMATION_DURATION_SEC } from '../constants/videoLyricAnimation';
import { isWordRandomAnimationPreset } from './lyricWordAnimation';

export type LyricAnimationTransform = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotation: number;
  blurPx: number;
};

const IDENTITY: LyricAnimationTransform = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0,
  blurPx: 0,
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const withBase = (
  partial: Partial<LyricAnimationTransform>,
): LyricAnimationTransform => ({
  ...IDENTITY,
  ...partial,
});

const computePchipDerivatives = (xs: number[], ys: number[]): number[] => {
  const count = xs.length;
  const derivatives = new Array<number>(count).fill(0);
  const slopes = new Array<number>(count - 1);

  for (let index = 0; index < count - 1; index += 1) {
    const span = xs[index + 1] - xs[index];
    slopes[index] = span > 0 ? (ys[index + 1] - ys[index]) / span : 0;
  }

  derivatives[0] = slopes[0];
  derivatives[count - 1] = slopes[count - 2];

  for (let index = 1; index < count - 1; index += 1) {
    const prevSlope = slopes[index - 1];
    const nextSlope = slopes[index];
    if (prevSlope === 0 || nextSlope === 0 || prevSlope * nextSlope <= 0) {
      derivatives[index] = 0;
      continue;
    }

    const leftSpan = xs[index] - xs[index - 1];
    const rightSpan = xs[index + 1] - xs[index];
    const weight1 = 2 * rightSpan + leftSpan;
    const weight2 = rightSpan + 2 * leftSpan;
    derivatives[index] =
      (weight1 + weight2) / (weight1 / prevSlope + weight2 / nextSlope);
  }

  return derivatives;
};

const evaluatePchip = (
  xs: number[],
  ys: number[],
  derivatives: number[],
  x: number,
): number => {
  const count = xs.length;
  if (x <= xs[0]) {
    return ys[0];
  }
  if (x >= xs[count - 1]) {
    return ys[count - 1];
  }

  let segment = 0;
  while (segment < count - 1 && x > xs[segment + 1]) {
    segment += 1;
  }

  const span = xs[segment + 1] - xs[segment];
  const t = span > 0 ? (x - xs[segment]) / span : 0;
  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return (
    h00 * ys[segment] +
    h10 * span * derivatives[segment] +
    h01 * ys[segment + 1] +
    h11 * span * derivatives[segment + 1]
  );
};

const interpolateChannel = (
  knotU: number[],
  knotValues: number[],
  u: number,
): number => {
  const derivatives = computePchipDerivatives(knotU, knotValues);
  return evaluatePchip(knotU, knotValues, derivatives, u);
};

type LineMotionContext = {
  u: number;
  edge: number;
  fadeEdge: number;
  fontSize: number;
  fadeOut: boolean;
};

const buildKnotU = (edge: number): number[] => [0, edge, 1 - edge, 1];

const getLineMotionContext = (
  elapsed: number,
  duration: number,
  lineDuration: number | null,
  hasLineEnd: boolean,
): LineMotionContext => {
  const effectiveDuration =
    lineDuration !== null && lineDuration > 0
      ? lineDuration
      : duration + 3.2;

  const rawEdge = duration / Math.max(effectiveDuration, 0.001);
  const edge = Math.min(0.4, Math.max(0.07, rawEdge));
  const fadeEdge = Math.min(0.52, Math.max(edge, rawEdge * 1.65));

  return {
    u: clamp01(elapsed / effectiveDuration),
    edge,
    fadeEdge,
    fontSize: 0,
    fadeOut: hasLineEnd && lineDuration !== null && lineDuration > 0,
  };
};

const computeOpacity = (ctx: LineMotionContext): number => {
  const knotU = buildKnotU(ctx.fadeEdge);
  const knotOpacity = ctx.fadeOut ? [0, 0.88, 1, 0] : [0, 0.88, 1, 1];
  return clamp01(interpolateChannel(knotU, knotOpacity, ctx.u));
};

/** One travel curve for the whole line: quick settle, slow middle, quick finish. */
const computeTravel = (ctx: LineMotionContext): number =>
  interpolateChannel(buildKnotU(ctx.edge), [0, 0.26, 0.68, 1], ctx.u);

type UnifiedLineMotion = (
  ctx: LineMotionContext,
  travel: number,
  opacity: number,
) => LyricAnimationTransform;

const unifiedLineMotion: Record<LyricLineAnimationPresetId, UnifiedLineMotion> = {
  fade_in: (_ctx, travel, opacity) =>
    withBase({
      opacity,
      scale: 0.94 + travel * 0.06,
    }),
  rise_up: (ctx, travel, opacity) =>
    withBase({
      opacity,
      translateY: (0.55 - travel * 1.18) * ctx.fontSize,
    }),
  drop_down: (ctx, travel, opacity) =>
    withBase({
      opacity,
      translateY: (-0.55 + travel * 1.18) * ctx.fontSize,
    }),
  scale_in: (ctx, travel, opacity) => {
    const scale = 0.35 + travel * 1.08;
    const blurPx =
      travel > 0.62
        ? ((travel - 0.62) / 0.38) * ctx.fontSize * 0.42
        : 0;
    return withBase({ opacity, scale, blurPx });
  },
  pop: (_ctx, travel, opacity) => {
    const settle = Math.min(1, travel / 0.34);
    const scale = 0.4 + settle * 0.6 + Math.max(0, travel - 0.34) * 0.35;
    return withBase({
      opacity,
      scale,
    });
  },
  elastic: (_ctx, travel, opacity) =>
    withBase({
      opacity,
      scale: 0.35 + travel * 1.05,
    }),
  glitch: (ctx, _travel, opacity) => {
    const { u, fadeEdge, fadeOut } = ctx;
    const inGlitch = u < fadeEdge;
    const outGlitch = fadeOut && u > 1 - fadeEdge;

    if (!inGlitch && !outGlitch) {
      return withBase({ opacity });
    }

    const glitchPhase = inGlitch
      ? 1 - u / fadeEdge
      : (u - (1 - fadeEdge)) / fadeEdge;
    const jitter = glitchPhase * 5.5;
    const wobble = ctx.u * 42;

    return withBase({
      opacity,
      translateX: Math.sin(wobble) * jitter,
      translateY: Math.cos(wobble * 1.25) * jitter * 0.65,
    });
  },
};

const computeUnifiedLineMotion = (
  preset: LyricLineAnimationPresetId,
  ctx: LineMotionContext,
): LyricAnimationTransform => {
  const opacity = computeOpacity(ctx);
  const travel = computeTravel(ctx);
  return unifiedLineMotion[preset](ctx, travel, opacity);
};

export type LyricAnimationTimingOptions = {
  enterDurationSec?: number;
};

export const getLyricAnimationTransform = (
  preset: LyricAnimationPresetId,
  timeSec: number,
  lineStartSec: number | null,
  lineEndSec: number | null,
  fontSize: number,
  timing?: LyricAnimationTimingOptions,
): LyricAnimationTransform => {
  if (isWordRandomAnimationPreset(preset)) {
    return IDENTITY;
  }

  if (preset === 'none' || lineStartSec === null) {
    return IDENTITY;
  }

  const elapsed = timeSec - lineStartSec;
  if (elapsed < 0) {
    return IDENTITY;
  }

  const duration = timing?.enterDurationSec ?? LYRIC_ANIMATION_DURATION_SEC;
  const hasLineEnd = lineEndSec !== null && Number.isFinite(lineEndSec);
  const remaining = hasLineEnd ? lineEndSec - timeSec : Number.POSITIVE_INFINITY;

  if (hasLineEnd && remaining <= 0) {
    return IDENTITY;
  }

  const lineDuration = hasLineEnd ? lineEndSec - lineStartSec : null;
  const motionContext = getLineMotionContext(
    elapsed,
    duration,
    lineDuration,
    hasLineEnd,
  );

  return computeUnifiedLineMotion(preset, {
    ...motionContext,
    fontSize,
  });
};

export const lyricAnimationTransformToStyle = (
  animation: LyricAnimationTransform,
): CSSProperties => {
  const parts: string[] = [];
  if (animation.translateX !== 0 || animation.translateY !== 0) {
    parts.push(
      `translate(${animation.translateX}px, ${animation.translateY}px)`,
    );
  }
  if (animation.scale !== 1) {
    parts.push(`scale(${animation.scale})`);
  }
  if (animation.rotation !== 0) {
    parts.push(`rotate(${animation.rotation}rad)`);
  }

  return {
    opacity: animation.opacity,
    transform: parts.length > 0 ? parts.join(' ') : undefined,
    filter: animation.blurPx > 0 ? `blur(${animation.blurPx}px)` : undefined,
  };
};
