// The record player's music deck: a swipeable album-card carousel with honest playback.
// Local audio (MusicTrack.audioFile) plays here and spins the 3D turntable; Spotify links play in
// Spotify's official embed; other links open externally. Nothing ever autoplays.
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Disc3, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage } from './SafeImage';
import { music, spotifyEmbed } from '@/content/music';
import { musicPlayer, useMusicPlayer } from '@/lib/music-player';

const time = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

export default function MusicPlayer({ onClose }: { onClose: () => void }) {
  const player = useMusicPlayer();
  const track = music[player.index];
  const [drag, setDrag] = useState(0);
  const [showEmbed, setShowEmbed] = useState(false);
  const start = useRef<number | null>(null);
  const embed = spotifyEmbed(track?.spotifyUrl);
  const ready = Boolean(track?.title);
  useEffect(() => setShowEmbed(false), [player.index]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') musicPlayer.next(); if (e.key === 'ArrowLeft') musicPlayer.previous(); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [onClose]);

  const onDown = (e: React.PointerEvent) => { start.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (start.current !== null) setDrag(e.clientX - start.current); };
  const onUp = () => { if (Math.abs(drag) > 45) (drag < 0 ? musicPlayer.next : musicPlayer.previous)(); start.current = null; setDrag(0); };

  return <div className="panel-shade music-shade" onClick={onClose}>
    <section className="music-deck" role="dialog" aria-modal="true" aria-label="On the turntable" onClick={e => e.stopPropagation()}>
      <header className="music-header"><Button variant="ghost" onClick={onClose}><ArrowLeft />Back to the room</Button><div><span className="eyebrow">The record player</span><h2>On the turntable</h2></div><Button variant="ghost" size="icon" aria-label="Close music player" onClick={onClose}><X /></Button></header>

      <div className="carousel" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-roledescription="carousel">
        {music.map((t, i) => {
          let offset = i - player.index; const n = music.length;
          if (offset > n / 2) offset -= n; if (offset < -n / 2) offset += n;
          const o = offset + drag / 220;
          if (Math.abs(offset) > 2) return null;
          return <button type="button" key={t.id} className="album-card" data-active={i === player.index} aria-label={`${t.title || 'Coming soon'}${t.artist ? ' by ' + t.artist : ''}`} aria-current={i === player.index}
            onClick={() => { if (Math.abs(drag) < 5) musicPlayer.select(i); }}
            style={{ transform: `translateX(calc(-50% + ${o * 62}%)) rotateY(${-o * 24}deg) scale(${1 - Math.min(Math.abs(o), 2) * 0.13})`, zIndex: 10 - Math.round(Math.abs(o) * 2), opacity: 1 - Math.min(Math.abs(o), 2) * 0.28, transition: drag ? 'none' : undefined }}>
            <SafeImage src={t.albumArt} alt={t.album ? `${t.album} cover` : `${t.title} cover`} fit="cover" ratio="1 / 1" fallback={<div className="album-art-placeholder"><Disc3 size={44} strokeWidth={1} /></div>} />
            <span className="album-card-title">{t.title || 'Coming soon'}</span>
            <span className="album-card-artist">{t.artist || 'Track still being chosen'}</span>
          </button>;
        })}
        <Button variant="ghost" size="icon" className="carousel-arrow carousel-prev" aria-label="Previous track" onClick={musicPlayer.previous}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" className="carousel-arrow carousel-next" aria-label="Next track" onClick={musicPlayer.next}><ChevronRight /></Button>
      </div>

      <div className="now-playing">
        <div className="track-info"><strong>{track?.title || 'Coming soon'}</strong><span>{[track?.artist, track?.album].filter(Boolean).join(' · ') || 'This slot is waiting for a song.'}</span></div>
        <div className="transport">
          <Button variant="ghost" size="icon" aria-label="Previous track" onClick={musicPlayer.previous}><SkipBack /></Button>
          <Button size="icon" className="play-button" aria-label={player.playing ? 'Pause' : 'Play'} disabled={!track?.audioFile} title={track?.audioFile ? undefined : 'No audio file for this track'} onClick={() => musicPlayer.toggle()}>{player.playing ? <Pause /> : <Play />}</Button>
          <Button variant="ghost" size="icon" aria-label="Next track" onClick={musicPlayer.next}><SkipForward /></Button>
        </div>
        {track?.audioFile && <div className="progress-row">
          <span>{time(player.time)}</span>
          <input type="range" aria-label="Playback position" min={0} max={player.duration || 0} step={0.1} value={player.time} disabled={!player.duration} onChange={e => musicPlayer.seek(Number(e.target.value))} />
          <span>{time(player.duration)}</span>
          <Button variant="ghost" size="icon" aria-label={player.muted ? 'Unmute' : 'Mute'} onClick={musicPlayer.toggleMute}>{player.muted ? <VolumeX /> : <Volume2 />}</Button>
          <input className="volume" type="range" aria-label="Volume" min={0} max={1} step={0.05} value={player.muted ? 0 : player.volume} onChange={e => musicPlayer.setVolume(Number(e.target.value))} />
        </div>}
        {player.error && <p className="form-feedback" role="status">{player.error}</p>}
        {track?.description && <p className="track-description">{track.description}</p>}
        {embed && <div className="external-playback">
          {showEmbed ? <iframe title={`${track?.title ?? 'Track'} on Spotify`} src={embed} width="100%" height="152" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
            : <Button variant="outline" onClick={() => setShowEmbed(true)}><Play size={14} />Load the Spotify player</Button>}
          <small>Plays inside Spotify’s own player. Full tracks need a Spotify login; otherwise Spotify plays a preview. The turntable only spins for local audio.</small>
        </div>}
        {track?.externalUrl && <a className="external-link" href={track.externalUrl} target="_blank" rel="noreferrer">Listen externally <ArrowUpRight size={13} /><small>Opens in a new tab</small></a>}
        {!ready && <p className="track-description">Songs will appear here as they’re added.</p>}
      </div>
    </section>
  </div>;
}

/** Room toolbar sound control: pauses the record when one is playing; disabled when silent. */
export function RoomSoundButton() {
  const { playing } = useMusicPlayer();
  return <Button variant="ghost" size="icon" title={playing ? 'Pause the record' : 'No music playing'} aria-label={playing ? 'Pause the record' : 'No music playing'} disabled={!playing} onClick={musicPlayer.pause}>{playing ? <Volume2 /> : <VolumeX />}</Button>;
}
