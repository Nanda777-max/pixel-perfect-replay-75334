// The laptop's enlarged screen: a GitHub-inspired workspace built from src/content/projects.ts.
// Nothing here is invented: missing links, roles or metrics show as "not added yet".
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Code2, FileText, Github, Image as ImageIcon, LineChart, Lock, Search, Star, X } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { parseProjects, type ProjectInfo } from '@/content/parse';
import { about } from '@/content/about';
import { portraitImage } from '@/content/media';

type Tab = 'code' | 'overview' | 'readme' | 'results' | 'visuals';
const TABS: { id: Tab; label: string; icon: typeof Code2 }[] = [
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'readme', label: 'README', icon: FileText },
  { id: 'results', label: 'Results', icon: LineChart },
  { id: 'visuals', label: 'Visualisations', icon: ImageIcon },
];
const LANG_COLOURS = ['#3572A5', '#e34c26', '#f1e05a', '#b07219', '#563d7c', '#89e051'];
const aboutField = (key: string) => about.text.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1]?.trim();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="gh-md-section"><h2>{title}</h2>{children}</section>;
}
function Missing({ children }: { children: React.ReactNode }) { return <p className="gh-muted">{children}</p>; }
function Topics({ tech }: { tech: string[] }) { return <div className="gh-topics">{tech.map(t => <span key={t} className="gh-topic">{t}</span>)}</div>; }
function LinkButtons({ p }: { p: ProjectInfo }) {
  return <div className="gh-links">
    {p.github ? <a className="gh-btn gh-btn-primary" href={p.github} target="_blank" rel="noreferrer"><Github size={15} />View on GitHub<ArrowUpRight size={13} /></a> : <span className="gh-btn gh-btn-disabled"><Lock size={14} />Repository link not added yet</span>}
    {p.demo && <a className="gh-btn" href={p.demo} target="_blank" rel="noreferrer">Live demo<ArrowUpRight size={13} /></a>}
  </div>;
}

function RepoView({ p, owner, tab, setTab }: { p: ProjectInfo; owner: string; tab: Tab; setTab: (t: Tab) => void }) {
  const counts: Partial<Record<Tab, number>> = { visuals: p.images.length };
  const about = <aside className="gh-about">
    <h3>About</h3>
    {p.overview && <p>{p.overview}</p>}
    {p.kind && <p className="gh-about-row"><Star size={14} />{p.kind.replace(/^./, c => c.toUpperCase())}</p>}
    {p.role && <p className="gh-about-row">Role: {p.role}</p>}
    {p.github && <a className="gh-about-row gh-link" href={p.github} target="_blank" rel="noreferrer"><Github size={14} />{p.github.replace(/^https?:\/\//, '')}</a>}
    {p.demo && <a className="gh-about-row gh-link" href={p.demo} target="_blank" rel="noreferrer"><ArrowUpRight size={14} />Live demo</a>}
    <Topics tech={p.tech} />
  </aside>;
  return <div className="gh-repo">
    <div className="gh-repo-head">
      <div className="gh-repo-title"><BookOpen size={18} /><span className="gh-owner">{owner}</span><span className="gh-sep">/</span><strong>{p.slug}</strong>{p.github && <span className="gh-badge">Public</span>}</div>
      <h1>{p.title}</h1>
      {p.overview && <p className="gh-desc">{p.overview}</p>}
      <LinkButtons p={p} />
    </div>
    <nav className="gh-tabs" role="tablist" aria-label="Repository sections">
      {TABS.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} className="gh-tab" onClick={() => setTab(id)}><Icon size={15} />{label}{counts[id] !== undefined && <span className="gh-count">{counts[id]}</span>}</button>)}
    </nav>
    <div className="gh-tab-body" key={tab} role="tabpanel">
      {tab === 'code' && <div className="gh-code-layout">
        <div className="gh-readme-box">
          <div className="gh-file-head"><FileText size={15} />README.md</div>
          <div className="gh-readme">
            <h2 className="gh-readme-title">{p.title}</h2>
            {p.overview && <p>{p.overview}</p>}
            {p.github && <><h3>Clone</h3><pre className="gh-pre"><code><span className="gh-prompt">$</span> git clone {p.github}.git{'\n'}<span className="gh-prompt">$</span> cd {p.slug}</code></pre></>}
            <h3>Built with</h3><Topics tech={p.tech} />
          </div>
        </div>
        {about}
      </div>}
      {tab === 'overview' && <article className="gh-md">
        <Section title="Project overview">{p.overview ? <p>{p.overview}</p> : <Missing>Overview not added yet.</Missing>}</Section>
        <Section title="Problem">{p.problem ? <p>{p.problem}</p> : <Missing>Problem statement not added yet.</Missing>}</Section>
        {p.kind && <Section title="Context"><p>{p.kind.replace(/^./, c => c.toUpperCase())}{p.role ? ` · ${p.role}` : ''}</p></Section>}
        <Section title="Repository and demo"><LinkButtons p={p} /></Section>
      </article>}
      {tab === 'readme' && <article className="gh-md">
        <Section title="Approach">{p.approach ? <p>{p.approach}</p> : <Missing>Approach not added yet.</Missing>}</Section>
        <Section title="Implementation">{p.implementation ? <p>{p.implementation}</p> : <Missing>Implementation details not added yet.</Missing>}</Section>
        <Section title="Technologies"><ul className="gh-tech-list">{p.tech.map((t, i) => <li key={t}><span className="gh-dot" style={{ background: LANG_COLOURS[i % LANG_COLOURS.length] }} />{t}</li>)}</ul></Section>
      </article>}
      {tab === 'results' && <article className="gh-md">
        {p.results && <Section title="Results"><p>{p.results}</p></Section>}
        {p.findings && <Section title="Findings"><p>{p.findings}</p></Section>}
        {p.noMetrics && <Missing>No accuracy or loss figures are published for this project: there is no verified metric.</Missing>}
        {!p.results && !p.findings && !p.noMetrics && <Missing>Results not added yet.</Missing>}
      </article>}
      {tab === 'visuals' && (p.images.length
        ? <div className="gh-gallery">{p.images.map((src, i) => <SafeImage key={src} src={src} alt={`${p.title}, screenshot ${i + 1}`} ratio="16 / 10" fit="contain" />)}</div>
        : <div className="gh-empty"><ImageIcon size={28} strokeWidth={1.3} /><p>Screenshots and visualisations will appear here.</p><small>Add the image files named in src/content/projects.ts to public/images/projects/.</small></div>)}
    </div>
  </div>;
}

export default function ProjectsWorkspace({ onClose }: { onClose: () => void }) {
  const { projects, comingSoon } = useMemo(() => parseProjects(), []);
  const owner = useMemo(() => projects.find(p => p.github)?.github?.split('/')[3] ?? 'projects', [projects]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('code');
  const [query, setQuery] = useState('');
  const project = projects.find(p => p.id === selected);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  const open = (id: string) => { setSelected(id); setTab('code'); };
  const filtered = projects.filter(p => !query || `${p.title} ${p.slug} ${p.tech.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const name = aboutField('Name'); const headline = aboutField('Headline'); const portrait = portraitImage();

  return <div className="ws-shade" onClick={onClose}>
    <section className="ws-window" role="dialog" aria-modal="true" aria-label="Things I’ve built" onClick={e => e.stopPropagation()}>
      <div className="ws-chrome">
        <span className="ws-dots" aria-hidden><i /><i /><i /></span>
        <span className="ws-address">github.com/{owner}{project ? `/${project.slug}` : ''}</span>
        <button className="ws-close" onClick={onClose} aria-label="Close and return to the room"><X size={16} /><span>Back to the room</span></button>
      </div>
      <header className="gh-nav">
        <Github size={28} className="gh-mark" />
        <nav className="gh-crumbs" aria-label="Breadcrumb">
          <button onClick={() => setSelected(null)} className={project ? '' : 'gh-crumb-current'}>{owner}</button>
          {project && <><span>/</span><span className="gh-crumb-current">{project.slug}</span></>}
        </nav>
        {!project && <label className="gh-search"><Search size={14} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a repository…" aria-label="Find a repository" /></label>}
        {project && <button className="gh-back" onClick={() => setSelected(null)}><ArrowLeft size={14} />All repositories</button>}
      </header>
      <div className="ws-body">
        {project ? <RepoView p={project} owner={owner} tab={tab} setTab={setTab} /> : <div className="gh-profile-layout">
          <aside className="gh-profile">
            <SafeImage src={portrait} alt={name ?? 'Profile photo'} fit="cover" ratio="1 / 1" className="gh-avatar" fallback={<div className="gh-avatar gh-avatar-initials" aria-hidden>{(name ?? owner).split(' ').map(w => w[0]).slice(0, 2).join('')}</div>} />
            {name && <h2>{name}</h2>}
            <p className="gh-handle">{owner}</p>
            {headline && <p className="gh-bio">{headline}</p>}
            <a className="gh-btn gh-btn-block" href={`https://github.com/${owner}`} target="_blank" rel="noreferrer"><Github size={15} />GitHub profile<ArrowUpRight size={13} /></a>
          </aside>
          <div className="gh-repos">
            <div className="gh-repos-head"><BookOpen size={16} /><strong>Repositories</strong><span className="gh-count">{projects.length}</span></div>
            {filtered.map((p, i) => <article key={p.id} className="gh-repo-card">
              <div className="gh-repo-card-top">
                <button className="gh-repo-name" onClick={() => open(p.id)}>{p.slug}</button>{p.github && <span className="gh-badge">Public</span>}
                {p.kind && <span className="gh-kind">{p.kind}</span>}
              </div>
              <h3>{p.title}</h3>
              {p.overview && <p className="gh-desc">{p.overview}</p>}
              <Topics tech={p.tech.slice(0, 6)} />
              <div className="gh-card-foot">
                <span><span className="gh-dot" style={{ background: LANG_COLOURS[i % LANG_COLOURS.length] }} />{p.tech[0]}</span>
                {p.github ? <a href={p.github} target="_blank" rel="noreferrer"><Github size={13} />GitHub</a> : <span className="gh-muted-inline">Repository link not added yet</span>}
                {p.demo && <a href={p.demo} target="_blank" rel="noreferrer"><ArrowUpRight size={13} />Live demo</a>}
                <button className="gh-open" onClick={() => open(p.id)}>Open repository<ArrowUpRight size={13} /></button>
              </div>
            </article>)}
            {!filtered.length && <div className="gh-empty"><Search size={22} /><p>No repository matches “{query}”.</p></div>}
            {!query && Array.from({ length: comingSoon }, (_, i) => <article key={`soon-${i}`} className="gh-repo-card gh-repo-soon"><div className="gh-repo-card-top"><span className="gh-repo-name">next-idea-{i + 1}</span><span className="gh-badge">Coming soon</span></div><p className="gh-desc">The next idea goes here.</p></article>)}
          </div>
        </div>}
      </div>
    </section>
  </div>;
}
