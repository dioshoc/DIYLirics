export type VideoFormatId = 'youtube' | 'tiktok';

export type VideoFormatDefinition = {
  id: VideoFormatId;
  label: string;
  description: string;
  width: number;
  height: number;
  cssAspectRatio: string;
};

export const VIDEO_FORMATS: Record<VideoFormatId, VideoFormatDefinition> = {
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    description: 'Horizontal 16:9',
    width: 1920,
    height: 1080,
    cssAspectRatio: '16 / 9',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    description: 'Vertical 9:16',
    width: 1080,
    height: 1920,
    cssAspectRatio: '9 / 16',
  },
};

export const VIDEO_FORMAT_ORDER: VideoFormatId[] = ['youtube', 'tiktok'];

export const getVideoFormat = (id: VideoFormatId): VideoFormatDefinition =>
  VIDEO_FORMATS[id];
