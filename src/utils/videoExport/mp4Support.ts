import {
  Mp4OutputFormat,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
} from 'mediabunny';

export const isMp4ExportSupported = async (
  width: number,
  height: number,
): Promise<boolean> => {
  if (typeof VideoEncoder === 'undefined') {
    return false;
  }

  const outputFormat = new Mp4OutputFormat();
  const videoCodec = await getFirstEncodableVideoCodec(
    outputFormat.getSupportedVideoCodecs(),
    { width, height },
  );
  const audioCodec = await getFirstEncodableAudioCodec(
    outputFormat.getSupportedAudioCodecs(),
  );

  return Boolean(videoCodec && audioCodec);
};
