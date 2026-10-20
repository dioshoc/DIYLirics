import type { VideoBackgroundSource } from '../../types/session';

export const isCoverSplitLayout = (
  backgroundSource: VideoBackgroundSource,
  coverArtUrl: string | null,
): boolean =>
  backgroundSource === 'track_cover' && Boolean(coverArtUrl);
