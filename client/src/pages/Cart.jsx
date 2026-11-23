import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  Bike,
  Clock,
  Leaf,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { FREE_DELIVERY_THRESHOLD, previewTotals } from '../lib/eco.js';
import { inr } from '../lib/format.js';
import FoodImage from '../components/FoodImage.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import EmptyState from '../components/EmptyState.jsx';
import EcoBadge from '../components/EcoBadge.jsx';

export default function Cart() {
  const { cart, restaurant, items, itemCount, setQuantity, removeItem, clearCart } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const totals = previewTotals(items);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - totals.itemTotal);
  const progress = Math.min(100, Math.round((totals.itemTotal / FREE_DELIVERY_THRESHOLD) * 100));

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Eight green kitchens are waiting. Add a dish you love and we will calculate the eco impact at checkout."
          action={
            <Link to="/restaurants" className="btn btn-primary btn-lg">
              Explore restaurants <ArrowRight size={17} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">
            <ShoppingBag size={13} /> Step 1 of 3
          </span>
          <h1 className="section-title mt-2 text-4xl">Your cart</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} from {restaurant.name}
          </p>
        </div>
        <Link to={`/restaurants/${restaurant.slug}`} className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Add more items
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-sage bg-sage/50 p-4">
              <FoodImage
                src={restaurant.image}
                alt={restaurant.name}
                className="h-14 w-14 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/restaurants/${restaurant.slug}`}
                    className="truncate font-display text-lg font-semibold text-ink hover:text-forest"
                  >
                    {restaurant.name}
                  </Link>
                  <EcoBadge restaurant={restaurant} />
                </div>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-ink-muted">
                  <MapPin size={11} /> {restaurant.area}
                  <Clock size={11} /> {restaurant.deliveryTimeMins} min
                </p>
              </div>
            </div>

            <ul className="divide-y divide-sage">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3.5 p-4 sm:gap-4">
                  <FoodImage src={item.image} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                          <span
                            className={`inline-block h-3 w-3 rounded-sm border-2 ${
                              item.isVeg ? 'border-emerald-600' : 'border-red-500'
                            }`}
                            aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
                          />
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">{item.category}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <QuantityStepper
                        value={item.quantity}
                        min={1}
                        onChange={(next) => setQuantity(item.id, next)}
                        size="sm"
                      />
                      <p className="text-sm font-extrabold text-forest">{inr(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-sage p-4">
              {confirmClear ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-ink">Clear the whole cart?</span>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      clearCart();
                      setConfirmClear(false);
                    }}
                  >
                    Yes, clear
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted transition hover:text-red-600"
                  >
                    <Trash2 size={13} /> Clear cart
                  </button>
                  <p className="text-[11px] font-semibold text-ink-muted">Prices include 5% GST</p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-forest/15 bg-mint-soft p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-forest-deep">
              <Leaf size={15} /> Eco choices come next
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              At checkout you can pick a bicycle or EV courier where supported, choose compostable or
              reusable packaging, and skip disposable cutlery. Each choice earns Green Points.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-forest">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1"><Bike size={11} /> Low-CO₂ delivery</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1"><Sprout size={11} /> Compostable</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1"><UtensilsCrossed size={11} /> No cutlery</span>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-sage p-5">
              <h2 className="font-display text-xl font-semibold">Bill details</h2>
              {remaining > 0 ? (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-forest">
                    Add {inr(remaining)} more for free delivery
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sage">
                    <div
                      className="h-full rounded-full bg-forest transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[10px] font-extrabold text-forest">
                  <Leaf size={11} /> Free delivery unlocked
                </p>
              )}
            </div>

            <dl className="space-y-2.5 p-5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>Item total</dt>
                <dd className="font-semibold text-ink">{inr(totals.itemTotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Delivery fee</dt>
                <dd className={totals.deliveryFee === 0 ? 'font-bold text-forest' : 'font-semibold text-ink'}>
                  {totals.deliveryFee === 0 ? 'FREE' : inr(totals.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Packaging fee</dt>
                <dd className="font-semibold text-ink">{inr(totals.packagingFee)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>GST (5%)</dt>
                <dd className="font-semibold text-ink">{inr(totals.taxes)}</dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-forest/15 pt-3 text-base font-extrabold text-ink">
                <dt>To pay</dt>
                <dd>{inr(totals.total)}</dd>
              </div>
            </dl>

            <div className="border-t border-sage p-5 pt-4">
              <Link to="/checkout" className="btn btn-primary w-full btn-lg">
                Proceed to checkout <ArrowRight size={17} />
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-ink-muted">
                <ShieldCheck size={12} className="text-forest" />
                Demo checkout · no real money is charged
              </p>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-ink-muted">
                <BadgeIndianRupee size={12} className="text-forest" />
                Totals are verified again on the server
              </p>
            </div>
          </div>

          <p className="mt-3 px-2 text-center text-[10px] leading-relaxed text-ink-muted">
            By placing an order you agree to this demo&apos;s simulated payment and delivery flow.
          </p>
        </aside>
      </div>
    </div>
  );
}
