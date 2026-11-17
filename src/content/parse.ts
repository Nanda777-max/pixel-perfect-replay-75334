// Turns the plain-text content files (projects, education, experience, research) into structured
// data for the laptop workspace and the framed displays. The text files stay the single source:
// edit them, never this file. Lines marked [PLACEHOLDER] are treated as "not supplied yet".
import { projects as projectsSource } from './projects';
import { education as educationSource } from './education';
import { experience as experienceSource } from './experience';
import { research as researchSource } from './research';
import { existingImage } from './media';

const isPlaceholder = (v: string) => v.includes('[PLACEHOLDER]');
/** Remove internal brief references such as (§16.5) or (see §4.5). */
const clean = (v: string) => v.replace(/\s*\((?:see )?§[\d.]+\)/g, '').replace(/§[\d.]+/g, '').replace(/\s+/g, ' ').trim();
const lines = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean);
const field = (line: string) => { const m = line.match(/^([A-Za-z][A-Za-z +&-]*?):\s*(.*)$/); return m ? { key: m[1]!.trim(), value: m[2]!.trim() } : null; };
/** Image files named on a line, e.g. "public/images/projects/a.png, b.png" → ['/images/projects/a.png', '/images/projects/b.png']. */
function imagePaths(value: string) {
  const files = value.match(/[\w/.-]+\.(?:png|jpe?g|webp|avif)/gi) ?? [];
  let dir = '';
  return files.map(f => { if (f.includes('/')) { dir = f.replace(/^public\//, '/').replace(/[^/]+$/, ''); return f.replace(/^public\//, '/'); } return dir + f; });
}

// ── Projects ────────────────────────────────────────────────────────────────
export interface ProjectInfo {
  id: string; slug: string; title: string; kind?: string | undefined;
  overview?: string; problem?: string; approach?: string; implementation?: string; results?: string; findings?: string;
  role?: string; tech: string[]; github?: string; demo?: string;
  /** Screenshot paths named in the content that exist in public/. */
  images: string[];
  /** The content asks that no metrics be shown for this project. */
  noMetrics: boolean;
}

export function parseProjects(text = projectsSource.text) {
  const blocks = text.split(/^Project (\d+): /m).slice(1);
  const list: ProjectInfo[] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    const [head = '', ...rest] = lines(blocks[i + 1] ?? '');
    const kind = head.match(/\(([^()]+)\)\s*$/)?.[1];
    const title = clean(kind ? head.replace(/\s*\([^()]+\)\s*$/, '') : head);
    const p: ProjectInfo = { id: `project-${blocks[i]}`, slug: '', title, kind, tech: [], images: [], noMetrics: false };
    for (const line of rest) {
      if (/^Projects? \d+\+/.test(line)) break;
      if (/^Do not show/i.test(line)) { p.noMetrics = true; continue; }
      const f = field(line); if (!f) continue;
      if (f.key === 'Images') { p.images = imagePaths(f.value).map(existingImage).filter((x): x is string => Boolean(x)); continue; }
      if (isPlaceholder(f.value) || !f.value) continue;
      const v = clean(f.value);
      switch (f.key) {
        case 'Overview': p.overview = v; break;
        case 'Problem': p.problem = v; break;
        case 'Approach': p.approach = v; break;
        case 'Implementation': p.implementation = v; break;
        case 'Results': p.results = v; break;
        case 'Findings': p.findings = v; break;
        case 'Tech': p.tech = v.split(/,\s*/); break;
        case 'GitHub': if (/^https?:\/\//.test(v)) p.github = v; break;
        case 'Live demo': if (/^https?:\/\//.test(v)) p.demo = v; break;
        case 'My role in the team': p.role = v; break;
      }
    }
    p.slug = p.github?.split('/').filter(Boolean).pop() ?? title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^(.{0,32})-.*$/, (m, keep: string) => (m.length > 32 ? keep : m));
    list.push(p);
  }
  const upcoming = text.match(/Provide (\w+) empty/i)?.[1];
  const comingSoon = upcoming ? ({ one: 1, two: 2, three: 3 } as Record<string, number>)[upcoming.toLowerCase()] ?? (Number(upcoming) || 0) : 0;
  return { projects: list, comingSoon };
}

// ── Education and experience (header line with a date range, then details) ──
const DATE_RANGE = /[A-Z][a-z]{2} \d{4} – (?:[A-Z][a-z]{2} \d{4}|Present)/;

export interface TimelineEntry {
  title: string; organisation: string; location: string; dates: string; status?: string | undefined; note?: string | undefined;
  startYear: number; endYear: number; details: string[]; tools: string[]; coursework: string[];
}

function parseTimeline(text: string, orgPattern?: RegExp): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const line of lines(text)) {
    if (DATE_RANGE.test(line) && line.includes(',')) {
      const parts = line.split(', ');
      const d = parts.findIndex(p => DATE_RANGE.test(p));
      const keyword = orgPattern ? parts.findIndex((p, i) => i < d && orgPattern.test(p)) : -1;
      const o = keyword > 0 ? keyword : 1;
      const datePart = parts[d] ?? '';
      const status = datePart.match(/\(([^)]+)\)/)?.[1];
      const dates = datePart.replace(/\s*\([^)]+\)/, '');
      const years = dates.match(/\d{4}/g)?.map(Number) ?? [];
      out.push({
        title: clean(parts.slice(0, o).join(', ')), organisation: clean(parts[o] ?? ''), location: clean(parts.slice(o + 1, d).join(', ')),
        dates, status, note: parts.slice(d + 1).join(', ') || undefined,
        startYear: years[0] ?? 0, endYear: years[1] ?? years[0] ?? 0, details: [], tools: [], coursework: [],
      });
      continue;
    }
    const entry = out[out.length - 1];
    if (!entry || isPlaceholder(line) || /^(Certificate image|Optional image|Memorabilia)/i.test(line)) continue;
    const f = field(line);
    if (f?.key === 'Tools') entry.tools = f.value.split(/,\s*/);
    else if (f?.key === 'Selected coursework') entry.coursework = f.value.split(/;\s*/);
    else entry.details.push(clean(line));
  }
  return out;
}

export const parseEducation = (text = educationSource.text) => parseTimeline(text, /University|College|Institute|School/);
/** Experience, most recent first (the order in the content file). */
export const parseExperience = (text = experienceSource.text) => parseTimeline(text);

// ── Research ────────────────────────────────────────────────────────────────
export interface ResearchInfo { heading: string; link?: string; title?: string; summary?: string; contribution?: string; figurePath: string }

export function parseResearch(text = researchSource.text): ResearchInfo {
  const info: ResearchInfo = { heading: '', figurePath: '/images/projects/ieee-figure.png' };
  for (const line of lines(text)) {
    const url = line.match(/https?:\/\/\S+/)?.[0];
    const f = field(line);
    if (!f || url && !info.link) {
      if (url) info.link = url;
      if (!info.heading) info.heading = clean(line.replace(/:?\s*https?:\/\/\S+/, ''));
      continue;
    }
    if (/^Figure/i.test(f.key)) { info.figurePath = imagePaths(f.value)[0] ?? info.figurePath; continue; }
    if (isPlaceholder(f.value)) continue;
    if (/^Paper title/i.test(f.key)) info.title = clean(f.value);
    else if (/summary/i.test(f.key)) info.summary = clean(f.value);
    else if (/contribution/i.test(f.key)) info.contribution = clean(f.value);
  }
  return info;
}

/** Optional photographs that replace the designed frame artwork when supplied. */
export const frameImages = {
  education: '/images/education/monash.jpg',
  experience: '/images/experience/tcs.jpg',
  research: '/images/projects/ieee-figure.png',
} as const;
