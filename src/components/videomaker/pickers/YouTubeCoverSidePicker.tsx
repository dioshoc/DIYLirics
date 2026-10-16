import {
  YOUTUBE_COVER_SIDE_LABELS,
  YOUTUBE_COVER_SIDE_ORDER,
  type YoutubeCoverSide,
} from '../../../constants/youtubeCoverLayout';
import { Section } from '../../shared/section/Section';
import sharedStyles from './pickerShared.module.scss';

type YouTubeCoverSidePickerProps = {
  selectedSide: YoutubeCoverSide;
  onSelect: (side: YoutubeCoverSide) => void;
};

export const YouTubeCoverSidePicker = ({
  selectedSide,
  onSelect,
}: YouTubeCoverSidePickerProps) => {
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
    <Section title="Cover layout">
      <div
        className={sharedStyles.list}
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
              className={sharedStyles.option}
              data-selected={isSelected}
              onClick={() => onSelect(side)}
              onKeyDown={(event) => handleKeyDown(event, side)}
            >
              {YOUTUBE_COVER_SIDE_LABELS[side]}
            </button>
          );
        })}
      </div>
    </Section>
  );
};
