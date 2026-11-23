import { Link } from 'react-router-dom';
import { Bike, Clock, MapPin, Star, Zap } from 'lucide-react';
import FoodImage from './FoodImage.jsx';
import EcoBadge from './EcoBadge.jsx';
import { DELIVERY_MODE_META } from '../lib/constants.jsx';
import { inr } from '../lib/format.js';

export default function RestaurantCard({ restaurant, priority = false }) {
  const hasBicycle = restaurant.deliveryModes?.includes('bicycle');
  const hasEv = restaurant.deliveryModes?.includes('ev');

  return (
    <Link
      to={`/restaurants/${restaurant.slug}`}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_50px_-28px_rgba(18,36,26,0.45)]"
      aria-label={`View ${restaurant.name}`}
    >
      <div className="relative h-48 overflow-hidden">
        <FoodImage
          src={restaurant.image}
          alt={restaurant.name}
          eager={priority}
          className="h-full w-full"
          imgClassName="transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <EcoBadge restaurant={restaurant} />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-ink shadow-sm backdrop-blur">
            <Clock size={11} strokeWidth={2.8} />
            {restaurant.deliveryTimeMins} min
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3.5 pb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/95 drop-shadow-sm">
            <MapPin size={11} /> {restaurant.area}
          </span>
          <div className="flex items-center gap-1.5">
            {hasBicycle && (
              <span
                className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-forest"
                title="Bicycle delivery available"
              >
                <Bike size={13} />
              </span>
            )}
            {hasEv && (
              <span
                className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-forest"
                title="EV delivery available"
              >
                <Zap size={13} />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-snug text-ink transition group-hover:text-forest">
            {restaurant.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-forest px-2 py-1 text-xs font-extrabold text-white">
            {restaurant.rating.toFixed(1)}
            <Star size={10} fill="currentColor" strokeWidth={0} />
          </span>
        </div>
        <p className="text-sm text-ink-muted">{restaurant.cuisines.join(' · ')}</p>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-muted/85">
          {restaurant.description}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-sage pt-3 text-xs font-semibold text-ink-muted">
          <span>{inr(restaurant.priceForTwo)} for two</span>
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {restaurant.distanceKm} km
          </span>
          <span className="hidden sm:inline">{restaurant.ratingCount.toLocaleString('en-IN')} ratings</span>
        </div>
      </div>
    </Link>
  );
}
