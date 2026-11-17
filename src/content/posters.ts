export interface Poster { id: string; title: string; type: 'movie' | 'series' | 'character' | 'other'; image?: string; description?: string; whyItMatters?: string }
export const posters: Poster[] = Array.from({ length: 4 }, (_, i) => ({ id: `poster-${i + 1}`, title: '', type: 'other' }));
// Every entry fits in the existing wall area; more entries make a denser grid.
export function posterLayout(count: number) {
  const columns = Math.max(2, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const width = Math.min(.9, 3.5 / columns - .12);
  const height = Math.min(1.2, 2.5 / rows - .12);
  return Array.from({ length: count }, (_, i) => ({ x: (i % columns - (columns - 1) / 2) * (3.5 / columns), y: ((rows - 1) / 2 - Math.floor(i / columns)) * (2.5 / rows), width, height }));
}
