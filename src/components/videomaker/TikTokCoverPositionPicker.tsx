import {
  TIKTOK_COVER_POSITION_LABELS,
  TIKTOK_COVER_POSITION_ORDER,
  type TiktokCoverPosition,
} from '../../constants/tiktokCoverLayout';
import styles from './VideoBackgroundPicker.module.scss';

type TikTokCoverPositionPickerProps = {
  selectedPosition: TiktokCoverPosition;
  onSelect: (position: TiktokCoverPosition) => void;
};

export const TikTokCoverPositionPicker = ({
  selectedPosition,
  onSelect,
}: TikTokCoverPositionPickerProps) => {
  const handleSelect = (position: TiktokCoverPosition) => {
    onSelect(position);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    position: TiktokCoverPosition,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onSelect(position);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Cover layout</h3>
      <div
        className={styles.list}
        role="radiogroup"
        aria-label="TikTok cover layout"
      >
        {TIKTOK_COVER_POSITION_ORDER.map((position) => {
          const isSelected = selectedPosition === position;

          return (
            <button
              key={position}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={styles.option}
              data-selected={isSelected}
              onClick={() => handleSelect(position)}
              onKeyDown={(event) => handleKeyDown(event, position)}
            >
              {TIKTOK_COVER_POSITION_LABELS[position]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
