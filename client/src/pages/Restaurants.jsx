import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Leaf, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { api } from '../lib/api.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Reveal from '../components/Reveal.jsx';

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Top rated' },
  { value: 'delivery', label: 'Fastest delivery' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
];

function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4 rounded-full" />
        <div className="skeleton h-4 w-1/2 rounded-full" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    cuisine: searchParams.get('cuisine') || 'All',
    eco: searchParams.get('eco') === 'true',
    sort: searchParams.get('sort') || 'recommended',
  }));
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    api('/restaurants/cuisines')
      .then((data) => setCuisines(data.cuisines))
      .catch(() => setCuisines([]));
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const next = {
        search: searchParams.get('search') || '',
        cuisine: searchParams.get('cuisine') || 'All',
        eco: searchParams.get('eco') === 'true',
        sort: searchParams.get('sort') || 'recommended',
      };
      setFilters((current) =>
        current.search === next.search &&
        current.cuisine === next.cuisine &&
        current.eco === next.eco &&
        current.sort === next.sort
          ? current
          : next
      );
    };
    syncFromUrl();
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams();
      if (filters.search.trim()) next.set('search', filters.search.trim());
      if (filters.cuisine !== 'All') next.set('cuisine', filters.cuisine);
      if (filters.eco) next.set('eco', 'true');
      if (filters.sort !== 'recommended') next.set('sort', filters.sort);
      setSearchParams(next, { replace: true });

      setLoading(true);
      setError('');
      api(`/restaurants?${next.toString()}`)
        .then((data) => setRestaurants(data.restaurants))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 240);

    return () => clearTimeout(timer);
  }, [filters, setSearchParams, retryKey]);

  const activeFilterCount = useMemo(
    () =>
      (filters.search ? 1 : 0) +
      (filters.cuisine !== 'All' ? 1 : 0) +
      (filters.eco ? 1 : 0),
    [filters]
  );

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const resetFilters = () => {
    setFilters({ search: '', cuisine: 'All', eco: false, sort: 'recommended' });
  };

  return (
    <div className="min-h-screen bg-cream">
      <section className="relative overflow-hidden border-b border-forest/10 bg-hero-glow">
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full border-[30px] border-forest/5" />
        <div className="container-page py-12 md:py-16">
          <span className="eyebrow">
            <Leaf size={13} /> 8 kitchens · Bengaluru
          </span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="section-title text-4xl sm:text-5xl">Find your kind of green</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
                Filter by cuisine, delivery speed or eco certification. Every kitchen is independent,
                local and reviewed by real people in this fictional demo dataset.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-forest/10 bg-white/80 px-4 py-3 text-xs font-semibold text-ink-muted backdrop-blur">
              <Sparkles size={15} className="text-forest" />
              Eco Certified = 4+ verified criteria
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search restaurants, cuisines or areas</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search a restaurant, dish or area (try 'dosa' or 'Whitefield')"
                className="input h-12 rounded-full pl-11 pr-10 shadow-sm"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition hover:bg-sage"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="flex items-center gap-2">
              <label className="relative">
                <span className="sr-only">Sort restaurants</span>
                <SlidersHorizontal
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilter('sort', event.target.value)}
                  className="input h-12 min-w-48 rounded-full pl-9 pr-9 text-sm font-semibold shadow-sm"
                >
                  {SORTS.map((sort) => (
                    <option key={sort.value} value={sort.value}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => updateFilter('eco', !filters.eco)}
                aria-pressed={filters.eco}
                className={`inline-flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                  filters.eco
                    ? 'border-forest bg-forest text-white'
                    : 'border-forest/15 bg-white text-forest hover:border-forest/40'
                }`}
              >
                <Leaf size={16} />
                Eco only
              </button>
            </div>
          </div>

          <div className="no-scrollbar mt-5 flex items-center gap-2 overflow-x-auto pb-1">
            {['All', ...cuisines].map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => updateFilter('cuisine', cuisine)}
                className={`chip ${filters.cuisine === cuisine ? 'chip-active' : ''}`}
                aria-pressed={filters.cuisine === cuisine}
              >
                {cuisine}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-bold text-forest hover:underline"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              {filters.cuisine === 'All' ? 'All kitchens' : `${filters.cuisine} kitchens`}
            </h2>
            <p className="mt-1 text-xs font-semibold text-ink-muted">
              {loading ? 'Finding kitchens…' : `${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurants'} available`}
              {filters.eco && ' · eco certified only'}
            </p>
          </div>
          <span className="hidden text-[11px] font-semibold text-ink-muted sm:block">
            Prices in INR · Delivery in Bengaluru
          </span>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="card mt-6 flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetryKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Search}
              title="No kitchens match that combination"
              description="Try clearing the eco filter, choosing another cuisine, or searching for a different area."
              action={
                <button type="button" onClick={resetFilters} className="btn btn-primary">
                  Reset all filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant, index) => (
              <Reveal key={restaurant.id} delay={Math.min(index, 5) * 50}>
                <RestaurantCard restaurant={restaurant} priority={index < 3} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
