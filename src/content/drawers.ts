// Memory drawers. Each drawer in the room has an id below; objects are linked to a drawer by
// `drawer`. Put photos in public/images/drawers/ and set `image` to "/images/drawers/<file>".
// A drawer with no objects shows a placeholder message. Nothing here is invented: add your own.
export interface Drawer { id: string; label: string; where: string }
export interface DrawerObject {
  id: string;
  drawer: string;          // one of the drawer ids below
  title: string;
  image?: string;          // e.g. "/images/drawers/first-ticket.jpg"
  description?: string;    // one short line
  story?: string;          // optional longer personal story
  category?: string;       // e.g. "Travel", "University", "Work"
}

export const drawers: Drawer[] = [
  { id: 'desk', label: 'The desk drawer', where: 'Under the desk' },
  { id: 'cabinet-top', label: 'Top drawer', where: 'The little cabinet by the window' },
  { id: 'cabinet-bottom', label: 'Bottom drawer', where: 'The little cabinet by the window' },
];

/** Objects inside the drawers. Example (remove the // to use):
 *  { id: 'ticket-1', drawer: 'desk', title: 'Train ticket', image: '/images/drawers/ticket.jpg',
 *    description: 'One line about it.', story: 'The longer story.', category: 'Travel' },
 */
export const drawerObjects: DrawerObject[] = [];

export const EMPTY_DRAWER_MESSAGE = 'Some memories are still waiting to be placed here.';
