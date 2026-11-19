import { describe, it, expect, beforeEach } from 'vitest';
import { __sensors, motion, shakeQueue } from '@/lib/motion';

const settle = (beta: number, gamma: number, n = 60) => { for (let i = 0; i < n; i++) __sensors.orientation(beta, gamma); };

describe('phone tilt and shake', () => {
  beforeEach(() => __sensors.reset());
  it('uses the first reading as level, and tilting right pushes the ball right', () => {
    __sensors.orientation(40, 0);   // how the phone is being held
    settle(40, 25);                 // tilt right by 25°
    const t = motion.get(); expect(t.tiltX).toBeGreaterThan(0.6); expect(Math.abs(t.tiltY)).toBeLessThan(0.05);
  });
  it('ignores small wobbles inside the dead zone', () => {
    __sensors.orientation(40, 0); settle(42, 2);
    const t = motion.get(); expect(Math.abs(t.tiltX)).toBeLessThan(0.01); expect(Math.abs(t.tiltY)).toBeLessThan(0.01);
  });
  it('caps strong tilts and smooths sudden changes', () => {
    __sensors.orientation(40, 0); __sensors.orientation(40, 80);
    expect(motion.get().tiltX).toBeLessThan(0.2);          // one reading only moves it a little (smoothing)
    settle(40, 80); expect(motion.get().tiltX).toBeLessThanOrEqual(1);
  });
  it('turns a strong jolt into one impulse, ignores gentle movement, and limits repeats', () => {
    __sensors.motion(2, 1); expect(shakeQueue.length).toBe(0);
    __sensors.motion(20, 5); expect(shakeQueue.length).toBe(1);
    expect(shakeQueue[0]!.strength).toBeGreaterThan(0); expect(shakeQueue[0]!.strength).toBeLessThanOrEqual(1);
    __sensors.motion(25, 0); expect(shakeQueue.length).toBe(1); // within the cool-down
  });
});
