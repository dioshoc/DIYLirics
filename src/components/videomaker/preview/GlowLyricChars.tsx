import type { LyricEffectPalette } from '../../../constants/lyricEffectColors';
import { getLyricGlowCharTextShadow } from '../../../utils/lyricVisualEffectsStyle';

type GlowLyricCharsProps = {
  text: string;
  timeSec: number;
  lineId: string | null;
  lineCharCount: number;
  palette: LyricEffectPalette;
  charIndexOffset?: number;
};

export const GlowLyricChars = ({
  text,
  timeSec,
  lineId,
  lineCharCount,
  palette,
  charIndexOffset = 0,
}: GlowLyricCharsProps) =>
  text.split('').map((char, index) => (
    <span
      key={`${charIndexOffset}-${index}-${char}`}
      style={{
        textShadow: getLyricGlowCharTextShadow(
          charIndexOffset + index,
          timeSec,
          lineId,
          lineCharCount,
          palette,
        ),
      }}
    >
      {char}
    </span>
  ));
