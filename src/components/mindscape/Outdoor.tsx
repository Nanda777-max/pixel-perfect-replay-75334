// The world outside the window: a real 3D Kerala coast rendered through a portal, so it is only
// visible through the glass and never spills around the open dollhouse room.
// Coordinates are relative to the window centre: y=0 is mid-window, the room floor is y=-2.1,
// and negative z runs out to sea.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshPortalMaterial } from '@react-three/drei';
import { BackSide, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Group, ShaderMaterial, Vector3, type LineSegments } from 'three';

const FLOOR = -2.1;
const SEA = FLOOR - 1.6;

function Sky({ evening }: { evening: boolean }) {
  const uniforms = useMemo(() => ({ top: { value: new Color() }, horizon: { value: new Color() } }), []);
  const material = useMemo(() => new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main(){ float h = clamp(vDir.y*1.6+0.08,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.7)),1.0); }',
  }), [uniforms]);
  uniforms.top.value.set(evening ? '#5f6f86' : '#9fb7c4');
  uniforms.horizon.value.set(evening ? '#e7b48f' : '#e9e6d8');
  return <mesh material={material} renderOrder={-1}><sphereGeometry args={[90, 32, 16]} /></mesh>;
}

const waterVertex = `
uniform float time; varying vec3 vWorld; varying float vWave;
float wave(vec2 p){ return sin(p.x*0.35+time*0.9)*0.16 + sin(p.y*0.55-time*1.3)*0.1 + sin((p.x+p.y)*1.4+time*1.9)*0.035; }
void main(){ vec3 p = position; p.z += wave(p.xy); vWave = p.z; vec4 w = modelMatrix * vec4(p,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const waterFragment = `
uniform vec3 deep; uniform vec3 shallow; uniform vec3 sky; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
varying vec3 vWorld; varying float vWave;
void main(){
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 v = normalize(cameraPosition - vWorld);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 col = mix(shallow, deep, smoothstep(-0.2, 0.2, vWave)); col += vec3(0.9) * smoothstep(0.2, 0.3, vWave) * 0.35;
  col = mix(col, sky, 0.08 + fresnel * 0.45);
  vec3 sun = normalize(vec3(-0.4, 0.5, -1.0));
  col += pow(max(dot(reflect(-v, n), sun), 0.0), 60.0) * 0.5;
  float d = length(cameraPosition - vWorld);
  gl_FragColor = vec4(mix(col, fogColor, smoothstep(fogNear, fogFar, d)), 1.0);
}`;

function Water({ evening, reduced }: { evening: boolean; reduced: boolean }) {
  const uniforms = useMemo(() => ({ time: { value: 0 }, deep: { value: new Color() }, shallow: { value: new Color() }, sky: { value: new Color() }, fogColor: { value: new Color() }, fogNear: { value: 28 }, fogFar: { value: 110 } }), []);
  const material = useMemo(() => new ShaderMaterial({ vertexShader: waterVertex, fragmentShader: waterFragment, uniforms }), [uniforms]);
  uniforms.deep.value.set(evening ? '#24434d' : '#1f5a63');
  uniforms.shallow.value.set(evening ? '#3f6d6c' : '#3f8a85');
  uniforms.sky.value.set(evening ? '#c9a58f' : '#c9d6d6');
  uniforms.fogColor.value.set(evening ? '#d9b49a' : '#dfe3da');
  useFrame((_, dt) => { if (!reduced) uniforms.time.value += Math.min(dt, 0.05); });
  return <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA, -45]}><planeGeometry args={[160, 80, 120, 60]} /></mesh>;
}

/** A coconut palm: curved trunk plus drooping fronds that sway on their own rhythm. */
function Palm({ at, height, lean, phase, reduced }: { at: [number, number, number]; height: number; lean: number; phase: number; reduced: boolean }) {
  const crown = useRef<Group>(null);
  const trunk = useMemo(() => new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(lean * 0.3, height * 0.4, 0), new Vector3(lean * 0.8, height * 0.75, 0), new Vector3(lean, height, 0)]), [height, lean]);
  const frond = useMemo(() => {
    // A tapered leaf strip that arches up then droops: 12 segments along its length.
    const g = new BufferGeometry(); const pos: number[] = []; const idx: number[] = []; const L = height * 0.42;
    for (let i = 0; i <= 12; i++) { const t = i / 12; const w = Math.sin(Math.PI * Math.min(t * 1.15, 1)) * 0.22 * height * 0.12 + 0.01; const x = t * L; const y = Math.sin(t * Math.PI * 0.8) * L * 0.25 - t * t * L * 0.55; pos.push(x, y, -w, x, y - w * 0.3, w); if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); }
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }, [height]);
  useFrame(({ clock }) => {
    if (!crown.current || reduced) return;
    const t = clock.elapsedTime + phase;
    crown.current.rotation.z = Math.sin(t * 0.9) * 0.06; crown.current.rotation.x = Math.sin(t * 0.6) * 0.04;
    crown.current.children.forEach((leaf, i) => { leaf.rotation.z = Math.sin(t * 1.7 + i) * 0.06; });
  });
  const top = trunk.getPoint(1);
  return <group position={at}>
    <mesh><tubeGeometry args={[trunk, 16, 0.07 * height * 0.25 + 0.05, 6, false]} /><meshStandardMaterial color="#7a6148" roughness={1} /></mesh>
    <group ref={crown} position={top}>
      {Array.from({ length: 9 }, (_, i) => <group key={i} rotation={[0, (i / 9) * Math.PI * 2, 0]}><mesh geometry={frond}><meshStandardMaterial color={i % 2 ? '#3f6b3a' : '#4d7d43'} side={DoubleSide} roughness={0.9} /></mesh></group>)}
      <mesh position={[0, -0.08, 0]}><sphereGeometry args={[0.13, 8, 6]} /><meshStandardMaterial color="#5a4630" /></mesh>
    </group>
  </group>;
}

/** Rain as one line-segment buffer: cheap enough to keep falling at all times. */
function Rain({ reduced }: { reduced: boolean }) {
  const ref = useRef<LineSegments>(null);
  const count = 260;
  const geometry = useMemo(() => {
    const g = new BufferGeometry(); const p = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) { const x = -6 + Math.random() * 12, y = FLOOR - 1 + Math.random() * 6, z = -0.6 - Math.random() * 9; p.set([x, y, z, x + 0.025, y - 0.22, z], i * 6); }
    g.setAttribute('position', new BufferAttribute(p, 3)); return g;
  }, []);
  useFrame((_, dt) => {
    if (reduced || !ref.current) return;
    const p = geometry.getAttribute('position') as BufferAttribute; const a = p.array as Float32Array; const step = Math.min(dt, 0.05) * 5;
    for (let i = 0; i < count; i++) { const o = i * 6; a[o + 1]! -= step; a[o + 4]! -= step; if (a[o + 4]! < FLOOR - 1.2) { a[o + 1]! += 6; a[o + 4]! += 6; } }
    p.needsUpdate = true;
  });
  return <lineSegments ref={ref} geometry={geometry}><lineBasicMaterial color="#ffffff" transparent opacity={0.35} /></lineSegments>;
}

function Coast({ reduced }: { reduced: boolean }) {
  // Palms line a narrow beach just below the balcony; open water fills the rest of the view.
  const palms = [
    { at: [-4.2, SEA + 0.1, -8.2], height: 4.8, lean: -1.1, phase: 0 },
    { at: [2.6, SEA + 0.1, -9], height: 5.3, lean: 1.1, phase: 1.3 },
    { at: [4.6, SEA + 0.1, -6.4], height: 4.1, lean: 0.6, phase: 2.4 },
    { at: [-7.4, SEA + 0.1, -7.2], height: 5, lean: -0.6, phase: 3.1 },
    { at: [-22, SEA + 1.2, -34], height: 5.5, lean: 0.3, phase: 0.7 },
    { at: [-26, SEA + 1.2, -37], height: 4.8, lean: -0.5, phase: 1.9 },
  ] as const;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, SEA + 0.08, -7]}><planeGeometry args={[30, 5.5]} /><meshStandardMaterial color="#d9c49b" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, SEA + 0.1, -3.5]}><planeGeometry args={[30, 1.6]} /><meshStandardMaterial color="#6f8f57" roughness={1} /></mesh>
    {/* Distant coastline: a green headland on the left, hazy hills along the horizon. */}
    {([[-30, -36, 11, 3.2, '#56724a'], [-14, -62, 14, 3.4, '#6a8566'], [16, -74, 18, 2.8, '#7b917c'], [38, -64, 12, 2.2, '#7f9580']] as const).map(([x, z, r, h, c], i) => <mesh key={i} position={[x, SEA, z]} scale={[1, h / r, 0.6]}><sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c} roughness={1} /></mesh>)}
    {palms.map((p, i) => <Palm key={i} at={p.at as unknown as [number, number, number]} height={p.height} lean={p.lean} phase={p.phase} reduced={reduced} />)}
  </group>;
}

/** A small balcony just outside the window: slab, posts and rail. */
function Balcony() {
  const wood = '#8a6a4c';
  return <group position={[0, FLOOR, -1.6]}>
    <mesh position={[0, -0.08, 0]}><boxGeometry args={[4.2, 0.16, 2.8]} /><meshStandardMaterial color="#c9b79a" roughness={0.95} /></mesh>
    <mesh position={[0, 1.02, -1.3]}><boxGeometry args={[4.2, 0.07, 0.09]} /><meshStandardMaterial color={wood} /></mesh>
    {Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[-2 + i * (4 / 14), 0.5, -1.3]}><boxGeometry args={[0.05, 1, 0.05]} /><meshStandardMaterial color={wood} /></mesh>)}
  </group>;
}

export function OutdoorWindow({ evening, reduced, position, size }: { evening: boolean; reduced: boolean; position: [number, number, number]; size: [number, number] }) {
  const fog = evening ? '#d9b49a' : '#dfe3da';
  return <mesh position={position} raycast={() => null}>
    <planeGeometry args={size} />
    <MeshPortalMaterial resolution={256} blur={0}>
      <fog attach="fog" args={[fog, 28, 110]} />
      <hemisphereLight args={[evening ? '#f2c9a5' : '#e8eef0', '#4a5e3e', evening ? 1.2 : 1.8]} />
      <directionalLight position={[-6, 10, -4]} intensity={evening ? 0.8 : 1.6} color={evening ? '#ffc58f' : '#fff6e6'} />
      <Sky evening={evening} />
      <Water evening={evening} reduced={reduced} />
      <Coast reduced={reduced} />
      <Balcony />
      <Rain reduced={reduced} />
    </MeshPortalMaterial>
  </mesh>;
}
