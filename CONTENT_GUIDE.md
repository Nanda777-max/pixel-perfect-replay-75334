# My Mindscape content guide

## Current delivery
The first room includes real 3D furniture, bounded free orbit and zoom, reset, object selection, warm evening lighting and a Kerala backdrop. Portfolio sections use the supplied facts. The shared board accepts pending notes with plain-text validation, a 280-character message limit, 40-character names, three colours and one submission per network every ten minutes. Approved notes are public until seven days after submission. Cleanup runs daily at 03:00 UTC.

Not yet delivered: character model and reactions, football physics, animated physical book opening, rotating record and tonearm, full 3D tropical balcony, palm animation, audio, globe location pins, secure private email sending, an owner sign-in and moderation screen, and full image auto-discovery. These are not represented as working features.

## Placeholder checklist — exact files and fields
- `src/content/about.ts` → `text`: personal one-liner, portrait path `public/images/profile/portrait.jpg`, résumé path `public/files/resume.pdf`.
- `src/content/research.ts` → `text`: paper title, two-sentence summary, contribution and `public/images/projects/ieee-figure.png`.
- `src/content/education.ts` → `text`: optional `public/images/education/monash.jpg` and `tkm.jpg`. Monash is in progress; never create a fake official certificate.
- `src/content/experience.ts` → `text`: `public/images/experience/tcs.jpg`, with no employee ID visible.
- `src/content/projects.ts` → `text`: World Cup live URL and `wc26-1.png`, `wc26-2.png`, `wc26-shap.png`; chatbot team role, GitHub and `chatbot-1.png`; IoT GitHub and `iot-1.jpg`; two future project slots.
- `src/content/interests.ts` → `text`: three personal topics.
- `src/content/notebook.ts` → `text`: four future pages. Current displayed pages are in `src/content/room.ts` → `notebookPages`; consolidation is still pending.
- `src/content/milestones.ts` → `text`: three goals and two images `public/images/profile/board-1.jpg`, `board-2.jpg`. Personal milestones still need to be displayed on the live board.
- `src/content/books.ts` → items 1–6: `title`, `author`, `category`, `whyIChoseIt`, `favouriteIdea`, `reflection`, `cover`.
- `src/content/music.ts` → items 1–6: `title`, `artist`, `spotifyUrl`, `externalUrl`, `albumArt`, `whyILikeIt`.
- `src/content/posters.ts` → items 1–4: `title`, `type`, `description`, `whyItMatters`, `image`.
- `src/content/artwork.ts` → items 1–4: `title`, `medium`, `year`, `description`, `image`.
- `src/content/travel.ts` → four existing places: explicitly set `confirmed` only after checking; fill `visited`, `photo`, `memory`, `funFact`. Items 5–7 also need `place`, `country`, `lat`, `lng`. No unconfirmed place is shown publicly.
- `src/content/easterEggs.ts` → `text`: coffee/tea joke and three fun facts. Hardware and football props still need implementing.
- `src/content/balcony.ts` → `text`: district, three memories, what you miss, two landscape photos `public/images/balcony/kerala-1.jpg`, `kerala-2.jpg`.
- `src/content/character.ts` → `text`: `public/images/profile/character-ref.jpg`, clothing, signature item, personality and three personal dialogue lines. Character implementation remains pending.

## Examples
**Book:** fill the first item's `title` and `author`, then add your reflections. The title and author appear in the bookshelf view; cover and reflection rendering still need completing.
**Song:** fill `title` and `artist`, and set `externalUrl` to a legitimate listening page. Spotify embedded playback and artwork are not yet connected.
**Visited place:** copy a travel item, fill place and country, get decimal latitude and longitude from a map, write your memory and set `confirmed: true`. The location appears in the diary; physical globe pins remain pending.
**Artwork:** fill title, medium and year; place an image under `public/artwork/` and set the image field. Image rendering remains pending.
**Project:** add a new project block to `projects.text`, preserving labels such as Overview, Approach, Implementation, Results, Tech and GitHub. Current view reads all real blocks; image wiring remains pending.
**Dialogue:** edit `character.text`. A model and dialogue implementation still need to be added.
**Photo:** use the exact paths above, preferably WebP or JPG, up to 1600px long edge. Portraits: 4:5. Project images: 16:10. Covers: 2:3. Album sleeves: square. Art: any orientation. Avoid large originals; the room does not yet automatically discover new files.

## Privacy
Never include phone, plaintext email, home address, visas, IDs, transcripts, unit marks or the government client's name. Refer only to “a UK Government client”. Strip EXIF/GPS before upload by exporting a clean copy or using `exiftool -all= photo.jpg`. Do not upload photos showing a home exterior.

## Cloud and moderation
Database configuration is managed by Lovable Cloud; do not paste privileged credentials into content files. Pending notes can be reviewed in More → Database, `guestbook_notes`; approve by setting `approved` to true or delete rejected notes. Owner sign-in and in-app moderation are still pending; designated roles are held in the separate `user_roles` table. Never grant every signed-in user moderation privileges.

## Private email
Private sending is disabled. Configure `CONTACT_TO_EMAIL` through Secrets, and configure a verified sending service before implementing delivery. No destination address belongs in public content or repository code. No submission is claimed to have been sent. Optional `CONTACT_FROM_EMAIL` must be a verified sender. Email delivery implementation and its end-to-end test remain open.

## Checks
Six rule/routing tests pass. Browser checks confirmed desktop and phone-sized 3D rendering, project text, and a persisted pending guestbook note with exactly seven-day expiry. Real GPU performance, touch feel and audio cannot be verified in the sandbox; inspect them in the preview on your own device. Owner moderation has not been tested because there is no configured owner account.
