// The loose notes on the desk. Clicking a note in the room shows its text. Leave `text` empty to
// keep a blank note ("Nothing written here yet."). Write your own lines here; nothing is invented.
export interface DeskNote { id: string; text: string }
export const deskNotes: DeskNote[] = [
  { id: 'note-1', text: '' },
  { id: 'note-2', text: '' },
  { id: 'note-3', text: '' },
];
