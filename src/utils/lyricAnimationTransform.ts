import type { CSSProperties } from 'react';

import type { LyricAnimationPresetId } from '../constants/videoLyricAnimation';
import { LYRIC_ANIMATION_DURATION_SEC } from '../constants/videoLyricAnimation';

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

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

type PresetCalculator = (
  progress: number,
  eased: number,
  fontSize: number,
) => LyricAnimationTransform;

const withBase = (
  partial: Partial<LyricAnimationTransform>,
): LyricAnimationTransform => ({
  ...IDENTITY,
  ...partial,
});

const enterCalculators: Record<
  Exclude<LyricAnimationPresetId, 'none'>,
  PresetCalculator
> = {
  fade_in: (_progress, eased) => withBase({ opacity: eased }),
  rise_up: (_progress, eased, fontSize) =>
    withBase({ opacity: eased, translateY: (1 - eased) * fontSize * 0.55 }),
  drop_down: (_progress, eased, fontSize) =>
    withBase({ opacity: eased, translateY: (1 - eased) * fontSize * -0.55 }),
  scale_in: (_progress, eased) =>
    withBase({ opacity: eased, scale: 0.35 + eased * 0.65 }),
  pop: (progress, _eased) =>
    withBase({
      opacity: Math.min(1, progress * 1.4),
      scale: progress < 0.55 ? easeOutBack(progress / 0.55) : 1,
    }),
  blur_in: (_progress, eased, fontSize) =>
    withBase({ opacity: eased, blurPx: (1 - eased) * fontSize * 0.35 }),
  bounce: (progress, _eased) => {
    const bounce =
      progress < 0.6
        ? easeOutCubic(progress / 0.6)
        : 1 - Math.sin((progress - 0.6) * Math.PI * 5) * 0.08 * (1 - progress);
    return withBase({
      opacity: clamp01(progress * 1.5),
      translateY: (1 - bounce) * 24,
      scale: 0.9 + bounce * 0.1,
    });
  },
  elastic: (progress) =>
    withBase({
      opacity: clamp01(progress * 1.2),
      scale: progress < 1 ? easeOutBack(progress) : 1,
    }),
  glitch: (progress, eased) => {
    const jitter = Math.sin(progress * 42) * (1 - eased) * 6;
    return withBase({
      opacity: eased > 0.15 ? 0.75 + eased * 0.25 : 0.4,
      translateX: jitter,
      translateY: Math.cos(progress * 37) * (1 - eased) * 4,
    });
  },
  zoom_blur: (_progress, eased, fontSize) =>
    withBase({
      opacity: eased,
      scale: 1.35 - eased * 0.35,
      blurPx: (1 - eased) * fontSize * 0.25,
    }),
};

const exitCalculators: Record<
  Exclude<LyricAnimationPresetId, 'none'>,
  PresetCalculator
> = {
  fade_in: (_progress, eased) => withBase({ opacity: 1 - eased }),
  rise_up: (_progress, eased, fontSize) =>
    withBase({
      opacity: 1 - eased,
      translateY: -eased * fontSize * 0.55,
    }),
  drop_down: (_progress, eased, fontSize) =>
    withBase({
      opacity: 1 - eased,
      translateY: eased * fontSize * 0.55,
    }),
  scale_in: (_progress, eased, fontSize) =>
    withBase({
      opacity: 1 - eased,
      scale: 1 + eased * 0.72,
      blurPx: eased * fontSize * 0.42,
    }),
  pop: (progress, _eased) => {
    const t = easeOutCubic(progress);
    return withBase({
      opacity: 1 - t,
      scale: 1 - t * 0.58,
    });
  },
  blur_in: (_progress, eased, fontSize) =>
    withBase({
      opacity: 1 - eased,
      blurPx: eased * fontSize * 0.35,
    }),
  bounce: (progress, _eased) => {
    const t = easeOutCubic(progress);
    return withBase({
      opacity: 1 - t,
      translateY: t * 22,
      scale: 1 - t * 0.1,
    });
  },
  elastic: (progress) => {
    const t = easeOutCubic(progress);
    return withBase({
      opacity: 1 - t,
      scale: Math.max(0.12, 1 - easeOutBack(progress) * 0.88),
    });
  },
  glitch: (progress, eased) => {
    const fade = 1 - eased;
    return withBase({
      opacity: fade,
      translateX: Math.sin(progress * 48) * progress * 9,
      translateY: Math.cos(progress * 41) * progress * 6,
    });
  },
  zoom_blur: (_progress, eased, fontSize) =>
    withBase({
      opacity: 1 - eased,
      scale: 1 + eased * 0.35,
      blurPx: eased * fontSize * 0.25,
    }),
};

const computeEnter = (
  preset: Exclude<LyricAnimationPresetId, 'none'>,
  progress: number,
  fontSize: number,
): LyricAnimationTransform => {
  const eased = easeOutCubic(clamp01(progress));
  return enterCalculators[preset](clamp01(progress), eased, fontSize);
};

const computeExit = (
  preset: Exclude<LyricAnimationPresetId, 'none'>,
  progress: number,
  fontSize: number,
): LyricAnimationTransform => {
  const eased = easeOutCubic(clamp01(progress));
  return exitCalculators[preset](clamp01(progress), eased, fontSize);
};

export const getLyricAnimationTransform = (
  preset: LyricAnimationPresetId,
  timeSec: number,
  lineStartSec: number | null,
  lineEndSec: number | null,
  fontSize: number,
): LyricAnimationTransform => {
  if (preset === 'none' || lineStartSec === null) {
    return IDENTITY;
  }

  const elapsed = timeSec - lineStartSec;
  if (elapsed < 0) {
    return IDENTITY;
  }

  const duration = LYRIC_ANIMATION_DURATION_SEC;
  const hasLineEnd = lineEndSec !== null && Number.isFinite(lineEndSec);
  const remaining = hasLineEnd ? lineEndSec - timeSec : Number.POSITIVE_INFINITY;

  if (hasLineEnd && remaining <= 0) {
    return IDENTITY;
  }

  const lineDuration = hasLineEnd ? lineEndSec - lineStartSec : null;

  if (
    lineDuration !== null &&
    lineDuration > 0 &&
    lineDuration < duration * 2
  ) {
    const phase = clamp01(elapsed / lineDuration);
    if (phase < 0.5) {
      return computeEnter(preset, phase * 2, fontSize);
    }
    return computeExit(preset, (phase - 0.5) * 2, fontSize);
  }

  if (hasLineEnd && remaining < duration) {
    const exitProgress = 1 - remaining / duration;
    return computeExit(preset, exitProgress, fontSize);
  }

  if (elapsed < duration) {
    const enterProgress = elapsed / duration;
    return computeEnter(preset, enterProgress, fontSize);
  }

  return IDENTITY;
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
