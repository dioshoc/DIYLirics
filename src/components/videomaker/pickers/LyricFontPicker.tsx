import {
  ALL_LYRIC_FONTS,
  getLyricFontCssFamily,
  type LyricFontId,
} from '../../../constants/videoLyricFonts';
import { Section } from '../../shared/section/Section';
import pickerStyles from './LyricFontPicker.module.scss';

type LyricFontPickerProps = {
  selectedId: LyricFontId;
  onSelect: (fontId: LyricFontId) => void;
};

export const LyricFontPicker = ({
  selectedId,
  onSelect,
}: LyricFontPickerProps) => {
  const handleTileKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    fontId: LyricFontId,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onSelect(fontId);
  };

  return (
    <Section title="Lyric font">
      <div
        className={pickerStyles.grid}
        role="radiogroup"
        aria-label="Lyric font family"
      >
        {ALL_LYRIC_FONTS.map((entry) => {
          const isSelected = selectedId === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={pickerStyles.tile}
              data-selected={isSelected}
              title={entry.label}
              onClick={() => onSelect(entry.id)}
              onKeyDown={(event) => handleTileKeyDown(event, entry.id)}
            >
              <span
                className={pickerStyles.sample}
                style={{ fontFamily: getLyricFontCssFamily(entry.id) }}
                aria-hidden
              >
                Aa
              </span>
              <span className={pickerStyles.name}>{entry.label}</span>
            </button>
          );
        })}
      </div>
    </Section>
  );
};
