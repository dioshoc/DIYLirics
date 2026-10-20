import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  isBackgroundVideoClipable,
  resolveBackgroundMediaPlaybackTimeSec,
} from '../../../utils/backgroundMediaClip';
import { probeBackgroundMediaDurationSec } from '../../../utils/probeBackgroundMediaDuration';

import { useSessionStore } from '../../../store/sessionStore';
import { buildLyricsProject } from '../../../utils/exportProject';
import {
  isTrackCoverCustomMediaBackdrop,
  resolveTrackCoverBackdrop,
  resolveVideoBackground,
} from '../../../utils/videoBackground';
import { AudioPlayer } from '../../liricks/player/AudioPlayer';
import panel from '../../shared/panel/Panel.module.scss';
import { TikTokSocialOverlay } from '../overlay/TikTokSocialOverlay';
import { LyricAnimationPicker } from '../pickers/LyricAnimationPicker';
import { LyricEffectsPicker } from '../pickers/LyricEffectsPicker';
import { LyricFontPicker } from '../pickers/LyricFontPicker';
import { LyricLayoutPicker } from '../pickers/LyricLayoutPicker';
import { TikTokCoverPositionPicker } from '../pickers/TikTokCoverPositionPicker';
import { TrackInfoUnderCoverPicker } from '../pickers/TrackInfoUnderCoverPicker';
import { VideoBackgroundPicker } from '../pickers/VideoBackgroundPicker';
import { VideoFormatPicker } from '../pickers/VideoFormatPicker';
import { YouTubeCoverSidePicker } from '../pickers/YouTubeCoverSidePicker';
import { VideoPreviewFrame } from '../preview/VideoPreviewFrame';
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
  const setTrackCoverBackdropSource = useSessionStore(
    (s) => s.setTrackCoverBackdropSource,
  );
  const setTrackCoverBackdropFile = useSessionStore(
    (s) => s.setTrackCoverBackdropFile,
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
        videoSettings.trackCoverBackdropSource,
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
    videoSettings.trackCoverBackdropSource,
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

  const trackCoverBackdrop = useMemo(
    () => resolveTrackCoverBackdrop(track, videoSettings),
    [track, videoSettings],
  );

  const backgroundPlaybackTimeSec = useMemo(() => {
    const file = videoSettings.customBackgroundFile;
    if (
      !isBackgroundVideoClipable(
        videoSettings.backgroundSource,
        videoSettings.customBackgroundKind,
        file,
        videoSettings.trackCoverBackdropSource,
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
    videoSettings.trackCoverBackdropSource,
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
        videoSettings.trackCoverBackdropSource,
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
    videoSettings.trackCoverBackdropSource,
  ]);
  const isTrackCoverLayout =
    videoSettings.backgroundSource === 'track_cover' &&
    Boolean(track.coverObjectUrl);
  const handleClearCustom = () => {
    setCustomBackgroundFile(null);
  };
  const handleClearTrackCoverBackdrop = () => {
    setTrackCoverBackdropFile(null);
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
            trackCoverBackdropSource={videoSettings.trackCoverBackdropSource}
            hasTrackCover={Boolean(track.coverObjectUrl)}
            customFileName={
              videoSettings.backgroundSource === 'custom'
                ? (videoSettings.customBackgroundFile?.name ?? null)
                : null
            }
            trackCoverBackdropFileName={
              videoSettings.backgroundSource === 'track_cover' &&
              videoSettings.trackCoverBackdropSource === 'custom_media'
                ? (videoSettings.customBackgroundFile?.name ?? null)
                : null
            }
            onSelectSource={setVideoBackgroundSource}
            onTrackCoverBackdropSourceChange={setTrackCoverBackdropSource}
            onCustomFileChange={setCustomBackgroundFile}
            onTrackCoverBackdropFileChange={setTrackCoverBackdropFile}
            onClearCustom={handleClearCustom}
            onClearTrackCoverBackdrop={handleClearTrackCoverBackdrop}
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
                  trackCoverBackdrop={trackCoverBackdrop}
                  trackCoverBackdropIsCustomMedia={isTrackCoverCustomMediaBackdrop(
                    videoSettings,
                  )}
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
