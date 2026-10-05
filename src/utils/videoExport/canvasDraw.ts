import type { LyricAnimationTransform } from '../lyricAnimationTransform';

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
): void => {
  if (!text) {
    return;
  }

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

  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = fontSize * 0.2;
  ctx.shadowOffsetY = fontSize * 0.04;

  const lines = wrapTextLines(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.45;
  const blockHeight = lines.length * lineHeight;

  let startY = box.y;
  if (align.vertical === 'center') {
    startY = box.y + (box.height - blockHeight) / 2;
  } else if (align.vertical === 'bottom') {
    startY = box.y + box.height - blockHeight;
  }

  lines.forEach((line, index) => {
    let x = box.x;
    const lineWidth = ctx.measureText(line).width;
    if (align.horizontal === 'center') {
      x = box.x + (box.width - lineWidth) / 2;
    } else if (align.horizontal === 'right') {
      x = box.x + box.width - lineWidth;
    }
    ctx.fillText(line, x, startY + index * lineHeight);
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
