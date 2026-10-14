import {
  LYRIC_EFFECT_BG_TINT_OPACITY,
  hexToRgbaCss,
  hasActiveLyricVisualEffect,
  resolveLyricEffectPalette,
  type LyricEffectColorSettings,
} from '../../constants/lyricEffectColors';
import type { LyricVisualEffects } from '../../constants/videoLyricEffects';
import styles from './VideomakerPanel.module.scss';

type LyricEffectBackgroundTintProps = {
  effects: LyricVisualEffects;
  colorSettings: LyricEffectColorSettings;
};

export const LyricEffectBackgroundTint = ({
  effects,
  colorSettings,
}: LyricEffectBackgroundTintProps) => {
  if (!hasActiveLyricVisualEffect(effects)) {
    return null;
  }

  const palette = resolveLyricEffectPalette(colorSettings);

  return (
    <div
      className={styles.lyricEffectTint}
      style={{
        backgroundColor: hexToRgbaCss(
          palette.backgroundTint,
          LYRIC_EFFECT_BG_TINT_OPACITY,
        ),
      }}
      aria-hidden
    />
  );
};
