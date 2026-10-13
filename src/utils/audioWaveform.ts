const peakCache = new Map<string, number[]>();

const WAVEFORM_CACHE_VERSION = 'v2-rms-p92';

const buildCacheKey = (audioUrl: string, barCount: number): string =>
  `${WAVEFORM_CACHE_VERSION}|${audioUrl}|${barCount}`;

const percentile = (sortedValues: number[], ratio: number): number => {
  if (sortedValues.length === 0) {
    return 0.0001;
  }
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(sortedValues.length * ratio)),
  );
  return sortedValues[index];
};

const toDisplayAmplitude = (normalized: number): number => {
  const clamped = Math.min(1, Math.max(0, normalized));
  return Math.pow(clamped, 0.55);
};

export const computeWaveformPeaks = async (
  audioUrl: string,
  barCount: number,
): Promise<number[]> => {
  const cacheKey = buildCacheKey(audioUrl, barCount);
  const cached = peakCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const context = new AudioContext();

  try {
    const buffer = await context.decodeAudioData(arrayBuffer);
    const channel0 = buffer.getChannelData(0);
    const channel1 =
      buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    const maxSample = channel0.length;

    const safeBarCount = Math.max(16, Math.min(barCount, 400));
    const samplesPerBar = Math.max(1, Math.floor(maxSample / safeBarCount));
    const rawMetrics: number[] = [];

    for (let barIndex = 0; barIndex < safeBarCount; barIndex += 1) {
      const start = barIndex * samplesPerBar;
      if (start >= maxSample) {
        rawMetrics.push(0);
        continue;
      }

      const end = Math.min(start + samplesPerBar, maxSample);
      let peak = 0;
      let sumSquares = 0;
      let sampleCount = 0;

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        const left = channel0[sampleIndex];
        const right = channel1 ? channel1[sampleIndex] : left;
        const mono = (left + right) * 0.5;
        const abs = Math.abs(mono);
        peak = Math.max(peak, abs);
        sumSquares += mono * mono;
        sampleCount += 1;
      }

      const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
      const loudness = peak * 0.3 + rms * 0.7;
      rawMetrics.push(loudness);
    }

    const sorted = [...rawMetrics].sort((a, b) => a - b);
    const normReference = Math.max(
      percentile(sorted, 0.92),
      percentile(sorted, 0.5) * 1.8,
      0.0001,
    );

    const normalized = rawMetrics.map((value) =>
      toDisplayAmplitude(value / normReference),
    );

    peakCache.set(cacheKey, normalized);
    return normalized;
  } finally {
    await context.close();
  }
};
