import { Leaf } from 'lucide-react';

export default function EcoBadge({ restaurant, className = '' }) {
  if (!restaurant) return null;
  const label =
    restaurant.ecoBadge ||
    (restaurant.isEcoCertified
      ? 'Eco Certified'
      : (restaurant.ecoCriteria?.length || 0) >= 3
        ? 'Eco Friendly'
        : null);

  if (!label) return null;

  const certified = label === 'Eco Certified';

  return (
    <span
      title={
        restaurant.ecoCriteria?.length
          ? `Criteria met: ${restaurant.ecoCriteria.join(', ')}`
          : label
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur ${
        certified
          ? 'border-emerald-200/80 bg-mint/95 text-forest-deep'
          : 'border-lime-200/80 bg-lime-50/95 text-lime-900'
      } ${className}`}
    >
      <Leaf size={12} strokeWidth={2.6} />
      {label}
    </span>
  );
}
