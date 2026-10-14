import type { LyricEffectPalette } from '../../constants/lyricEffectColors';
import type { LyricAnimationPresetId } from '../../constants/videoLyricAnimation';
import type { LyricVisualEffects } from '../../constants/videoLyricEffects';
import type { LyricAnimationTransform } from '../lyricAnimationTransform';
import {
  type LyricCanvasEffectFrame,
  paintLyricTextWithEffects,
} from '../lyricCanvasEffects';
import {
  getLyricWordAnimationTransform,
  isWordRandomAnimationPreset,
  splitLyricIntoWords,
} from '../lyricWordAnimation';

export const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  scale = 1,
): void => {
  const sourceWidth =
    'videoWidth' in source && source.videoWidth
      ? source.videoWidth
      : (source as HTMLImageElement).naturalWidth;
  const sourceHeight =
    'videoHeight' in source && source.videoHeight
      ? source.videoHeight
      : (source as HTMLImageElement).naturalHeight;

  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const targetW = width * scale;
  const targetH = height * scale;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetW / targetH;

  let drawW = targetW;
  let drawH = targetH;
  if (sourceRatio > targetRatio) {
    drawH = targetH;
    drawW = drawH * sourceRatio;
  } else {
    drawW = targetW;
    drawH = drawW / sourceRatio;
  }

  const offsetX = (width - drawW) / 2;
  const offsetY = (height - drawH) / 2;
  ctx.drawImage(source, offsetX, offsetY, drawW, drawH);
};

export const wrapTextLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  if (!text.trim()) {
    return [];
  }

  const paragraphs = text.split('\n');
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      return;
    }

    let current = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const next = `${current} ${words[index]}`;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = words[index];
      }
    }
    lines.push(current);
  });

  return lines;
};

type TextBoxAlign = {
  vertical: 'top' | 'center' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
};

const DEFAULT_ANIMATION: LyricAnimationTransform = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0,
  blurPx: 0,
};

export const drawLyricInBox = (
  ctx: CanvasRenderingContext2D,
  text: string,
  box: { x: number; y: number; width: number; height: number },
  align: TextBoxAlign,
  fontSize: number,
  fontFamily: string,
  fontWeight: number = 700,
  animation: LyricAnimationTransform = DEFAULT_ANIMATION,
  lyricEffects: LyricVisualEffects,
  palette: LyricEffectPalette,
  effectFrame: LyricCanvasEffectFrame,
  timeSec: number,
  lineId: string | null,
): void => {
  if (!text) {
    return;
  }

  const lineCharCount = text.length;
  const maxWidth = box.width * 0.92;
  ctx.save();
  ctx.globalAlpha = animation.opacity;
  if (animation.blurPx > 0) {
    ctx.filter = `blur(${animation.blurPx}px)`;
  }
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  ctx.translate(
    centerX + animation.translateX,
    centerY + animation.translateY,
  );
  ctx.rotate(animation.rotation);
  ctx.scale(animation.scale, animation.scale);
  ctx.translate(-centerX, -centerY);

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  const lines = wrapTextLines(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.45;
  const blockHeight = lines.length * lineHeight;

  let startY = box.y;
  if (align.vertical === 'center') {
    startY = box.y + (box.height - blockHeight) / 2;
  } else if (align.vertical === 'bottom') {
    startY = box.y + box.height - blockHeight;
  }

  let charIndexOffset = 0;
  lines.forEach((line, lineIndex) => {
    let x = box.x;
    const lineWidth = ctx.measureText(line).width;
    if (align.horizontal === 'center') {
      x = box.x + (box.width - lineWidth) / 2;
    } else if (align.horizontal === 'right') {
      x = box.x + box.width - lineWidth;
    }
    paintLyricTextWithEffects(
      ctx,
      line,
      x,
      startY + lineIndex * lineHeight,
      fontSize,
      lyricEffects,
      palette,
      effectFrame,
      timeSec,
      lineId,
      lineCharCount,
      charIndexOffset,
    );
    charIndexOffset += line.length;
  });

  ctx.restore();
};

type LyricWordPlacement = {
  wordIndex: number;
  x: number;
  y: number;
};

const layoutLyricWordPlacements = (
  ctx: CanvasRenderingContext2D,
  words: string[],
  box: { x: number; y: number; width: number; height: number },
  align: TextBoxAlign,
  fontSize: number,
): LyricWordPlacement[] => {
  const maxWidth = box.width * 0.92;
  const spaceWidth = ctx.measureText(' ').width;
  const lineHeight = fontSize * 1.45;
  const rows: number[][] = [];
  let row: number[] = [];
  let rowWidth = 0;

  words.forEach((word, wordIndex) => {
    const wordWidth = ctx.measureText(word).width;
    const extraWidth = row.length === 0 ? wordWidth : spaceWidth + wordWidth;

    if (row.length > 0 && rowWidth + extraWidth > maxWidth) {
      rows.push(row);
      row = [wordIndex];
      rowWidth = wordWidth;
      return;
    }

    row.push(wordIndex);
    rowWidth += extraWidth;
  });

  if (row.length > 0) {
    rows.push(row);
  }

  const blockHeight = rows.length * lineHeight;
  let startY = box.y;
  if (align.vertical === 'center') {
    startY = box.y + (box.height - blockHeight) / 2;
  } else if (align.vertical === 'bottom') {
    startY = box.y + box.height - blockHeight;
  }

  const placements: LyricWordPlacement[] = [];

  rows.forEach((rowIndices, rowIndex) => {
    const y = startY + rowIndex * lineHeight;
    let rowPixelWidth = 0;

    rowIndices.forEach((wordIndex, indexInRow) => {
      const wordWidth = ctx.measureText(words[wordIndex]).width;
      if (indexInRow > 0) {
        rowPixelWidth += spaceWidth;
      }
      rowPixelWidth += wordWidth;
    });

    let x = box.x;
    if (align.horizontal === 'center') {
      x = box.x + (box.width - rowPixelWidth) / 2;
    } else if (align.horizontal === 'right') {
      x = box.x + box.width - rowPixelWidth;
    }

    rowIndices.forEach((wordIndex, indexInRow) => {
      if (indexInRow > 0) {
        x += spaceWidth;
      }
      placements.push({ wordIndex, x, y });
      x += ctx.measureText(words[wordIndex]).width;
    });
  });

  return placements;
};

const drawSingleWord = (
  ctx: CanvasRenderingContext2D,
  word: string,
  x: number,
  y: number,
  fontSize: number,
  animation: LyricAnimationTransform,
  lyricEffects: LyricVisualEffects,
  palette: LyricEffectPalette,
  effectFrame: LyricCanvasEffectFrame,
  timeSec: number,
  lineId: string | null,
  lineCharCount: number,
  charIndexOffset: number,
): void => {
  const wordWidth = ctx.measureText(word).width;
  const centerX = x + wordWidth / 2;
  const centerY = y + fontSize * 0.72;

  ctx.save();
  ctx.globalAlpha = animation.opacity;
  if (animation.blurPx > 0) {
    ctx.filter = `blur(${animation.blurPx}px)`;
  }
  ctx.translate(
    centerX + animation.translateX,
    centerY + animation.translateY,
  );
  ctx.rotate(animation.rotation);
  ctx.scale(animation.scale, animation.scale);
  ctx.translate(-centerX, -centerY);
  paintLyricTextWithEffects(
    ctx,
    word,
    x,
    y,
    fontSize,
    lyricEffects,
    palette,
    effectFrame,
    timeSec,
    lineId,
    lineCharCount,
    charIndexOffset,
  );
  ctx.restore();
};

export const drawWordAnimatedLyricInBox = (
  ctx: CanvasRenderingContext2D,
  text: string,
  lineId: string,
  lineStartSec: number,
  lineEndSec: number | null,
  timeSec: number,
  preset: LyricAnimationPresetId,
  box: { x: number; y: number; width: number; height: number },
  align: TextBoxAlign,
  fontSize: number,
  fontFamily: string,
  fontWeight: number = 700,
  lyricEffects: LyricVisualEffects,
  palette: LyricEffectPalette,
  effectFrame: LyricCanvasEffectFrame,
): void => {
  if (!text || !isWordRandomAnimationPreset(preset)) {
    return;
  }

  const words = splitLyricIntoWords(text);
  if (words.length === 0) {
    return;
  }

  const lineCharCount = text.length;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  const placements = layoutLyricWordPlacements(
    ctx,
    words,
    box,
    align,
    fontSize,
  );

  placements.forEach(({ wordIndex, x, y }) => {
    const animation = getLyricWordAnimationTransform(
      preset,
      timeSec,
      lineStartSec,
      lineEndSec,
      fontSize,
      wordIndex,
      words.length,
      lineId,
    );
    const charIndexOffset = words.slice(0, wordIndex).join(' ').length;
    drawSingleWord(
      ctx,
      words[wordIndex],
      x,
      y,
      fontSize,
      animation,
      lyricEffects,
      palette,
      effectFrame,
      timeSec,
      lineId,
      lineCharCount,
      charIndexOffset,
    );
  });

  ctx.restore();
};

export const drawTrackInfoUnderCover = (
  ctx: CanvasRenderingContext2D,
  text: string,
  cardX: number,
  cardY: number,
  cardSize: number,
  fontSize: number,
  fontFamily: string,
): void => {
  if (!text.trim()) {
    return;
  }

  const gap = cardSize * 0.05;
  const box = {
    x: cardX,
    y: cardY + cardSize + gap,
    width: cardSize,
    height: fontSize * 4,
  };

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = fontSize * 0.2;
  ctx.shadowOffsetY = fontSize * 0.04;

  const lines = wrapTextLines(ctx, text, box.width);
  const lineHeight = fontSize * 1.45;
  const blockHeight = lines.length * lineHeight;
  const startY = box.y + Math.max(0, (box.height - blockHeight) / 2);

  lines.forEach((line, index) => {
    const lineWidth = ctx.measureText(line).width;
    const x = box.x + (box.width - lineWidth) / 2;
    ctx.fillText(line, x, startY + index * lineHeight);
  });

  ctx.restore();
};

export const drawRoundedImage = (
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  size: number,
  radius: number,
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
};
