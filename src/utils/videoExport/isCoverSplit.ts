import type { VideoBackgroundSource } from '../../types/session';
import type { ResolvedVideoBackground } from '../videoBackground';

export const isCoverSplitLayout = (
  backgroundSource: VideoBackgroundSource,
  coverArtUrl: string | null,
  background: ResolvedVideoBackground,
): boolean =>
  backgroundSource === 'track_cover' &&
  Boolean(coverArtUrl) &&
  background.kind === 'image';
