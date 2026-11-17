import { useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { existingImage } from '@/content/media';

/**
 * An image that never shows a broken-image icon: missing or failing files render `fallback`
 * (or a quiet placeholder). `fit` keeps the image's own proportions; it is never stretched.
 */
export function SafeImage({ src, alt, fit = 'contain', ratio, className = '', fallback, eager = false, onClick }: {
  src?: string | null | undefined; alt: string; fit?: 'contain' | 'cover' | undefined; ratio?: string | undefined; className?: string | undefined; fallback?: ReactNode; eager?: boolean | undefined; onClick?: (() => void) | undefined;
}) {
  const path = existingImage(src);
  const [failed, setFailed] = useState(false);
  if (!path || failed) return <>{fallback ?? <div className={`safe-image safe-image-missing ${className}`} style={{ aspectRatio: ratio }}><ImageOff size={22} strokeWidth={1.3} aria-hidden /><span>Image coming soon</span></div>}</>;
  const img = <img src={path} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} style={{ objectFit: fit }} />;
  return onClick
    ? <button type="button" className={`safe-image ${className}`} style={{ aspectRatio: ratio }} onClick={onClick} aria-label={`Enlarge: ${alt}`}>{img}</button>
    : <div className={`safe-image ${className}`} style={{ aspectRatio: ratio }}>{img}</div>;
}
