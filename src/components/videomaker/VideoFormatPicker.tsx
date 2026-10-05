import {
  VIDEO_FORMAT_ORDER,
  VIDEO_FORMATS,
  type VideoFormatId,
} from '../../constants/videoFormats';
import styles from './VideoFormatPicker.module.scss';

type VideoFormatPickerProps = {
  selectedId: VideoFormatId;
  onSelect: (id: VideoFormatId) => void;
};

export const VideoFormatPicker = ({
  selectedId,
  onSelect,
}: VideoFormatPickerProps) => {
  const handleSelect = (id: VideoFormatId) => {
    onSelect(id);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    id: VideoFormatId,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onSelect(id);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Video format</h3>
      <div className={styles.list} role="radiogroup" aria-label="Video format">
        {VIDEO_FORMAT_ORDER.map((id) => {
          const format = VIDEO_FORMATS[id];
          const isSelected = selectedId === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={styles.option}
              data-selected={isSelected}
              onClick={() => handleSelect(id)}
              onKeyDown={(event) => handleKeyDown(event, id)}
            >
              <span
                className={styles.optionFrame}
                data-format={id}
                aria-hidden
              />
              <span className={styles.optionText}>
                <span className={styles.optionLabel}>{format.label}</span>
                <span className={styles.optionMeta}>
                  {format.description} · {format.width}×{format.height}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
