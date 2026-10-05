import styles from './VideoBackgroundPicker.module.scss';
import pickerStyles from './LyricLayoutPicker.module.scss';

type TrackInfoUnderCoverPickerProps = {
  showTrackInfo: boolean;
  onChange: (showTrackInfo: boolean) => void;
};

export const TrackInfoUnderCoverPicker = ({
  showTrackInfo,
  onChange,
}: TrackInfoUnderCoverPickerProps) => {
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    next: boolean,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onChange(next);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Track info under cover</h3>
      <div className={pickerStyles.group}>
        <div
          className={pickerStyles.row}
          role="radiogroup"
          aria-label="Show track info under cover art"
        >
          <button
            type="button"
            role="radio"
            aria-checked={showTrackInfo}
            className={pickerStyles.chip}
            data-selected={showTrackInfo}
            onClick={() => onChange(true)}
            onKeyDown={(event) => handleKeyDown(event, true)}
          >
            Show
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!showTrackInfo}
            className={pickerStyles.chip}
            data-selected={!showTrackInfo}
            onClick={() => onChange(false)}
            onKeyDown={(event) => handleKeyDown(event, false)}
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
};
