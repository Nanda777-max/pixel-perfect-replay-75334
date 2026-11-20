import { describe, it, expect } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { atRest, BALL_RADIUS as R, COLLIDERS, GRAVITY, ROOM, dragBall, floorAt, stepBall, type BallState } from '@/lib/ball-physics';

const down = new Vector3(0, -GRAVITY, 0);
const ball = (p: [number, number, number], v: [number, number, number] = [0, 0, 0]): BallState => ({ p: new Vector3(...p), v: new Vector3(...v), q: new Quaternion() });
/** Runs the simulation like the app does (4 sub-steps per 60 fps frame); returns per-step snapshots. */
function run(b: BallState, seconds: number, gravity = down) {
  const out: { y: number; vy: number; x: number; z: number; grounded: boolean }[] = []; const dt = 1 / 240;
  for (let i = 0; i < seconds / dt; i++) { const g = stepBall(b, dt, gravity); out.push({ y: b.p.y, vy: b.v.y, x: b.p.x, z: b.p.z, grounded: g }); }
  return out;
}

describe('ball physics', () => {
  it('falls, bounces lower each time, and comes to rest on the floor', () => {
    const b = ball([0, 2, 2.5]); const s = run(b, 6);
    const peaks: number[] = []; for (let i = 1; i < s.length - 1; i++) if (s[i - 1]!.vy > 0 && s[i]!.vy <= 0) peaks.push(s[i]!.y);
    expect(peaks.length).toBeGreaterThan(1);
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]!).toBeLessThan(peaks[i - 1]!);
    expect(b.p.y).toBeCloseTo(floorAt(b.p.x, b.p.z) + R, 3);
    expect(atRest(b, true)).toBe(true);
  });
  it('rebounds off the back wall and never passes through it', () => {
    const b = ball([0, R, 2.6], [0, 0, -9]); const s = run(b, 2);
    expect(Math.min(...s.map(x => x.z))).toBeGreaterThanOrEqual(ROOM.minZ + R - 1e-6);
    expect(s.some(x => x.z > -2)).toBe(true);
    expect(s.findIndex(x => x.z < ROOM.minZ + R + 0.01)).toBeGreaterThan(-1);
  });
  it('stays inside the room when thrown hard at the open front edge', () => {
    const b = ball([3, R, 3], [14, 3, 14]); run(b, 3);
    expect(b.p.x).toBeLessThanOrEqual(ROOM.maxX - R + 1e-6); expect(b.p.z).toBeLessThanOrEqual(ROOM.maxZ - R + 1e-6);
  });
  it('bounces off furniture instead of going through it (bookshelf)', () => {
    const shelf = COLLIDERS.find(c => c.max.y === 2.6)!; const b = ball([3.2, R, 0], [0, 0, -8]); const s = run(b, 1.5);
    for (const x of s) expect(x.z > shelf.max.z + R - 0.02 || x.x < shelf.min.x || x.x > shelf.max.x).toBe(true);
  });
  it('rolls with friction and spins in the direction of travel', () => {
    const b = ball([0, R, 2.6], [3, 0, 0]); const q0 = b.q.clone(); run(b, 0.2);
    expect(b.q.angleTo(q0)).toBeGreaterThan(0.5); run(b, 8);
    expect(Math.hypot(b.v.x, b.v.z)).toBeLessThan(0.05);
  });
  it('rolls downhill when gravity is tilted (phone tilt)', () => {
    const b = ball([0, R, 2.6]); const tilted = new Vector3(GRAVITY * 0.5, -GRAVITY, 0); run(b, 0.6, tilted);
    expect(b.p.x).toBeGreaterThan(0.3);
  });
  it('cannot be dragged through furniture: it slides along the bookshelf instead', () => {
    const shelf = COLLIDERS.find(c => c.max.y === 2.6)!; const b = ball([3.2, 0.55, 0]);
    dragBall(b, new Vector3(3.2, 0.55, -3.3));
    expect(b.p.z).toBeGreaterThanOrEqual(shelf.max.z + R - 1e-3);
    for (let i = 0; i < 3; i++) dragBall(b, new Vector3(1.9, 0.55, -3.3)); // pointer keeps moving: once past the shelf it reaches the wall
    expect(b.p.x).toBeLessThan(shelf.min.x); expect(b.p.z).toBeCloseTo(ROOM.minZ + R, 3);
  });
  it('cannot be dragged through a desk leg or out of the room', () => {
    const b = ball([-2.88, 0.55, -1.2]); dragBall(b, new Vector3(-2.88, 0.55, -2.2));
    expect(Math.abs(b.p.z - -1.74)).toBeGreaterThanOrEqual(0.07 + R - 1e-3);
    dragBall(b, new Vector3(-9, 0.55, 9)); expect(b.p.x).toBeGreaterThanOrEqual(ROOM.minX + R - 1e-6); expect(b.p.z).toBeLessThanOrEqual(ROOM.maxZ - R + 1e-6);
  });
});
