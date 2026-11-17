import { Github, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { socialLinks, type SocialLink } from '@/content/social';

const ICONS: Record<SocialLink['id'], typeof Github> = { github: Github, linkedin: Linkedin, instagram: Instagram };

/** Icon buttons for the header (variant "icons") or labelled links for panels (variant "list"). */
export function SocialLinks({ variant = 'icons', className = '' }: { variant?: 'icons' | 'list'; className?: string }) {
  if (variant === 'list') return <div className={`social-list ${className}`}>{socialLinks.map(({ id, label, url, handle }) => { const Icon = ICONS[id]; return <a key={id} href={url} target="_blank" rel="noreferrer" className="social-list-item"><Icon size={18} strokeWidth={1.6} aria-hidden /><span><strong>{label}</strong><small>{id === 'instagram' ? '@' : ''}{handle}</small></span></a>; })}</div>;
  return <>{socialLinks.map(({ id, label, url }) => { const Icon = ICONS[id]; return <Button key={id} className={`social-link ${className}`} asChild variant="ghost" size="icon"><a href={url} target="_blank" rel="noreferrer" aria-label={label} title={label}><Icon /></a></Button>; })}</>;
}
