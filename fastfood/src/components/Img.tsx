import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

/** Image avec fondu au chargement et visuel de remplacement si elle ne charge pas. */
export default function Img({ src, alt, className = '', eager }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const positioned = /\b(absolute|fixed)\b/.test(className);
  return (
    <div className={`${positioned ? '' : 'relative'} overflow-hidden bg-coal ${className}`}>
      {state !== 'error' && (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setState('ok')} onError={() => setState('error')}
          className={`h-full w-full object-cover transition duration-700 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`} />
      )}
      {state === 'error' && (
        <div className="absolute inset-0 grid place-items-center text-mustard/60" role="img" aria-label={alt}>
          <UtensilsCrossed className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
