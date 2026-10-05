import type { ResolvedVideoBackground } from '../videoBackground';

export type ExportMediaAssets = {
  coverImage: HTMLImageElement | null;
  backgroundImage: HTMLImageElement | null;
  backgroundVideo: HTMLVideoElement | null;
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

export const loadExportMediaAssets = async (
  coverArtUrl: string | null,
  background: ResolvedVideoBackground,
): Promise<ExportMediaAssets> => {
  const coverImage = coverArtUrl ? await loadImage(coverArtUrl) : null;

  if (!background.url || !background.kind) {
    return { coverImage, backgroundImage: null, backgroundVideo: null };
  }

  if (background.kind === 'video') {
    const backgroundVideo = await loadVideo(background.url);
    return { coverImage, backgroundImage: null, backgroundVideo };
  }

  const backgroundImage = await loadImage(background.url);
  return { coverImage, backgroundImage, backgroundVideo: null };
};

export const seekBackgroundVideo = (
  video: HTMLVideoElement,
  timeSec: number,
): Promise<void> =>
  new Promise((resolve) => {
    if (Math.abs(video.currentTime - timeSec) < 0.05) {
      resolve();
      return;
    }

    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      resolve();
    };

    video.addEventListener('seeked', handleSeeked);
    video.currentTime = Math.min(timeSec, video.duration || timeSec);
  });
