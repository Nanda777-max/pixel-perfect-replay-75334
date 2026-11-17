// The travel globe, brought forward: real country polygons from Natural Earth, rotatable and
// zoomable, with every country marked `visited: true` in src/content/travel.ts highlighted.
// Clicking a highlighted country opens its photo album.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ThreeGlobe from 'three-globe';
import { MeshPhongMaterial, Vector3, type Object3D } from 'three';
import { ArrowLeft, ChevronLeft, ChevronRight, Globe2, ImageOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage } from './SafeImage';
import { countryPhotos } from '@/content/media';
import { visitedCountries, type VisitedCountry } from '@/content/travel';
import { globeColours, loadCountries, visitedCodes, visitedEntry, type CountryFeature } from '@/lib/countries';

/** Rough label point for a country: the centre of its largest outer ring's bounding box. */
function labelPoint(f: CountryFeature) {
  const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
  let best: number[][] = polys[0]?.[0] ?? [[0, 0]]; let area = -1;
  for (const p of polys) { const r = p[0] ?? []; const xs = r.map(c => c[0] ?? 0), ys = r.map(c => c[1] ?? 0); const a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); if (a > area) { area = a; best = r; } }
  const xs = best.map(c => c[0] ?? 0), ys = best.map(c => c[1] ?? 0);
  return { lng: (Math.max(...xs) + Math.min(...xs)) / 2, lat: (Math.max(...ys) + Math.min(...ys)) / 2 };
}

type LabelRefs = React.MutableRefObject<Map<string, HTMLSpanElement>>;

/** Projects label anchor points to the screen every frame and moves the HTML labels there. */
function LabelProjector({ globe, features, labels }: { globe: ThreeGlobe; features: CountryFeature[]; labels: LabelRefs }) {
  const anchors = useMemo(() => new Map(features.map(f => { const { lat, lng } = labelPoint(f); const c = globe.getCoords(lat, lng, 0.03); return [f.properties.code, new Vector3(c.x, c.y, c.z)] as const; })), [globe, features]);
  const v = useMemo(() => new Vector3(), []); const dir = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    labels.current.forEach((el, code) => {
      const a = anchors.get(code); if (!a) { el.style.display = 'none'; return; }
      const facing = dir.copy(camera.position).normalize().dot(v.copy(a).normalize()) > 0.2;
      v.copy(a).project(camera);
      el.style.display = facing ? 'block' : 'none';
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height - 22}px)`;
    });
  });
  return null;
}

function GlobeScene({ features, onHover, onPick, hovered, labels }: { features: CountryFeature[]; hovered: CountryFeature | null; onHover: (f: CountryFeature | null) => void; onPick: (f: CountryFeature) => void; labels: LabelRefs }) {
  const visited = useMemo(() => visitedCodes(), []);
  const globe = useMemo(() => {
    const g = new ThreeGlobe({ animateIn: false })
      .globeMaterial(new MeshPhongMaterial({ color: globeColours.ocean, shininess: 8 }))
      .showAtmosphere(true).atmosphereColor('#f3e7cf').atmosphereAltitude(0.12)
      .polygonsData(features)
      .polygonCapCurvatureResolution(3)
      .polygonSideColor(() => 'rgba(80, 70, 50, 0.18)')
      .polygonsTransitionDuration(200);
    return g;
  }, [features]);
  useEffect(() => () => { (globe as unknown as { _destructor?: () => void })._destructor?.(); }, [globe]);
  useEffect(() => {
    const isVisited = (f: object) => visited.has((f as CountryFeature).properties.code);
    globe
      .polygonCapColor(f => (isVisited(f) ? globeColours.visited : f === hovered ? '#f6efdc' : globeColours.land))
      .polygonStrokeColor(f => (isVisited(f) ? globeColours.visitedBorder : globeColours.border))
      .polygonAltitude(f => (f === hovered ? 0.022 : isVisited(f) ? 0.014 : 0.006));
  }, [globe, hovered, visited]);

  // Open looking at the first visited country, or at India (home) when none are marked yet.
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  useEffect(() => {
    // Keep the whole globe in view on tall phone screens as well as wide ones.
    const first = features.find(f => visited.has(f.properties.code)); const p = first ? labelPoint(first) : { lat: 15, lng: 78 };
    const c = globe.getCoords(p.lat, p.lng, aspect < 1 ? 2.5 / aspect : 2.6); camera.position.set(c.x, c.y, c.z); camera.lookAt(0, 0, 0);
  }, [camera, features, globe, visited, aspect < 1]); // eslint-disable-line react-hooks/exhaustive-deps

  const featureOf = (o: Object3D | null): CountryFeature | null => { for (let x = o; x; x = x.parent) { const d = (x as Object3D & { __data?: { data?: CountryFeature } }).__data; if (d && 'data' in d && d.data?.properties) return d.data; if (d && (d as unknown as CountryFeature).properties) return d as unknown as CountryFeature; } return null; };
  const down = useRef<{ x: number; y: number } | null>(null);
  return <>
    <ambientLight intensity={1.25} />
    <directionalLight position={[200, 260, 300]} intensity={1.6} />
    <directionalLight position={[-300, -100, -200]} intensity={0.4} />
    <primitive object={globe}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); const f = featureOf(e.object); if (f !== hovered) onHover(f); document.body.style.cursor = f ? 'pointer' : 'grab'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'auto'; }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => { down.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); const d = down.current; if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; const f = featureOf(e.object); if (f) onPick(f); }} />
    <LabelProjector globe={globe} features={features} labels={labels} />
    <OrbitControls makeDefault enablePan={false} minDistance={135} maxDistance={700} rotateSpeed={0.5} zoomSpeed={0.7} enableDamping dampingFactor={0.08} />
  </>;
}

function Album({ country, onClose }: { country: VisitedCountry; onClose: () => void }) {
  const photos = useMemo(() => countryPhotos(country), [country]);
  const [index, setIndex] = useState(0); const [enlarged, setEnlarged] = useState(false);
  const go = (d: number) => setIndex(i => (i + d + photos.length) % photos.length);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') { e.stopPropagation(); if (enlarged) setEnlarged(false); else onClose(); } };
    window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true);
  });
  const alt = (i: number) => `${country.country}, photo ${i + 1} of ${photos.length}`;
  return <section className="album" role="dialog" aria-modal="true" aria-label={`${country.country} photo album`}>
    <header className="album-header"><Button variant="ghost" onClick={onClose}><ArrowLeft />Back to the globe</Button><Button variant="ghost" size="icon" aria-label="Close album" onClick={onClose}><X /></Button></header>
    <div className="album-body">
      <span className="eyebrow">Travel album</span><h2>{country.country}</h2>
      {country.description && <p className="panel-description">{country.description}</p>}
      {photos.length ? <>
        <div className="album-stage">
          <SafeImage key={photos[index]} src={photos[index]} alt={alt(index)} ratio="4 / 3" className="album-photo" eager onClick={() => setEnlarged(true)} />
          {photos.length > 1 && <><Button variant="outline" size="icon" className="album-nav album-prev" aria-label="Previous photo" onClick={() => go(-1)}><ChevronLeft /></Button><Button variant="outline" size="icon" className="album-nav album-next" aria-label="Next photo" onClick={() => go(1)}><ChevronRight /></Button></>}
        </div>
        <p className="album-count">{index + 1} / {photos.length} · tap the photo to enlarge</p>
        {photos.length > 1 && <div className="album-thumbs">{photos.map((p, i) => <button type="button" key={p} aria-label={`Show photo ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}><SafeImage src={p} alt="" fit="cover" ratio="1 / 1" /></button>)}</div>}
      </> : <div className="placeholder-page"><ImageOff size={26} strokeWidth={1.3} /><p>Photos coming soon.</p><small>Add images to public/images/travel/{country.id}/</small></div>}
    </div>
    {enlarged && <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt(index)} onClick={() => setEnlarged(false)}>
      <SafeImage src={photos[index]} alt={alt(index)} eager />
      <Button variant="secondary" size="icon" className="lightbox-close" aria-label="Close enlarged photo" onClick={() => setEnlarged(false)}><X /></Button>
      {photos.length > 1 && <><Button variant="secondary" size="icon" className="album-nav album-prev" aria-label="Previous photo" onClick={e => { e.stopPropagation(); go(-1); }}><ChevronLeft /></Button><Button variant="secondary" size="icon" className="album-nav album-next" aria-label="Next photo" onClick={e => { e.stopPropagation(); go(1); }}><ChevronRight /></Button></>}
    </div>}
  </section>;
}

export default function GlobeViewer({ onClose }: { onClose: () => void }) {
  const [features, setFeatures] = useState<CountryFeature[] | null>(null);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [notice, setNotice] = useState('');
  const [album, setAlbum] = useState<VisitedCountry | null>(null);
  const labels = useRef(new Map<string, HTMLSpanElement>());
  const labelled = features ? features.filter(f => visitedEntry(f.properties.code) || f === hovered) : [];
  const webgl = useMemo(() => { try { return Boolean(document.createElement('canvas').getContext('webgl2')); } catch { return false; } }, []);
  useEffect(() => { loadCountries().then(setFeatures).catch(() => setError('The map could not load. Please try again.')); }, []);
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !album) onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [album, onClose]);
  const visited = visitedCountries.filter(c => c.visited);
  const pick = (f: CountryFeature) => { const entry = visitedEntry(f.properties.code); if (entry) { setAlbum(entry); setNotice(''); } else setNotice(`${f.properties.name} · not visited yet`); };
  return <div className="globe-shade">
    <section className="globe-viewer" role="dialog" aria-modal="true" aria-label="A world of memories">
      <header className="panel-header"><Button variant="ghost" onClick={onClose}><ArrowLeft />Back to the room</Button><div className="globe-title"><span className="eyebrow">The globe</span><h2>A world of memories</h2></div><Button variant="ghost" size="icon" aria-label="Close globe" onClick={onClose}><X /></Button></header>
      <div className="globe-stage">
        {webgl && features && <Canvas camera={{ fov: 40, near: 1, far: 2000, position: [0, 0, 300] }} dpr={[1, 2]} onPointerMissed={() => setNotice('')}><GlobeScene features={features} hovered={hovered} onHover={setHovered} onPick={pick} labels={labels} /></Canvas>}
        <div className="globe-labels" aria-hidden>{labelled.map(f => <span key={f.properties.code} className={`globe-label ${visitedEntry(f.properties.code) ? 'globe-label-visited' : 'globe-label-hover'}`} style={{ display: 'none' }} ref={el => { if (el) labels.current.set(f.properties.code, el); else labels.current.delete(f.properties.code); }}>{f.properties.name}</span>)}</div>
        {!features && !error && webgl && <div className="loading-room">Unfolding the map…</div>}
        {error && <div className="loading-room">{error}</div>}
        {!webgl && <div className="globe-fallback"><Globe2 size={30} strokeWidth={1.2} /><p>The 3D globe needs WebGL, which this browser has turned off.</p>{visited.map(c => <Button key={c.id} variant="outline" onClick={() => setAlbum(c)}>{c.country}</Button>)}</div>}
        <div className="globe-legend" aria-label="Map legend"><span><i style={{ background: globeColours.visited }} />Visited</span><span><i style={{ background: globeColours.land }} />Not yet</span></div>
        <p className="globe-hint" role="status">{notice || (hovered ? `${hovered.properties.name}${visitedEntry(hovered.properties.code) ? ' · open the album' : ''}` : visited.length ? 'Drag to turn, scroll or pinch to zoom, tap a highlighted country.' : 'Drag to turn, scroll or pinch to zoom. Visited countries will light up here.')}</p>
      </div>
    </section>
    {album && <Album country={album} onClose={() => setAlbum(null)} />}
  </div>;
}
