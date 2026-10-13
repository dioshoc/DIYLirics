export const decodeAudioFromUrl = async (url: string): Promise<AudioBuffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const context = new AudioContext();
  try {
    return await context.decodeAudioData(arrayBuffer);
  } finally {
    await context.close();
  }
};

export const trimAudioBuffer = (
  buffer: AudioBuffer,
  durationSec: number,
): AudioBuffer => {
  const sampleCount = Math.min(
    buffer.length,
    Math.max(0, Math.floor(durationSec * buffer.sampleRate)),
  );

  if (sampleCount >= buffer.length) {
    return buffer;
  }

  const trimmed = new AudioContext().createBuffer(
    buffer.numberOfChannels,
    sampleCount,
    buffer.sampleRate,
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    trimmed.copyToChannel(
      buffer.getChannelData(channel).subarray(0, sampleCount),
      channel,
    );
  }

  return trimmed;
};

export const sliceAudioBuffer = (
  buffer: AudioBuffer,
  startSec: number,
  durationSec: number,
): AudioBuffer => {
  const startSample = Math.min(
    buffer.length,
    Math.max(0, Math.floor(startSec * buffer.sampleRate)),
  );
  const sampleCount = Math.min(
    Math.max(0, Math.floor(durationSec * buffer.sampleRate)),
    buffer.length - startSample,
  );

  if (sampleCount <= 0) {
    return trimAudioBuffer(buffer, 0);
  }

  if (startSample === 0 && sampleCount >= buffer.length) {
    return buffer;
  }

  const sliced = new AudioContext().createBuffer(
    buffer.numberOfChannels,
    sampleCount,
    buffer.sampleRate,
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    sliced.copyToChannel(
      buffer.getChannelData(channel).subarray(
        startSample,
        startSample + sampleCount,
      ),
      channel,
    );
  }

  return sliced;
};
