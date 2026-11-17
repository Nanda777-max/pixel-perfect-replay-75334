// Country borders (Natural Earth 1:110m, public domain), slimmed to { name, code } per country.
// Loaded on demand from public/data/countries.geojson so the first page load stays light.
import { visitedCountries } from '@/content/travel';
import { withBase } from '@/content/media';

export interface CountryFeature {
  type: 'Feature';
  properties: { name: string; code: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
}

let cache: Promise<CountryFeature[]> | null = null;
export function loadCountries() {
  cache ??= fetch(withBase('/data/countries.geojson'))
    .then(r => { if (!r.ok) throw new Error(`Country data failed to load (${r.status})`); return r.json(); })
    .then((d: { features: CountryFeature[] }) => d.features)
    .catch(e => { cache = null; throw e; });
  return cache;
}

/** ISO codes of every country marked `visited: true` in src/content/travel.ts. */
export const visitedCodes = () => new Set(visitedCountries.filter(c => c.visited).map(c => c.countryCode.toUpperCase()));
export const visitedEntry = (code: string) => visitedCountries.find(c => c.visited && c.countryCode.toUpperCase() === code.toUpperCase());

export const globeColours = { ocean: '#cfe0dc', land: '#e9e1cc', border: '#8f9a83', visited: '#d9774b', visitedBorder: '#9c4a28' };

/** Equirectangular world map for the small desk-side globe, with visited countries highlighted. */
export function drawWorldMap(features: CountryFeature[], width = 1024) {
  // Deeper tones than the big globe: the small globe sits in a bright room and would wash out.
  const tone = { ocean: '#7fa9a6', land: '#efe5c8', border: '#7d8a6f' };
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = width / 2;
  const ctx = canvas.getContext('2d'); if (!ctx) return canvas;
  const visited = visitedCodes();
  ctx.fillStyle = tone.ocean; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const px = (lon: number) => ((lon + 180) / 360) * canvas.width; const py = (lat: number) => ((90 - lat) / 180) * canvas.height;
  for (const f of features) {
    const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
    const hit = visited.has(f.properties.code);
    ctx.beginPath();
    for (const poly of polys) for (const ring of poly) ring.forEach(([lon = 0, lat = 0], i) => (i ? ctx.lineTo(px(lon), py(lat)) : ctx.moveTo(px(lon), py(lat))));
    ctx.fillStyle = hit ? globeColours.visited : tone.land; ctx.fill('evenodd');
    ctx.lineWidth = 0.8; ctx.strokeStyle = hit ? globeColours.visitedBorder : tone.border; ctx.stroke();
  }
  return canvas;
}
