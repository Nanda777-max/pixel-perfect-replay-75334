// One shared audio player, so the 3D turntable and the music interface always agree.
// Only local audio files (MusicTrack.audioFile) play here; Spotify plays inside its own embed.
import { useSyncExternalStore } from 'react';
import { music, type MusicTrack } from '@/content/music';

interface State { index: number; playing: boolean; time: number; duration: number; volume: number; muted: boolean; error: string }
let state: State = { index: 0, playing: false, time: 0, duration: 0, volume: 0.8, muted: false, error: '' };
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;

function set(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(l => l()); }
function element() {
  if (audio || typeof Audio === 'undefined') return audio;
  audio = new Audio();
  audio.preload = 'none';
  audio.addEventListener('play', () => set({ playing: true, error: '' }));
  audio.addEventListener('pause', () => set({ playing: false }));
  audio.addEventListener('ended', () => set({ playing: false, time: 0 }));
  audio.addEventListener('timeupdate', () => set({ time: audio!.currentTime }));
  audio.addEventListener('loadedmetadata', () => set({ duration: audio!.duration || 0 }));
  audio.addEventListener('error', () => set({ playing: false, error: 'This audio file could not be loaded.' }));
  return audio;
}
const track = (): MusicTrack | undefined => music[state.index];

export const musicPlayer = {
  select(index: number) {
    if (index === state.index) return;
    const a = element();
    if (a) { a.pause(); a.removeAttribute('src'); a.load(); }
    set({ index: (index + music.length) % music.length, playing: false, time: 0, duration: 0, error: '' });
  },
  next() { musicPlayer.select(state.index + 1); },
  previous() { musicPlayer.select(state.index - 1); },
  async toggle() {
    const a = element(); const t = track();
    if (!a || !t?.audioFile) return;
    if (!a.paused) { a.pause(); return; }
    if (!a.src.endsWith(t.audioFile)) a.src = t.audioFile;
    a.volume = state.volume; a.muted = state.muted;
    try { await a.play(); } catch { set({ playing: false, error: 'Playback was blocked or the file is missing.' }); }
  },
  pause() { audio?.pause(); },
  seek(seconds: number) { if (audio && state.duration) audio.currentTime = seconds; },
  setVolume(volume: number) { set({ volume, muted: volume === 0 }); if (audio) { audio.volume = volume; audio.muted = volume === 0; } },
  toggleMute() { set({ muted: !state.muted }); if (audio) audio.muted = state.muted; },
};

export function useMusicPlayer() {
  return useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => state);
}
