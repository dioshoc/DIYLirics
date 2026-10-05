import {
  LYRIC_ANIMATION_PRESET_LABELS,
  LYRIC_ANIMATION_PRESET_ORDER,
  type LyricAnimationPresetId,
} from '../../constants/videoLyricAnimation';
import { getLyricAnimationClasses } from './lyricAnimationClass';
import styles from './VideoBackgroundPicker.module.scss';
import pickerStyles from './LyricAnimationPicker.module.scss';

type LyricAnimationPickerProps = {
  selectedId: LyricAnimationPresetId;
  onSelect: (presetId: LyricAnimationPresetId) => void;
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

export const LyricAnimationPicker = ({
  selectedId,
  onSelect,
}: LyricAnimationPickerProps) => {
  const handleTileKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    presetId: LyricAnimationPresetId,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onSelect(presetId);
  };

  const isNoneSelected = selectedId === 'none';

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Lyric entrance</h3>
      <div
        className={pickerStyles.grid}
        role="radiogroup"
        aria-label="Lyric entrance animation"
      >
        <button
          type="button"
          role="radio"
          aria-checked={isNoneSelected}
          className={pickerStyles.tile}
          data-selected={isNoneSelected}
          onClick={() => onSelect('none')}
          onKeyDown={(event) => handleTileKeyDown(event, 'none')}
        >
          <span className={pickerStyles.noneIcon} aria-hidden>
            <BanIcon />
          </span>
          <span className={pickerStyles.name}>No animation</span>
        </button>
        {LYRIC_ANIMATION_PRESET_ORDER.map((presetId) => {
          const isSelected = selectedId === presetId;
          const previewClass = getLyricAnimationClasses(presetId, {
            previewLoop: true,
          });

          return (
            <button
              key={presetId}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={pickerStyles.tile}
              data-selected={isSelected}
              onClick={() => onSelect(presetId)}
              onKeyDown={(event) => handleTileKeyDown(event, presetId)}
            >
              <span className={previewClass} aria-hidden>Aa</span>
              <span className={pickerStyles.name}>
                {LYRIC_ANIMATION_PRESET_LABELS[presetId]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
