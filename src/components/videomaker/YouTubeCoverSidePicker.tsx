import {
  YOUTUBE_COVER_SIDE_LABELS,
  YOUTUBE_COVER_SIDE_ORDER,
  type YoutubeCoverSide,
} from '../../constants/youtubeCoverLayout';
import styles from './VideoBackgroundPicker.module.scss';

type YouTubeCoverSidePickerProps = {
  selectedSide: YoutubeCoverSide;
  onSelect: (side: YoutubeCoverSide) => void;
};

export const YouTubeCoverSidePicker = ({
  selectedSide,
  onSelect,
}: YouTubeCoverSidePickerProps) => {
  const handleSelect = (side: YoutubeCoverSide) => {
    onSelect(side);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    side: YoutubeCoverSide,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onSelect(side);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Cover layout</h3>
      <div
        className={styles.list}
        role="radiogroup"
        aria-label="YouTube cover layout"
      >
        {YOUTUBE_COVER_SIDE_ORDER.map((side) => {
          const isSelected = selectedSide === side;

          return (
            <button
              key={side}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={styles.option}
              data-selected={isSelected}
              onClick={() => handleSelect(side)}
              onKeyDown={(event) => handleKeyDown(event, side)}
            >
              {YOUTUBE_COVER_SIDE_LABELS[side]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
