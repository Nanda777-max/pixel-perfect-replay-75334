// Linen curtains on a rod. Lightweight procedural cloth: pleats, a gentle breeze, and a damped
// spring that the cursor pushes when it moves across or near a panel.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, DoubleSide, Mesh, Plane, PlaneGeometry, Vector3 } from 'three';

interface Panel { x: number; width: number; push: { x: number; z: number; vx: number; vz: number; cx: number; cy: number } }

const SEG_X = 18, SEG_Y = 28;

function CurtainPanel({ panel, top, height, z, reduced }: { panel: Panel; top: number; height: number; z: number; reduced: boolean }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => new PlaneGeometry(panel.width, height, SEG_X, SEG_Y), [panel.width, height]);
  const rest = useMemo(() => Float32Array.from(geometry.getAttribute('position').array), [geometry]);
  const settled = useRef(false);
  useFrame(({ clock }) => {
    const p = panel.push;
    const moving = Math.abs(p.x) + Math.abs(p.z) + Math.abs(p.vx) + Math.abs(p.vz) > 1e-4;
    if (reduced && settled.current && !moving) return;
    const t = reduced ? 0 : clock.elapsedTime;
    const pos = geometry.getAttribute('position') as BufferAttribute; const a = pos.array as Float32Array;
    for (let i = 0; i < a.length; i += 3) {
      const x = rest[i]!, y = rest[i + 1]!;
      const down = (height / 2 - y) / height;          // 0 at the rod, 1 at the hem
      const hang = down * down;
      const pleat = Math.sin((x / panel.width + 0.5) * Math.PI * 7) * 0.035 * (0.7 + down * 0.5);
      const breeze = reduced ? 0 : Math.sin(t * 1.1 + x * 4 + down * 2.2) * 0.03 * hang + Math.sin(t * 0.47 + panel.x) * 0.035 * hang;
      const dx = panel.x + x - p.cx, dy = top - height / 2 + y - p.cy;
      const touch = Math.exp(-(dx * dx + dy * dy) / 0.35) * down;
      a[i] = x + p.x * touch;
      a[i + 2] = pleat + breeze + p.z * touch;
    }
    pos.needsUpdate = true; geometry.computeVertexNormals();
    settled.current = true;
  });
  return <mesh ref={mesh} geometry={geometry} position={[panel.x, top - height / 2, z]} castShadow raycast={() => null}>
    <meshStandardMaterial color="#f3ead6" roughness={0.95} side={DoubleSide} transparent opacity={0.94} />
  </mesh>;
}

export function Curtains({ left, right, top, bottom, z, reduced }: { left: number; right: number; top: number; bottom: number; z: number; reduced: boolean }) {
  const height = top - bottom; const width = 0.62;
  const panels = useMemo<Panel[]>(() => [left + width / 2 - 0.06, right - width / 2 + 0.06].map(x => ({ x, width, push: { x: 0, z: 0, vx: 0, vz: 0, cx: x, cy: top - height / 2 } })), [left, right, top, height]);
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), -z), [z]);
  const hit = useMemo(() => new Vector3(), []);
  const last = useRef<Vector3 | null>(null);
  useFrame(({ raycaster, pointer, camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    raycaster.setFromCamera(pointer, camera);
    const point = raycaster.ray.intersectPlane(plane, hit);
    const prev = last.current;
    for (const panel of panels) {
      const p = panel.push;
      if (point && prev) {
        const near = Math.abs(point.x - panel.x) < width / 2 + 0.35 && point.y < top && point.y > bottom - 0.2;
        const vx = (point.x - prev.x) / Math.max(dt, 1e-3);
        if (near && Math.abs(vx) > 0.05) {
          // Cursor sweeps nudge the cloth sideways and slightly outward, capped to stay subtle.
          p.cx = point.x; p.cy = point.y;
          p.vx += Math.max(-1.2, Math.min(1.2, vx)) * 0.05; p.vz += Math.min(Math.abs(vx), 1.2) * 0.03;
        }
      }
      // Damped spring back to rest.
      p.vx += (-14 * p.x - 3.2 * p.vx) * dt; p.vz += (-14 * p.z - 3.2 * p.vz) * dt;
      p.x = Math.max(-0.18, Math.min(0.18, p.x + p.vx * dt)); p.z = Math.max(-0.12, Math.min(0.12, p.z + p.vz * dt));
    }
    last.current = point ? (last.current ?? new Vector3()).copy(point) : null;
  });
  return <group>
    <mesh position={[(left + right) / 2, top + 0.04, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.022, 0.022, right - left + 0.35, 12]} /><meshStandardMaterial color="#6b4f37" roughness={0.6} /></mesh>
    {[left - 0.17, right + 0.17].map(x => <mesh key={x} position={[x, top + 0.04, z]}><sphereGeometry args={[0.04, 12, 8]} /><meshStandardMaterial color="#6b4f37" roughness={0.6} /></mesh>)}
    {panels.map((panel, i) => <CurtainPanel key={i} panel={panel} top={top} height={height} z={z} reduced={reduced} />)}
  </group>;
}
