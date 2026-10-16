import type { CSSProperties } from 'react';

import {
  DEFAULT_LYRIC_EFFECT_COLOR,
  LYRIC_EFFECT_COLOR_SCHEMES,
  resolveLyricEffectPalette,
  type LyricEffectColorSchemeId,
  type LyricEffectColorSettings,
} from '../../../constants/lyricEffectColors';
import {
  DEFAULT_LYRIC_VISUAL_EFFECTS,
  LYRIC_EFFECT_LABELS,
  LYRIC_EFFECT_ORDER,
  lyricEffectsWithSingle,
  type LyricEffectId,
  type LyricVisualEffects,
} from '../../../constants/videoLyricEffects';
import { Section } from '../../shared/section/Section';
import pickerStyles from './LyricEffectsPicker.module.scss';

type LyricEffectsPickerProps = {
  effects: LyricVisualEffects;
  color: LyricEffectColorSettings;
  onChange: (effects: LyricVisualEffects) => void;
  onColorChange: (color: LyricEffectColorSettings) => void;
};

const BanIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </svg>
);

const isNoEffects = (effects: LyricVisualEffects): boolean =>
  !effects.glow && !effects.outline && !effects.cutOut;

const PREVIEW_STYLE: Record<
  LyricEffectId,
  (accent: string, stroke: string, face: string) => CSSProperties
> = {
  glow: (accent, _stroke, _face) => ({
    textShadow: `0 0 3px rgb(255 255 255 / 95%), 0 0 8px ${accent}`,
  }),
  outline: (_accent, stroke, _face) => ({
    color: '#ffffff',
    WebkitTextStroke: `2px ${stroke}`,
    paintOrder: 'stroke fill',
    textShadow: 'none',
  }),
  cutOut: (accent) => ({
    textShadow: `1px 1px 0 ${accent}, 2px 2px 0 ${accent}, 3px 3px 0 ${accent}, 4px 4px 0 ${accent}`,
  }),
};

export const LyricEffectsPicker = ({
  effects,
  color,
  onChange,
  onColorChange,
}: LyricEffectsPickerProps) => {
  const handleTileKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    action: () => void,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    action();
  };

  const handleClearEffects = () => {
    onChange({ ...DEFAULT_LYRIC_VISUAL_EFFECTS });
  };

  const handleSelectEffect = (effectId: LyricEffectId) => {
    if (effects[effectId]) {
      onChange({ ...DEFAULT_LYRIC_VISUAL_EFFECTS });
      return;
    }
    onChange(lyricEffectsWithSingle(effectId));
  };

  const handleSelectScheme = (schemeId: LyricEffectColorSchemeId) => {
    onColorChange({
      ...color,
      schemeId,
    });
  };

  const handleCustomColorChange = (value: string) => {
    onColorChange({
      schemeId: 'custom',
      customAccent: value,
    });
  };

  const previewPalette = resolveLyricEffectPalette(color);

  const noEffectsSelected = isNoEffects(effects);
  const isCustom = color.schemeId === 'custom';

  return (
    <Section title="Lyric effects">
      <div
        className={pickerStyles.grid}
        role="group"
        aria-label="Lyric visual effects"
      >
        <button
          type="button"
          aria-pressed={noEffectsSelected}
          className={pickerStyles.tile}
          data-selected={noEffectsSelected}
          onClick={handleClearEffects}
          onKeyDown={(event) => handleTileKeyDown(event, handleClearEffects)}
        >
          <span className={pickerStyles.noneIcon} aria-hidden>
            <BanIcon />
          </span>
          <span className={pickerStyles.name}>No effects</span>
        </button>
        {LYRIC_EFFECT_ORDER.map((effectId) => {
          const isSelected = effects[effectId];
          const previewStyle = PREVIEW_STYLE[effectId](
            previewPalette.accent,
            previewPalette.outlineStroke,
            previewPalette.textFace,
          );

          return (
            <button
              key={effectId}
              type="button"
              aria-pressed={isSelected}
              className={pickerStyles.tile}
              data-selected={isSelected}
              onClick={() => handleSelectEffect(effectId)}
              onKeyDown={(event) =>
                handleTileKeyDown(event, () => handleSelectEffect(effectId))
              }
            >
              <span
                className={pickerStyles.preview}
                style={previewStyle}
                aria-hidden
              >
                Aa
              </span>
              <span className={pickerStyles.name}>
                {LYRIC_EFFECT_LABELS[effectId]}
              </span>
            </button>
          );
        })}
      </div>

      <h4 className={pickerStyles.colorTitle}>Effect color</h4>
      <div
        className={pickerStyles.colorGrid}
        role="listbox"
        aria-label="Effect color schemes"
      >
        {LYRIC_EFFECT_COLOR_SCHEMES.map((scheme) => {
          const isSelected = color.schemeId === scheme.id;
          return (
            <button
              key={scheme.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={pickerStyles.colorSwatch}
              data-selected={isSelected}
              title={scheme.label}
              onClick={() => handleSelectScheme(scheme.id)}
              onKeyDown={(event) =>
                handleTileKeyDown(event, () => handleSelectScheme(scheme.id))
              }
            >
              <span
                className={pickerStyles.colorSwatchDot}
                style={{ backgroundColor: scheme.palette.accent }}
                aria-hidden
              />
              <span
                className={pickerStyles.colorSwatchTint}
                style={{ backgroundColor: scheme.palette.backgroundTint }}
                aria-hidden
              />
            </button>
          );
        })}
        <button
          type="button"
          role="option"
          aria-selected={isCustom}
          className={pickerStyles.colorSwatch}
          data-selected={isCustom}
          data-custom="true"
          title="Custom color"
          onClick={() => handleSelectScheme('custom')}
          onKeyDown={(event) =>
            handleTileKeyDown(event, () => handleSelectScheme('custom'))
          }
        >
          <span className={pickerStyles.colorCustomMark} aria-hidden>+</span>
        </button>
      </div>

      <label className={pickerStyles.colorPickerRow}>
        <span className={pickerStyles.colorPickerLabel}>Custom</span>
        <input
          type="color"
          className={pickerStyles.colorInput}
          value={
            isCustom ? color.customAccent : DEFAULT_LYRIC_EFFECT_COLOR.customAccent
          }
          onChange={(event) => handleCustomColorChange(event.target.value)}
          aria-label="Custom effect accent color"
        />
        <span className={pickerStyles.colorHex}>
          {isCustom ? color.customAccent : previewPalette.accent}
        </span>
      </label>
    </Section>
  );
};
