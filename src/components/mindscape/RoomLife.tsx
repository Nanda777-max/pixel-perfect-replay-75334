// Things that make the room feel lived-in: gallery lighting, the art on the easel, a ball with
// real physics, a wall clock, desk accessories, plants, and drawers that hold memories.
// Personal content comes from src/content (artwork.ts, drawers.ts, desk.ts); nothing is invented.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AmbientLight, Box3, CanvasTexture, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial, Object3D, Plane, PlaneGeometry, Quaternion, SpotLight, SRGBColorSpace, Vector2, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SceneLabel } from './SceneLabel';
import { useSafeTexture } from './RoomObjects';
import { artwork } from '@/content/artwork';
import { existingImage, withBase } from '@/content/media';
import { drawerObjects } from '@/content/drawers';
import { deskNotes } from '@/content/desk';
import { motion, shakeQueue } from '@/lib/motion';
import { atRest, BALL_RADIUS, GRAVITY, ROOM, SPAWN, stepBall } from '@/lib/ball-physics';
import type { Section } from '@/content/room';

type Vec = [number, number, number];
const breeze = (t: number, phase = 0) => Math.sin(t * 1.1 + phase) * 0.6 + Math.sin(t * 0.47 + phase * 1.7) * 0.4;
const ease = (dt: number, k = 6) => 1 - Math.exp(-k * Math.min(dt, 0.05));
function useHoverCursor(cursor = 'pointer') {
  const [hover, setHover] = useState(false);
  return { hover, bind: { onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); document.body.style.cursor = cursor; }, onPointerOut: () => { setHover(false); document.body.style.cursor = 'auto'; } } };
}

// ── Lights: normal room lighting, dimmed with a warm spotlight while the gallery is open ──────
export function SceneLights({ evening, gallery, colours }: { evening: boolean; gallery: boolean; colours: { paper: string; sage: string } }) {
  const amb = useRef<AmbientLight>(null); const hemi = useRef<HemisphereLight>(null); const sun = useRef<DirectionalLight>(null); const spot = useRef<SpotLight>(null);
  const target = useMemo(() => { const o = new Object3D(); o.position.set(-3.41, 1.35, 0.62); return o; }, []);
  useFrame(({ scene }, dt) => {
    const a = ease(dt, 3); const dim = gallery ? 0.38 : 1;
    scene.environmentIntensity += ((gallery ? 0.3 : 1) - scene.environmentIntensity) * a; // the room's ambient reflections
    if (amb.current) amb.current.intensity += ((evening ? 0.75 : 1.1) * dim - amb.current.intensity) * a;
    if (hemi.current) hemi.current.intensity += (1.4 * dim - hemi.current.intensity) * a;
    if (sun.current) sun.current.intensity += ((evening ? 1.4 : 2.5) * dim - sun.current.intensity) * a;
    if (spot.current) spot.current.intensity += ((gallery ? 40 : 0) - spot.current.intensity) * a;
  });
  return <>
    <ambientLight ref={amb} intensity={evening ? 0.75 : 1.1} />
    <hemisphereLight ref={hemi} args={[colours.paper, colours.sage, 1.4]} />
    <directionalLight ref={sun} position={[-3, 8, 6]} intensity={evening ? 1.4 : 2.5} color={colours.paper} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
    <primitive object={target} />
    <spotLight ref={spot} position={[-1.6, 3.6, 2.4]} target={target} angle={0.32} penumbra={0.75} distance={9} decay={1.2} intensity={0} color="#ffd9a0" />
  </>;
}

/** The first artwork with an image is shown on the easel's canvas. */
export function EaselArt() {
  const first = artwork.find(a => existingImage(a.image));
  const tex = useSafeTexture(first ? existingImage(first.image) : null);
  if (!tex) return null;
  const img = tex.image as HTMLImageElement; const W = 0.82, H = 1.03; const a = img.width / img.height;
  const [w, h] = a > W / H ? [W, W / a] : [H * a, H];
  return <group position={[-3.45, 0, 0.55]} rotation={[0, 0.5, 0]}><mesh position={[0, 1.35, 0.089]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh></group>;
}

// ── The ball: physics in src/lib/ball-physics.ts; here only input, tilt and rendering ──────
const R = BALL_RADIUS;
const G = GRAVITY;

export function Ball({ reduced }: { reduced: boolean }) {
  const mesh = useRef<Mesh>(null);
  const { camera, gl, raycaster } = useThree();
  const controls = useThree(s => s.controls) as unknown as OrbitControlsImpl | null;
  const sim = useMemo(() => ({ p: SPAWN.clone(), v: new Vector3(), q: new Quaternion(), awake: false, dragging: false, samples: [] as { t: number; p: Vector3 }[] }), []);
  const tmp = useMemo(() => ({ right: new Vector3(), fwd: new Vector3(), g: new Vector3(), hit: new Vector3(), ndc: new Vector2(), plane: new Plane(new Vector3(0, 1, 0), -0.55) }), []);
  const { hover, bind } = useHoverCursor('grab');

  // Drag with mouse or finger; the release speed decides the throw.
  useEffect(() => {
    const el = gl.domElement;
    const toFloor = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect(); tmp.ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(tmp.ndc, camera); return raycaster.ray.intersectPlane(tmp.plane, tmp.hit);
    };
    const move = (e: PointerEvent) => {
      if (!sim.dragging) return; const p = toFloor(e.clientX, e.clientY); if (!p) return;
      p.x = Math.min(ROOM.maxX - R, Math.max(ROOM.minX + R, p.x)); p.z = Math.min(ROOM.maxZ - R, Math.max(ROOM.minZ + R, p.z));
      sim.p.lerp(p, 0.6); const now = performance.now(); sim.samples.push({ t: now, p: sim.p.clone() }); while (sim.samples.length > 2 && now - sim.samples[0]!.t > 110) sim.samples.shift();
    };
    const up = () => {
      if (!sim.dragging) return; sim.dragging = false; document.body.style.cursor = 'auto'; if (controls) controls.enabled = true;
      const s = sim.samples; const a = s[0], b = s[s.length - 1];
      if (a && b && b.t - a.t > 8) { sim.v.copy(b.p).sub(a.p).multiplyScalar(1000 / (b.t - a.t)); sim.v.y = 0; const speed = Math.min(sim.v.length(), 14); sim.v.setLength(speed); sim.v.y = Math.min(3.2, speed * 0.18); }
      sim.awake = true;
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [camera, controls, gl, raycaster, sim, tmp]);

  const step = (dt: number) => {
    const t = motion.get();
    // Gravity, tipped sideways by the phone's tilt (relative to how the screen is looking at the room).
    camera.getWorldDirection(tmp.fwd); tmp.fwd.y = 0; tmp.fwd.normalize(); tmp.right.set(-tmp.fwd.z, 0, tmp.fwd.x);
    tmp.g.set(0, -G, 0).addScaledVector(tmp.right, t.tiltX * G * 0.7).addScaledVector(tmp.fwd, -t.tiltY * G * 0.7);
    return stepBall(sim, dt, tmp.g);
  };

  useFrame((_, delta) => {
    const t = motion.get();
    while (shakeQueue.length) { // a shake gives a short push in the direction of the jolt
      const s = shakeQueue.shift()!; camera.getWorldDirection(tmp.fwd); tmp.fwd.y = 0; tmp.fwd.normalize(); tmp.right.set(-tmp.fwd.z, 0, tmp.fwd.x);
      sim.v.addScaledVector(tmp.right, s.x * s.strength * 5).addScaledVector(tmp.fwd, -s.y * s.strength * 5); sim.v.y += s.strength * 2.5; sim.awake = true;
    }
    if (Math.abs(t.tiltX) + Math.abs(t.tiltY) > 0.02) sim.awake = true;
    if (sim.dragging) { sim.v.set(0, 0, 0); sim.awake = true; }
    else if (sim.awake && !reduced) {
      const dt = Math.min(delta, 1 / 30); const n = 4; let grounded = false;
      for (let i = 0; i < n; i++) grounded = step(dt / n);
      if (atRest(sim, grounded) && Math.abs(t.tiltX) + Math.abs(t.tiltY) < 0.02) { sim.v.set(0, 0, 0); sim.awake = false; } // rest: stop simulating
      if (sim.p.y < -2 || !Number.isFinite(sim.p.x)) { sim.p.copy(SPAWN); sim.v.set(0, 0, 0); }
    }
    if (mesh.current) { mesh.current.position.copy(sim.p); mesh.current.quaternion.copy(sim.q); }
  });

  const tex = useMemo(() => { // a stitched leather-look ball in the room's colours
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d')!;
    g.fillStyle = '#d98b6a'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#f3ead6';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(32 + i * 64, 64, 22, 40, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#7a4a34'; g.lineWidth = 2; g.setLineDash([4, 4]); for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(32 + i * 64, 64, 24, 42, 0, 0, Math.PI * 2); g.stroke(); }
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
  }, []);
  return <mesh ref={mesh} position={SPAWN.toArray()} castShadow receiveShadow {...bind}
    onPointerDown={e => { e.stopPropagation(); sim.dragging = true; sim.samples = [{ t: performance.now(), p: sim.p.clone() }]; if (controls) controls.enabled = false; document.body.style.cursor = 'grabbing'; }}>
    <sphereGeometry args={[R, 32, 24]} /><meshStandardMaterial map={tex} roughness={0.55} />
    {hover && !sim.dragging && <SceneLabel position={[0, 0.4, 0]}><div className="tooltip-label">Drag and throw me</div></SceneLabel>}
  </mesh>;
}

// ── Wall clock ──────────────────────────────────────────────────────────────────────────────
export function WallClock({ position, reduced }: { position: Vec; reduced: boolean }) {
  const hour = useRef<Group>(null), minute = useRef<Group>(null), second = useRef<Group>(null);
  useFrame(() => {
    const d = new Date(); const ms = d.getMilliseconds(); const s = d.getSeconds() + (reduced ? 0 : Math.min(1, ms / 140)); // tick: snaps in 140ms
    const m = d.getMinutes() + d.getSeconds() / 60; const h = (d.getHours() % 12) + m / 60;
    if (second.current) second.current.rotation.z = -(s / 60) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2;
  });
  const { hover, bind } = useHoverCursor('default');
  return <group position={position} {...bind}>
    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.27, 0.27, 0.05, 48]} /><meshStandardMaterial color="#8a5d3b" roughness={0.55} /></mesh>
    <group>
      <mesh position={[0, 0, 0.027]}><circleGeometry args={[0.235, 48]} /><meshStandardMaterial color="#f6efdc" roughness={0.9} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.2, Math.cos((i / 12) * Math.PI * 2) * 0.2, 0.03]} rotation={[0, 0, -(i / 12) * Math.PI * 2]}><boxGeometry args={[i % 3 ? 0.008 : 0.016, i % 3 ? 0.025 : 0.045, 0.004]} /><meshStandardMaterial color="#3a3328" /></mesh>)}
      <group ref={hour} position={[0, 0, 0.034]}><mesh position={[0, 0.05, 0]}><boxGeometry args={[0.018, 0.12, 0.004]} /><meshStandardMaterial color="#2c2a22" /></mesh></group>
      <group ref={minute} position={[0, 0, 0.038]}><mesh position={[0, 0.075, 0]}><boxGeometry args={[0.012, 0.17, 0.004]} /><meshStandardMaterial color="#2c2a22" /></mesh></group>
      <group ref={second} position={[0, 0, 0.042]}><mesh position={[0, 0.06, 0]}><boxGeometry args={[0.005, 0.2, 0.003]} /><meshStandardMaterial color="#b9785f" /></mesh></group>
      <mesh position={[0, 0, 0.046]}><circleGeometry args={[0.014, 16]} /><meshStandardMaterial color="#b88a4a" metalness={0.6} roughness={0.3} /></mesh>
    </group>
    {hover && <SceneLabel position={[0, 0.42, 0.1]}><div className="tooltip-label">Time keeps moving.</div></SceneLabel>}
  </group>;
}

// ── Desk accessories ───────────────────────────────────────────────────────────────────────
const DESK_Y = 1.385;
/** The room is built at roughly twice real-life scale, so desk objects are scaled to match. */
const S = 1.7;
function Mug() {
  const g = useRef<Group>(null); const turn = useRef(0); const { hover, bind } = useHoverCursor();
  useFrame((_, dt) => { if (g.current) { g.current.rotation.y += (turn.current - g.current.rotation.y) * ease(dt, 5); g.current.position.y = DESK_Y + Math.max(0, Math.sin(Math.min(1, Math.abs(turn.current - g.current.rotation.y)) * Math.PI)) * 0.03; } });
  return <group ref={g} position={[-0.5, DESK_Y, -1.92]} scale={S} onClick={e => { e.stopPropagation(); turn.current += Math.PI * 0.75; }} {...bind}>
    <mesh position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.055, 0.05, 0.12, 24]} /><meshStandardMaterial color="#e3b6a6" roughness={0.6} /></mesh>
    <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.048, 24]} /><meshStandardMaterial color="#5a3a26" roughness={0.3} /></mesh>
    <mesh position={[0.064, 0.062, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.03, 0.009, 8, 16, Math.PI]} /><meshStandardMaterial color="#e3b6a6" roughness={0.6} /></mesh>
    {hover && <SceneLabel position={[0, 0.3, 0]}><div className="tooltip-label">Coffee, always</div></SceneLabel>}
  </group>;
}
function PenHolder() {
  return <group position={[-2.38, DESK_Y, -2.72]} scale={S}>
    <mesh position={[0, 0.065, 0]} castShadow><cylinderGeometry args={[0.048, 0.044, 0.13, 20, 1, true]} /><meshStandardMaterial color="#6b4f37" roughness={0.6} side={2} /></mesh>
    <mesh position={[0, 0.004, 0]}><cylinderGeometry args={[0.044, 0.044, 0.008, 20]} /><meshStandardMaterial color="#6b4f37" /></mesh>
    {([['#3f5a46', 0.18, 0.2], ['#c9a54f', -0.15, 0.17], ['#b9785f', 0.05, -0.22], ['#2c2a22', -0.2, -0.12]] as const).map(([c, tx, tz], i) => <mesh key={i} position={[tx * 0.12, 0.13, tz * 0.12]} rotation={[tz, 0, -tx]}><cylinderGeometry args={[0.006, 0.006, 0.17, 8]} /><meshStandardMaterial color={c} /></mesh>)}
  </group>;
}
function Calculator() {
  const [pressed, setPressed] = useState(-1); const { hover, bind } = useHoverCursor();
  useEffect(() => { if (pressed < 0) return; const t = setTimeout(() => setPressed(-1), 160); return () => clearTimeout(t); }, [pressed]);
  return <group position={[-2.68, DESK_Y, -1.9]} rotation={[0, 0.25, 0]} scale={S} onClick={e => { e.stopPropagation(); setPressed(Math.floor(Math.random() * 12)); }} {...bind}>
    <mesh position={[0, 0.011, 0]} castShadow><boxGeometry args={[0.13, 0.022, 0.19]} /><meshStandardMaterial color="#3a403b" roughness={0.6} /></mesh>
    <mesh position={[0, 0.023, -0.06]}><boxGeometry args={[0.1, 0.003, 0.04]} /><meshStandardMaterial color="#b9c7b0" emissive="#b9c7b0" emissiveIntensity={0.15} /></mesh>
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[-0.033 + (i % 3) * 0.033, pressed === i ? 0.022 : 0.026, -0.012 + Math.floor(i / 3) * 0.025]}><boxGeometry args={[0.024, 0.007, 0.018]} /><meshStandardMaterial color={i === 11 ? '#d98b6a' : '#e9e2cf'} /></mesh>)}
    {hover && <SceneLabel position={[0, 0.25, 0]}><div className="tooltip-label">Press a key</div></SceneLabel>}
  </group>;
}
function Notes() {
  const [open, setOpen] = useState<number | null>(null);
  return <group position={[-1.6, DESK_Y + 0.002, -1.8]} scale={S}>
    {deskNotes.slice(0, 3).map((n, i) => {
      return <group key={n.id} position={[i * 0.05 - 0.05, i * 0.002, (i % 2) * 0.03]} rotation={[0, (i - 1) * 0.35, 0]}
        onClick={e => { e.stopPropagation(); setOpen(open === i ? null : i); }}
        onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color={['#efe0a8', '#f3ecd9', '#e9c9bd'][i % 3] ?? '#f3ecd9'} roughness={0.95} /></mesh>
        {[0.02, 0, -0.02].map(z => <mesh key={z} position={[0, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.07, 0.004]} /><meshBasicMaterial color="#8d806a" transparent opacity={n.text ? 0.6 : 0.2} /></mesh>)}
        {open === i && <SceneLabel position={[0, 0.25, 0]}><div className="tooltip-label note-label">{n.text || 'Nothing written here yet.'}</div></SceneLabel>}
      </group>;
    })}
  </group>;
}
function Headphones() {
  const g = useRef<Group>(null); const [held, setHeld] = useState(false); const { hover, bind } = useHoverCursor();
  useFrame((_, dt) => { if (!g.current) return; const a = ease(dt, 6); g.current.position.y += ((held ? DESK_Y + 0.28 : DESK_Y) - g.current.position.y) * a; g.current.rotation.x += ((held ? 0 : -Math.PI / 2) - g.current.rotation.x) * a; g.current.rotation.y += ((held ? 0.6 : 0.4) - g.current.rotation.y) * a; });
  return <group ref={g} position={[-0.62, DESK_Y, -2.85]} rotation={[-Math.PI / 2, 0.4, 0]} scale={S} onClick={e => { e.stopPropagation(); setHeld(!held); }} {...bind}>
    <mesh position={[0, 0.03, 0]} castShadow><torusGeometry args={[0.085, 0.011, 8, 32, Math.PI]} /><meshStandardMaterial color="#2c2a22" roughness={0.5} /></mesh>
    {[-0.085, 0.085].map(x => <mesh key={x} position={[x, 0.025, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.028, 20]} /><meshStandardMaterial color="#3f5a46" roughness={0.6} /></mesh>)}
    {hover && <SceneLabel position={[0, 0.3, 0]}><div className="tooltip-label">{held ? 'Put them back' : 'Pick up the headphones'}</div></SceneLabel>}
  </group>;
}
export function DeskAccessories() {
  return <><Mug /><PenHolder /><Calculator /><Notes /><Headphones /></>;
}

// ── Plants ──────────────────────────────────────────────────────────────────────────────────
const LEAF_GREENS = ['#4d7d43', '#5f8f52', '#3f6b3a', '#6f9a5c'];
const leaf = (i: number) => LEAF_GREENS[((i % 4) + 4) % 4]!;
/** Trailing vine: a chain of small leaves that sways in the breeze. */
function Vine({ origin, length, phase, reduced, droop = 1 }: { origin: Vec; length: number; phase: number; reduced: boolean; droop?: number }) {
  const g = useRef<Group>(null); const n = Math.round(length / 0.07);
  useFrame(({ clock }) => { if (g.current && !reduced) { const b = breeze(clock.elapsedTime, phase); g.current.rotation.z = b * 0.05; g.current.rotation.x = b * 0.035; } });
  return <group ref={g} position={origin}>
    {Array.from({ length: n }, (_, i) => <mesh key={i} position={[Math.sin(i * 0.9 + phase) * 0.02, -i * 0.07 * droop, Math.cos(i * 0.7) * 0.015]} rotation={[0.4, i * 1.3 + phase, 0.6]} scale={[1, 0.55, 1.5]}>
      <sphereGeometry args={[0.028 + (i % 3) * 0.004, 8, 6]} /><meshStandardMaterial color={leaf(i + Math.round(phase * 3))} roughness={0.8} />
    </mesh>)}
  </group>;
}
function HangingPlant({ reduced }: { reduced: boolean }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => { if (g.current && !reduced) g.current.rotation.z = breeze(clock.elapsedTime, 0.4) * 0.025; });
  return <group position={[-4.0, 3.45, -1.15]}>
    <mesh position={[-0.12, 0, 0]}><boxGeometry args={[0.2, 0.02, 0.03]} /><meshStandardMaterial color="#6b4f37" /></mesh>
    <group ref={g}>
      {[[-0.06, -0.04], [0.06, -0.04], [0, 0.06]].map(([x, z], i) => <mesh key={i} position={[x! * 0.5, -0.22, z! * 0.5]} rotation={[z! * 1.6, 0, -x! * 1.6]}><cylinderGeometry args={[0.003, 0.003, 0.44, 4]} /><meshStandardMaterial color="#8a7a5c" /></mesh>)}
      <mesh position={[0, -0.47, 0]} castShadow><sphereGeometry args={[0.12, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#d8c3a0" roughness={0.8} side={2} /></mesh>
      {Array.from({ length: 6 }, (_, i) => <Vine key={i} origin={[Math.cos(i) * 0.09, -0.44, Math.sin(i) * 0.09]} length={0.35 + (i % 3) * 0.18} phase={i * 0.9} reduced={reduced} />)}
    </group>
  </group>;
}
function ShelfVines({ reduced }: { reduced: boolean }) {
  return <group position={[2.85, 2.6, -2.42]}>
    <mesh position={[0, 0.07, 0]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.14, 20]} /><meshStandardMaterial color="#b9785f" roughness={0.8} /></mesh>
    {Array.from({ length: 5 }, (_, i) => <Vine key={i} origin={[-0.05 + i * 0.03, 0.13, 0.08]} length={0.45 + (i % 3) * 0.25} phase={i * 1.4 + 2} reduced={reduced} />)}
  </group>;
}
function FloorPlant({ reduced }: { reduced: boolean }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => { if (g.current && !reduced) g.current.children.forEach((c, i) => { c.rotation.z = (c.userData['tilt'] as number) + breeze(clock.elapsedTime, i) * 0.015; }); });
  const leaves = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ angle: (i / 9) * Math.PI * 2 + i * 0.3, height: 0.55 + (i % 4) * 0.12, tilt: 0.35 + (i % 3) * 0.12 })), []);
  return <group position={[-3.8, 0, 2.85]}>
    <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.2, 0.15, 0.34, 24]} /><meshStandardMaterial color="#e9dcc0" roughness={0.8} /></mesh>
    <group ref={g} position={[0, 0.32, 0]}>
      {leaves.map((l, i) => <group key={i} rotation={[0, l.angle, l.tilt]} userData={{ tilt: l.tilt }}>
        <mesh position={[0, l.height / 2, 0]}><cylinderGeometry args={[0.008, 0.01, l.height, 5]} /><meshStandardMaterial color="#5f7f4c" /></mesh>
        <mesh position={[0.05, l.height, 0]} rotation={[0, 0, -0.9]} scale={[1, 0.12, 0.7]} castShadow><sphereGeometry args={[0.15, 14, 8]} /><meshStandardMaterial color={leaf(i)} roughness={0.75} /></mesh>
      </group>)}
    </group>
  </group>;
}
export function Plants({ reduced }: { reduced: boolean }) {
  return <><HangingPlant reduced={reduced} /><ShelfVines reduced={reduced} /><FloorPlant reduced={reduced} /></>;
}

// ── Drawers ─────────────────────────────────────────────────────────────────────────────────
/** Small cards inside an open drawer: one per object in drawers.ts, or a folded note if empty. */
function DrawerContents({ drawer }: { drawer: string }) {
  const items = drawerObjects.filter(o => o.drawer === drawer).slice(0, 3);
  if (!items.length) return <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0.3]}><planeGeometry args={[0.13, 0.09]} /><meshStandardMaterial color="#f3ecd9" roughness={0.95} /></mesh>;
  return <>{items.map((o, i) => <DrawerCard key={o.id} image={existingImage(o.image)} index={i} />)}</>;
}
function DrawerCard({ image, index }: { image: string | null; index: number }) {
  const tex = useSafeTexture(image);
  return <mesh position={[-0.08 + index * 0.08, 0.012 + index * 0.002, 0]} rotation={[-Math.PI / 2, 0, (index - 1) * 0.25]}><planeGeometry args={[0.1, 0.08]} /><meshStandardMaterial map={tex} color={tex ? '#ffffff' : '#f3ecd9'} roughness={0.9} /></mesh>;
}

/** A two-drawer keepsake cabinet against the left wall, near the window. */
export function MemoryCabinet({ openDrawer, onDrawer, reduced }: { openDrawer: string | null; onDrawer: (id: string | null) => void; reduced: boolean }) {
  const ids = ['cabinet-top', 'cabinet-bottom'];
  const refs = useRef<(Group | null)[]>([]); const [hover, setHover] = useState<string | null>(null);
  useFrame((_, dt) => refs.current.forEach((g, i) => { if (g) { const target = openDrawer === ids[i] ? 0.3 : 0; g.position.x += (target - g.position.x) * (reduced ? 1 : ease(dt, 7)); } }));
  const W = 0.62, D = 0.46, H = 0.76;
  return <group position={[-3.98, 0, -1.35]}>
    <mesh position={[0, H / 2, 0]} castShadow receiveShadow><boxGeometry args={[D, H, W]} /><meshStandardMaterial color="#9a6b45" roughness={0.6} /></mesh>
    <mesh position={[0, H + 0.015, 0]} castShadow><boxGeometry args={[D + 0.04, 0.03, W + 0.04]} /><meshStandardMaterial color="#8a5d3b" roughness={0.55} /></mesh>
    {ids.map((id, i) => <group key={id} position={[D / 2 - 0.2, H - 0.2 - i * 0.32, 0]}>
      <group ref={el => { refs.current[i] = el; }}
        onClick={e => { e.stopPropagation(); onDrawer(openDrawer === id ? null : id); }}
        onPointerOver={e => { e.stopPropagation(); setHover(id); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto'; }}>
        <mesh position={[0.2, 0, 0]} castShadow><boxGeometry args={[0.025, 0.26, W - 0.06]} /><meshStandardMaterial color={hover === id ? '#c49a6c' : '#b58457'} roughness={0.55} /></mesh>
        <mesh position={[0.225, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 0.03, 12]} /><meshStandardMaterial color="#b88a4a" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[0, -0.11, 0]}><boxGeometry args={[0.4, 0.015, W - 0.1]} /><meshStandardMaterial color="#e4d3b0" /></mesh>
        {[-1, 1].map(s => <mesh key={s} position={[0, -0.06, s * (W - 0.1) / 2]}><boxGeometry args={[0.4, 0.1, 0.012]} /><meshStandardMaterial color="#c9a77c" /></mesh>)}
        <group position={[0, -0.1, 0]}><DrawerContents drawer={id} /></group>
        {hover === id && <SceneLabel position={[0.3, 0.25, 0]}><div className="tooltip-label">{openDrawer === id ? 'Close the drawer' : 'Open the drawer'}</div></SceneLabel>}
      </group>
    </group>)}
  </group>;
}

/** The desk model with its own drawer able to slide open. Clicking the drawer opens it; clicking the desk opens "skills". */
export function DeskWithDrawer({ url, position, height, openDrawer, onDrawer, onSelect, reduced }: { url: string; position: Vec; height: number; openDrawer: string | null; onDrawer: (id: string | null) => void; onSelect: (id: Section) => void; reduced: boolean }) {
  const { scene } = useGLTF(withBase(url));
  const { model, drawer, rest } = useMemo(() => {
    const c = scene.clone(true); const b = new Box3().setFromObject(c); const size = b.getSize(new Vector3()); const centre = b.getCenter(new Vector3()); const k = height / size.y;
    c.position.set(-centre.x * k, -b.min.y * k, -centre.z * k); c.scale.setScalar(k);
    c.traverse(o => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    const d = c.getObjectByName('drawer') ?? null;
    // A folded note sits inside the drawer (drawer's own units; the drawer is 0.2 wide and 0.18 deep).
    if (d) { const note = new Mesh(new PlaneGeometry(0.1, 0.07), new MeshStandardMaterial({ color: '#f3ecd9', roughness: 0.95 })); note.position.set(0.1, 0.051, 0.09); note.rotation.set(-Math.PI / 2, 0, 0.2); d.add(note); }
    return { model: c, drawer: d, rest: d ? d.position.z : 0 };
  }, [scene, height]);
  const open = openDrawer === 'desk';
  useFrame((_, dt) => { if (drawer) drawer.position.z += ((open ? rest + 0.16 : rest) - drawer.position.z) * (reduced ? 1 : ease(dt, 7)); });
  const inDrawer = (o: Object3D | null) => { for (let x = o; x; x = x.parent) if (x === drawer) return true; return false; };
  const [hover, setHover] = useState<'desk' | 'drawer' | null>(null);
  return <group position={position}
    onClick={e => { e.stopPropagation(); if (inDrawer(e.object)) onDrawer(open ? null : 'desk'); else onSelect('skills'); }}
    onPointerMove={e => { e.stopPropagation(); const h = inDrawer(e.object) ? 'drawer' : 'desk'; if (h !== hover) setHover(h); document.body.style.cursor = 'pointer'; }}
    onPointerOut={() => { setHover(null); document.body.style.cursor = 'auto'; }}>
    <primitive object={model} />
    {hover && <SceneLabel position={[0, height + 0.15, 0.5]}><div className="tooltip-label">{hover === 'drawer' ? (open ? 'Close the drawer' : 'Open the desk drawer') : 'My technical toolbox'}</div></SceneLabel>}
  </group>;
}
