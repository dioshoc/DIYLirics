const GIF_FALLBACK_DURATION_SEC = 5;

const probeWithVideoElement = (url: string): Promise<number | null> =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      video.remove();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        resolve(null);
        return;
      }
      resolve(duration);
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = url;
  });

export const probeBackgroundMediaDurationSec = async (
  file: File,
  objectUrl: string,
): Promise<number> => {
  if (file.type.startsWith('video/')) {
    const duration = await probeWithVideoElement(objectUrl);
    return duration ?? GIF_FALLBACK_DURATION_SEC;
  }

  if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
    const duration = await probeWithVideoElement(objectUrl);
    return duration ?? GIF_FALLBACK_DURATION_SEC;
  }

  return GIF_FALLBACK_DURATION_SEC;
};
