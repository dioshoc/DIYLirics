import styles from './WaveformBars.module.scss';

type WaveformBarsProps = {
  peaks: number[] | null;
  isLoading?: boolean;
  dimBeforePercent?: number;
  dimAfterPercent?: number;
};

export const WaveformBars = ({
  peaks,
  isLoading = false,
  dimBeforePercent = 0,
  dimAfterPercent = 0,
}: WaveformBarsProps) => {
  const bars =
    peaks && peaks.length > 0
      ? peaks
      : Array.from({ length: 48 }, () => 0.12);

  return (
    <div
      className={styles.waveform}
      data-loading={isLoading}
      aria-hidden
    >
      {bars.map((peak, index) => {
        const barPercent = ((index + 0.5) / bars.length) * 100;
        const isDimmed =
          barPercent < dimBeforePercent ||
          barPercent > 100 - dimAfterPercent;

        return (
          <div
            key={index}
            className={styles.bar}
            data-dimmed={isDimmed}
            style={{
              height: `${Math.min(100, Math.max(3, peak * 100))}%`,
            }}
          />
        );
      })}
    </div>
  );
};
