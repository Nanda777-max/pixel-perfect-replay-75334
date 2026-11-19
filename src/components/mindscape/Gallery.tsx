// The easel, opened: a small museum exhibition. Each artwork hangs large under a spotlight with a
// brass identification plaque; a carousel walks between them. All data from src/content/artwork.ts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { artwork, type Artwork } from '@/content/artwork';
import { existingImage } from '@/content/media';

const filled = (v?: string | null) => Boolean(v && v.trim() && !v.includes('[PLACEHOLDER]'));
const isReal = (a: Artwork) => filled(a.title);

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

function Piece({ art, index }: { art: Artwork; index: number }) {
  const src = existingImage(art.image);
  const [ratio, setRatio] = useState<number | null>(null);
  return <figure className="gal-piece">
    <div className="gal-frame" style={ratio ? { aspectRatio: String(ratio) } : undefined}>
      {src ? <img src={src} alt={isReal(art) ? `${art.title}${filled(art.artist) ? ` by ${art.artist}` : ''}` : `Artwork ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async"
        onLoad={e => { const i = e.currentTarget; if (i.naturalWidth) setRatio(i.naturalWidth / i.naturalHeight); }} />
        : <div className="gal-blank" aria-label="An empty canvas, waiting for an artwork"><span>Still on the easel</span></div>}
    </div>
    <Plaque art={art} />
    {isReal(art) && filled(art.description) && <figcaption className="gal-description">{art.description}</figcaption>}
  </figure>;
}

export default function Gallery({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const count = artwork.length;
  const go = useCallback((d: number) => setIndex(i => Math.max(0, Math.min(count - 1, i + d))), [count]);
  const close = useCallback(() => { setClosing(true); setTimeout(onClose, 380); }, [onClose]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [close, go]);
  const onDown = (e: React.PointerEvent) => { start.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (start.current !== null) setDrag(e.clientX - start.current); };
  const onUp = () => { if (Math.abs(drag) > 60) go(drag < 0 ? 1 : -1); start.current = null; setDrag(0); };

  return <div className={`gal-shade ${closing ? 'is-closing' : ''}`} onClick={close}>
    <section className="gal-room" role="dialog" aria-modal="true" aria-label="Art gallery" onClick={e => e.stopPropagation()}>
      <span className="gal-spot" aria-hidden />
      <header className="gal-header">
        <div><span className="eyebrow">The easel</span><h2>A small <em>exhibition</em></h2></div>
        <button className="gal-close" onClick={close} aria-label="Close the gallery and return to the room"><X size={18} /><span>Back to the room</span></button>
      </header>
      <div className="gal-viewport" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-roledescription="carousel">
        <div className="gal-track" style={{ transform: `translateX(calc(${-index * 100}% + ${drag}px))`, transition: drag ? 'none' : undefined }}>
          {artwork.map((art, i) => <div className="gal-slide" key={art.id} aria-hidden={i !== index} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}><Piece art={art} index={i} /></div>)}
        </div>
      </div>
      <footer className="gal-footer">
        <button className="gal-arrow" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous artwork"><ChevronLeft /></button>
        <div className="gal-progress"><span>{String(index + 1).padStart(2, '0')}</span><span className="gal-dots">{artwork.map((a, i) => <button key={a.id} aria-label={`Show artwork ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)} />)}</span><span>{String(count).padStart(2, '0')}</span></div>
        <button className="gal-arrow" onClick={() => go(1)} disabled={index === count - 1} aria-label="Next artwork"><ChevronRight /></button>
      </footer>
    </section>
  </div>;
}
