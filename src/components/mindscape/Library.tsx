// The bookshelf, opened: a reading-room library inspired by the "Reading Hour" reference.
// Books stand spine-out on a ledge; selecting one slides it out and turns its cover to you;
// opening it swings the cover back into a two-page spread. Everything comes from
// src/content/books.ts — nothing is invented, and placeholder books stay on the shelf.
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { books as bookData } from '@/content/books';
import { sections } from '@/content/room';
import { existingImage } from '@/content/media';

interface Book {
  status?: string; title: string; author: string; category?: string;
  whyIChoseIt?: string; favouriteIdea?: string; reflection?: string; cover?: string | null;
}
const filled = (v?: string | null) => Boolean(v && v.trim() && !v.includes('[PLACEHOLDER]'));
const isReal = (b: Book) => filled(b.title);
const PLACEHOLDER = 'A book I love goes here. Still choosing.';

/** Cloth colours for covers and spines, drawn from the room's palette. */
const CLOTH = [
  { bg: '#3f5a46', ink: '#f3ecd9' }, { bg: '#b9785f', ink: '#fbf3e4' }, { bg: '#e9dcc0', ink: '#3a3328' },
  { bg: '#2d3a33', ink: '#e8d9b0' }, { bg: '#8a5d3b', ink: '#f6ead2' }, { bg: '#c9a54f', ink: '#2c2a22' },
];

function Cover({ book, index }: { book: Book; index: number }) {
  const art = existingImage(book.cover);
  const cloth = CLOTH[index % CLOTH.length]!;
  if (art) return <img className="lb-cover-img" src={art} alt={`Cover of ${book.title}`} loading="lazy" />;
  return <div className="lb-cover-design" style={{ background: cloth.bg, color: cloth.ink }}>
    <span className="lb-cover-rule" />
    {isReal(book) ? <><strong>{book.title}</strong>{filled(book.author) && <em>{book.author}</em>}</> : <><BookOpen size={26} strokeWidth={1.2} /><em>Still choosing</em></>}
    <span className="lb-cover-rule" />
  </div>;
}

function Book3D({ book, index, state, onSelect }: { book: Book; index: number; state: 'idle' | 'focused' | 'left' | 'right'; onSelect: () => void }) {
  const cloth = CLOTH[index % CLOTH.length]!;
  const label = isReal(book) ? `${book.title}${filled(book.author) ? `, by ${book.author}` : ''}` : `Book ${index + 1}: still choosing`;
  return <button type="button" className={`lb-slot lb-${state}`} onClick={onSelect} aria-label={state === 'focused' ? `Open ${label}` : label} aria-pressed={state === 'focused'}
    style={{ '--cloth': cloth.bg, '--ink': cloth.ink, '--tilt': `${(index % 3 - 1) * 1.5}deg` } as CSSProperties}>
    <span className="lb-book">
      <span className="lb-face lb-front"><Cover book={book} index={index} /></span>
      <span className="lb-face lb-back" />
      <span className="lb-face lb-spine">
        <span className="lb-spine-band" />
        <span className="lb-spine-text">{isReal(book) ? book.title : '·  ·  ·'}</span>
        <span className="lb-spine-band" />
      </span>
      <span className="lb-face lb-pages" />
      <span className="lb-face lb-top" />
    </span>
  </button>;
}

function OpenBook({ book, index, onClose, onPrev, onNext, count }: { book: Book; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; count: number }) {
  const [open, setOpen] = useState(false);
  // Mounted closed, then opened on the next frames so the cover visibly swings open.
  useEffect(() => { const t = setTimeout(() => setOpen(true), 80); return () => clearTimeout(t); }, []);
  const close = () => { setOpen(false); setTimeout(onClose, 650); };
  const real = isReal(book);
  return <div className="lb-reading" role="dialog" aria-modal="true" aria-label={real ? book.title : 'A book still to be chosen'}>
    <div className={`lb-spread ${open ? 'is-open' : ''}`}>
      <div className="lb-page lb-page-right">
        {filled(book.favouriteIdea) ? <><span className="lb-page-label">Favourite idea</span><blockquote>“{book.favouriteIdea}”</blockquote></>
          : <p className="lb-page-quiet">{real ? 'A favourite idea will be written here.' : PLACEHOLDER}</p>}
        <span className="lb-folio">{index + 1}</span>
      </div>
      <div className="lb-cover-leaf">
        <div className="lb-leaf-face lb-leaf-front"><Cover book={book} index={index} /></div>
        <div className="lb-leaf-face lb-leaf-back lb-page">
          <span className="lb-page-label">{filled(book.category) ? book.category : 'My bookshelf'}</span>
          <h3>{real ? book.title : 'Still choosing'}</h3>
          {filled(book.author) && <p className="lb-title-author">{book.author}</p>}
          <span className="lb-ornament">❦</span>
        </div>
      </div>
    </div>
    <div className="lb-notes">
      {filled(book.category) && <span className="eyebrow">{book.category}</span>}
      <h2>{real ? book.title : 'Still choosing'}</h2>
      {filled(book.author) && <p className="lb-author">by {book.author}</p>}
      {!real && <p className="lb-note-text">{PLACEHOLDER}</p>}
      {filled(book.whyIChoseIt) && <><h4>Why I chose it</h4><p className="lb-note-text">{book.whyIChoseIt}</p></>}
      {filled(book.reflection) && <><h4>Reflection</h4><p className="lb-note-text">{book.reflection}</p></>}
      <div className="lb-note-actions">
        <Button variant="outline" onClick={close}><ArrowLeft size={15} />Back to the shelf</Button>
        {count > 1 && <span className="lb-pager">
          <Button variant="ghost" size="icon" aria-label="Previous book" onClick={onPrev}><ChevronLeft /></Button>
          <span>{index + 1} / {count}</span>
          <Button variant="ghost" size="icon" aria-label="Next book" onClick={onNext}><ChevronRight /></Button>
        </span>}
      </div>
    </div>
  </div>;
}

export default function Library({ onClose }: { onClose: () => void }) {
  const books = bookData as Book[];
  const section = sections.find(s => s.id === 'books');
  const categories = useMemo(() => [...new Set(books.filter(isReal).map(b => b.category).filter((c): c is string => filled(c)))], [books]);
  const [category, setCategory] = useState<string | null>(null);
  const visible = useMemo(() => books.map((b, i) => ({ b, i })).filter(({ b }) => !category || b.category === category), [books, category]);
  const [focused, setFocused] = useState<number | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);

  const leave = useCallback(() => { setClosing(true); setTimeout(onClose, 320); }, [onClose]);
  const step = useCallback((d: number) => {
    const order = visible.map(v => v.i); const cur = reading ?? focused ?? order[0] ?? 0;
    const next = order[(order.indexOf(cur) + d + order.length) % order.length] ?? cur;
    if (reading !== null) setReading(next); setFocused(next);
  }, [visible, reading, focused]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (reading !== null) setReading(null); else if (focused !== null) setFocused(null); else leave(); }
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'Enter' && focused !== null && reading === null) setReading(focused);
    };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [reading, focused, step, leave]);

  const stateOf = (i: number): 'idle' | 'focused' | 'left' | 'right' => focused === null ? 'idle' : i === focused ? 'focused' : i < focused ? 'left' : 'right';
  const select = (i: number) => { if (focused === i) setReading(i); else setFocused(i); };
  const current = reading !== null ? books[reading] : undefined;

  return <div className={`lb-shade ${closing ? 'is-closing' : ''}`} onClick={leave}>
    <section className={`lb-window ${reading !== null ? 'is-reading' : ''}`} role="dialog" aria-modal="true" aria-label={section?.title ?? 'My bookshelf'} onClick={e => e.stopPropagation()}>
      <div className="lb-room" aria-hidden><span className="lb-window-light" /><span className="lb-shelves" /></div>
      <header className="lb-header">
        <Button variant="ghost" onClick={leave}><ArrowLeft />Back to the room</Button>
        <Button variant="ghost" size="icon" aria-label="Close the library" onClick={leave}><X /></Button>
      </header>
      <div className="lb-title">
        <span className="eyebrow">{section?.object ?? 'The bookshelf'}</span>
        <h2>On my <em>bookshelf</em></h2>
        <p>{section?.description}</p>
      </div>
      {categories.length > 1 && <nav className="lb-categories" aria-label="Book categories">
        <button aria-pressed={category === null} onClick={() => setCategory(null)}>All</button>
        {categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => { setCategory(c); setFocused(null); }}>{c}</button>)}
      </nav>}
      <div className="lb-stage">
        <div className="lb-row" style={{ '--count': visible.length } as CSSProperties}>
          {visible.map(({ b, i }) => <Book3D key={i} book={b} index={i} state={stateOf(i)} onSelect={() => select(i)} />)}
        </div>
        <div className="lb-ledge" aria-hidden />
        <p className="lb-hint" role="status">{focused === null ? 'Choose a book to take it off the shelf.' : <>Tap the book again to open it · <button className="lb-link" onClick={() => setReading(focused)}>Open</button> · <button className="lb-link" onClick={() => setFocused(null)}>Put it back</button></>}</p>
        {visible.length > 1 && <div className="lb-shelf-nav">
          <Button variant="outline" size="icon" aria-label="Previous book" onClick={() => step(-1)}><ChevronLeft /></Button>
          <Button variant="outline" size="icon" aria-label="Next book" onClick={() => step(1)}><ChevronRight /></Button>
        </div>}
      </div>
      {current && reading !== null && <OpenBook key={reading} book={current} index={reading} count={visible.length} onClose={() => setReading(null)} onPrev={() => step(-1)} onNext={() => step(1)} />}
    </section>
  </div>;
}
