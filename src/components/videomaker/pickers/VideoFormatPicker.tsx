import {
  VIDEO_FORMAT_ORDER,
  VIDEO_FORMATS,
  type VideoFormatId,
} from '../../../constants/videoFormats';
import { Section } from '../../shared/section/Section';
import styles from './VideoFormatPicker.module.scss';

type VideoFormatPickerProps = {
  selectedId: VideoFormatId;
  onSelect: (id: VideoFormatId) => void;
};

export const VideoFormatPicker = ({
  selectedId,
  onSelect,
}: VideoFormatPickerProps) => {
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
    <Section title="Video format">
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
              onClick={() => onSelect(id)}
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
    </Section>
  );
};
