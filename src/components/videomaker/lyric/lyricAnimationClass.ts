import type { LyricAnimationPresetId } from '../../../constants/videoLyricAnimation';
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
  elastic: animStyles.animElastic,
  glitch: animStyles.animGlitch,
  words_random_fade: animStyles.animFadeIn,
  words_random_rise: animStyles.animRiseUp,
  words_random_pop: animStyles.animPop,
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
  elastic: animStyles.animElasticLoop,
  glitch: animStyles.animGlitchLoop,
  words_random_fade: animStyles.animFadeInLoop,
  words_random_rise: animStyles.animRiseUpLoop,
  words_random_pop: animStyles.animPopLoop,
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
