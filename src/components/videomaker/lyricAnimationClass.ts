import type { LyricAnimationPresetId } from '../../constants/videoLyricAnimation';
import animStyles from './LyricAnimation.module.scss';

const ANIM_CLASS_MAP: Record<
  Exclude<LyricAnimationPresetId, 'none'>,
  string
> = {
  fade_in: animStyles.animFadeIn,
  rise_up: animStyles.animRiseUp,
  drop_down: animStyles.animDropDown,
  scale_in: animStyles.animScaleIn,
  pop: animStyles.animPop,
  blur_in: animStyles.animBlurIn,
  bounce: animStyles.animBounce,
  elastic: animStyles.animElastic,
  glitch: animStyles.animGlitch,
  zoom_blur: animStyles.animZoomBlur,
};

const ANIM_LOOP_CLASS_MAP: Record<
  Exclude<LyricAnimationPresetId, 'none'>,
  string
> = {
  fade_in: animStyles.animFadeInLoop,
  rise_up: animStyles.animRiseUpLoop,
  drop_down: animStyles.animDropDownLoop,
  scale_in: animStyles.animScaleInLoop,
  pop: animStyles.animPopLoop,
  blur_in: animStyles.animBlurInLoop,
  bounce: animStyles.animBounceLoop,
  elastic: animStyles.animElasticLoop,
  glitch: animStyles.animGlitchLoop,
  zoom_blur: animStyles.animZoomBlurLoop,
};

export const getLyricAnimationClasses = (
  preset: LyricAnimationPresetId,
  options?: { previewLoop?: boolean },
): string => {
  if (preset === 'none') {
    return animStyles.base;
  }

  const animClass = options?.previewLoop
    ? ANIM_LOOP_CLASS_MAP[preset]
    : ANIM_CLASS_MAP[preset];
  const loopClass = options?.previewLoop ? animStyles.previewLoop : '';
  return [animStyles.base, animClass, loopClass].filter(Boolean).join(' ');
};
