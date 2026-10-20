import type { ResolvedVideoBackground } from '../videoBackground';

export type ExportMediaAssets = {
  coverImage: HTMLImageElement | null;
  backgroundImage: HTMLImageElement | null;
  backgroundVideo: HTMLVideoElement | null;
  coverSplitBackdropImage: HTMLImageElement | null;
  coverSplitBackdropVideo: HTMLVideoElement | null;
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });

const loadVideo = (url: string): Promise<HTMLVideoElement> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = url;
  });

const emptyBackdropAssets = {
  coverSplitBackdropImage: null,
  coverSplitBackdropVideo: null,
};

export const loadExportMediaAssets = async (
  coverArtUrl: string | null,
  background: ResolvedVideoBackground,
  coverSplitBackdrop: ResolvedVideoBackground | null,
): Promise<ExportMediaAssets> => {
  const coverImage = coverArtUrl ? await loadImage(coverArtUrl) : null;

  let backgroundImage: HTMLImageElement | null = null;
  let backgroundVideo: HTMLVideoElement | null = null;

  if (background.url && background.kind) {
    if (background.kind === 'video') {
      backgroundVideo = await loadVideo(background.url);
    } else {
      backgroundImage = await loadImage(background.url);
    }
  }

  if (!coverSplitBackdrop?.url || !coverSplitBackdrop.kind) {
    return {
      coverImage,
      backgroundImage,
      backgroundVideo,
      ...emptyBackdropAssets,
    };
  }

  const sameAsCover =
    coverArtUrl !== null && coverSplitBackdrop.url === coverArtUrl;

  if (coverSplitBackdrop.kind === 'video') {
    const coverSplitBackdropVideo = await loadVideo(coverSplitBackdrop.url);
    return {
      coverImage,
      backgroundImage,
      backgroundVideo,
      coverSplitBackdropImage: null,
      coverSplitBackdropVideo,
    };
  }

  if (sameAsCover) {
    return {
      coverImage,
      backgroundImage,
      backgroundVideo,
      ...emptyBackdropAssets,
    };
  }

  const coverSplitBackdropImage = await loadImage(coverSplitBackdrop.url);
  return {
    coverImage,
    backgroundImage,
    backgroundVideo,
    coverSplitBackdropImage,
    coverSplitBackdropVideo: null,
  };
};

/** Must be below one export frame step (1/60 s) so each encoded frame gets a fresh seek. */
const SEEK_TIME_EPSILON_SEC = 1 / 240;

export const seekBackgroundVideo = (
  video: HTMLVideoElement,
  timeSec: number,
): Promise<void> =>
  new Promise((resolve) => {
    const clampedTime = Math.min(
      Math.max(0, timeSec),
      video.duration || timeSec,
    );

    if (Math.abs(video.currentTime - clampedTime) < SEEK_TIME_EPSILON_SEC) {
      resolve();
      return;
    }

    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      resolve();
    };

    video.addEventListener('seeked', handleSeeked);
    video.currentTime = clampedTime;
  });
