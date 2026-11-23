import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

export default function FoodImage({ src, alt, className = '', imgClassName = '', eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-sage ${className}`}>
      {!loaded && !failed && <div className="absolute inset-0 skeleton" aria-hidden="true" />}
      {failed ? (
        <div className="flex h-full min-h-24 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-mint-soft via-sage to-mint text-forest/60">
          <UtensilsCrossed size={26} />
          <span className="px-4 text-center text-xs font-semibold">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-all duration-700 ${
            loaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}
