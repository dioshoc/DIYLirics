import {
  TIKTOK_COVER_POSITION_LABELS,
  TIKTOK_COVER_POSITION_ORDER,
  type TiktokCoverPosition,
} from '../../../constants/tiktokCoverLayout';
import { Section } from '../../shared/section/Section';
import sharedStyles from './pickerShared.module.scss';

type TikTokCoverPositionPickerProps = {
  selectedPosition: TiktokCoverPosition;
  onSelect: (position: TiktokCoverPosition) => void;
};

export const TikTokCoverPositionPicker = ({
  selectedPosition,
  onSelect,
}: TikTokCoverPositionPickerProps) => {
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
    <Section title="Cover layout">
      <div
        className={sharedStyles.list}
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
              className={sharedStyles.option}
              data-selected={isSelected}
              onClick={() => onSelect(position)}
              onKeyDown={(event) => handleKeyDown(event, position)}
            >
              {TIKTOK_COVER_POSITION_LABELS[position]}
            </button>
          );
        })}
      </div>
    </Section>
  );
};
