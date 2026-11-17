# My Mindscape content guide

This guide is for updating the site without touching the 3D code. Everything personal lives in two places:

- **Files** in `public/` (images, audio). `public/images/posters/dune.jpg` is served at `/images/posters/dune.jpg`.
- **Content files** in `src/content/` (titles, descriptions, links, which countries you've visited).

You never need to edit anything in `src/components/`.

## When do changes appear?

| Where you're looking | After adding a file or editing a content file |
|---|---|
| Local preview (`npm run dev`) | The page reloads by itself. If a brand-new file still doesn't show, stop and restart `npm run dev`. |
| Lovable preview / published site | Commit and push to GitHub `main` (Lovable syncs it), then press **Publish → Update** in Lovable. The list of images is captured when the site is built, so new images on the live site always need this redeploy. |

## What updates automatically, and what needs a content entry

| Content | Folder | Content file | What happens |
|---|---|---|---|
| Profile photo | `public/images/profile/` | none | `portrait.jpg` (or `.png`, `.webp`) appears in the desk frame and the "A little about me" panel. No file → drawn placeholder. |
| Character reference | `public/images/profile/` | none (`character.ts` holds the written description) | `character-ref.jpg` is kept for the future 3D character. It is never displayed on the site. |
| Movie and character posters | `public/images/posters/` | `posters.ts` | Each entry becomes a framed poster on the left wall, sized to the image's shape. Needs an entry. |
| Travel photos | `public/images/travel/<country-id>/` | `travel.ts` | Every image in the country's folder appears in its album, automatically. The country must be marked `visited: true`. |
| Visited countries | none | `travel.ts` | `visited: true` highlights the whole country on both globes. |
| Music | `public/images/music/` (covers), `public/audio/` (audio) | `music.ts` | Each entry becomes an album card. Needs an entry. |
| Artwork | `public/artwork/` | `artwork.ts` | Shows the image in the easel panel. Needs the `image` field. |
| Project screenshots | `public/images/projects/` | none | Every image appears as a gallery in "Things I've built", automatically. |
| Education / experience / balcony photos | `public/images/education/`, `…/experience/`, `…/balcony/` | none | Every image appears as a gallery in that panel, automatically. |
| Book covers | `public/images/books/` | `books.ts` | Set an item's `image` to the cover path. |

Supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`. Keep images under about 1600 px on the long edge and strip location data first (see Privacy).

---

## 1. Replace your profile photograph
1. Save the photo as `public/images/profile/portrait.jpg`. Use a 4:5 portrait shape; other shapes are cropped to fit, never stretched.
2. Reload. No code or content change is needed.

To remove it, delete the file and the placeholder comes back.

## 2. Add or replace the 3D character reference
1. Save it as `public/images/profile/character-ref.jpg`.
2. Describe clothing and personality in `src/content/character.ts` (`text`).

This file is a reference for building the stylised character later. It is deliberately not shown anywhere on the site.

## 3. Add a movie poster
1. Save the poster as `public/images/posters/interstellar.jpg`.
2. In `src/content/posters.ts`, replace one placeholder entry with:

```ts
export const posters: Poster[] = [
  {
    id: 'interstellar',
    title: 'Interstellar',
    type: 'movie',                 // 'movie' | 'series' | 'character' | 'other'
    image: '/images/posters/interstellar.jpg',
    description: 'Optional one-liner.',
    whyItMatters: 'Optional: why it stays with you.',
  },
  // …the remaining entries
];
```

3. Reload. The poster is framed on the wall. Clicking it brings it forward with its details.

## 4. Add another movie, series or character
Add another entry to the same `posters` list, with a different `id` and its own image. The wall rearranges itself into a grid that fits the space without overlapping. Entries with an empty `title` stay as placeholder frames; delete them when you no longer want them.

## 5. Mark a country as visited
Open `src/content/travel.ts`. Each country is one entry:

```ts
{ id: 'thailand', country: 'Thailand', countryCode: 'TH', visited: true, photos: [], description: 'A line or two about the trip.' },
```

- `countryCode` is the two-letter ISO code (TH, IN, JP, AU, GB, US…). It is how the globe finds the country's borders.
- `id` is lower-case with no spaces. It is also the name of the photo folder.
- To add a new country, copy an entry and change all four fields.

## 6. Highlight it on the globe
`visited: true` is all it takes. After reloading, the country's whole land area turns terracotta on the big globe (with its name label) and on the small globe in the room. The legend explains the colours. Countries set to `visited: false` stay plain and never open an album.

## 7. Add photos to that country's album
1. Put the photos in `public/images/travel/thailand/`. Name them in order: `thailand-1.jpg`, `thailand-2.jpg`, … (`-2` sorts before `-10`).
2. Leave `photos: []` empty. Every image in the folder is used automatically.

To choose or reorder photos yourself, list them instead. Then only the listed files are used:
```ts
photos: ['thailand-2.jpg', 'thailand-1.jpg'],
```
Clicking the highlighted country opens the album. Visitors can step through photos, tap one to enlarge it, and return to the globe.

## 8. Add a music track
In `src/content/music.ts`, replace a placeholder entry:

```ts
{
  id: 'example-track',
  title: 'Song title',
  artist: 'Artist',
  album: 'Album name',                         // optional
  albumArt: '/images/music/example-track.jpg', // optional
  spotifyUrl: 'https://open.spotify.com/track/…', // optional
  externalUrl: 'https://…',                    // optional
  audioFile: '/audio/example-track.mp3',       // optional, only audio you have the rights to share
  description: 'Why I like it.',               // optional
},
```

## 9. Add album artwork
Save a square image as `public/images/music/example-track.jpg` and set `albumArt` to that path. The cover shows on the card and on the label of the record on the turntable.

## 10. Link a Spotify track or another listening page
- **Spotify:** set `spotifyUrl` to the track, album or playlist link (Share → Copy link). Visitors press "Load the Spotify player" to open Spotify's official embedded player. Spotify only plays full tracks for logged-in listeners; otherwise it plays a preview. The site can't control the Spotify player, so the turntable doesn't spin for it.
- **Any other page** (YouTube, Apple Music, Bandcamp): set `externalUrl`. A "Listen externally" link opens it in a new tab.
- **Your own audio:** put the file in `public/audio/` and set `audioFile`. This plays in the site's own player: play, pause, next and previous, progress, volume and mute. The record spins and the tonearm swings onto it while it plays. Music never starts by itself.

## 11. Add artwork
1. Save the image as `public/artwork/artwork-1.jpg`.
2. In `src/content/artwork.ts`, fill an item: `"title": "Monsoon study"`, `"image": "/artwork/artwork-1.jpg"`, plus `medium`, `year` and `description`.
3. Reload and click the easel.

## 12. Add project screenshots
Drop the images into `public/images/projects/` (for example `wc26-1.png`). They appear as a gallery at the top of "Things I've built", in name order. No content entry is needed. Education, experience and balcony photos work the same way in their own folders.

---

## Placeholder checklist — text still to supply
- `src/content/about.ts` → `text`: personal one-liner; résumé at `public/files/resume.pdf`.
- `src/content/research.ts` → paper title, two-sentence summary, contribution, figure at `public/images/projects/ieee-figure.png`.
- `src/content/education.ts` → Monash is in progress; never create a fake official certificate.
- `src/content/experience.ts` → no employee ID visible in photos.
- `src/content/projects.ts` → World Cup live URL; chatbot team role and GitHub; IoT GitHub; two future project slots.
- `src/content/interests.ts`, `notebook.ts`, `milestones.ts`, `easterEggs.ts`, `balcony.ts`, `character.ts` → fill the `[PLACEHOLDER]` lines.
- `src/content/books.ts`, `music.ts`, `posters.ts`, `artwork.ts`, `travel.ts` → see the sections above. Nothing is invented: empty entries stay as placeholders.

## Privacy
Never include phone, plaintext email, home address, visas, IDs, transcripts, unit marks or the government client's name. Refer only to “a UK Government client”. Strip EXIF/GPS before upload by exporting a clean copy or using `exiftool -all= photo.jpg`. Do not upload photos showing a home exterior.

## Cloud and moderation
Database configuration is managed by Lovable Cloud; do not paste privileged credentials into content files. Pending notes can be reviewed in More → Database, `guestbook_notes`; approve by setting `approved` to true or delete rejected notes. Owner sign-in and in-app moderation are still pending; designated roles are held in the separate `user_roles` table. Never grant every signed-in user moderation privileges.

## Private email
Private sending is disabled. Configure `CONTACT_TO_EMAIL` through Secrets, and configure a verified sending service before implementing delivery. No destination address belongs in public content or repository code. No submission is claimed to have been sent. Optional `CONTACT_FROM_EMAIL` must be a verified sender. Email delivery implementation and its end-to-end test remain open.

## Still not built
Character model and reactions, football physics, animated book opening, secure private email and an owner moderation screen.
