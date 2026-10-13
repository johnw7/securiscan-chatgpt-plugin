import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  /** Texte du visuel de remplacement si la photo ne charge pas ('' = fond uni, pour les bannières). */
  fallbackLabel?: string;
  eager?: boolean;
}

/** Image produit avec chargement progressif et visuel de remplacement en cas d'erreur. */
export default function ProductImage({ src, alt, className = '', fallbackLabel, eager }: Props) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(src ? 'loading' : 'error');

  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden bg-sand-100 ${className}`}>
      {status !== 'error' && src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-cover transition duration-700 ${status === 'ok' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-sand-100" aria-hidden="true" />}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-sand-100 to-sand-200 p-4 text-center text-sand-600" role="img" aria-label={alt}>
          {fallbackLabel !== '' && (
            <>
              <Shirt className="h-8 w-8" strokeWidth={1.3} aria-hidden="true" />
              <span className="text-xs uppercase tracking-widest">{fallbackLabel ?? alt}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
