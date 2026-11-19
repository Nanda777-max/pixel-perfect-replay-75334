// What's inside an open drawer: a tray at the bottom of the screen, so the room stays visible.
// Objects come from src/content/drawers.ts; an empty drawer shows a placeholder.
import { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { drawers, drawerObjects, EMPTY_DRAWER_MESSAGE } from '@/content/drawers';
import { motion, motionSupported, useMotion } from '@/lib/motion';

export function DrawerTray({ id, onClose }: { id: string; onClose: () => void }) {
  const drawer = drawers.find(d => d.id === id);
  const items = drawerObjects.filter(o => o.drawer === id);
  const [story, setStory] = useState<string | null>(null);
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [onClose]);
  return <section className="drawer-tray" role="dialog" aria-label={drawer?.label ?? 'Drawer'}>
    <header><div><span className="eyebrow">{drawer?.where}</span><h3>{drawer?.label ?? 'A drawer'}</h3></div><button className="drawer-close" onClick={onClose} aria-label="Close the drawer"><X size={18} /></button></header>
    {items.length ? <div className="drawer-items">{items.map(o => <article key={o.id} className="drawer-item">
      <SafeImage src={o.image} alt={o.title} fit="cover" ratio="4 / 3" fallback={<div className="drawer-item-blank" aria-hidden />} />
      <div>{o.category && <span className="eyebrow">{o.category}</span>}<h4>{o.title}</h4>{o.description && <p>{o.description}</p>}
        {o.story && <button className="drawer-story" onClick={() => setStory(story === o.id ? null : o.id)}>{story === o.id ? 'Hide the story' : 'Read the story'}</button>}
        {story === o.id && <p className="drawer-story-text">{o.story}</p>}</div>
    </article>)}</div> : <p className="drawer-empty">{EMPTY_DRAWER_MESSAGE}</p>}
  </section>;
}

/** Opt-in phone tilt and shake for the ball. Only shown on touch devices with motion sensors. */
export function MotionToggle() {
  const m = useMotion(); const [show, setShow] = useState(false);
  useEffect(() => setShow(motionSupported()), []);
  if (!show) return null;
  const on = m.status === 'on';
  return <div className="motion-toggle">
    <button onClick={() => (on ? motion.disable() : motion.enable())} aria-pressed={on}><Smartphone size={15} />{on ? 'Motion on: tilt or shake to move the ball' : 'Enable motion controls'}</button>
    {on && <button className="motion-recentre" onClick={() => motion.recalibrate()}>Re-centre</button>}
    {m.status === 'denied' && <span role="status">Motion access was declined. You can still drag and throw the ball.</span>}
  </div>;
}
