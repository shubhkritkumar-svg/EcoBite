import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bike,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Leaf,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Star,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DELIVERY_MODE_META, MENU_CATEGORY_ORDER, PACKAGING_META } from '../lib/constants.jsx';
import { inr } from '../lib/format.js';
import FoodImage from '../components/FoodImage.jsx';
import EcoBadge from '../components/EcoBadge.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import Modal from '../components/Modal.jsx';
import PageLoader from '../components/PageLoader.jsx';

function VegMark({ isVeg }) {
  return (
    <span
      className={`inline-grid h-4 w-4 place-items-center rounded-sm border-2 ${
        isVeg ? 'border-emerald-600' : 'border-red-500'
      }`}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={`h-2 w-2 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-red-500'}`} />
    </span>
  );
}

export default function RestaurantMenu() {
  const { slug } = useParams();
  const { addItem, replaceCart, setQuantity, restaurant: cartRestaurant, items, itemCount, itemTotal } = useCart();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingItem, setPendingItem] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/restaurants/${slug}`)
      .then((response) => active && setData(response))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug, retryKey]);

  const cartForThisRestaurant = Boolean(
    cartRestaurant && data && String(cartRestaurant.id) === String(data.restaurant.id)
  );
  const cartAvailable = cartForThisRestaurant && itemCount > 0;

  const quantityInCart = (itemId) => {
    if (!cartForThisRestaurant) return 0;
    return items.find((item) => item.id === itemId)?.quantity || 0;
  };

  const filteredMenu = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.menu.filter((item) => {
      if (vegOnly && !item.isVeg) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    });
  }, [data, vegOnly, search]);

  const groups = useMemo(
    () =>
      MENU_CATEGORY_ORDER.map((category) => ({
        category,
        items: filteredMenu.filter((item) => item.category === category),
      })).filter((group) => group.items.length > 0),
    [filteredMenu]
  );

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-64 w-full rounded-3xl" />
        <div className="mx-auto mt-8 max-w-2xl">
          <PageLoader label="Plating the menu" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <h1 className="font-display text-2xl font-semibold">Kitchen not found</h1>
          <p className="mt-2 text-sm text-ink-muted">{error || 'This restaurant may have been removed.'}</p>
          <Link to="/restaurants" className="btn btn-primary mt-6">
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  const { restaurant, menu } = data;

  const handleAdd = (item) => {
    if (!item.available) return;
    if (!addItem(restaurant, item, 1)) {
      setPendingItem(item);
    }
  };

  const confirmReplace = () => {
    if (!pendingItem) return;
    replaceCart(restaurant, pendingItem, 1);
    toast.success(`New cart started with ${pendingItem.name}`);
    setPendingItem(null);
  };

  return (
    <div className="pb-28 md:pb-16">
      <div className="container-page pt-6">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted" aria-label="Breadcrumb">
          <Link to="/" className="transition hover:text-forest">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link to="/restaurants" className="transition hover:text-forest">
            Restaurants
          </Link>
          <ChevronRight size={12} />
          <span className="truncate text-ink">{restaurant.name}</span>
        </nav>

        <div className="relative mt-5 overflow-hidden rounded-[2rem]">
          <FoodImage
            src={restaurant.image}
            alt={restaurant.name}
            eager
            className="h-64 w-full sm:h-80"
            imgClassName="scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
            <EcoBadge restaurant={restaurant} />
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-ink shadow-sm backdrop-blur">
              {restaurant.deliveryTimeMins} min · {restaurant.distanceKm} km
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime">
                  {restaurant.area}, {restaurant.city}
                </p>
                <h1 className="section-title mt-1 text-3xl text-white sm:text-5xl">{restaurant.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                  {restaurant.description}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-white backdrop-blur">
                <span className="inline-flex items-center gap-1 rounded-lg bg-lime px-2 py-1 text-sm font-extrabold text-forest-deep">
                  {restaurant.rating.toFixed(1)}
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                </span>
                <div className="text-[10px] font-semibold leading-tight text-white/70">
                  {restaurant.ratingCount.toLocaleString('en-IN')}
                  <br />
                  ratings
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
          <span className="chip">
            <Clock size={12} /> {restaurant.deliveryTimeMins} min delivery
          </span>
          <span className="chip">
            <MapPin size={12} /> {restaurant.area}
          </span>
          <span className="chip">{inr(restaurant.priceForTwo)} for two</span>
          <span className="chip capitalize">{restaurant.cuisines.join(' · ')}</span>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Menu</h2>
              <p className="mt-1 text-xs font-semibold text-ink-muted">
                {menu.length} dishes · cooked to order
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">Search the menu</span>
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search this menu"
                  className="input h-10 w-full rounded-full pl-9 pr-3 text-sm sm:w-48"
                />
              </label>
              <button
                type="button"
                onClick={() => setVegOnly((value) => !value)}
                aria-pressed={vegOnly}
                className={`chip h-10 ${vegOnly ? 'chip-active' : ''}`}
              >
                <VegMark isVeg /> Veg only
              </button>
            </div>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {groups.map((group) => (
              <a
                key={group.category}
                href={`#category-${group.category.replace(/[^a-z]/gi, '')}`}
                className="chip"
              >
                {group.category}
              </a>
            ))}
          </div>

          {groups.length === 0 ? (
            <div className="card mt-6 p-12 text-center">
              <p className="font-display text-xl font-semibold">No dishes match your filters</p>
              <p className="mt-2 text-sm text-ink-muted">Try turning off “Veg only” or clearing your search.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-4"
                onClick={() => {
                  setSearch('');
                  setVegOnly(false);
                }}
              >
                Clear menu filters
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {groups.map((group) => (
                <section
                  key={group.category}
                  id={`category-${group.category.replace(/[^a-z]/gi, '')}`}
                  className="scroll-mt-28"
                >
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
                    {group.category}
                    <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-extrabold text-ink-muted">
                      {group.items.length}
                    </span>
                  </h3>

                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    {group.items.map((item) => {
                      const quantity = quantityInCart(item.id);
                      return (
                        <article
                          key={item.id}
                          className={`flex gap-4 rounded-2xl border border-forest/10 bg-white p-4 transition hover:border-forest/25 ${
                            !item.available ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center gap-2">
                              <VegMark isVeg={item.isVeg} />
                              {item.spiceLevel !== 'None' && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600">
                                  <Flame size={11} /> {item.spiceLevel}
                                </span>
                              )}
                              {item.isVegan && (
                                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                                  Vegan
                                </span>
                              )}
                            </div>
                            <h4 className="mt-1.5 text-sm font-extrabold text-ink">{item.name}</h4>
                            <p className="mt-1 text-xs font-bold text-forest">{inr(item.price)}</p>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                              {item.description}
                            </p>
                            <p className="mt-auto pt-2 text-[10px] font-semibold text-ink-muted/80">
                              {item.calories} kcal · {item.popularity}% order this
                            </p>
                          </div>

                          <div className="relative w-28 shrink-0 sm:w-32">
                            <FoodImage
                              src={item.image}
                              alt={item.name}
                              className="h-28 w-28 rounded-xl sm:h-32 sm:w-32"
                            />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                              {!item.available ? (
                                <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-extrabold text-stone-500 shadow-sm">
                                  Unavailable
                                </span>
                              ) : quantity > 0 ? (
                                <div className="rounded-full bg-white p-0.5 shadow-md">
                                  <QuantityStepper
                                    size="sm"
                                    value={quantity}
                                    min={0}
                                    onChange={(next) => setQuantity(item.id, next)}
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAdd(item)}
                                  className="rounded-full border border-forest/20 bg-white px-4 py-1.5 text-[11px] font-extrabold text-forest shadow-md transition hover:bg-forest hover:text-white"
                                  aria-label={`Add ${item.name} to cart`}
                                >
                                  ADD +
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          {cartAvailable && (
            <div className="card border-forest/20 bg-forest p-5 text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime">Your cart</p>
              <p className="mt-2 font-display text-xl font-semibold">{itemCount} items · {inr(itemTotal)}</p>
              <p className="mt-1 text-xs text-white/60">From {cartRestaurant.name}</p>
              <Link to="/cart" className="btn btn-mint mt-4 w-full">
                <ShoppingBag size={16} /> View cart
              </Link>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Why this kitchen?</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">{restaurant.description}</p>

            {restaurant.ecoCriteria?.length > 0 && (
              <>
                <div className="mt-4 flex items-center gap-2">
                  <EcoBadge restaurant={restaurant} />
                  <span className="text-[10px] font-bold text-ink-muted">
                    {restaurant.ecoCriteria.length}/5 criteria
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {restaurant.ecoCriteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-2 text-xs font-semibold text-ink/80">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-forest" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!restaurant.isEcoCertified && (
              <p className="mt-3 rounded-xl bg-sage px-3 py-2 text-[10px] font-semibold leading-relaxed text-ink-muted">
                This kitchen meets fewer than four eco criteria, so it does not carry the Eco
                Certified label. Eco delivery options may still be available.
              </p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">Delivery options</h3>
            <div className="mt-3 space-y-2">
              {restaurant.deliveryModes.map((mode) => {
                const meta = DELIVERY_MODE_META[mode];
                const Icon = meta.icon;
                return (
                  <div key={mode} className="flex items-start gap-2.5 rounded-xl border border-sage p-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-forest">
                      <Icon size={15} />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-ink">{meta.label}</p>
                      <p className="text-[10px] text-ink-muted">{meta.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <h3 className="mt-4 text-xs font-extrabold uppercase tracking-wider text-ink-muted">Packaging</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {restaurant.packagingOptions.map((option) => {
                const meta = PACKAGING_META[option];
                return (
                  <span key={option} className="chip !cursor-default text-[10px]">
                    <meta.icon size={12} /> {meta.label}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-1.5 border-t border-sage pt-3 text-[10px] font-semibold text-ink-muted">
              <Leaf size={12} className="text-forest" /> Distance and savings are estimates, not GPS data.
            </p>
          </div>
        </aside>
      </div>

      {cartAvailable && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/20 bg-forest px-4 py-3 text-white shadow-[0_-10px_30px_rgba(8,45,23,0.25)] md:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-lime">{itemCount} items</p>
              <p className="text-base font-extrabold">{inr(itemTotal)}</p>
            </div>
            <Link to="/cart" className="btn btn-mint">
              View cart <ShoppingBag size={15} />
            </Link>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(pendingItem)}
        onClose={() => setPendingItem(null)}
        title="Start a new cart?"
        description={`Your cart already has items from ${cartRestaurant?.name}. A cart can contain dishes from one kitchen at a time.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={() => setPendingItem(null)}>
            Keep current cart
          </button>
          <button type="button" className="btn btn-primary" onClick={confirmReplace}>
            Start new cart
          </button>
        </div>
      </Modal>
    </div>
  );
}
