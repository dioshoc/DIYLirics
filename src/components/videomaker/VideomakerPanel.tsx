import { useCallback, useMemo, useRef, useState } from 'react';

import { useSessionStore } from '../../store/sessionStore';
import { buildLyricsProject } from '../../utils/exportProject';
import { resolveVideoBackground } from '../../utils/videoBackground';
import { AudioPlayer } from '../liricks/AudioPlayer';
import panel from '../shared/Panel.module.scss';
import { VideoBackgroundPicker } from './VideoBackgroundPicker';
import { VideoFormatPicker } from './VideoFormatPicker';
import { LyricAnimationPicker } from './LyricAnimationPicker';
import { LyricFontPicker } from './LyricFontPicker';
import { LyricLayoutPicker } from './LyricLayoutPicker';
import { TikTokCoverPositionPicker } from './TikTokCoverPositionPicker';
import { TrackInfoUnderCoverPicker } from './TrackInfoUnderCoverPicker';
import { YouTubeCoverSidePicker } from './YouTubeCoverSidePicker';
import { TikTokSocialOverlay } from './TikTokSocialOverlay';
import { VideoPreviewFrame } from './VideoPreviewFrame';
import styles from './VideomakerPanel.module.scss';

export const VideomakerPanel = () => {
  const track = useSessionStore((s) => s.track);
  const lines = useSessionStore((s) => s.lines);
  const lyricsEndTimeSec = useSessionStore((s) => s.lyricsEndTimeSec);
  const videoSettings = useSessionStore((s) => s.videoSettings);
  const setVideoFormatId = useSessionStore((s) => s.setVideoFormatId);
  const setVideoBackgroundSource = useSessionStore(
    (s) => s.setVideoBackgroundSource,
  );
  const setYoutubeCoverSide = useSessionStore((s) => s.setYoutubeCoverSide);
  const setTiktokCoverPosition = useSessionStore(
    (s) => s.setTiktokCoverPosition,
  );
  const setLyricVerticalAlign = useSessionStore((s) => s.setLyricVerticalAlign);
  const setLyricHorizontalAlign = useSessionStore(
    (s) => s.setLyricHorizontalAlign,
  );
  const setLyricFontSize = useSessionStore((s) => s.setLyricFontSize);
  const setLyricFontId = useSessionStore((s) => s.setLyricFontId);
  const setLyricAnimationPreset = useSessionStore(
    (s) => s.setLyricAnimationPreset,
  );
  const setShowTrackInfoUnderCover = useSessionStore(
    (s) => s.setShowTrackInfoUnderCover,
  );
  const setCustomBackgroundFile = useSessionStore(
    (s) => s.setCustomBackgroundFile,
  );
  const setDurationSec = useSessionStore((s) => s.setDurationSec);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [previewTimeSec, setPreviewTimeSec] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const handlePreviewTimeUpdate = useCallback((timeSec: number) => {
    setPreviewTimeSec(timeSec);
  }, []);

  const handlePreviewPlayingChange = useCallback((isPlaying: boolean) => {
    setIsPreviewPlaying(isPlaying);
  }, []);

  const syncedCount = lines.filter((l) => l.startTimeSec !== null).length;
  const project = useMemo(
    () => buildLyricsProject(track, lines, lyricsEndTimeSec),
    [track, lines, lyricsEndTimeSec],
  );

  const background = useMemo(
    () => resolveVideoBackground(track, videoSettings),
    [track, videoSettings],
  );
  const isTrackCoverLayout =
    videoSettings.backgroundSource === 'track_cover' &&
    Boolean(track.coverObjectUrl);
  const handleClearCustom = () => {
    setCustomBackgroundFile(null);
    if (track.coverObjectUrl) {
      setVideoBackgroundSource('track_cover');
      return;
    }
    setVideoBackgroundSource('custom');
  };

  if (syncedCount === 0) {
    return (
      <section className={panel.panel}>
        <h2 className={panel.title}>Videomaker</h2>
        <p className={panel.warning}>
          Sync lyrics in the Liricks tab first.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`${panel.panel} ${styles.root}`}
      aria-labelledby="videomaker-heading"
    >
      <div className={styles.workspace}>
      <div className={styles.layout}>
        <aside className={styles.settings} aria-label="Video settings">
          <VideoFormatPicker
            selectedId={videoSettings.formatId}
            onSelect={setVideoFormatId}
          />
          <VideoBackgroundPicker
            selectedSource={videoSettings.backgroundSource}
            hasTrackCover={Boolean(track.coverObjectUrl)}
            customFileName={videoSettings.customBackgroundFile?.name ?? null}
            onSelectSource={setVideoBackgroundSource}
            onCustomFileChange={setCustomBackgroundFile}
            onClearCustom={handleClearCustom}
          />
          {isTrackCoverLayout ? (
            <TrackInfoUnderCoverPicker
              showTrackInfo={videoSettings.showTrackInfoUnderCover}
              onChange={setShowTrackInfoUnderCover}
            />
          ) : null}
          {isTrackCoverLayout && videoSettings.formatId === 'youtube' ? (
            <YouTubeCoverSidePicker
              selectedSide={videoSettings.youtubeCoverSide}
              onSelect={setYoutubeCoverSide}
            />
          ) : null}
          {isTrackCoverLayout && videoSettings.formatId === 'tiktok' ? (
            <TikTokCoverPositionPicker
              selectedPosition={videoSettings.tiktokCoverPosition}
              onSelect={setTiktokCoverPosition}
            />
          ) : null}
          <LyricFontPicker
            selectedId={videoSettings.lyricFontId}
            onSelect={setLyricFontId}
          />
          <LyricAnimationPicker
            selectedId={videoSettings.lyricAnimationPreset}
            onSelect={setLyricAnimationPreset}
          />
          <LyricLayoutPicker
            verticalAlign={videoSettings.lyricVerticalAlign}
            horizontalAlign={videoSettings.lyricHorizontalAlign}
            fontSize={videoSettings.lyricFontSize}
            onVerticalAlignChange={setLyricVerticalAlign}
            onHorizontalAlignChange={setLyricHorizontalAlign}
            onFontSizeChange={setLyricFontSize}
          />
        </aside>

        <div className={styles.preview}>
          <div
            className={styles.previewFrameWrap}
            data-format={videoSettings.formatId}
          >
            <div
              className={styles.videoExportFrame}
              data-videomaker-export-root
            >
              <VideoPreviewFrame
                formatId={videoSettings.formatId}
                backgroundSource={videoSettings.backgroundSource}
                coverArtUrl={track.coverObjectUrl}
                background={background}
                lines={project.lines}
                lyricsEndTimeSec={lyricsEndTimeSec}
                audioRef={audioRef}
                youtubeCoverSide={videoSettings.youtubeCoverSide}
                tiktokCoverPosition={videoSettings.tiktokCoverPosition}
                lyricVerticalAlign={videoSettings.lyricVerticalAlign}
                lyricHorizontalAlign={videoSettings.lyricHorizontalAlign}
                lyricFontSize={videoSettings.lyricFontSize}
                lyricFontId={videoSettings.lyricFontId}
                lyricAnimationPreset={videoSettings.lyricAnimationPreset}
                artist={track.artist}
                title={track.title}
                showTrackInfoUnderCover={videoSettings.showTrackInfoUnderCover}
                playbackTimeSec={previewTimeSec}
                isPlaybackActive={isPreviewPlaying}
              />
            </div>
            {videoSettings.formatId === 'tiktok' ? (
              <TikTokSocialOverlay
                artist={track.artist}
                title={track.title}
              />
            ) : null}
          </div>
        </div>
      </div>
      </div>
      {track.audioObjectUrl ? (
        <footer className={styles.bottomDock} aria-label="Preview playback">
          <AudioPlayer
            src={track.audioObjectUrl}
            audioRefExternal={audioRef}
            onDuration={setDurationSec}
            onTimeUpdate={handlePreviewTimeUpdate}
            onPlayingChange={handlePreviewPlayingChange}
            embedded
          />
        </footer>
      ) : (
        <footer className={styles.bottomDock} aria-label="Preview playback">
          <p className={styles.noAudioHint}>
            Upload audio in Options to preview playback.
          </p>
        </footer>
      )}
    </section>
  );
};
