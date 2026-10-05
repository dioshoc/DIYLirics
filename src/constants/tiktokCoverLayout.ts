export type TiktokCoverPosition = 'top' | 'bottom';

export const TIKTOK_COVER_POSITION_ORDER: TiktokCoverPosition[] = [
  'top',
  'bottom',
];

export const TIKTOK_COVER_POSITION_LABELS: Record<TiktokCoverPosition, string> = {
  top: 'Cover on top',
  bottom: 'Cover on bottom',
};
