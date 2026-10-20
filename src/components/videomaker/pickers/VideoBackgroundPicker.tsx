import type {
  TrackCoverBackdropSource,
  VideoBackgroundSource,
} from '../../../types/session';
import { Section } from '../../shared/section/Section';
import sharedStyles from './pickerShared.module.scss';

const SOURCE_ORDER: VideoBackgroundSource[] = ['track_cover', 'custom'];

const SOURCE_LABELS: Record<
  VideoBackgroundSource,
  { label: string; description: string }
> = {
  track_cover: {
    label: 'Track cover',
    description: 'Release art card with backdrop',
  },
  custom: {
    label: 'Custom media',
    description: 'Full-frame image or video',
  },
};

const BACKDROP_ORDER: TrackCoverBackdropSource[] = [
  'release_art',
  'custom_media',
];

const BACKDROP_LABELS: Record<
  TrackCoverBackdropSource,
  { label: string; description: string }
> = {
  release_art: {
    label: 'Release art',
    description: 'Blurred cover from Options',
  },
  custom_media: {
    label: 'Custom media',
    description: 'Your own image or video behind the card',
  },
};

type VideoBackgroundPickerProps = {
  selectedSource: VideoBackgroundSource;
  trackCoverBackdropSource: TrackCoverBackdropSource;
  hasTrackCover: boolean;
  customFileName: string | null;
  trackCoverBackdropFileName: string | null;
  onSelectSource: (source: VideoBackgroundSource) => void;
  onTrackCoverBackdropSourceChange: (source: TrackCoverBackdropSource) => void;
  onCustomFileChange: (file: File | null) => void;
  onTrackCoverBackdropFileChange: (file: File | null) => void;
  onClearCustom: () => void;
  onClearTrackCoverBackdrop: () => void;
};

export const VideoBackgroundPicker = ({
  selectedSource,
  trackCoverBackdropSource,
  hasTrackCover,
  customFileName,
  trackCoverBackdropFileName,
  onSelectSource,
  onTrackCoverBackdropSourceChange,
  onCustomFileChange,
  onTrackCoverBackdropFileChange,
  onClearCustom,
  onClearTrackCoverBackdrop,
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

  const handleBackdropClick = (source: TrackCoverBackdropSource) => {
    onTrackCoverBackdropSourceChange(source);
  };

  const handleBackdropKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    source: TrackCoverBackdropSource,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    handleBackdropClick(source);
  };

  const handleFullCustomFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    onCustomFileChange(file);
  };

  const handleBackdropFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    onTrackCoverBackdropFileChange(file);
  };

  return (
    <Section title="Background">
      <div
        className={sharedStyles.list}
        role="radiogroup"
        aria-label="Background source"
      >
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
              className={sharedStyles.option}
              data-selected={isSelected}
              disabled={isDisabled}
              onClick={() => handleSourceClick(source)}
              onKeyDown={(event) => handleSourceKeyDown(event, source)}
            >
              <span className={sharedStyles.optionLabel}>{copy.label}</span>
              <span className={sharedStyles.optionMeta}>
                {isDisabled
                  ? 'Upload cover art in Options first'
                  : copy.description}
              </span>
            </button>
          );
        })}
      </div>

      {selectedSource === 'track_cover' ? (
        <>
          <p className={sharedStyles.hint}>Backdrop behind the cover card</p>
          <div
            className={sharedStyles.list}
            role="radiogroup"
            aria-label="Track cover backdrop"
          >
            {BACKDROP_ORDER.map((source) => {
              const copy = BACKDROP_LABELS[source];
              const isSelected = trackCoverBackdropSource === source;

              return (
                <button
                  key={source}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={sharedStyles.option}
                  data-selected={isSelected}
                  onClick={() => handleBackdropClick(source)}
                  onKeyDown={(event) => handleBackdropKeyDown(event, source)}
                >
                  <span className={sharedStyles.optionLabel}>{copy.label}</span>
                  <span className={sharedStyles.optionMeta}>
                    {copy.description}
                  </span>
                </button>
              );
            })}
          </div>
          {trackCoverBackdropSource === 'custom_media' ? (
            <>
              <div className={sharedStyles.customBlock}>
                <label
                  className={sharedStyles.optionMeta}
                  htmlFor="video-backdrop-file"
                >
                  Backdrop file
                </label>
                <input
                  id="video-backdrop-file"
                  className={sharedStyles.fileInput}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleBackdropFileInputChange}
                />
                {trackCoverBackdropFileName ? (
                  <>
                    <span className={sharedStyles.fileName}>
                      {trackCoverBackdropFileName}
                    </span>
                    <button
                      type="button"
                      className={sharedStyles.clearBtn}
                      onClick={onClearTrackCoverBackdrop}
                    >
                      Remove backdrop file
                    </button>
                  </>
                ) : null}
              </div>
              {!trackCoverBackdropFileName ? (
                <p className={sharedStyles.hint}>
                  Until you upload a file, release art is used as the backdrop.
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {selectedSource === 'custom' ? (
        <>
          <div className={sharedStyles.customBlock}>
            <label className={sharedStyles.optionMeta} htmlFor="video-bg-file">
              Custom background file
            </label>
            <input
              id="video-bg-file"
              className={sharedStyles.fileInput}
              type="file"
              accept="image/*,video/*"
              onChange={handleFullCustomFileInputChange}
            />
            {customFileName ? (
              <>
                <span className={sharedStyles.fileName}>{customFileName}</span>
                <button
                  type="button"
                  className={sharedStyles.clearBtn}
                  onClick={onClearCustom}
                >
                  Remove custom file
                </button>
              </>
            ) : null}
          </div>
          {!customFileName ? (
            <p className={sharedStyles.hint}>
              Select a file to use a custom background.
            </p>
          ) : null}
        </>
      ) : null}
    </Section>
  );
};
