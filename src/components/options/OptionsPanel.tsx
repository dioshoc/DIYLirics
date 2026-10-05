import { useSessionStore } from '../../store/sessionStore';
import { formatTimeSec } from '../../utils/time';
import panel from '../shared/Panel.module.scss';
import styles from './OptionsPanel.module.scss';

export const OptionsPanel = () => {
  const track = useSessionStore((s) => s.track);
  const setTitle = useSessionStore((s) => s.setTitle);
  const setArtist = useSessionStore((s) => s.setArtist);
  const setAudioFile = useSessionStore((s) => s.setAudioFile);
  const setCoverFile = useSessionStore((s) => s.setCoverFile);
  const setDurationSec = useSessionStore((s) => s.setDurationSec);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleArtistChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setArtist(event.target.value);
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAudioFile(file);
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setCoverFile(file);
  };

  const handleAudioMetadata = (
    event: React.SyntheticEvent<HTMLAudioElement>,
  ) => {
    const audio = event.currentTarget;
    if (!Number.isFinite(audio.duration)) {
      return;
    }
    setDurationSec(audio.duration);
  };

  const handleAudioError = () => {
    setDurationSec(null);
  };

  return (
    <section className={panel.panel} aria-labelledby="options-heading">
      <h2 id="options-heading" className={panel.title}>
        Options
      </h2>
      <p className={panel.hint}>
        Upload your track, cover art, and metadata — used in Liricks and
        Videomaker.
      </p>

      <div className={panel.field}>
        <label className={panel.label} htmlFor="audio-file">
          Audio file
        </label>
        <input
          id="audio-file"
          className={panel.input}
          type="file"
          accept="audio/*"
          onChange={handleAudioFileChange}
        />
      </div>

      {track.audioObjectUrl && (
        <audio
          src={track.audioObjectUrl}
          preload="metadata"
          onLoadedMetadata={handleAudioMetadata}
          onError={handleAudioError}
          aria-hidden
        />
      )}

      <div className={styles.coverRow}>
        <div className={styles.coverPreview} aria-hidden={!track.coverObjectUrl}>
          {track.coverObjectUrl ? (
            <img
              className={styles.coverImage}
              src={track.coverObjectUrl}
              alt="Release cover preview"
            />
          ) : (
            <span className={styles.coverPlaceholder}>No cover yet</span>
          )}
        </div>
        <div className={styles.coverField}>
          <label className={panel.label} htmlFor="cover-file">
            Release cover art
          </label>
          <input
            id="cover-file"
            className={panel.input}
            type="file"
            accept="image/*"
            onChange={handleCoverFileChange}
          />
          {track.coverFile && (
            <span className={panel.hint}>{track.coverFile.name}</span>
          )}
        </div>
      </div>

      <div className={panel.field}>
        <label className={panel.label} htmlFor="song-title">
          Song title
        </label>
        <input
          id="song-title"
          className={panel.input}
          type="text"
          value={track.title}
          placeholder="Title"
          onChange={handleTitleChange}
        />
      </div>

      <div className={panel.field}>
        <label className={panel.label} htmlFor="song-artist">
          Artist / band
        </label>
        <input
          id="song-artist"
          className={panel.input}
          type="text"
          value={track.artist}
          placeholder="Artist"
          onChange={handleArtistChange}
        />
      </div>

      <div className={panel.metaBox}>
        {track.audioFile ? (
          <>
            <div>File: {track.audioFile.name}</div>
            <div>Duration: {formatTimeSec(track.durationSec)}</div>
          </>
        ) : (
          <div>No track uploaded yet</div>
        )}
      </div>
    </section>
  );
};
