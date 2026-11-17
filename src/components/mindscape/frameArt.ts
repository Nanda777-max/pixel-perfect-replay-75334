// Artwork drawn for the framed displays and the laptop screen, from the content files.
// Kept deliberately simple: the frame says what it is; the opened view holds the detail.
import { parseEducation, parseExperience, parseProjects, parseResearch } from '@/content/parse';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";
export const FRAME_ART = { width: 1024, height: 688 };

/** Waits for the site fonts so canvas text uses them (falls back after a short wait). */
export async function fontsReady() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.race([
    Promise.all([document.fonts.load(`500 40px ${SERIF}`), document.fonts.load(`italic 400 40px ${SERIF}`), document.fonts.load(`500 20px ${SANS}`), document.fonts.load(`600 20px ${SANS}`)]),
    new Promise(r => setTimeout(r, 1500)),
  ]);
}

function canvas(w = FRAME_ART.width, h = FRAME_ART.height) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
}
/** Shrinks the font until the text fits the width. */
function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number, font: (s: number) => string) {
  let s = size; g.font = font(s);
  while (g.measureText(text).width > maxWidth && s > 10) { s -= 1; g.font = font(s); }
  g.fillText(text, x, y);
}
function spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = [...text]; const w = chars.reduce((a, ch) => a + g.measureText(ch).width + spacing, -spacing);
  let cx = x - (g.textAlign === 'center' ? w / 2 : 0); const align = g.textAlign; g.textAlign = 'left';
  for (const ch of chars) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + spacing; }
  g.textAlign = align;
}

/** Certificate-inspired personal display. No seal, signature or certificate number. */
export function drawEducationCard() {
  const [c, g] = canvas(); const W = c.width, H = c.height;
  const degree = parseEducation()[0];
  const navy = '#1f3a5f', gold = '#b8954a', ink = '#27302a';
  g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, W, H);
  // Soft paper grain.
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(120,100,60,${Math.random() * 0.035})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  // Double decorative border with corner ornaments.
  g.strokeStyle = navy; g.lineWidth = 6; g.strokeRect(28, 28, W - 56, H - 56);
  g.strokeStyle = gold; g.lineWidth = 2; g.strokeRect(46, 46, W - 92, H - 92);
  for (const [x, y] of [[46, 46], [W - 46, 46], [46, H - 46], [W - 46, H - 46]] as const) { g.fillStyle = gold; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
  // Graduation cap emblem.
  const cx = W / 2, cy = 128;
  g.fillStyle = navy; g.beginPath(); g.moveTo(cx - 62, cy); g.lineTo(cx, cy - 28); g.lineTo(cx + 62, cy); g.lineTo(cx, cy + 28); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx - 34, cy + 14); g.lineTo(cx - 34, cy + 40); g.quadraticCurveTo(cx, cy + 62, cx + 34, cy + 40); g.lineTo(cx + 34, cy + 14); g.lineTo(cx, cy + 28); g.closePath(); g.fill();
  g.strokeStyle = gold; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 40, cy + 4); g.lineTo(cx + 52, cy + 44); g.stroke(); g.fillStyle = gold; g.beginPath(); g.arc(cx + 52, cy + 48, 7, 0, Math.PI * 2); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = navy; g.font = `600 30px ${SANS}`; spaced(g, (degree?.organisation ?? 'Monash University').toUpperCase(), cx, 238, 6);
  g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 170, 266); g.lineTo(cx + 170, 266); g.stroke();
  g.fillStyle = ink; fitText(g, degree?.title ?? 'Master of Data Science', cx, 350, W - 200, 76, s => `500 ${s}px ${SERIF}`);
  g.fillStyle = '#5b625a'; g.font = `italic 400 40px ${SERIF}`; g.fillText(degree?.location ?? 'Melbourne, Australia', cx, 412);
  g.font = `500 34px ${SANS}`; g.fillStyle = ink; g.fillText(degree ? `${degree.startYear}–${degree.endYear}` : '', cx, 480);
  // "In progress" pill: clearly not a conferred award.
  const label = (degree?.status ?? 'in progress').toUpperCase(); g.font = `600 26px ${SANS}`;
  const pw = g.measureText(label).width + 26 * label.length * 0.12 + 60;
  g.fillStyle = navy; g.beginPath(); g.roundRect(cx - pw / 2, 520, pw, 56, 28); g.fill();
  g.fillStyle = '#fbf6ea'; spaced(g, label, cx, 558, 3);
  return c;
}

/** Miniature career timeline: places and years, oldest on the left. */
export function drawJourneyTimeline() {
  const [c, g] = canvas(); const W = c.width, H = c.height;
  const jobs = [...parseExperience()].reverse();
  g.fillStyle = '#25302b'; g.fillRect(0, 0, W, H);
  const grad = g.createRadialGradient(W * 0.3, H * 0.2, 50, W / 2, H / 2, W * 0.8); grad.addColorStop(0, 'rgba(255,255,255,0.06)'); grad.addColorStop(1, 'rgba(0,0,0,0.15)'); g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.textAlign = 'left'; g.fillStyle = '#e9e2cf'; g.font = `600 30px ${SANS}`; spaced(g, 'MY JOURNEY', 70, 100, 8);
  g.fillStyle = '#9fb59a'; g.font = `italic 400 34px ${SERIF}`; g.fillText('people, projects and places', 70, 148);
  // Winding path through the milestones.
  const n = Math.max(jobs.length, 1); const xs = jobs.map((_, i) => 150 + (i * (W - 300)) / Math.max(n - 1, 1)); const ys = jobs.map((_, i) => (i % 2 ? 330 : 470));
  g.strokeStyle = '#d9cfb4'; g.lineWidth = 6; g.setLineDash([2, 16]); g.lineCap = 'round';
  g.beginPath(); g.moveTo(40, 520);
  xs.forEach((x, i) => { const px = i ? xs[i - 1]! : 40, py = i ? ys[i - 1]! : 520; g.bezierCurveTo((px + x) / 2, py, (px + x) / 2, ys[i]!, x, ys[i]!); });
  g.bezierCurveTo(W - 90, ys[n - 1]!, W - 70, 230, W - 40, 210); g.stroke(); g.setLineDash([]);
  jobs.forEach((job, i) => {
    const x = xs[i]!, y = ys[i]!; const accent = ['#e2b35c', '#8fb3a8', '#d98b6a'][i % 3]!;
    g.fillStyle = accent; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#25302b'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
    const above = y > 400; const ty = above ? y - 120 : y + 60;
    g.textAlign = 'center'; g.fillStyle = accent; g.font = `600 40px ${SANS}`; g.fillText(String(job.startYear), x, ty);
    g.fillStyle = '#f3ecd9'; fitText(g, job.organisation, x, ty + 40, 290, 28, s => `500 ${s}px ${SANS}`);
    g.fillStyle = '#b7c2b3'; fitText(g, job.location.split(',')[0]!.replace(/^./, ch => ch.toUpperCase()), x, ty + 74, 270, 24, s => `400 ${s}px ${SANS}`);
  });
  return c;
}

/** Framed publication preview: greyed text and a labelled figure area, no invented title or diagram. */
export function drawResearchPreview() {
  const [c, g] = canvas(); const W = c.width, H = c.height;
  const r = parseResearch();
  g.fillStyle = '#e8e3d6'; g.fillRect(0, 0, W, H);
  // Paper page with a slight shadow.
  const px = 150, py = 40, pw = W - 300, ph = H - 80;
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(px + 10, py + 12, pw, ph);
  g.fillStyle = '#ffffff'; g.fillRect(px, py, pw, ph);
  g.fillStyle = '#00629b'; g.fillRect(px, py, pw, 70);
  g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.font = `600 26px ${SANS}`; spaced(g, 'IEEE XPLORE', px + 30, py + 45, 4);
  g.textAlign = 'right'; g.font = `500 24px ${SANS}`; g.fillText('WAMS 2024', px + pw - 30, py + 45);
  g.textAlign = 'left'; g.fillStyle = '#1d2a33';
  fitText(g, r.title ?? 'Research paper', px + 40, py + 140, pw - 80, 50, s => `500 ${s}px ${SERIF}`);
  g.fillStyle = '#6a7680'; g.font = `italic 400 28px ${SERIF}`; g.fillText('Co-authored · published in IEEE Xplore', px + 40, py + 185);
  // Greyed body text in two columns and an abstract figure box.
  const line = (x: number, y: number, w: number) => { g.fillStyle = '#d7dce0'; g.fillRect(x, y, w, 10); };
  const colW = (pw - 110) / 2; const left = px + 40, right = left + colW + 30;
  g.fillStyle = '#00629b'; g.font = `600 18px ${SANS}`; g.fillText('ABSTRACT', left, py + 236);
  for (let i = 0; i < 12; i++) line(left, py + 256 + i * 24, colW * (i % 4 === 3 ? 0.7 : 1));
  g.strokeStyle = '#9cb6c8'; g.lineWidth = 3; g.strokeRect(right, py + 222, colW, 170);
  g.strokeStyle = '#00629b'; g.lineWidth = 4; g.beginPath();
  for (let i = 0; i <= 40; i++) { const x = right + 20 + (i / 40) * (colW - 40); const y = py + 330 - Math.sin(i / 6) * 40 * (1 - i / 60); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  for (let i = 0; i < 5; i++) line(right, py + 436 + i * 24, colW * (i === 4 ? 0.5 : 1));
  return c;
}

/** The laptop's screen: a dark developer workspace listing the real project names. */
export function drawLaptopScreen() {
  const [c, g] = canvas(1024, 576); const W = c.width, H = c.height;
  const { projects } = parseProjects();
  g.fillStyle = '#0d1117'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#161b22'; g.fillRect(0, 0, W, 76);
  g.fillStyle = '#f0f6fc'; g.beginPath(); g.arc(52, 38, 20, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0d1117'; g.beginPath(); g.arc(52, 34, 9, 0, Math.PI * 2); g.fill(); g.fillRect(47, 40, 10, 14);
  g.fillStyle = '#e6edf3'; g.font = `600 28px ${SANS}`; g.textAlign = 'left'; g.fillText('Nanda777-max', 90, 48);
  g.fillStyle = '#8b949e'; g.font = `500 22px ${SANS}`; g.fillText('Repositories', 90, 126);
  projects.slice(0, 3).forEach((p, i) => {
    const y = 160 + i * 128;
    g.strokeStyle = '#30363d'; g.lineWidth = 2; g.beginPath(); g.roundRect(40, y, W - 80, 108, 12); g.stroke();
    g.fillStyle = '#4493f8'; fitText(g, p.slug, 70, y + 46, W - 300, 30, s => `600 ${s}px ${SANS}`);
    g.strokeStyle = '#3d444d'; g.beginPath(); g.roundRect(W - 190, y + 22, 110, 34, 17); g.stroke();
    g.fillStyle = '#8b949e'; g.font = `500 18px ${SANS}`; g.textAlign = 'center'; g.fillText('Public', W - 135, y + 45); g.textAlign = 'left';
    g.fillStyle = ['#3fb950', '#d29922', '#a371f7'][i % 3]!; g.beginPath(); g.arc(80, y + 80, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8b949e'; fitText(g, p.tech.slice(0, 3).join(' · '), 98, y + 87, W - 200, 20, s => `400 ${s}px ${SANS}`);
  });
  return c;
}
