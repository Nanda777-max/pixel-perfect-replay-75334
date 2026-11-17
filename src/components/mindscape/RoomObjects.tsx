// Content-driven room objects: the warm desk lamp, the desk portrait, the poster wall, the
// turntable and the globe on its table. Personal content comes from src/content/*, never from here.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, CanvasTexture, Color, Group, Mesh, MeshStandardMaterial, PointLight, SRGBColorSpace, Texture, TextureLoader, Vector3, type Object3D } from 'three';
import { SceneLabel } from './SceneLabel';
import { posters, posterLayout } from '@/content/posters';
import { music } from '@/content/music';
import { existingImage, portraitImage, withBase } from '@/content/media';
import { useMusicPlayer } from '@/lib/music-player';
import { drawWorldMap, loadCountries } from '@/lib/countries';
import type { Section } from '@/content/room';
import { drawLaptopScreen, fontsReady } from './frameArt';

type Vec = [number, number, number];
/** Warm 2700–3000 K lamp colour. */
export const WARM_LIGHT = '#ffb46b';

/** Loads an image as a texture without ever throwing; returns null while missing or broken. */
export function useSafeTexture(url: string | null | undefined) {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    if (!url) { setTexture(null); return; }
    let live = true; let loaded: Texture | null = null;
    new TextureLoader().load(url, t => { if (!live) { t.dispose(); return; } t.colorSpace = SRGBColorSpace; t.anisotropy = 4; loaded = t; setTexture(t); }, undefined, () => live && setTexture(null));
    return () => { live = false; loaded?.dispose(); };
  }, [url]);
  return texture;
}
const aspectOf = (t: Texture | null) => (t?.image ? (t.image as HTMLImageElement).width / (t.image as HTMLImageElement).height : null);

/** Crop a texture to fill a frame of the given aspect, centred, without stretching. */
function coverCrop(texture: Texture, frameAspect: number) {
  const a = aspectOf(texture) ?? frameAspect;
  if (a > frameAspect) { texture.repeat.set(frameAspect / a, 1); texture.offset.set((1 - frameAspect / a) / 2, 0); }
  else { texture.repeat.set(1, a / frameAspect); texture.offset.set(0, (1 - a / frameAspect) / 2); }
  texture.needsUpdate = true;
}

function useHover(active = true) {
  const [hover, setHover] = useState(false);
  return {
    hover,
    bind: active ? {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; },
      onPointerOut: () => { setHover(false); document.body.style.cursor = 'auto'; },
    } : {},
  };
}

/** Drawn placeholder art so empty frames still look intentional. */
function placeholderTexture(kind: 'portrait' | 'poster', tint: string, seed = 0) {
  const c = document.createElement('canvas'); c.width = 256; c.height = kind === 'portrait' ? 320 : 384;
  const g = c.getContext('2d')!; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height);
  g.globalAlpha = 0.18; g.fillStyle = '#2f3a2c';
  if (kind === 'portrait') { g.beginPath(); g.arc(128, 128, 52, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(128, 320, 100, 110, 0, Math.PI, 0); g.fill(); }
  else { g.beginPath(); g.arc(128 + (seed % 2 ? 30 : -30), 150, 70, 0, Math.PI * 2); g.fill(); g.fillRect(40, 290, 176, 10); g.fillRect(70, 312, 116, 6); }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

// ── Warm desk lamp ───────────────────────────────────────────────────────────
export function WarmLamp({ url, position, height, on, onToggle, reduced }: { url: string; position: Vec; height: number; on: boolean; onToggle: () => void; reduced: boolean }) {
  const { scene } = useGLTF(withBase(url));
  const { model, shade } = useMemo(() => {
    const c = scene.clone(true); const b = new Box3().setFromObject(c); const size = b.getSize(new Vector3()); const centre = b.getCenter(new Vector3()); const k = height / size.y;
    c.position.set(-centre.x * k, -b.min.y * k, -centre.z * k); c.scale.setScalar(k);
    let shade: MeshStandardMaterial | null = null;
    c.traverse((o: Object3D) => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; o.material = (o.material as MeshStandardMaterial).clone(); if ((o.material as MeshStandardMaterial).name === 'lamp') shade = o.material as MeshStandardMaterial; } });
    return { model: c, shade: shade as MeshStandardMaterial | null };
  }, [scene, height]);
  const light = useRef<PointLight>(null); const level = useRef(on ? 1 : 0);
  useEffect(() => { if (shade) { shade.emissive = new Color(WARM_LIGHT); } }, [shade]);
  useFrame((_, dt) => {
    const target = on ? 1 : 0;
    level.current = reduced ? target : level.current + (target - level.current) * (1 - Math.exp(-5 * Math.min(dt, 0.05)));
    if (light.current) light.current.intensity = level.current * 16;
    if (shade) shade.emissiveIntensity = level.current * 0.85;
  });
  const { hover, bind } = useHover();
  return <group position={position} onClick={e => { e.stopPropagation(); onToggle(); }} {...bind}>
    <primitive object={model} />
    <pointLight ref={light} position={[0, height * 0.72, 0.05]} color={WARM_LIGHT} intensity={0} distance={4.2} decay={1.5} />
    {hover && <SceneLabel position={[0, height + 0.15, 0]}><div className="tooltip-label">{on ? 'Switch the lamp off' : 'Switch the lamp on'}</div></SceneLabel>}
  </group>;
}

// ── Desk portrait ────────────────────────────────────────────────────────────
export function PortraitFrame({ position, rotation, onSelect }: { position: Vec; rotation: number; onSelect: (id: Section) => void }) {
  const photo = useSafeTexture(portraitImage());
  const placeholder = useMemo(() => placeholderTexture('portrait', '#c9d6bf'), []);
  const W = 0.3, H = 0.375;
  const map = useMemo(() => { if (!photo) return placeholder; coverCrop(photo, W / H); return photo; }, [photo, placeholder]);
  const { hover, bind } = useHover();
  return <group position={position} rotation={[0, rotation, 0]} onClick={e => { e.stopPropagation(); onSelect('about'); }} {...bind}>
    <group rotation={[-0.16, 0, 0]} position={[0, H / 2 + 0.03, 0]}>
      <mesh castShadow><boxGeometry args={[W + 0.05, H + 0.05, 0.025]} /><meshStandardMaterial color="#6b4f37" roughness={0.7} /></mesh>
      <mesh position={[0, 0, 0.0135]}><planeGeometry args={[W, H]} /><meshStandardMaterial map={map} roughness={0.85} /></mesh>
    </group>
    <mesh position={[0, 0.17, -0.09]} rotation={[0.45, 0, 0]}><boxGeometry args={[0.04, 0.34, 0.015]} /><meshStandardMaterial color="#6b4f37" /></mesh>
    {hover && <SceneLabel position={[0, H + 0.25, 0]}><div className="tooltip-label">A little about me</div></SceneLabel>}
  </group>;
}

// ── Poster wall ──────────────────────────────────────────────────────────────
function PosterFrame({ index, slot, onSelect }: { index: number; slot: { x: number; y: number; width: number; height: number }; onSelect: (id: Section, index?: number) => void }) {
  const poster = posters[index]!;
  const image = useSafeTexture(existingImage(poster.image));
  const placeholder = useMemo(() => placeholderTexture('poster', index % 2 ? '#e9c9bd' : '#efe0a8', index), [index]);
  const a = aspectOf(image) ?? 2 / 3;
  // Fit the frame to the image's own aspect inside its slot: no stretching, no cropping.
  const [w, h] = a > slot.width / slot.height ? [slot.width, slot.width / a] : [slot.height * a, slot.height];
  const { hover, bind } = useHover();
  return <group position={[slot.x, slot.y, 0]} onClick={e => { e.stopPropagation(); onSelect('posters', index); }} {...bind}>
    <mesh castShadow><boxGeometry args={[w + 0.07, h + 0.07, 0.04]} /><meshStandardMaterial color="#6b4f37" roughness={0.7} /></mesh>
    <mesh position={[0, 0, 0.021]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={image ?? placeholder} roughness={0.8} /></mesh>
    {hover && <SceneLabel position={[0, h / 2 + 0.2, 0.1]}><div className="tooltip-label">{poster.title || 'Little influences'}</div></SceneLabel>}
  </group>;
}
export function PosterWall({ position, onSelect }: { position: Vec; onSelect: (id: Section, index?: number) => void }) {
  const slots = useMemo(() => posterLayout(posters.length), []);
  return <group position={position} rotation={[0, Math.PI / 2, 0]}>{slots.map((slot, i) => <PosterFrame key={posters[i]?.id ?? i} index={i} slot={slot} onSelect={onSelect} />)}</group>;
}

// ── Turntable ────────────────────────────────────────────────────────────────
export function Turntable({ position, onSelect, reduced }: { position: Vec; onSelect: (id: Section) => void; reduced: boolean }) {
  const { index, playing } = useMusicPlayer();
  const art = useSafeTexture(existingImage(music[index]?.albumArt));
  const record = useRef<Group>(null); const arm = useRef<Group>(null);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (record.current && playing && !reduced) record.current.rotation.y -= d * 3.5; // ≈33⅓ rpm
    if (arm.current) { const target = playing ? -0.42 : 0; arm.current.rotation.y += (target - arm.current.rotation.y) * (reduced ? 1 : 1 - Math.exp(-4 * d)); }
  });
  const { hover, bind } = useHover();
  return <group position={position} onClick={e => { e.stopPropagation(); onSelect('music'); }} {...bind}>
    <mesh castShadow receiveShadow><boxGeometry args={[0.85, 0.14, 0.62]} /><meshStandardMaterial color="#9a6b45" roughness={0.6} /></mesh>
    <group ref={record} position={[-0.1, 0.08, 0]}>
      <mesh><cylinderGeometry args={[0.27, 0.27, 0.018, 48]} /><meshStandardMaterial color="#1f2620" roughness={0.35} metalness={0.1} /></mesh>
      {[0.12, 0.17, 0.22].map(r => <mesh key={r} position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r, r + 0.004, 48]} /><meshStandardMaterial color="#39433a" /></mesh>)}
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.075, 32]} /><meshStandardMaterial map={art} color={art ? '#ffffff' : '#e3b6a6'} /></mesh>
    </group>
    {/* Tonearm pivots from the back-right corner onto the record when playing. */}
    <group ref={arm} position={[0.3, 0.1, -0.22]}>
      <mesh><cylinderGeometry args={[0.03, 0.035, 0.05, 16]} /><meshStandardMaterial color="#cfd3d0" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[-0.02, 0.04, 0.2]} rotation={[0, 0.12, 0]}><boxGeometry args={[0.018, 0.018, 0.4]} /><meshStandardMaterial color="#e9e5da" metalness={0.5} roughness={0.35} /></mesh>
      <mesh position={[-0.045, 0.03, 0.4]}><boxGeometry args={[0.04, 0.025, 0.05]} /><meshStandardMaterial color="#2c332d" /></mesh>
    </group>
    {hover && <SceneLabel position={[0, 0.5, 0]}><div className="tooltip-label">On the turntable</div></SceneLabel>}
  </group>;
}

// ── Globe on its own little table ────────────────────────────────────────────
export function GlobeTable({ position, onSelect, reduced }: { position: Vec; onSelect: (id: Section) => void; reduced: boolean }) {
  const [map, setMap] = useState<CanvasTexture | null>(null);
  const globe = useRef<Group>(null);
  useEffect(() => { let live = true; loadCountries().then(f => { if (!live) return; const t = new CanvasTexture(drawWorldMap(f)); t.colorSpace = SRGBColorSpace; setMap(t); }).catch(() => {}); return () => { live = false; }; }, []);
  useFrame((_, dt) => { if (globe.current && !reduced) globe.current.rotation.y += Math.min(dt, 0.05) * 0.12; });
  const { hover, bind } = useHover();
  const TOP = 0.62;
  return <group position={position}>
    {/* Pedestal side table: base, column and round top. */}
    <mesh position={[0, 0.02, 0]} castShadow receiveShadow><cylinderGeometry args={[0.22, 0.25, 0.04, 32]} /><meshStandardMaterial color="#8a5f3e" roughness={0.6} /></mesh>
    <mesh position={[0, TOP / 2, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, TOP - 0.04, 16]} /><meshStandardMaterial color="#8a5f3e" roughness={0.6} /></mesh>
    <mesh position={[0, TOP, 0]} castShadow receiveShadow><cylinderGeometry args={[0.32, 0.32, 0.04, 40]} /><meshStandardMaterial color="#a8774f" roughness={0.55} /></mesh>
    <group position={[0, TOP + 0.02, 0]} onClick={e => { e.stopPropagation(); onSelect('travel'); }} {...bind}>
      <mesh position={[0, 0.015, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.03, 24]} /><meshStandardMaterial color="#5b4330" /></mesh>
      <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.015, 0.02, 0.13, 12]} /><meshStandardMaterial color="#5b4330" /></mesh>
      <group position={[0, 0.38, 0]} rotation={[0, 0, 0.41]}>
        <group ref={globe}><mesh castShadow><sphereGeometry args={[0.22, 48, 32]} /><meshStandardMaterial map={map} color={map ? '#ffffff' : '#cfe0dc'} roughness={0.55} /></mesh></group>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.25, 0.008, 8, 64, Math.PI * 1.2]} /><meshStandardMaterial color="#b88a4a" metalness={0.6} roughness={0.35} /></mesh>
        <mesh><cylinderGeometry args={[0.006, 0.006, 0.54, 8]} /><meshStandardMaterial color="#b88a4a" metalness={0.6} /></mesh>
      </group>
      {hover && <SceneLabel position={[0, 0.8, 0]}><div className="tooltip-label">A world of memories</div></SceneLabel>}
    </group>
  </group>;
}

// ── Framed displays (education, journey, research) ──────────────────────────
/** A canvas drawing as a texture, redrawn once the site fonts have loaded. */
export function useDrawnTexture(draw: () => HTMLCanvasElement) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let live = true; let made: CanvasTexture | null = null;
    fontsReady().then(() => { if (!live) return; made = new CanvasTexture(draw()); made.colorSpace = SRGBColorSpace; made.anisotropy = 8; setTexture(made); });
    return () => { live = false; made?.dispose(); };
  }, [draw]);
  return texture;
}

export function FramedDisplay({ id, position, label, draw, photo, onSelect }: { id: Section; position: Vec; label: string; draw: () => HTMLCanvasElement; photo: string; onSelect: (id: Section) => void }) {
  const art = useDrawnTexture(draw);
  const image = useSafeTexture(existingImage(photo));
  const W = 0.85, H = 0.57;
  const map = useMemo(() => { if (image) coverCrop(image, W / H); return image ?? art; }, [image, art]);
  const group = useRef<Group>(null);
  const { hover, bind } = useHover();
  useFrame((_, dt) => { if (group.current) { const s = group.current.scale.x + ((hover ? 1.04 : 1) - group.current.scale.x) * (1 - Math.exp(-10 * Math.min(dt, 0.05))); group.current.scale.setScalar(s); } });
  return <group ref={group} position={position} onClick={e => { e.stopPropagation(); onSelect(id); }} {...bind}>
    <mesh castShadow receiveShadow><boxGeometry args={[1, 0.72, 0.08]} /><meshStandardMaterial color={hover ? '#b98a5c' : '#9a6b45'} roughness={0.6} /></mesh>
    <mesh position={[0, 0, 0.041]}><boxGeometry args={[0.9, 0.62, 0.01]} /><meshStandardMaterial color="#f4ecd8" roughness={0.9} /></mesh>
    <mesh position={[0, 0, 0.047]}><planeGeometry args={[W, H]} /><meshStandardMaterial map={map} color={map ? '#ffffff' : '#f4ecd8'} roughness={0.8} emissive="#fff3d6" emissiveIntensity={hover ? 0.12 : 0} /></mesh>
    {hover && <SceneLabel position={[0, 0.55, 0.1]}><div className="tooltip-label">{label}</div></SceneLabel>}
  </group>;
}

/** The laptop screen overlay, in the laptop model's own units (see Room's Model). */
export function LaptopScreen() {
  const screen = useDrawnTexture(drawLaptopScreen);
  // Inner screen corners in the Kenney laptop model: x 0.04–0.56, from (y .067, z −.384) to (y .331, z −.502).
  return <mesh position={[0, 0.199, -0.443 + 0.2728]} rotation={[-0.424, 0, 0]} renderOrder={1}>
    <planeGeometry args={[0.52, 0.289]} /><meshBasicMaterial map={screen} color={screen ? '#ffffff' : '#0d1117'} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
  </mesh>;
}
