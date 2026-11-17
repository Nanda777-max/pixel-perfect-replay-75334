export interface VisitedCountry {
  id: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2, e.g. TH, IN, AU
  visited: boolean; // Set true only after confirming an actual visit.
  photos: string[]; // Filenames within /images/travel/<id>/ or absolute public paths.
  description?: string;
}
// An example configuration, NOT a claim of travel.
export const visitedCountries: VisitedCountry[] = [
  { id: 'thailand', country: 'Thailand', countryCode: 'TH', visited: false, photos: [], description: '' },
];
export function visitedCountry(code: string, countries = visitedCountries) {
  return countries.find(country => country.visited && country.countryCode.toUpperCase() === code.toUpperCase());
}
