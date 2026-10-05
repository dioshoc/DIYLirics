import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
} from 'mediabunny';

import { getVideoFormat } from '../../constants/videoFormats';
import type { LyricsProject, TrackMeta, VideoSettings } from '../../types/session';
import type { ResolvedVideoBackground } from '../videoBackground';
import { decodeAudioFromUrl, trimAudioBuffer } from './decodeAudio';
import { ensureLyricFontLoaded } from './ensureLyricFontLoaded';
import { drawExportFrame } from './drawFrame';
import { loadExportMediaAssets, seekBackgroundVideo } from './loadAssets';

export type ExportLyricVideoInput = {
  track: TrackMeta;
  project: LyricsProject;
  videoSettings: VideoSettings;
  background: ResolvedVideoBackground;
  lyricsEndTimeSec: number | null;
};

export type ExportLyricVideoProgress = {
  ratio: number;
  timeSec: number;
  durationSec: number;
};

const EXPORT_FPS = 30;

const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

const buildVideoDownloadFileName = (
  track: TrackMeta,
  project: LyricsProject,
): string => {
  const title =
    track.title.trim() || project.meta.title.trim() || 'lyrics-video';

  const safeTitle = title
    .replace(INVALID_FILE_NAME_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  return `${safeTitle || 'lyrics-video'}.mp4`;
};

export const downloadVideoBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportLyricVideo = async (
  input: ExportLyricVideoInput,
  onProgress?: (progress: ExportLyricVideoProgress) => void,
): Promise<Blob> => {
  const audioUrl = input.track.audioObjectUrl;
  if (!audioUrl) {
    throw new Error('Upload audio in Options first.');
  }

  if (!input.background.url) {
    throw new Error('Choose a video background first.');
  }

  const format = getVideoFormat(input.videoSettings.formatId);
  const outputFormat = new Mp4OutputFormat();
  const videoCodec = await getFirstEncodableVideoCodec(
    outputFormat.getSupportedVideoCodecs(),
    { width: format.width, height: format.height },
  );
  const audioCodec = await getFirstEncodableAudioCodec(
    outputFormat.getSupportedAudioCodecs(),
  );

  if (!videoCodec || !audioCodec) {
    throw new Error(
      'MP4 export is not supported in this browser (H.264/AAC encoding).',
    );
  }

  const assets = await loadExportMediaAssets(
    input.track.coverObjectUrl,
    input.background,
  );

  const decodedAudio = await decodeAudioFromUrl(audioUrl);
  const durationSec =
    input.lyricsEndTimeSec ??
    input.project.meta.durationSec ??
    decodedAudio.duration;

  if (!durationSec || !Number.isFinite(durationSec)) {
    throw new Error('Audio duration is unknown.');
  }

  const audioBuffer = trimAudioBuffer(decodedAudio, durationSec);

  const canvas = document.createElement('canvas');
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available.');
  }

  const drawConfig = {
    width: format.width,
    height: format.height,
    formatId: input.videoSettings.formatId,
    backgroundSource: input.videoSettings.backgroundSource,
    coverArtUrl: input.track.coverObjectUrl,
    background: input.background,
    youtubeCoverSide: input.videoSettings.youtubeCoverSide,
    tiktokCoverPosition: input.videoSettings.tiktokCoverPosition,
    lyricVerticalAlign: input.videoSettings.lyricVerticalAlign,
    lyricHorizontalAlign: input.videoSettings.lyricHorizontalAlign,
    lyricFontSize: input.videoSettings.lyricFontSize,
    lyricFontId: input.videoSettings.lyricFontId,
    lyricAnimationPreset: input.videoSettings.lyricAnimationPreset,
    showTrackInfoUnderCover: input.videoSettings.showTrackInfoUnderCover,
    project: input.project,
    lyricsEndTimeSec: input.lyricsEndTimeSec,
  };

  const output = new Output({
    format: outputFormat,
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(canvas, {
    codec: videoCodec,
    quality: new Quality({ bitrate: 8_000_000 }),
  });

  const audioSource = new AudioBufferSource({
    codec: audioCodec,
    quality: new Quality({ bitrate: 192_000 }),
  });

  output.addVideoTrack(videoSource, { frameRate: EXPORT_FPS });
  output.addAudioTrack(audioSource);

  output.setMetadataTags({
    title: input.track.title || input.project.meta.title || 'Lyrics video',
    artist: input.track.artist || input.project.meta.artist || undefined,
  });

  await ensureLyricFontLoaded(
    input.videoSettings.lyricFontId,
    Math.max(32, format.height * 0.05),
  );

  await output.start();

  const totalFrames = Math.max(1, Math.ceil(durationSec * EXPORT_FPS));

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
    const timeSec = Math.min(frameIndex / EXPORT_FPS, durationSec);

    if (assets.backgroundVideo) {
      await seekBackgroundVideo(assets.backgroundVideo, timeSec);
    }

    await drawExportFrame(ctx, timeSec, drawConfig, assets);
    await videoSource.add(timeSec, 1 / EXPORT_FPS, {
      keyFrame: frameIndex % EXPORT_FPS === 0,
    });

    onProgress?.({
      ratio: (frameIndex + 1) / totalFrames,
      timeSec,
      durationSec,
    });
  }

  await audioSource.add(audioBuffer);
  await output.finalize();

  const buffer = output.target.buffer;
  if (!buffer) {
    throw new Error('MP4 export produced an empty file.');
  }

  return new Blob([buffer], { type: 'video/mp4' });
};

export const exportAndDownloadLyricVideo = async (
  input: ExportLyricVideoInput,
  onProgress?: (progress: ExportLyricVideoProgress) => void,
): Promise<void> => {
  const blob = await exportLyricVideo(input, onProgress);
  downloadVideoBlob(
    blob,
    buildVideoDownloadFileName(input.track, input.project),
  );
};
