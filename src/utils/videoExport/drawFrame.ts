import type { VideoFormatId } from '../../constants/videoFormats';
import type { TiktokCoverPosition } from '../../constants/tiktokCoverLayout';
import {
  getLyricFontCssFamily,
  type LyricFontId,
} from '../../constants/videoLyricFonts';
import {
  scaleLyricFontPx,
  type LyricFontSize,
} from '../../constants/videoLyricFontSize';
import type {
  LyricHorizontalAlign,
  LyricVerticalAlign,
} from '../../constants/videoLyricLayout';
import type { LyricAnimationPresetId } from '../../constants/videoLyricAnimation';
import type { YoutubeCoverSide } from '../../constants/youtubeCoverLayout';
import type { LyricsProject, VideoBackgroundSource } from '../../types/session';
import { getActiveLyricStateAtTime } from '../activeLyricLine';
import { getLyricAnimationTransform } from '../lyricAnimationTransform';
import type { ResolvedVideoBackground } from '../videoBackground';
import { formatTrackInfoLabel } from '../formatTrackInfoLabel';
import {
  drawImageCover,
  drawLyricInBox,
  drawRoundedImage,
  drawTrackInfoUnderCover,
} from './canvasDraw';
import type { ExportMediaAssets } from './loadAssets';
import { isCoverSplitLayout } from './isCoverSplit';

export type DrawFrameConfig = {
  width: number;
  height: number;
  formatId: VideoFormatId;
  backgroundSource: VideoBackgroundSource;
  coverArtUrl: string | null;
  background: ResolvedVideoBackground;
  youtubeCoverSide: YoutubeCoverSide;
  tiktokCoverPosition: TiktokCoverPosition;
  lyricVerticalAlign: LyricVerticalAlign;
  lyricHorizontalAlign: LyricHorizontalAlign;
  lyricFontSize: LyricFontSize;
  lyricFontId: LyricFontId;
  lyricAnimationPreset: LyricAnimationPresetId;
  showTrackInfoUnderCover: boolean;
  project: LyricsProject;
  lyricsEndTimeSec: number | null;
};

type DrawFrameRuntime = {
  timeSec: number;
  lyricText: string;
  lineStartSec: number | null;
  lineEndSec: number | null;
};

const drawCoverTrackInfoIfEnabled = (
  ctx: CanvasRenderingContext2D,
  config: DrawFrameConfig,
  cardX: number,
  cardY: number,
  cardSize: number,
): void => {
  if (!config.showTrackInfoUnderCover) {
    return;
  }

  const label = formatTrackInfoLabel(
    config.project.meta.artist,
    config.project.meta.title,
  );
  if (!label) {
    return;
  }

  const infoFontSize = Math.max(
    12,
    Math.min(cardSize * 0.1, config.width * 0.024),
  );
  const fontFamily = getLyricFontCssFamily(config.lyricFontId);
  drawTrackInfoUnderCover(
    ctx,
    label,
    cardX,
    cardY,
    cardSize,
    infoFontSize,
    fontFamily,
  );
};

const resolveLyricAnimation = (
  config: DrawFrameConfig,
  runtime: DrawFrameRuntime,
  fontSize: number,
) =>
  getLyricAnimationTransform(
    config.lyricAnimationPreset,
    runtime.timeSec,
    runtime.lineStartSec,
    runtime.lineEndSec,
    fontSize,
  );

const drawBlurredCoverBackdrop = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void => {
  ctx.save();
  ctx.filter = `blur(${Math.max(10, Math.min(width, height) * 0.01)}px)`;
  drawImageCover(ctx, image, width, height, 1.05);
  ctx.restore();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.fillRect(0, 0, width, height);
};

const drawFullBackground = (
  ctx: CanvasRenderingContext2D,
  assets: ExportMediaAssets,
  width: number,
  height: number,
): void => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1f2433');
  gradient.addColorStop(1, '#12151f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (assets.backgroundVideo) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    drawImageCover(ctx, assets.backgroundVideo, width, height);
    ctx.restore();
  } else if (assets.backgroundImage) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    drawImageCover(ctx, assets.backgroundImage, width, height);
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, width, height);
};

const lyricAlign = (
  v: LyricVerticalAlign,
  h: LyricHorizontalAlign,
): { vertical: LyricVerticalAlign; horizontal: LyricHorizontalAlign } => ({
  vertical: v,
  horizontal: h,
});

const drawYoutubeCoverSplit = (
  ctx: CanvasRenderingContext2D,
  config: DrawFrameConfig,
  assets: ExportMediaAssets,
  runtime: DrawFrameRuntime,
): void => {
  const { lyricText } = runtime;
  const { width, height, youtubeCoverSide, lyricVerticalAlign, lyricHorizontalAlign } =
    config;
  const cover = assets.coverImage;
  if (!cover) {
    return;
  }

  drawBlurredCoverBackdrop(ctx, cover, width, height);

  const padX = width * 0.07;
  const padY = height * 0.08;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const cardSize = Math.min(innerW * 0.323, innerH * 0.612);
  const gap = height * 0.06;
  const lyricW = innerW - cardSize - gap;
  const radius = Math.min(width, height) * 0.02;

  const cardY = padY + (innerH - cardSize) / 2;
  const cardXLeft = padX;
  const cardXRight = padX + lyricW + gap;

  const lyricBoxLeft = { x: padX, y: padY, width: lyricW, height: innerH };
  const lyricBoxRight = {
    x: padX + cardSize + gap,
    y: padY,
    width: lyricW,
    height: innerH,
  };

  const fontSize = scaleLyricFontPx(
    Math.min(width * 0.0425, height * 0.085),
    config.lyricFontSize,
  );
  const fontFamily = getLyricFontCssFamily(config.lyricFontId);
  const animation = resolveLyricAnimation(config, runtime, fontSize);

  if (youtubeCoverSide === 'left') {
    drawRoundedImage(ctx, cover, cardXLeft, cardY, cardSize, radius);
    drawCoverTrackInfoIfEnabled(ctx, config, cardXLeft, cardY, cardSize);
    drawLyricInBox(
      ctx,
      lyricText,
      lyricBoxRight,
      lyricAlign(lyricVerticalAlign, lyricHorizontalAlign),
      fontSize,
      fontFamily,
      700,
      animation,
    );
    return;
  }

  drawLyricInBox(
    ctx,
    lyricText,
    lyricBoxLeft,
    lyricAlign(lyricVerticalAlign, lyricHorizontalAlign),
    fontSize,
    fontFamily,
    700,
    animation,
  );
  drawRoundedImage(ctx, cover, cardXRight, cardY, cardSize, radius);
  drawCoverTrackInfoIfEnabled(ctx, config, cardXRight, cardY, cardSize);
};

const drawTiktokCoverSplit = (
  ctx: CanvasRenderingContext2D,
  config: DrawFrameConfig,
  assets: ExportMediaAssets,
  runtime: DrawFrameRuntime,
): void => {
  const { lyricText } = runtime;
  const { width, height, tiktokCoverPosition, lyricVerticalAlign, lyricHorizontalAlign } =
    config;
  const cover = assets.coverImage;
  if (!cover) {
    return;
  }

  drawBlurredCoverBackdrop(ctx, cover, width, height);

  const cardSize = Math.min(width * 0.612, height * 0.357);
  const cardX = (width - cardSize) / 2;
  const radius = Math.min(width, height) * 0.02;

  const cardYTop = height * 0.22;
  const cardYBottom = height * 0.76 - cardSize;

  const cardY =
    tiktokCoverPosition === 'bottom' ? cardYBottom : cardYTop;

  drawRoundedImage(ctx, cover, cardX, cardY, cardSize, radius);
  drawCoverTrackInfoIfEnabled(ctx, config, cardX, cardY, cardSize);

  const lyricPadX = width * 0.1;
  const cardReserve = cardSize + height * 0.0175;
  const lyricBox =
    tiktokCoverPosition === 'bottom'
      ? {
          x: lyricPadX,
          y: height * 0.14,
          width: width - lyricPadX * 2,
          height: height - height * 0.14 - height * 0.18 - cardReserve,
        }
      : {
          x: lyricPadX,
          y: height * 0.16 + cardReserve,
          width: width - lyricPadX * 2,
          height: height - height * 0.16 - cardReserve - height * 0.26,
        };

  const fontSize = scaleLyricFontPx(height * 0.036, config.lyricFontSize);
  const fontFamily = getLyricFontCssFamily(config.lyricFontId);
  const animation = resolveLyricAnimation(config, runtime, fontSize);
  drawLyricInBox(
    ctx,
    lyricText,
    lyricBox,
    lyricAlign(lyricVerticalAlign, lyricHorizontalAlign),
    fontSize,
    fontFamily,
    700,
    animation,
  );
};

const drawFullLayout = (
  ctx: CanvasRenderingContext2D,
  config: DrawFrameConfig,
  assets: ExportMediaAssets,
  runtime: DrawFrameRuntime,
): void => {
  const { lyricText } = runtime;
  const { width, height, formatId, lyricVerticalAlign, lyricHorizontalAlign } =
    config;

  drawFullBackground(ctx, assets, width, height);

  const padX = width * 0.08;
  const padTop = formatId === 'tiktok' ? height * 0.14 : height * 0.1;
  const padBottom = formatId === 'tiktok' ? height * 0.26 : height * 0.1;

  const lyricBox = {
    x: padX,
    y: padTop,
    width: width - padX * 2,
    height: height - padTop - padBottom,
  };

  const baseFontSize =
    formatId === 'tiktok'
      ? height * 0.036
      : Math.min(width * 0.047, height * 0.0765);
  const fontSize = scaleLyricFontPx(baseFontSize, config.lyricFontSize);
  const fontFamily = getLyricFontCssFamily(config.lyricFontId);
  const animation = resolveLyricAnimation(config, runtime, fontSize);

  drawLyricInBox(
    ctx,
    lyricText,
    lyricBox,
    lyricAlign(lyricVerticalAlign, lyricHorizontalAlign),
    fontSize,
    fontFamily,
    formatId === 'tiktok' ? 700 : 600,
    animation,
  );
};

export const drawExportFrame = async (
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  config: DrawFrameConfig,
  assets: ExportMediaAssets,
): Promise<void> => {
  const { width, height, project, lyricsEndTimeSec } = config;
  ctx.clearRect(0, 0, width, height);

  if (assets.backgroundVideo) {
    assets.backgroundVideo.currentTime = Math.min(
      timeSec,
      assets.backgroundVideo.duration || timeSec,
    );
  }

  const lyricState = getActiveLyricStateAtTime(
    project.lines,
    timeSec,
    lyricsEndTimeSec,
  );
  const runtime: DrawFrameRuntime = {
    timeSec,
    lyricText: lyricState.text,
    lineStartSec: lyricState.lineStartSec,
    lineEndSec: lyricState.lineEndSec,
  };

  const coverSplit = isCoverSplitLayout(
    config.backgroundSource,
    config.coverArtUrl,
    config.background,
  );

  if (coverSplit && assets.coverImage) {
    if (config.formatId === 'youtube') {
      drawYoutubeCoverSplit(ctx, config, assets, runtime);
      return;
    }
    drawTiktokCoverSplit(ctx, config, assets, runtime);
    return;
  }

  drawFullLayout(ctx, config, assets, runtime);
};
