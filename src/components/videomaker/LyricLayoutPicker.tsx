import {
  LYRIC_FONT_SIZE_LABELS,
  LYRIC_FONT_SIZE_ORDER,
  type LyricFontSize,
} from '../../constants/videoLyricFontSize';
import {
  LYRIC_HORIZONTAL_LABELS,
  LYRIC_HORIZONTAL_ORDER,
  LYRIC_VERTICAL_LABELS,
  LYRIC_VERTICAL_ORDER,
  type LyricHorizontalAlign,
  type LyricVerticalAlign,
} from '../../constants/videoLyricLayout';
import styles from './VideoBackgroundPicker.module.scss';
import pickerStyles from './LyricLayoutPicker.module.scss';

type LyricLayoutPickerProps = {
  verticalAlign: LyricVerticalAlign;
  horizontalAlign: LyricHorizontalAlign;
  fontSize: LyricFontSize;
  onVerticalAlignChange: (align: LyricVerticalAlign) => void;
  onHorizontalAlignChange: (align: LyricHorizontalAlign) => void;
  onFontSizeChange: (size: LyricFontSize) => void;
};

export const LyricLayoutPicker = ({
  verticalAlign,
  horizontalAlign,
  fontSize,
  onVerticalAlignChange,
  onHorizontalAlignChange,
  onFontSizeChange,
}: LyricLayoutPickerProps) => {
  const handleVerticalKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    align: LyricVerticalAlign,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onVerticalAlignChange(align);
  };

  const handleHorizontalKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    align: LyricHorizontalAlign,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onHorizontalAlignChange(align);
  };

  const handleFontSizeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    size: LyricFontSize,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onFontSizeChange(size);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Lyric position</h3>
      <div className={pickerStyles.group}>
        <span className={pickerStyles.groupLabel}>Vertical</span>
        <div
          className={pickerStyles.row}
          role="radiogroup"
          aria-label="Lyric vertical position"
        >
          {LYRIC_VERTICAL_ORDER.map((align) => {
            const isSelected = verticalAlign === align;

            return (
              <button
                key={align}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={pickerStyles.chip}
                data-selected={isSelected}
                onClick={() => onVerticalAlignChange(align)}
                onKeyDown={(event) => handleVerticalKeyDown(event, align)}
              >
                {LYRIC_VERTICAL_LABELS[align]}
              </button>
            );
          })}
        </div>
      </div>
      <div className={pickerStyles.group}>
        <span className={pickerStyles.groupLabel}>Horizontal</span>
        <div
          className={pickerStyles.row}
          role="radiogroup"
          aria-label="Lyric horizontal alignment"
        >
          {LYRIC_HORIZONTAL_ORDER.map((align) => {
            const isSelected = horizontalAlign === align;

            return (
              <button
                key={align}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={pickerStyles.chip}
                data-selected={isSelected}
                onClick={() => onHorizontalAlignChange(align)}
                onKeyDown={(event) => handleHorizontalKeyDown(event, align)}
              >
                {LYRIC_HORIZONTAL_LABELS[align]}
              </button>
            );
          })}
        </div>
      </div>
      <div className={pickerStyles.group}>
        <span className={pickerStyles.groupLabel}>Text size</span>
        <div
          className={pickerStyles.row}
          role="radiogroup"
          aria-label="Lyric text size"
        >
          {LYRIC_FONT_SIZE_ORDER.map((size) => {
            const isSelected = fontSize === size;

            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={pickerStyles.chip}
                data-selected={isSelected}
                onClick={() => onFontSizeChange(size)}
                onKeyDown={(event) => handleFontSizeKeyDown(event, size)}
              >
                {LYRIC_FONT_SIZE_LABELS[size]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
