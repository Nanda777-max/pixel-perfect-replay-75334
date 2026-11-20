// The easel, opened: a private after-hours museum. One painting hangs large on a dark wall under
// warm spotlights, with a brass identification plaque mounted beneath it; a carousel walks between
// exhibits. All metadata comes from src/content/artwork.ts — nothing here is invented.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { artwork, type Artwork } from '@/content/artwork';
import { existingImage } from '@/content/media';

const filled = (v?: string | null) => Boolean(v && v.trim() && !v.includes('[PLACEHOLDER]'));
const isReal = (a: Artwork) => filled(a.title);

/** The brass label mounted on the wall under the painting: title, artist, medium, year. */
function Plaque({ art }: { art: Artwork }) {
  const details = [art.medium, art.year].filter(filled).join(' · ');
  return <div className="gal-plaque" aria-label="Artwork label">
    <span className="gal-screw" aria-hidden /><span className="gal-screw" aria-hidden />
    {isReal(art) ? <>
      <em className="gal-plaque-title">{art.title}</em>
      {filled(art.artist) && <strong className="gal-plaque-artist">{art.artist}</strong>}
      {details && <small className="gal-plaque-details">{details}</small>}
    </> : <>
      <em className="gal-plaque-title">Work in progress</em>
      <small className="gal-plaque-details">A little space for something I make.</small>
    </>}
  </div>;
}

/** One exhibit: the painting on the wall under its halo of light, its plaque beneath it. */
function Piece({ art, index }: { art: Artwork; index: number }) {
  const src = existingImage(art.image);
  const [ratio, setRatio] = useState<number | null>(null);
  // A real image sizes the frame to its own proportions (--r), so it fills the framed area exactly.
  const frameStyle = ratio ? ({ '--r': String(ratio) } as React.CSSProperties) : undefined;
  return <figure className="gal-piece">
    <div className="gal-hang">
      <span className="gal-halo" aria-hidden />
      <div className={`gal-frame ${src ? 'has-art' : 'is-empty'} ${ratio ? 'is-sized' : ''}`} style={frameStyle}>
        <div className="gal-canvas">
        {src ? <img src={src} alt={isReal(art) ? `${art.title}${filled(art.artist) ? ` by ${art.artist}` : ''}` : `Artwork ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async"
          onLoad={e => { const i = e.currentTarget; if (i.naturalWidth) setRatio(i.naturalWidth / i.naturalHeight); }} />
          : <div className="gal-blank" aria-label="An empty canvas, waiting for an artwork"><span>A new piece is waiting to be hung.</span></div>}
          <span className="gal-light" aria-hidden />
        </div>
      </div>
    </div>
    <Plaque art={art} />
    {isReal(art) && filled(art.description) && <figcaption className="gal-description">{art.description}</figcaption>}
  </figure>;
}

/** Shown when artwork.ts has no entries at all, so the gallery never opens onto nothing. */
const EMPTY_WALL: Artwork = { id: 'empty-wall', status: 'placeholder', title: '', artist: '', medium: '', year: '', description: '', image: null };

export default function Gallery({ onClose }: { onClose: () => void }) {
  const items = artwork.length ? artwork : [EMPTY_WALL];
  const [rawIndex, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const count = items.length;
  const index = Math.min(rawIndex, count - 1); // stays valid if artworks are added or removed
  const go = useCallback((d: number) => setIndex(i => Math.max(0, Math.min(count - 1, Math.min(i, count - 1) + d))), [count]);
  const close = useCallback(() => { setClosing(true); setTimeout(onClose, 480); }, [onClose]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [close, go]);
  const onDown = (e: React.PointerEvent) => { start.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (start.current !== null) setDrag(e.clientX - start.current); };
  const onUp = () => { if (Math.abs(drag) > 60) go(drag < 0 ? 1 : -1); start.current = null; setDrag(0); };

  return <div className={`gal-shade ${closing ? 'is-closing' : ''}`} onClick={close}>
    <section className="gal-room" role="dialog" aria-modal="true" aria-label="Art gallery" onClick={e => e.stopPropagation()}>
      {/* The room itself: plastered walls with a cornice and skirting, angled wings, a wooden floor,
          two narrow ceiling spots trained on the painting and soft washers on the side walls. */}
      <div className="gal-museum" aria-hidden>
        <div className="gal-wall" />
        <div className="gal-wing gal-wing-l"><span className="gal-wash" /></div>
        <div className="gal-wing gal-wing-r"><span className="gal-wash" /></div>
        <div className="gal-cornice" />
        <div className="gal-floor" />
        <div className="gal-skirting" />
        <span className="gal-fixture gal-fixture-l" />
        <span className="gal-fixture gal-fixture-r" />
        <div className="gal-beam gal-beam-l" />
        <div className="gal-beam gal-beam-r" />
        <div className="gal-pool" />
        <div className="gal-vignette" />
      </div>

      <button className="gal-close" onClick={close} aria-label="Back to the room">
        <ArrowLeft size={15} /><span>Back to the room</span>
      </button>

      <div className="gal-viewport" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-roledescription="carousel">
        <div className="gal-track" style={{ transform: `translateX(calc(${-index * 100}% + ${drag}px))`, transition: drag ? 'none' : undefined }}>
          {items.map((art, i) => <div className="gal-slide" key={art.id} aria-hidden={i !== index} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}><Piece art={art} index={i} /></div>)}
        </div>
      </div>

      {count > 1 && <footer className="gal-footer" aria-label="Choose an artwork">
        <button className="gal-arrow" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous artwork"><ChevronLeft size={20} strokeWidth={1.5} /></button>
        <div className="gal-progress">
          <span className="gal-count" aria-live="polite"><b>{String(index + 1).padStart(2, '0')}</b><i aria-hidden /> {String(count).padStart(2, '0')}</span>
          <span className="gal-dots">{items.map((a, i) => <button key={a.id} aria-label={`Show artwork ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)} />)}</span>
        </div>
        <button className="gal-arrow" onClick={() => go(1)} disabled={index === count - 1} aria-label="Next artwork"><ChevronRight size={20} strokeWidth={1.5} /></button>
      </footer>}
    </section>
  </div>;
}
