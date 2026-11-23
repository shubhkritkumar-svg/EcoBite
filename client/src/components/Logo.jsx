import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Logo({ compact = false, light = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="EcoBite home">
      <span
        className={`grid place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 ${
          light ? 'bg-mint text-forest-deep' : 'bg-forest text-mint'
        } ${compact ? 'h-9 w-9' : 'h-11 w-11'} shadow-[0_10px_24px_-14px_rgba(22,101,52,0.8)]`}
      >
        <Leaf size={compact ? 18 : 22} strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-semibold tracking-tight ${
            compact ? 'text-xl' : 'text-2xl'
          } ${light ? 'text-white' : 'text-forest-deep'}`}
        >
          Eco<span className={light ? 'text-lime' : 'text-leaf'}>Bite</span>
        </span>
        {!compact && (
          <span
            className={`mt-1 text-[8.5px] font-bold uppercase tracking-[0.24em] ${
              light ? 'text-white/60' : 'text-ink-muted'
            }`}
          >
            eat light · live green
          </span>
        )}
      </span>
    </Link>
  );
}
