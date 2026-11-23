import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Leaf,
  Loader2,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { previewEcoImpact, previewTotals } from '../lib/eco.js';
import { inr } from '../lib/format.js';
import { DELIVERY_MODE_META, PACKAGING_META } from '../lib/constants.jsx';

const PAYMENT_METHODS = [
  {
    id: 'demo_upi',
    label: 'UPI',
    icon: Smartphone,
    description: 'Simulated instant confirmation. No UPI app is opened.',
  },
  {
    id: 'demo_card',
    label: 'Card',
    icon: CreditCard,
    description: 'Simulated card payment. No card details are collected.',
  },
  {
    id: 'cash_on_delivery',
    label: 'Cash on delivery',
    icon: Banknote,
    description: 'Pay cash to the demo rider. Payment stays pending until delivery.',
  },
];

const addressId = (address) => address.id || address._id;

const emptyAddress = { label: 'Home', line1: '', area: '', city: 'Bengaluru', pincode: '' };

export default function Checkout() {
  const { user, refreshUser } = useAuth();
  const { restaurant, items, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const savedAddresses = user?.addresses || [];
  const defaultAddress = savedAddresses.find((address) => address.isDefault) || savedAddresses[0];

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress ? addressId(defaultAddress) : '');
  const [useNewAddress, setUseNewAddress] = useState(savedAddresses.length === 0);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryMode, setDeliveryMode] = useState(() => {
    const modes = restaurant?.deliveryModes || ['standard'];
    if (modes.includes('bicycle')) return 'bicycle';
    if (modes.includes('ev')) return 'ev';
    return modes[0];
  });
  const [packaging, setPackaging] = useState(() => {
    const options = restaurant?.packagingOptions || ['standard'];
    if (options.includes('compostable')) return 'compostable';
    if (options.includes('reusable')) return 'reusable';
    return options[0];
  });
  const [cutlery, setCutlery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('demo_upi');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totals = previewTotals(items);
  const eco = useMemo(
    () =>
      previewEcoImpact({
        distanceKm: restaurant?.distanceKm || 2.5,
        deliveryMode,
        packaging,
        cutlery,
      }),
    [restaurant?.distanceKm, deliveryMode, packaging, cutlery]
  );

  if (items.length === 0 && !submitted) return <Navigate to="/cart" replace />;
  if (!restaurant) {
    return (
      <div className="container-page py-20 text-center text-sm font-semibold text-ink-muted">
        Opening your order…
      </div>
    );
  }

  const updateNewAddress = (field) => (event) =>
    setNewAddress((previous) => ({ ...previous, [field]: event.target.value }));

  const validate = () => {
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      return 'Enter a valid 10-digit mobile number starting with 6–9 for delivery updates.';
    }
    if (useNewAddress) {
      if (
        newAddress.line1.trim().length < 5 ||
        newAddress.area.trim().length < 2 ||
        newAddress.city.trim().length < 2
      ) {
        return 'Please fill the full delivery address (flat/street, area and city).';
      }
      if (!/^[1-9]\d{5}$/.test(newAddress.pincode.trim())) {
        return 'Enter a valid 6-digit pincode.';
      }
    } else if (!selectedAddressId) {
      return 'Please select a delivery address.';
    }
    return '';
  };

  const placeOrder = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setPlacing(true);
    try {
      const payload = {
        restaurantId: restaurant.id,
        items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        contactPhone: phone.trim(),
        deliveryMode,
        packaging,
        cutlery,
        paymentMethod,
        ...(useNewAddress
          ? {
              address: {
                label: newAddress.label.trim() || 'Home',
                line1: newAddress.line1.trim(),
                area: newAddress.area.trim(),
                city: newAddress.city.trim(),
                pincode: newAddress.pincode.trim(),
                isDefault: savedAddresses.length === 0,
              },
              saveAddress,
            }
          : { addressId: selectedAddressId }),
      };

      const data = await api('/orders', { method: 'POST', body: payload });
      setSubmitted(true);
      clearCart();
      refreshUser().catch(() => {});
      toast.success(
        `Order placed! You earned ${data.greenPointsEarned} Green Points for this order.`
      );
      navigate(`/orders/${data.order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
      setPlacing(false);
    }
  };

  const supportedModes = restaurant.deliveryModes?.length ? restaurant.deliveryModes : ['standard'];
  const supportedPackaging = restaurant.packagingOptions?.length
    ? restaurant.packagingOptions
    : ['standard', 'compostable'];

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted transition hover:text-forest"
      >
        <ArrowLeft size={14} /> Back to cart
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Step 2 of 3 · Demo checkout
          </span>
          <h1 className="section-title mt-2 text-4xl">Checkout</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {items.reduce((sum, item) => sum + item.quantity, 0)} items from {restaurant.name}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
          Simulation · no real payment
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Address */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <MapPin size={17} className="text-forest" />
              <h2 className="font-display text-lg font-semibold">Delivery address</h2>
            </div>

            <div className="mt-4 grid gap-2.5">
              {savedAddresses.map((address) => {
                const id = addressId(address);
                const selected = !useNewAddress && selectedAddressId === id;
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                      selected ? 'border-forest bg-mint-soft ring-1 ring-forest/20' : 'border-sage hover:border-forest/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setUseNewAddress(false);
                        setSelectedAddressId(id);
                      }}
                    />
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                        selected ? 'border-forest bg-forest text-white' : 'border-sage bg-white'
                      }`}
                    >
                      {selected && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-ink">
                        {address.label || 'Home'}
                        {address.isDefault && (
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-forest">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                        {address.line1}, {address.area}, {address.city} – {address.pincode}
                      </span>
                    </span>
                  </label>
                );
              })}

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed p-3.5 transition ${
                  useNewAddress ? 'border-forest bg-mint-soft ring-1 ring-forest/20' : 'border-sage hover:border-forest/30'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  className="sr-only"
                  checked={useNewAddress}
                  onChange={() => setUseNewAddress(true)}
                />
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                    useNewAddress ? 'border-forest bg-forest text-white' : 'border-sage bg-white'
                  }`}
                >
                  {useNewAddress && <Check size={10} strokeWidth={3} />}
                </span>
                <span className="text-sm font-extrabold text-ink">
                  {savedAddresses.length ? 'Deliver to a new address' : 'Add your delivery address'}
                  <span className="mt-0.5 block text-xs font-medium text-ink-muted">
                    We will save it to your profile so next time is one tap.
                  </span>
                </span>
              </label>
            </div>

            {useNewAddress && (
              <div className="mt-4 grid gap-3 rounded-2xl bg-cream/70 p-3.5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="address-label">Label</label>
                  <input
                    id="address-label"
                    className="input"
                    value={newAddress.label}
                    onChange={updateNewAddress('label')}
                    placeholder="Home / Work"
                    maxLength={30}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="address-line1">Flat / house, street</label>
                  <input
                    id="address-line1"
                    className="input"
                    value={newAddress.line1}
                    onChange={updateNewAddress('line1')}
                    placeholder="Flat 402, Green Meadows, 12th Main"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="address-area">Area</label>
                  <input
                    id="address-area"
                    className="input"
                    value={newAddress.area}
                    onChange={updateNewAddress('area')}
                    placeholder="Indiranagar"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="address-city">City</label>
                  <input
                    id="address-city"
                    className="input"
                    value={newAddress.city}
                    onChange={updateNewAddress('city')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="address-pincode">Pincode</label>
                  <input
                    id="address-pincode"
                    className="input"
                    inputMode="numeric"
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={updateNewAddress('pincode')}
                    placeholder="560038"
                  />
                </div>
                <label className="flex items-end gap-2 pb-2.5 text-xs font-semibold text-ink-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-sage text-forest focus:ring-forest"
                    checked={saveAddress}
                    onChange={(event) => setSaveAddress(event.target.checked)}
                  />
                  Save to my addresses
                </label>
              </div>
            )}

            <div className="mt-4">
              <label className="label" htmlFor="checkout-phone">Contact mobile number</label>
              <input
                id="checkout-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="input max-w-xs"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
              />
              <p className="mt-1.5 text-[10px] text-ink-muted">
                Required for delivery updates. Used only for this order.
              </p>
            </div>
          </section>

          {/* Delivery mode */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Truck size={17} className="text-forest" />
              <h2 className="font-display text-lg font-semibold">Delivery mode</h2>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              This kitchen supports {supportedModes.length} modes. Eco modes earn Green Points.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {supportedModes.map((mode) => {
                const meta = DELIVERY_MODE_META[mode];
                const Icon = meta.icon;
                const active = deliveryMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDeliveryMode(mode)}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? 'border-forest bg-mint-soft ring-1 ring-forest/20'
                        : 'border-sage bg-white hover:border-forest/30'
                    }`}
                    aria-pressed={active}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? 'bg-forest text-mint' : 'bg-sage text-forest'}`}>
                        <Icon size={16} />
                      </span>
                      {meta.badge && (
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-forest">
                          {meta.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-ink">{meta.label}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">{meta.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Packaging */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Leaf size={17} className="text-forest" />
              <h2 className="font-display text-lg font-semibold">Packaging</h2>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {supportedPackaging.map((option) => {
                const meta = PACKAGING_META[option];
                const Icon = meta.icon;
                const active = packaging === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPackaging(option)}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? 'border-forest bg-mint-soft ring-1 ring-forest/20'
                        : 'border-sage bg-white hover:border-forest/30'
                    }`}
                    aria-pressed={active}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon size={18} className={active ? 'text-forest' : 'text-ink-muted'} />
                      {meta.badge && (
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-forest">
                          {meta.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-ink">{meta.label}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">{meta.description}</p>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-sage bg-cream/60 p-3.5">
              <span className="flex items-start gap-2.5">
                <UtensilsCrossed size={17} className="mt-0.5 text-forest" />
                <span>
                  <span className="block text-sm font-extrabold text-ink">Send disposable cutlery</span>
                  <span className="mt-0.5 block text-[10px] text-ink-muted">
                    Off by default. Eating at home? Skip it and earn 5 Green Points.
                  </span>
                </span>
              </span>
              <span className="relative inline-flex shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={cutlery}
                  onChange={(event) => setCutlery(event.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-sage transition peer-checked:bg-forest" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
          </section>

          {/* Payment */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard size={17} className="text-forest" />
              <h2 className="font-display text-lg font-semibold">Payment</h2>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-800">
                Simulated
              </span>
            </div>
            <div className="mt-4 grid gap-2.5">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? 'border-forest bg-mint-soft ring-1 ring-forest/20'
                        : 'border-sage bg-white hover:border-forest/30'
                    }`}
                    aria-pressed={active}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-forest text-mint' : 'bg-sage text-forest'}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-ink">{method.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-muted">
                        {method.description}
                      </span>
                    </span>
                    {active && <CheckCircle2 size={17} className="mt-1 shrink-0 text-forest" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-ink-muted">
              No real payment gateway is integrated. Card and UPI choices are recorded as
              &quot;simulated paid&quot; so you can test the full order lifecycle.
            </p>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-sage p-5">
              <h2 className="font-display text-xl font-semibold">Order summary</h2>
              <p className="mt-1 text-xs text-ink-muted">{restaurant.name} · {restaurant.area}</p>
            </div>

            <ul className="max-h-56 space-y-2 overflow-y-auto p-4 text-xs">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 gap-2">
                    <span
                      className={`mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm border-2 ${
                        item.isVeg ? 'border-emerald-600' : 'border-red-500'
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink">{item.name}</span>
                      <span className="text-[10px] text-ink-muted">Qty {item.quantity}</span>
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-ink">{inr(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-sage p-4 text-xs">
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
              <div className="flex justify-between border-t border-dashed border-forest/15 pt-2.5 text-sm font-extrabold text-ink">
                <dt>To pay</dt>
                <dd>{inr(totals.total)}</dd>
              </div>
            </dl>

            <div className="mx-4 rounded-2xl border border-forest/15 bg-mint-soft p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-forest-deep">
                <Sparkles size={13} /> This order&apos;s eco impact
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-ink-muted">
                <span>Petrol baseline</span>
                <span>{eco.baselineCo2Kg.toFixed(3)} kg CO₂e</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-forest">
                <span>Your choices</span>
                <span>{eco.actualCo2Kg.toFixed(3)} kg CO₂e</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-2.5 py-2">
                <span className="text-[10px] font-bold text-ink-muted">Estimated saving</span>
                <span className="text-xs font-extrabold text-forest">−{eco.co2SavedKg.toFixed(3)} kg</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-2.5 py-2">
                <span className="text-[10px] font-bold text-ink-muted">Green Points</span>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-forest">
                  <Leaf size={11} /> +{eco.greenPoints}
                </span>
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-ink-muted">
                Estimates use documented factors (see Eco dashboard). Server recalculates final values.
              </p>
            </div>

            <div className="p-4">
              <button
                type="button"
                onClick={placeOrder}
                className="btn btn-primary w-full btn-lg"
                disabled={placing}
              >
                {placing ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Placing order…
                  </>
                ) : (
                  <>
                    Place order · {inr(totals.total)}
                  </>
                )}
              </button>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-ink-muted">
                <ShieldCheck size={12} className="text-forest" /> Totals are validated again on the server
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
