import { describe, it, expect } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { BALL_RADIUS, ROOM, SPAWN, roomGravity, stepBall } from '@/lib/ball-physics';
import { MAX_TILT, roomTilt, tiltTarget } from '@/lib/room-tilt';

const ball = () => ({ p: SPAWN.clone(), v: new Vector3(), q: new Quaternion() });
const roll = (tiltX: number, tiltZ: number, steps = 120) => {
  const b = ball();
  const g = roomGravity(9.81, tiltX, tiltZ);
  for (let i = 0; i < steps; i++) stepBall(b, 1 / 120, g, []);
  return { b, g };
};

describe('room tilt and the gravity it creates', () => {
  it('leaves gravity straight down while the room is level', () => {
    const g = roomGravity(9.81, 0, 0);
    expect(g.x).toBeCloseTo(0, 6);
    expect(g.z).toBeCloseTo(0, 6);
    expect(g.y).toBeCloseTo(-9.81, 6);
  });

  it('tips gravity without changing how hard it pulls', () => {
    expect(roomGravity(9.81, MAX_TILT, -MAX_TILT).length()).toBeCloseTo(9.81, 6);
  });

  it('rolls the ball toward the side the room tipped down', () => {
    const { b, g } = roll(0, -MAX_TILT);
    expect(g.x).toBeGreaterThan(0);
    expect(b.p.x).toBeGreaterThan(SPAWN.x + 0.2);
  });

  it('rolls the ball toward the visitor when the near side tips down', () => {
    const { b, g } = roll(MAX_TILT, 0);
    expect(g.z).toBeGreaterThan(0);
    expect(b.p.z).toBeGreaterThan(SPAWN.z + 0.2);
  });

  it('keeps the ball inside the room while it rolls under a tilt', () => {
    const b = ball();
    const g = roomGravity(9.81, MAX_TILT, -MAX_TILT);
    for (let i = 0; i < 600; i++) stepBall(b, 1 / 60, g);
    expect(b.p.x).toBeGreaterThanOrEqual(ROOM.minX + BALL_RADIUS - 1e-6);
    expect(b.p.x).toBeLessThanOrEqual(ROOM.maxX - BALL_RADIUS + 1e-6);
    expect(b.p.z).toBeGreaterThanOrEqual(ROOM.minZ + BALL_RADIUS - 1e-6);
    expect(b.p.z).toBeLessThanOrEqual(ROOM.maxZ - BALL_RADIUS + 1e-6);
    expect(b.p.y).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(b.p.x) && Number.isFinite(b.p.z) && Number.isFinite(b.p.y)).toBe(true);
  });

  it('clamps a long drag to the maximum tilt and levels the room on exit', () => {
    roomTilt.enable();
    tiltTarget.x = 0; tiltTarget.z = 0;
    for (let i = 0; i < 400; i++) roomTilt.drag(60, 60);
    expect(tiltTarget.z).toBeCloseTo(-MAX_TILT, 6);
    expect(tiltTarget.x).toBeCloseTo(MAX_TILT, 6);
    roomTilt.disable();
    expect(tiltTarget.x).toBe(0);
    expect(tiltTarget.z).toBe(0);
    expect(roomTilt.isOn()).toBe(false);
  });

  it('ignores drags while tilt mode is off', () => {
    roomTilt.disable();
    tiltTarget.x = 0; tiltTarget.z = 0;
    roomTilt.drag(500, 500);
    expect(tiltTarget.x).toBe(0);
    expect(tiltTarget.z).toBe(0);
  });
});
