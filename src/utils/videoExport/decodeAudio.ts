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
