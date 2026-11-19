// Phone tilt and shake, for the ball. Nothing is requested until the visitor presses
// "Enable motion controls"; iOS then asks for permission. Readings are smoothed and small
// movements ignored, so ordinary handling of the phone doesn't push the ball around.
import { useSyncExternalStore } from 'react';

type Status = 'off' | 'on' | 'denied' | 'unsupported';
interface State { status: Status; tiltX: number; tiltY: number }
let state: State = { status: 'off', tiltX: 0, tiltY: 0 };
const listeners = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; listeners.forEach(l => l()); };

/** Shake impulses waiting to be applied by the ball: screen-space direction and strength. */
export const shakeQueue: { x: number; y: number; strength: number }[] = [];

let base: { beta: number; gamma: number } | null = null;
let lastShake = -1e9;
const DEAD_ZONE = 3;      // degrees of tilt ignored around the resting angle
const MAX_TILT = 35;      // degrees for full effect
const SHAKE_MIN = 13;     // m/s² of acceleration (without gravity) that counts as a shake

const screenAngle = () => (typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : (window as unknown as { orientation?: number }).orientation ?? 0);

function onOrientation(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return;
  base ??= { beta: e.beta, gamma: e.gamma };
  let x = e.gamma - base.gamma, y = e.beta - base.beta;           // portrait: x = left/right, y = forward/back
  const a = screenAngle();
  if (a === 90) [x, y] = [y, -x]; else if (a === 270 || a === -90) [x, y] = [-y, x]; else if (a === 180) [x, y] = [-x, -y];
  const shape = (v: number) => { const m = Math.max(0, Math.abs(v) - DEAD_ZONE); return Math.sign(v) * Math.min(1, m / (MAX_TILT - DEAD_ZONE)); };
  const k = 0.15; // low-pass filter
  set({ tiltX: state.tiltX + (shape(x) - state.tiltX) * k, tiltY: state.tiltY + (shape(y) - state.tiltY) * k });
}
function onMotion(e: DeviceMotionEvent) {
  const acc = e.acceleration; if (!acc || acc.x == null || acc.y == null) return;
  const mag = Math.hypot(acc.x, acc.y, acc.z ?? 0); const now = performance.now();
  if (mag < SHAKE_MIN || now - lastShake < 450) return;
  lastShake = now;
  const len = Math.hypot(acc.x, acc.y) || 1;
  shakeQueue.push({ x: acc.x / len, y: -acc.y / len, strength: Math.min(1, (mag - SHAKE_MIN) / 20 + 0.25) });
}

export const motionSupported = () => typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches;

export const motion = {
  async enable() {
    if (!motionSupported()) { set({ status: 'unsupported' }); return; }
    try {
      const O = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      const M = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
      if (O.requestPermission && (await O.requestPermission()) !== 'granted') { set({ status: 'denied' }); return; }
      if (M?.requestPermission) await M.requestPermission().catch(() => 'denied');
    } catch { set({ status: 'denied' }); return; }
    base = null;
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('devicemotion', onMotion);
    set({ status: 'on', tiltX: 0, tiltY: 0 });
  },
  disable() {
    window.removeEventListener('deviceorientation', onOrientation);
    window.removeEventListener('devicemotion', onMotion);
    shakeQueue.length = 0;
    set({ status: 'off', tiltX: 0, tiltY: 0 });
  },
  /** Re-centre: the current way the phone is held becomes "level". */
  recalibrate() { base = null; },
  get: () => state,
};

/** For tests: feed sensor readings straight into the handlers. */
export const __sensors = {
  orientation: (beta: number, gamma: number) => onOrientation({ beta, gamma } as DeviceOrientationEvent),
  motion: (x: number, y: number, z = 0) => onMotion({ acceleration: { x, y, z } } as DeviceMotionEvent),
  reset: () => { base = null; lastShake = -1e9; shakeQueue.length = 0; set({ tiltX: 0, tiltY: 0 }); },
};

export const useMotion = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => state);
