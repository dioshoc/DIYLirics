import type { VideoBackgroundSource } from '../../types/session';
import styles from './VideoBackgroundPicker.module.scss';

const SOURCE_ORDER: VideoBackgroundSource[] = ['track_cover', 'custom'];

const SOURCE_LABELS: Record<
  VideoBackgroundSource,
  { label: string; description: string }
> = {
  track_cover: {
    label: 'Track cover',
    description: 'Release art from Options',
  },
  custom: {
    label: 'Custom media',
    description: 'Upload an image or video file',
  },
};

type VideoBackgroundPickerProps = {
  selectedSource: VideoBackgroundSource;
  hasTrackCover: boolean;
  customFileName: string | null;
  onSelectSource: (source: VideoBackgroundSource) => void;
  onCustomFileChange: (file: File | null) => void;
  onClearCustom: () => void;
};

export const VideoBackgroundPicker = ({
  selectedSource,
  hasTrackCover,
  customFileName,
  onSelectSource,
  onCustomFileChange,
  onClearCustom,
}: VideoBackgroundPickerProps) => {
  const handleSourceClick = (source: VideoBackgroundSource) => {
    if (source === 'track_cover' && !hasTrackCover) {
      return;
    }
    onSelectSource(source);
  };

  const handleSourceKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    source: VideoBackgroundSource,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    handleSourceClick(source);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    onCustomFileChange(file);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Background</h3>
      <div className={styles.list} role="radiogroup" aria-label="Background source">
        {SOURCE_ORDER.map((source) => {
          const copy = SOURCE_LABELS[source];
          const isSelected = selectedSource === source;
          const isTrackCover = source === 'track_cover';
          const isDisabled = isTrackCover && !hasTrackCover;

          return (
            <button
              key={source}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={styles.option}
              data-selected={isSelected}
              disabled={isDisabled}
              onClick={() => handleSourceClick(source)}
              onKeyDown={(event) => handleSourceKeyDown(event, source)}
            >
              <span className={styles.optionLabel}>{copy.label}</span>
              <span className={styles.optionMeta}>
                {isDisabled
                  ? 'Upload cover art in Options first'
                  : copy.description}
              </span>
            </button>
          );
        })}
      </div>

      {selectedSource === 'custom' ? (
        <>
          <div className={styles.customBlock}>
            <label className={styles.optionMeta} htmlFor="video-bg-file">
              Custom background file
            </label>
            <input
              id="video-bg-file"
              className={styles.fileInput}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileInputChange}
            />
            {customFileName ? (
              <>
                <span className={styles.fileName}>{customFileName}</span>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={onClearCustom}
                >
                  Remove custom file
                </button>
              </>
            ) : null}
          </div>
          {!customFileName ? (
            <p className={styles.hint}>
              Select a file to use a custom background.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
