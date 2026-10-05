import {
  getLyricFontFamily,
  type LyricFontId,
} from '../../constants/videoLyricFonts';

export const ensureLyricFontLoaded = async (
  fontId: LyricFontId,
  fontSizePx = 48,
  fontWeight = 700,
): Promise<void> => {
  if (!document.fonts) {
    return;
  }

  const family = getLyricFontFamily(fontId);
  const fontSpec = `${fontWeight} ${fontSizePx}px "${family}"`;

  try {
    await document.fonts.load(fontSpec);
    await document.fonts.ready;
  } catch {
    // Fallback to system font if load fails
  }
};
