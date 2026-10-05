export const formatTrackInfoLabel = (artist: string, title: string): string => {
  const trimmedArtist = artist.trim();
  const trimmedTitle = title.trim();

  if (trimmedArtist && trimmedTitle) {
    return `${trimmedArtist} — ${trimmedTitle}`;
  }

  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (trimmedArtist) {
    return trimmedArtist;
  }

  return '';
};
