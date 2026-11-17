export interface MusicTrack {
  id: string; title: string; artist: string; album?: string;
  albumArt?: string; spotifyUrl?: string; externalUrl?: string;
  audioFile?: string; description?: string;
}
export const music: MusicTrack[] = Array.from({ length: 6 }, (_, i) => ({ id: `track-${i + 1}`, title: '', artist: '' }));
export function spotifyEmbed(url?: string) {
  if (!url) return null;
  try { const parsed = new URL(url); const match = parsed.pathname.match(/^\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)\/?$/);
    return parsed.hostname === 'open.spotify.com' && match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
  } catch { return null; }
}
