import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 1, max = 10, size = 'md' }) {
  const small = size === 'sm';

  return (
    <div
      className={`inline-flex items-center rounded-full border border-forest/25 bg-white ${
        small ? 'h-8' : 'h-10'
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`grid h-full place-items-center rounded-l-full text-forest transition hover:bg-mint disabled:opacity-40 ${
          small ? 'w-8' : 'w-10'
        }`}
        aria-label="Decrease quantity"
      >
        <Minus size={small ? 13 : 15} strokeWidth={2.6} />
      </button>
      <span
        className={`min-w-7 text-center font-bold text-forest-deep ${small ? 'text-xs' : 'text-sm'}`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`grid h-full place-items-center rounded-r-full text-forest transition hover:bg-mint disabled:opacity-40 ${
          small ? 'w-8' : 'w-10'
        }`}
        aria-label="Increase quantity"
      >
        <Plus size={small ? 13 : 15} strokeWidth={2.6} />
      </button>
    </div>
  );
}
