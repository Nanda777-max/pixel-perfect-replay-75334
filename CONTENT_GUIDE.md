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
| Artwork | `public/artwork/` | `artwork.ts` | Each entry is one artwork in the museum gallery, with its gold plaque. The first artwork with an image also appears on the easel's canvas. |
| Drawer memories | `public/images/drawers/` | `drawers.ts` | Objects appear in the drawer you link them to, in the room and in the tray that opens. Empty drawers show a placeholder. |
| Desk notes | none | `desk.ts` | Clicking a note on the desk shows its text. |
| Project screenshots | `public/images/projects/` | `projects.ts` (`Images:` line) | Files named on a project's `Images:` line appear in its **Visualisations** tab in the laptop workspace. Any image in the folder also shows as a gallery. |
| Education frame photo | `public/images/education/monash.jpg` | none | Replaces the designed certificate-style card on the wall and in the education view. |
| Journey frame photo | `public/images/experience/tcs.jpg` | none | Replaces the designed timeline on the wall and in the journey view. No ID numbers visible. |
| Research figure | `public/images/projects/ieee-figure.png` | none | Replaces the designed paper preview on the wall and in the research view. |
| Education / experience / balcony photos | `public/images/education/`, `…/experience/`, `…/balcony/` | none | Every image appears as a gallery in that panel, automatically. |
| Books and covers | `public/images/books/` | `books.ts` | Each entry is a book on the library shelf; `cover` shows the image on its front. |
| Social links | none | `social.ts` | GitHub, LinkedIn and Instagram everywhere on the site. |
| Site icon | `public/` | none | `nks-icon.png` and the sizes made from it. |

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

## 11. Add artwork (the museum gallery)
1. Save the image in `public/artwork/`, for example `public/artwork/monsoon-memories.jpg`. Any shape works; it is never cropped or stretched.
2. In `src/content/artwork.ts`, fill in a placeholder entry (or copy one to add more):

```ts
{
  "id": "monsoon-memories",
  "status": "ready",
  "title": "Monsoon Memories",
  "artist": "Nanda Kishor Sajeev",
  "medium": "Digital illustration",
  "year": "2026",
  "description": "Optional: one or two lines shown under the plaque.",
  "image": "/artwork/monsoon-memories.jpg"
},
```

3. Reload and click the easel. The camera moves to the easel, the room dims, and the gallery opens.
- **The gold plaque** shows the title in italics, the artist in capitals, then "medium · year". Any empty field is simply left off.
- **An entry with an empty `title`** stays a "Work in progress" canvas in the carousel.
- **The order of entries** is the order of the carousel.
- **The easel in the room** shows the first artwork that has an image.
- **The frame** is a carved, gilded museum frame (`src/assets/gallery-frame.svg`). It sizes itself to each image's own proportions, so portrait, landscape and square pieces all fit exactly, with nothing cropped or stretched.
- **An entry with no image** hangs as a quiet dark canvas reading "A new piece is waiting to be hung."
- **One artwork** hides the arrows and dots; **no artworks at all** shows a single empty frame.

## 12. Add project screenshots
1. Save them in `public/images/projects/` using the names already on the project's `Images:` line in `src/content/projects.ts` (for the World Cup predictor: `wc26-1.png`, `wc26-2.png`, `wc26-shap.png`).
2. Reload, open the laptop, open the repository and choose **Visualisations**.

To add a new screenshot, add its filename to that `Images:` line. When a project's links or role are ready, replace the `[PLACEHOLDER]` on its `GitHub:`, `Live demo:` or `My role in the team:` line with the real value; the workspace picks them up automatically.

## 13. The laptop workspace and the framed displays
- **Laptop:** everything comes from `src/content/projects.ts`. Keep the `Project N:` headings and the `Overview:`, `Problem:`, `Approach:`, `Implementation:`, `Results:`, `Findings:`, `Tech:`, `GitHub:`, `Live demo:` labels. A project's GitHub link is what shows the "Public" badge and the clone command. The "coming soon" slots come from the `Projects 4+` line.
- **Education:** `src/content/education.ts`. The wall card uses the first degree's title, university, place and years, plus its status in brackets, e.g. `(in progress)`.
- **My Journey:** `src/content/experience.ts`, newest role first. Each role starts with `Role, Company, Place, Mon YYYY – Mon YYYY` and is followed by its bullet lines and a `Tools:` line.
- **Research:** `src/content/research.ts`. Replace `[PLACEHOLDER]` after `Paper title:`, `Plain-English summary:`, and `My contribution:`. The wall preview then shows the real title. Keep each label before the colon exactly as it is: labels can only contain letters, spaces and hyphens, so a label like `Summary (2 sentences):` would be ignored.

---

## 14. Replace the site icon (favicon)
- **The source** is `public/nks-icon.png` (square, 1024×1024). These are made from it and are what browsers use: `public/favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png`. `public/site.webmanifest` lists the two large ones for installed apps.
- **To replace it:** save your new square PNG over `public/nks-icon.png` and ask me (or any developer) to regenerate the five sizes, or make them with an online favicon generator and replace the files with the same names.
- **To make browsers drop the cached old icon:** change `?v=nks` to something new (for example `?v=nks2`) in `src/routes/__root.tsx` and `pages/index.html`. Browsers cache icons hard; a private window shows the new one straight away.

## 15. GitHub avatar and social links
- **Social links** live only in `src/content/social.ts`. Change a `url` or `handle` there and the header, the menu, the About panel and the laptop workspace all update. The order of the list is the order on the site.
- **The GitHub avatar** in the laptop workspace is `githubAvatar` in the same file. It points to GitHub's own copy of your profile picture (by your account number), so changing your picture on GitHub updates the site automatically. To use a different image instead, put it in `public/images/profile/` and set `githubAvatar` to that path, for example `'/images/profile/github-avatar.jpg'`. Your website portrait (`public/images/profile/portrait.jpg`) is separate and unaffected.

## 16. Add a book to the library
Each entry in `src/content/books.ts` is one book on the shelf, in order. Replace a placeholder entry (one with `"title": ""`) with your book:

```ts
{
  "status": "ready",
  "title": "Thinking, Fast and Slow",
  "author": "Daniel Kahneman",
  "category": "Favourite books",
  "whyIChoseIt": "Why it made the shelf.",
  "favouriteIdea": "The idea that stayed with me, in a sentence or two.",
  "reflection": "What I took from it.",
  "cover": "/images/books/thinking-fast-and-slow.jpg"
},
```

- A book with a `title` shows it on its spine and its cover; leave `title` empty to keep a "Still choosing" placeholder book on the shelf.
- Any field you leave empty is simply left out when the book is opened. Nothing is filled in for you.
- `favouriteIdea` appears as the quote on the right-hand page; `whyIChoseIt` and `reflection` appear beside the open book.
- If books have more than one `category`, category buttons appear above the shelf automatically.
- To add a seventh book, copy any entry and add it to the list.

## 17. Add a book cover
Save the cover (portrait shape, about 600×900, JPG or WebP) in `public/images/books/`, for example `thinking-fast-and-slow.jpg`, and set that book's `"cover"` to `"/images/books/thinking-fast-and-slow.jpg"`. Without a cover, the book gets a designed cloth cover with its title and author.

## 18. Add memories to the drawers
There are three drawers: the **desk drawer** (`desk`) and the **top** and **bottom drawers** of the little cabinet by the window (`cabinet-top`, `cabinet-bottom`). Click one in the room to slide it open; a tray shows what's inside.

1. Put a photo of the object in `public/images/drawers/`, for example `first-ticket.jpg`.
2. Add an entry to `drawerObjects` in `src/content/drawers.ts`:

```ts
export const drawerObjects: DrawerObject[] = [
  {
    id: 'first-ticket',
    drawer: 'cabinet-top',               // which drawer it lives in
    title: 'Ticket from my first trip',
    image: '/images/drawers/first-ticket.jpg',
    description: 'One short line.',
    story: 'The longer story, shown when someone taps "Read the story".',
    category: 'Travel',
  },
];
```

- `image`, `description`, `story` and `category` are optional.
- A drawer with nothing in it says "Some memories are still waiting to be placed here." and still opens and closes.
- To rename a drawer, change its `label` or `where` in the `drawers` list. The ids must stay the same.

## 19. Write on the desk notes
The three loose notes on the desk come from `src/content/desk.ts`. Put text in `text` and clicking that note shows it; an empty note says "Nothing written here yet."

## 20. The ball and motion controls
- **Mouse or finger:** press on the ball, drag it, and let go. The faster you move, the harder it's thrown. It bounces off the walls and furniture, loses energy, and rolls to a stop.
- **Phones (tilt and shake):** an "Enable motion controls" button appears on touch devices. Nothing is asked until it's pressed; iPhones then show a permission prompt. Tilting the phone rolls the ball "downhill" and a firm shake gives it a push. "Re-centre" makes the current way you're holding the phone count as level. Pressing the button again turns motion off.
- **Tilting the room (desktop and phones):** press the tilt button (the first button in the room tools, bottom right). While it's on, dragging anywhere, or using the arrow keys, tips the whole room up to about 12°, and the ball rolls toward whichever side has gone down, bouncing off furniture and walls. Dragging right lowers the side that looks right from where you're standing. The camera is frozen while tilting, so the two can't be confused. "Level" puts the room flat again and the ball rolls to a stop; "Done" (or Escape) levels it and gives the camera back. Opening any object also turns tilt off.
- **Rotating the camera never changes gravity.** Only room tilt and phone tilt do.
- **Dragging the ball** slides it around furniture instead of through it.
- **Adjusting the feel:** the physics settings (bounciness, friction) and the furniture outlines it collides with are in `src/lib/ball-physics.ts`. How far the room can tilt (`MAX_TILT`) and how fast a drag tips it are in `src/lib/room-tilt.ts`.

## The GitHub Pages copy
`.github/workflows/pages.yml` publishes a static copy of the site at `https://nanda777-max.github.io/pixel-perfect-replay-75334/` every time `main` changes, about two minutes after a push. It only runs while the repository is public. On that copy, visitors can read approved guestbook notes but can't post new ones, because GitHub Pages can't run the server code that saves them. Everything else works the same.

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
Character model and reactions, secure private email and an owner moderation screen.
