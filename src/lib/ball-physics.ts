// A small, dependency-free physics step for one ball in the room: gravity (which can be tilted),
// bouncing with energy loss, wall and furniture collisions, rolling friction and rolling spin.
import { Quaternion, Vector3 } from 'three';

export const BALL_RADIUS = 0.17;
export const GRAVITY = 9.81;
const RESTITUTION_FLOOR = 0.55, RESTITUTION_WALL = 0.62, RESTITUTION_OBJECT = 0.45;
const ROLLING_FRICTION = 0.85; // per second, while touching the floor

export interface Box { min: Vector3; max: Vector3 }
const box = (cx: number, cz: number, hx: number, hz: number, top: number, bottom = 0): Box => ({ min: new Vector3(cx - hx, bottom, cz - hz), max: new Vector3(cx + hx, top, cz + hz) });

/** Solid things the ball bounces off: approximate boxes around the furniture (room units). */
export const COLLIDERS: Box[] = [
  ...[-2.88, -0.42].flatMap(x => [-2.96, -1.74].map(z => box(x, z, 0.07, 0.07, 1.38))), // desk legs
  box(-1.65, -2.35, 1.32, 0.7, 1.4, 1.16),  // desk top and drawer
  box(-1.55, -0.9, 0.45, 0.45, 1.4),       // desk chair
  box(3.2, -2.5, 0.6, 0.38, 2.6),          // bookshelf
  box(1.7, 1.35, 0.72, 0.78, 1.0),         // lounge chair
  box(3.15, 0.45, 0.56, 0.24, 0.84),       // side table and turntable
  box(2.5, 2.3, 0.33, 0.33, 0.95),         // globe table
  box(-3.65, -2.5, 0.27, 0.27, 1.4), box(3.6, 2.6, 0.27, 0.27, 1.45), box(-3.8, 2.85, 0.28, 0.28, 1.2), // plants
  box(-3.45, 0.55, 0.42, 0.3, 2),          // easel
  box(-3.98, -1.35, 0.24, 0.32, 0.78),     // memory cabinet
];
/** Inner faces of the walls; the open front edges of the room act as invisible walls. */
export const ROOM = { minX: -4.22, maxX: 4.2, minZ: -3.42, maxZ: 3.4, top: 3.7 };
const RUG = { minX: -1.75, maxX: 1.75, minZ: -0.52, maxZ: 1.92, h: 0.058 };
export const floorAt = (x: number, z: number) => (x > RUG.minX && x < RUG.maxX && z > RUG.minZ && z < RUG.maxZ ? RUG.h : 0);
export const SPAWN = new Vector3(0.35, RUG.h + BALL_RADIUS, 0.95);

export interface BallState { p: Vector3; v: Vector3; q: Quaternion }
const c = new Vector3(), d = new Vector3(), axis = new Vector3(), dq = new Quaternion();

/** Advances the ball by dt seconds under `gravity`. Returns true if it is touching the floor or a surface below it. */
export function stepBall(b: BallState, dt: number, gravity: Vector3, colliders = COLLIDERS): boolean {
  const R = BALL_RADIUS; const { p, v } = b;
  v.addScaledVector(gravity, dt); p.addScaledVector(v, dt);
  let grounded = false;
  const floor = floorAt(p.x, p.z) + R;
  if (p.y <= floor + 1e-4) { p.y = floor; if (v.y < 0) { v.y = -v.y * RESTITUTION_FLOOR; if (v.y < 0.45) v.y = 0; } grounded = true; }
  const wall = (ax: 'x' | 'z', lo: number, hi: number) => {
    if (p[ax] < lo + R) { p[ax] = lo + R; if (v[ax] < 0) v[ax] *= -RESTITUTION_WALL; }
    if (p[ax] > hi - R) { p[ax] = hi - R; if (v[ax] > 0) v[ax] *= -RESTITUTION_WALL; }
  };
  wall('x', ROOM.minX, ROOM.maxX); wall('z', ROOM.minZ, ROOM.maxZ);
  if (p.y > ROOM.top - R) { p.y = ROOM.top - R; if (v.y > 0) v.y *= -0.5; }
  for (const bx of colliders) {
    c.copy(p).clamp(bx.min, bx.max); d.copy(p).sub(c); const dist = d.length();
    if (dist >= R) continue;
    if (dist < 1e-5) { // centre ended up inside: push out through the nearest face
      const faces = [[p.x - bx.min.x, -1, 'x'], [bx.max.x - p.x, 1, 'x'], [p.z - bx.min.z, -1, 'z'], [bx.max.z - p.z, 1, 'z'], [bx.max.y - p.y, 1, 'y']] as const;
      const [, dir, ax] = faces.reduce((m, f) => (f[0] < m[0] ? f : m));
      d.set(0, 0, 0); d[ax] = dir; p[ax] = dir < 0 ? bx.min[ax] - R : bx.max[ax] + R;
    } else { d.divideScalar(dist); p.addScaledVector(d, R - dist); }
    const vn = v.dot(d);
    if (vn < 0) { v.addScaledVector(d, -(1 + RESTITUTION_OBJECT) * vn); v.multiplyScalar(0.94); }
    if (d.y > 0.7) grounded = true;
  }
  if (grounded) { const k = Math.exp(-ROLLING_FRICTION * dt); v.x *= k; v.z *= k; }
  const sp = Math.hypot(v.x, v.z); // roll: spin about the axis perpendicular to travel
  if (sp > 1e-4) { axis.set(v.z, 0, -v.x).normalize(); dq.setFromAxisAngle(axis, (sp * dt) / R); b.q.premultiply(dq); }
  return grounded;
}

/** True when the ball has effectively stopped and can be left unsimulated. */
export const atRest = (b: BallState, grounded: boolean) => grounded && b.v.lengthSq() < 0.0009;
