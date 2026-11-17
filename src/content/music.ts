// The record player's collection. Each entry becomes an album card in the music player.
// To add one: put the cover in public/images/music/ and add an entry, for example
//   { id: 'example-track', title: 'Song title', artist: 'Artist', album: 'Album',
//     albumArt: '/images/music/example-track.jpg',
//     spotifyUrl: 'https://open.spotify.com/track/…',  // plays inside an official Spotify embed
//     externalUrl: 'https://…',                         // any other listening page (opens a new tab)
//     audioFile: '/audio/example-track.mp3' },          // only audio you have the rights to share
// Entries with an empty title stay "coming soon" cards. Nothing ever plays automatically.
export interface MusicTrack {
  id: string; title: string; artist: string; album?: string;
  albumArt?: string; spotifyUrl?: string; externalUrl?: string;
  audioFile?: string; description?: string;
}
export const music: MusicTrack[] = Array.from({ length: 6 }, (_, i) => ({ id: `track-${i + 1}`, title: '', artist: '' }));

/** The official embed URL for an open.spotify.com track, album or playlist link, or null. */
export function spotifyEmbed(url?: string) {
  if (!url) return null;
  try { const parsed = new URL(url); const match = parsed.pathname.match(/^\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)\/?$/);
    return parsed.hostname === 'open.spotify.com' && match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
  } catch { return null; }
}
