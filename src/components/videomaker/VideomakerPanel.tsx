import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  isBackgroundVideoClipable,
  resolveBackgroundMediaPlaybackTimeSec,
} from '../../utils/backgroundMediaClip';
import { probeBackgroundMediaDurationSec } from '../../utils/probeBackgroundMediaDuration';

import { useSessionStore } from '../../store/sessionStore';
import { buildLyricsProject } from '../../utils/exportProject';
import { resolveVideoBackground } from '../../utils/videoBackground';
import { AudioPlayer } from '../liricks/AudioPlayer';
import panel from '../shared/Panel.module.scss';
import { VideoBackgroundPicker } from './VideoBackgroundPicker';
import { VideoFormatPicker } from './VideoFormatPicker';
import { LyricAnimationPicker } from './LyricAnimationPicker';
import { LyricEffectsPicker } from './LyricEffectsPicker';
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
  const setTiktokClipWindow = useSessionStore((s) => s.setTiktokClipWindow);
  const setLyricVerticalAlign = useSessionStore((s) => s.setLyricVerticalAlign);
  const setLyricHorizontalAlign = useSessionStore(
    (s) => s.setLyricHorizontalAlign,
  );
  const setLyricFontSize = useSessionStore((s) => s.setLyricFontSize);
  const setLyricFontId = useSessionStore((s) => s.setLyricFontId);
  const setLyricAnimationPreset = useSessionStore(
    (s) => s.setLyricAnimationPreset,
  );
  const setLyricEffects = useSessionStore((s) => s.setLyricEffects);
  const setLyricEffectColor = useSessionStore((s) => s.setLyricEffectColor);
  const setShowTrackInfoUnderCover = useSessionStore(
    (s) => s.setShowTrackInfoUnderCover,
  );
  const setCustomBackgroundFile = useSessionStore(
    (s) => s.setCustomBackgroundFile,
  );
  const setCustomBackgroundMediaClipWindow = useSessionStore(
    (s) => s.setCustomBackgroundMediaClipWindow,
  );
  const setCustomBackgroundMediaDurationSec = useSessionStore(
    (s) => s.setCustomBackgroundMediaDurationSec,
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

  useEffect(() => {
    const file = videoSettings.customBackgroundFile;
    const url = videoSettings.customBackgroundObjectUrl;
    if (
      !file ||
      !url ||
      videoSettings.customBackgroundDurationSec ||
      !isBackgroundVideoClipable(
        videoSettings.backgroundSource,
        videoSettings.customBackgroundKind,
        file,
      )
    ) {
      return;
    }

    void probeBackgroundMediaDurationSec(file, url).then((durationSec) => {
      setCustomBackgroundMediaDurationSec(durationSec);
    });
  }, [
    setCustomBackgroundMediaDurationSec,
    videoSettings.backgroundSource,
    videoSettings.customBackgroundDurationSec,
    videoSettings.customBackgroundFile,
    videoSettings.customBackgroundKind,
    videoSettings.customBackgroundObjectUrl,
  ]);

  const clipConfig = useMemo(() => {
    const timelineDurationSec = track.durationSec;
    if (
      videoSettings.formatId !== 'tiktok' ||
      timelineDurationSec === null ||
      timelineDurationSec <= 0
    ) {
      return null;
    }

    return {
      contentEndSec: timelineDurationSec,
      clipStartSec: videoSettings.tiktokClipStartSec,
      clipDurationSec: videoSettings.tiktokClipDurationSec,
      onClipWindowChange: setTiktokClipWindow,
    };
  }, [
    setTiktokClipWindow,
    track.durationSec,
    videoSettings.formatId,
    videoSettings.tiktokClipDurationSec,
    videoSettings.tiktokClipStartSec,
  ]);

  const syncedCount = lines.filter((l) => l.startTimeSec !== null).length;
  const project = useMemo(
    () => buildLyricsProject(track, lines, lyricsEndTimeSec),
    [track, lines, lyricsEndTimeSec],
  );

  const background = useMemo(
    () => resolveVideoBackground(track, videoSettings),
    [track, videoSettings],
  );

  const backgroundPlaybackTimeSec = useMemo(() => {
    const file = videoSettings.customBackgroundFile;
    if (
      !isBackgroundVideoClipable(
        videoSettings.backgroundSource,
        videoSettings.customBackgroundKind,
        file,
      )
    ) {
      return undefined;
    }
    const mediaDurationSec = videoSettings.customBackgroundDurationSec;
    if (!mediaDurationSec) {
      return 0;
    }
    return resolveBackgroundMediaPlaybackTimeSec(
      previewTimeSec,
      videoSettings.customBackgroundClipStartSec,
      videoSettings.customBackgroundClipDurationSec,
      mediaDurationSec,
    );
  }, [
    previewTimeSec,
    videoSettings.backgroundSource,
    videoSettings.customBackgroundClipDurationSec,
    videoSettings.customBackgroundClipStartSec,
    videoSettings.customBackgroundDurationSec,
    videoSettings.customBackgroundFile,
    videoSettings.customBackgroundKind,
  ]);

  const mediaClipConfig = useMemo(() => {
    const timelineDurationSec = track.durationSec;
    const mediaDurationSec = videoSettings.customBackgroundDurationSec;
    const file = videoSettings.customBackgroundFile;
    if (
      !timelineDurationSec ||
      timelineDurationSec <= 0 ||
      !mediaDurationSec ||
      !isBackgroundVideoClipable(
        videoSettings.backgroundSource,
        videoSettings.customBackgroundKind,
        file,
      )
    ) {
      return null;
    }

    return {
      contentEndSec: timelineDurationSec,
      mediaDurationSec,
      clipStartSec: videoSettings.customBackgroundClipStartSec,
      clipDurationSec: videoSettings.customBackgroundClipDurationSec,
      playheadSec: previewTimeSec,
      onClipWindowChange: setCustomBackgroundMediaClipWindow,
    };
  }, [
    previewTimeSec,
    setCustomBackgroundMediaClipWindow,
    track.durationSec,
    videoSettings.backgroundSource,
    videoSettings.customBackgroundClipDurationSec,
    videoSettings.customBackgroundClipStartSec,
    videoSettings.customBackgroundDurationSec,
    videoSettings.customBackgroundFile,
    videoSettings.customBackgroundKind,
  ]);
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
          <LyricLayoutPicker
            verticalAlign={videoSettings.lyricVerticalAlign}
            horizontalAlign={videoSettings.lyricHorizontalAlign}
            fontSize={videoSettings.lyricFontSize}
            onVerticalAlignChange={setLyricVerticalAlign}
            onHorizontalAlignChange={setLyricHorizontalAlign}
            onFontSizeChange={setLyricFontSize}
          />
          <LyricFontPicker
            selectedId={videoSettings.lyricFontId}
            onSelect={setLyricFontId}
          />
          <LyricAnimationPicker
            selectedId={videoSettings.lyricAnimationPreset}
            onSelect={setLyricAnimationPreset}
          />
          <LyricEffectsPicker
            effects={videoSettings.lyricEffects}
            color={videoSettings.lyricEffectColor}
            onChange={setLyricEffects}
            onColorChange={setLyricEffectColor}
          />
        </aside>

        <div className={styles.mainColumn}>
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
                  lyricEffects={videoSettings.lyricEffects}
                  lyricEffectColor={videoSettings.lyricEffectColor}
                  artist={track.artist}
                  title={track.title}
                  showTrackInfoUnderCover={videoSettings.showTrackInfoUnderCover}
                  playbackTimeSec={previewTimeSec}
                  backgroundPlaybackTimeSec={backgroundPlaybackTimeSec}
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
          {track.audioObjectUrl ? (
            <footer className={styles.bottomDock} aria-label="Preview playback">
              <AudioPlayer
                src={track.audioObjectUrl}
                audioRefExternal={audioRef}
                onDuration={setDurationSec}
                onTimeUpdate={handlePreviewTimeUpdate}
                onPlayingChange={handlePreviewPlayingChange}
                clipConfig={clipConfig}
                mediaClipConfig={mediaClipConfig}
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
        </div>
      </div>
      </div>
    </section>
  );
};
