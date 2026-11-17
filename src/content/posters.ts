// The poster wall. Each entry becomes a framed poster on the left wall of the room.
// To add one: put the image in public/images/posters/ and add an entry, for example
//   { id: 'interstellar', title: 'Interstellar', type: 'movie', image: '/images/posters/interstellar.jpg',
//     description: 'Optional one-liner.', whyItMatters: 'Optional: why it stays with you.' },
// An entry with an empty title stays a placeholder frame. A missing image shows the placeholder art.
export interface Poster {
  id: string;
  title: string;
  type: 'movie' | 'series' | 'character' | 'other';
  image?: string;
  description?: string;
  whyItMatters?: string;
}

export const posters: Poster[] = Array.from({ length: 4 }, (_, i) => ({ id: `poster-${i + 1}`, title: '', type: 'other' }));

/** Wall area the posters share, in metres (width along the wall × height). */
export const posterWall = { width: 2.7, height: 1.75 };

/** Grid slots that fit `count` posters in the wall area without overlapping. */
export function posterLayout(count: number, wall = posterWall) {
  const columns = Math.max(2, Math.ceil(Math.sqrt(count * 1.4)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const gap = 0.12;
  const width = wall.width / columns - gap;
  const height = wall.height / rows - gap;
  return Array.from({ length: count }, (_, i) => ({
    x: (i % columns - (columns - 1) / 2) * (wall.width / columns),
    y: ((rows - 1) / 2 - Math.floor(i / columns)) * (wall.height / rows),
    width,
    height,
  }));
}
