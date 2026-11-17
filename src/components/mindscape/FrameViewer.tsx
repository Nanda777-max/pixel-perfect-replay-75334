// The expanded view behind each framed display: education, career journey and research.
// All text comes from src/content/{education,experience,research}.ts via the parsers.
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Briefcase, GraduationCap, MapPin, ScrollText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage } from './SafeImage';
import { frameImages, parseEducation, parseExperience, parseResearch, type TimelineEntry } from '@/content/parse';
import { existingImage } from '@/content/media';
import { drawEducationCard, drawJourneyTimeline, drawResearchPreview, fontsReady } from './frameArt';

export type FrameId = 'education' | 'experience' | 'research';

/** The supplied photograph if there is one, otherwise the same artwork shown in the room's frame. */
function Hero({ photo, draw, alt }: { photo: string; draw: () => HTMLCanvasElement; alt: string }) {
  const [art, setArt] = useState<string | null>(null);
  const supplied = existingImage(photo);
  useEffect(() => { if (supplied) return; let live = true; fontsReady().then(() => { if (live) setArt(draw().toDataURL('image/png')); }); return () => { live = false; }; }, [draw, supplied]);
  if (supplied) return <SafeImage src={photo} alt={alt} fit="cover" ratio="1024 / 688" className="fv-hero" eager />;
  return art ? <img className="fv-hero" src={art} alt={alt} /> : <div className="fv-hero fv-hero-loading" aria-hidden />;
}
const Chips = ({ items }: { items: string[] }) => items.length ? <div className="fv-chips">{items.map(t => <span key={t}>{t}</span>)}</div> : null;

function Education() {
  const degrees = useMemo(() => parseEducation(), []);
  return <>
    <Hero photo={frameImages.education} draw={drawEducationCard} alt="Education display: Master of Data Science, Monash University, in progress" />
    <p className="fv-note">A personal display, not an official certificate.</p>
    {degrees.map(d => <article key={d.title} className="fv-card">
      <header className="fv-card-head">
        <GraduationCap size={22} strokeWidth={1.4} />
        <div><h3>{d.title}</h3><p>{d.organisation}{d.location ? ` · ${d.location}` : ''}</p></div>
        <span className="fv-dates">{d.dates}{d.status && <em className="fv-status">{d.status}</em>}</span>
      </header>
      {d.details.length > 0 && <ul className="fv-list">{d.details.map(x => <li key={x}>{x}</li>)}</ul>}
      {d.coursework.length > 0 && <><h4>Selected coursework</h4><Chips items={d.coursework} /></>}
    </article>)}
  </>;
}

function Journey() {
  const jobs = useMemo(() => parseExperience(), []);
  return <>
    <Hero photo={frameImages.experience} draw={drawJourneyTimeline} alt="Career timeline: Evoura Technologies, Tata Consultancy Services, KitaHQ" />
    <ol className="fv-timeline">
      {jobs.map((j: TimelineEntry) => <li key={`${j.organisation}-${j.dates}`}>
        <span className="fv-node" aria-hidden />
        <div className="fv-card">
          <header className="fv-card-head">
            <Briefcase size={20} strokeWidth={1.4} />
            <div><h3>{j.title}</h3><p>{j.organisation}</p></div>
            <span className="fv-dates">{j.dates}</span>
          </header>
          <p className="fv-meta"><MapPin size={13} />{j.location.replace(/^./, c => c.toUpperCase())}{j.note ? ` · ${j.note}` : ''}</p>
          {j.details.length > 0 && <ul className="fv-list">{j.details.map(x => <li key={x}>{x}</li>)}</ul>}
          {j.tools.length > 0 && <><h4>Tools</h4><Chips items={j.tools} /></>}
        </div>
      </li>)}
    </ol>
  </>;
}

function Research() {
  const r = useMemo(() => parseResearch(), []);
  const figure = existingImage(r.figurePath);
  return <>
    <Hero photo={r.figurePath} draw={drawResearchPreview} alt={figure ? 'Figure from the research paper' : 'Research paper preview, IEEE Xplore, WAMS 2024'} />
    <article className="fv-card fv-paper">
      <span className="eyebrow">IEEE Xplore · WAMS 2024</span>
      <h3 className="fv-paper-title">{r.title ?? 'Paper title coming soon'}</h3>
      {r.heading && <p className="fv-meta"><ScrollText size={13} />{r.heading}</p>}
      <h4>In plain English</h4>
      {r.summary ? <p>{r.summary}</p> : <p className="fv-muted">A short summary is on its way.</p>}
      <h4>My contribution</h4>
      {r.contribution ? <p>{r.contribution}</p> : <p className="fv-muted">Details of my contribution are on their way.</p>}
      {r.link && <a className="fv-link-button" href={r.link} target="_blank" rel="noreferrer">Read the paper on IEEE Xplore<ArrowUpRight size={15} /></a>}
    </article>
  </>;
}

const META: Record<FrameId, { eyebrow: string; title: string; body: () => React.ReactElement }> = {
  education: { eyebrow: 'The education frame', title: 'Always learning', body: Education },
  experience: { eyebrow: 'My journey', title: 'Experience, so far', body: Journey },
  research: { eyebrow: 'The research frame', title: 'A little deeper', body: Research },
};

export default function FrameViewer({ id, onClose }: { id: FrameId; onClose: () => void }) {
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [onClose]);
  const { eyebrow, title, body: Body } = META[id];
  return <div className="fv-shade" onClick={onClose}>
    <section className="fv-window" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
      <header className="panel-header"><Button variant="ghost" onClick={onClose}><ArrowLeft />Back to the room</Button><div className="fv-title"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X /></Button></header>
      <div className="fv-body"><Body /></div>
    </section>
  </div>;
}
