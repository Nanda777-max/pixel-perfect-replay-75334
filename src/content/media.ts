// Public files are deliberately referenced by path. New collections need a data entry.
export const profileImages = { portrait: '/images/profile/portrait.jpg', characterReference: '/images/profile/character-ref.jpg' };
export interface PortfolioImage { id: string; image: string; title: string; description?: string }
export const projectImages: PortfolioImage[] = [];
export const educationImages: PortfolioImage[] = [];
export const experienceImages: PortfolioImage[] = [];
export const balconyImages: PortfolioImage[] = [];
export function countryPhotos(country: { id: string; photos: string[] }) {
  return country.photos.map(path => path.startsWith('/') ? path : `/images/travel/${country.id}/${path}`);
}