import type { TrackMeta, VideoBackgroundKind, VideoSettings } from '../types/session';

export type ResolvedVideoBackground = {
  url: string | null;
  kind: VideoBackgroundKind | null;
};

export const getCustomBackgroundKind = (
  file: File,
): VideoBackgroundKind | null => {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }
  return null;
};

export const resolveVideoBackground = (
  track: TrackMeta,
  settings: VideoSettings,
): ResolvedVideoBackground => {
  if (settings.backgroundSource === 'custom') {
    return {
      url: settings.customBackgroundObjectUrl,
      kind: settings.customBackgroundKind,
    };
  }

  if (!track.coverObjectUrl) {
    return { url: null, kind: null };
  }

  return { url: track.coverObjectUrl, kind: 'image' };
};

/** Blurred backdrop behind the cover card in track-cover layout. */
export const resolveTrackCoverBackdrop = (
  track: TrackMeta,
  settings: VideoSettings,
): ResolvedVideoBackground => {
  if (
    settings.backgroundSource === 'track_cover' &&
    settings.trackCoverBackdropSource === 'custom_media' &&
    settings.customBackgroundObjectUrl &&
    settings.customBackgroundKind
  ) {
    return {
      url: settings.customBackgroundObjectUrl,
      kind: settings.customBackgroundKind,
    };
  }

  if (!track.coverObjectUrl) {
    return { url: null, kind: null };
  }

  return { url: track.coverObjectUrl, kind: 'image' };
};

/** Custom file behind the cover card (not blurred release-art treatment). */
export const isTrackCoverCustomMediaBackdrop = (
  settings: VideoSettings,
): boolean =>
  settings.backgroundSource === 'track_cover' &&
  settings.trackCoverBackdropSource === 'custom_media' &&
  Boolean(settings.customBackgroundObjectUrl) &&
  Boolean(settings.customBackgroundKind);
