// The art gallery (the easel). Each entry is one artwork in the museum carousel, in this order.
// Put the image in public/artwork/ and set "image" to "/artwork/<file>". Leave "title" empty to keep a
// placeholder canvas. Empty fields are simply not shown on the gold plaque. Nothing is filled in for you.
export interface Artwork { id: string; status: string; title: string; artist: string; medium: string; year: string; description: string; image: string | null }
export const artwork: Artwork[] = [
  {
    "id": "artwork-1",
    "status": "placeholder",
    "title": "",
    "artist": "",
    "medium": "sketch",
    "year": "",
    "description": "",
    "image": null
  },
  {
    "id": "artwork-2",
    "status": "placeholder",
    "title": "",
    "artist": "",
    "medium": "sketch",
    "year": "",
    "description": "",
    "image": null
  },
  {
    "id": "artwork-3",
    "status": "placeholder",
    "title": "",
    "artist": "",
    "medium": "sketch",
    "year": "",
    "description": "",
    "image": null
  },
  {
    "id": "artwork-4",
    "status": "placeholder",
    "title": "",
    "artist": "",
    "medium": "sketch",
    "year": "",
    "description": "",
    "image": null
  }
];
