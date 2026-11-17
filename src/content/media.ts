// Image lookups for the content files. Paths are site paths: public/images/x.jpg → '/images/x.jpg'.
// The image list is generated from public/images and public/artwork (see vite.config.ts), so the
// site knows which files exist and never requests a missing one.
import { publicImages } from 'virtual:public-images';

const known = new Set(publicImages);

/** Normalise 'images/a.jpg', '/images/a.jpg' or 'public/images/a.jpg' to '/images/a.jpg'. */
export function sitePath(path: string) {
  return '/' + path.replace(/^\/+/, '').replace(/^public\//, '');
}

/** The image path if that file exists in public/, otherwise null. External https:// links are trusted. */
export function existingImage(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const p = sitePath(path);
  return known.has(p) ? p : null;
}

/** All images directly or indirectly inside a public folder, in natural order (photo-2 before photo-10). */
export function imagesIn(folder: string) {
  const prefix = sitePath(folder).replace(/\/?$/, '/');
  return publicImages.filter(p => p.startsWith(prefix));
}

/** First existing file for a base name in any supported format, e.g. portrait.jpg or portrait.webp. */
export function firstImage(basePath: string) {
  const base = sitePath(basePath).replace(/\.[a-z0-9]+$/i, '');
  return ['jpg', 'jpeg', 'png', 'webp', 'avif'].map(ext => `${base}.${ext}`).find(p => known.has(p)) ?? null;
}

export const profileImages = { portrait: '/images/profile/portrait.jpg', characterReference: '/images/profile/character-ref.jpg' };
/** The displayed profile photograph (jpg, png or webp), or null while none has been added. */
export const portraitImage = () => firstImage(profileImages.portrait);
/** The character-reference image. Never displayed as the profile photograph. */
export const characterReferenceImage = () => firstImage(profileImages.characterReference);

export interface PortfolioImage { id: string; image: string; title: string; description?: string }

/**
 * Travel album photos for a country. If `photos` lists files, exactly those are used (a bare
 * filename is looked up in /images/travel/<id>/). If `photos` is empty, every image in
 * public/images/travel/<id>/ is used automatically.
 */
export function countryPhotos(country: { id: string; photos: string[] }) {
  const listed = country.photos
    .map(p => existingImage(p.includes('/') ? p : `/images/travel/${country.id}/${p}`))
    .filter((p): p is string => Boolean(p));
  return country.photos.length ? listed : imagesIn(`/images/travel/${country.id}`);
}

/** Folder galleries: any image placed in these folders appears in the matching panel. */
export const galleryFolders = {
  projects: '/images/projects',
  education: '/images/education',
  experience: '/images/experience',
  balcony: '/images/balcony',
} as const;
