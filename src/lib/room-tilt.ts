// Room tilt: a deliberate, visitor-driven tipping of the whole room, kept separate from camera
// orbit. The target is mutated while dragging (never a React render per pointer move); the scene
// writes the rotation it actually applied each frame, so the ball's gravity always matches what
// is drawn rather than what was asked for.
import { useSyncExternalStore } from 'react';

/** ~12.6° — enough to make the ball roll across the floor, not enough to topple the room. */
export const MAX_TILT = 0.22;
/** Radians of tilt gained per pixel dragged. */
const SENSITIVITY = 0.0018;

export interface TiltAxes { x: number; z: number }
/** Where the visitor wants the room tipped. Mutated in place: no React render while dragging. */
export const tiltTarget: TiltAxes = { x: 0, z: 0 };
/** Where the room actually is, written by the scene every frame before the ball is stepped. */
export const tiltApplied: TiltAxes = { x: 0, z: 0 };
/** True while the ball itself is being dragged, so that drag never doubles as a room tilt. */
export const tiltHold = { active: false };

let on = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const clamp = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v));

export const roomTilt = {
  isOn: () => on,
  toggle() { on = !on; if (!on) roomTilt.reset(); emit(); },
  enable() { if (!on) { on = true; emit(); } },
  disable() { if (on) { on = false; roomTilt.reset(); emit(); } },
  /** Drag the room along its own axes: +x tips its +x side down, +z tips its near (+z) side down. */
  drag(dx: number, dy: number) { roomTilt.tip(dx, dy); },
  /**
   * Tip the room so the side lying in floor direction (wx, wz) goes down, by that many pixels' worth.
   * The scene converts a screen drag into this direction using the camera's heading, so "drag right"
   * always lowers whichever side of the room looks like the right-hand side.
   */
  tip(wx: number, wz: number) {
    if (!on) return;
    tiltTarget.z = clamp(tiltTarget.z - wx * SENSITIVITY);
    tiltTarget.x = clamp(tiltTarget.x + wz * SENSITIVITY);
  },
  /** Restore the room's original orientation. */
  reset() { tiltTarget.x = 0; tiltTarget.z = 0; },
  level: () => tiltTarget.x === 0 && tiltTarget.z === 0,
  get: () => ({ on, x: tiltTarget.x, z: tiltTarget.z }),
};

/** Only the on/off switch is reactive; the tilt angles themselves never re-render the scene. */
export const useRoomTilt = () => useSyncExternalStore(
  l => { listeners.add(l); return () => { listeners.delete(l); }; },
  () => on,
  () => on,
);
