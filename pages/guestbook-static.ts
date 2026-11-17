// Stand-in for src/lib/guestbook.functions.ts in the GitHub Pages build. GitHub Pages only
// serves files, so the server function that saves new notes can't run there. Reading approved
// notes still works (it goes straight to the database from the browser).
import type { z } from 'zod';
import type { noteSchema } from '@/lib/guestbook-schema';

type NoteInput = z.infer<typeof noteSchema>;

export const pinNote = async (_input: { data: NoteInput }) => ({
  ok: false,
  message: 'Leaving notes is switched off on this copy of the site. Your note has not been sent.',
});
