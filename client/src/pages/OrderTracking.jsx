import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDateTime, inr, shortOrderId } from '../lib/format.js';
import { ORDER_FLOW, STATUS_META, DELIVERY_MODE_META, PACKAGING_META } from '../lib/constants.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';

const PAYMENT_LABELS = {
  demo_upi: 'UPI · simulated',
  demo_card: 'Card · simulated',
  cash_on_delivery: 'Cash on delivery',
};

const PAYMENT_STATUS_LABELS = {
  simulated_paid: 'Paid (simulated)',
  pending: 'Payment pending',
  refund_simulated: 'Refund simulated',
};

export default function OrderTracking() {
  const { id } = useParams();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showPlacedBanner, setShowPlacedBanner] = useState(Boolean(location.state?.justPlaced));

  const load = () => {
    setLoading(true);
    setError('');
    api(`/orders/${id}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <PageLoader label="Loading your order" />;

  if (error || !order) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <AlertCircle size={30} className="mx-auto text-red-500" />
          <h1 className="mt-3 font-display text-2xl font-semibold">Order not available</h1>
          <p className="mt-2 text-sm text-ink-muted">{error || 'This order could not be found.'}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/profile" className="btn btn-secondary">
              My orders
            </Link>
            <button type="button" onClick={load} className="btn btn-primary">
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const activeIndex = ORDER_FLOW.indexOf(order.status);
  const deliveryMeta = DELIVERY_MODE_META[order.deliveryMode] || DELIVERY_MODE_META.standard;
  const packagingMeta = PACKAGING_META[order.packaging] || PACKAGING_META.standard;
  const DeliveryIcon = deliveryMeta.icon;
  const PackagingIcon = packagingMeta.icon;
  const historyByStatus = new Map((order.statusHistory || []).map((entry) => [entry.status, entry.at]));

  const advance = async () => {
    setAdvancing(true);
    try {
      const data = await api(`/orders/${id}/advance`, { method: 'POST' });
      setOrder(data.order);
      toast.info(`Status advanced to “${STATUS_META[data.order.status].label}” (simulated).`);
      if (data.order.status === 'delivered') refreshUser().catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdvancing(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      const data = await api(`/orders/${id}/cancel`, { method: 'PATCH' });
      setOrder(data.order);
      setConfirmCancel(false);
      refreshUser().catch(() => {});
      toast.success('Order cancelled. Green Points for this order were reversed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted transition hover:text-forest"
      >
        <ArrowLeft size={14} /> Back to my orders
      </Link>

      {showPlacedBanner && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-mint-soft p-4">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-forest" />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-forest-deep">Order placed successfully!</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              You earned <strong className="text-forest">{order.eco.greenPointsEarned} Green Points</strong> and
              saved an estimated <strong className="text-forest">{order.eco.co2SavedKg.toFixed(3)} kg CO₂e</strong>.
              Payment is simulated — no money was charged.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPlacedBanner(false)}
            className="rounded-full p-1.5 text-ink-muted hover:bg-white/70"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow">
            <Clock size={13} /> Step 3 of 3 · Order tracking
          </span>
          <h1 className="section-title mt-2 text-4xl">Order {shortOrderId(order.id)}</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Placed {formatDateTime(order.createdAt)} · {order.restaurant?.name}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Tracking */}
          <section className="card overflow-hidden">
            <div className={`border-b border-sage p-5 ${isCancelled ? 'bg-red-50/60' : 'bg-mint-soft/60'}`}>
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    isCancelled ? 'bg-red-100 text-red-600' : 'bg-forest text-mint'
                  }`}
                >
                  {isCancelled ? <XCircle size={20} /> : <StatusIcon size={20} />}
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    {order.status === 'delivered' ? 'Delivered — enjoy your meal!' : meta.label}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{meta.description}</p>
                </div>
              </div>
            </div>

            {!isCancelled && (
              <div className="p-5">
                <ol className="flex items-start justify-between gap-1">
                  {ORDER_FLOW.map((step, index) => {
                    const stepMeta = STATUS_META[step];
                    const StepIcon = stepMeta.icon;
                    const done = index <= activeIndex;
                    const current = index === activeIndex;
                    return (
                      <li key={step} className="relative flex flex-1 flex-col items-center text-center">
                        {index > 0 && (
                          <span
                            className={`absolute left-0 top-4 h-0.5 w-[calc(100%-2.5rem)] -translate-x-1/2 ${
                              index <= activeIndex ? 'bg-forest' : 'bg-sage'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 transition ${
                            done
                              ? 'border-forest bg-forest text-mint'
                              : 'border-sage bg-white text-ink-muted'
                          } ${current ? 'ring-4 ring-mint' : ''}`}
                        >
                          <StepIcon size={14} />
                        </span>
                        <span
                          className={`mt-2 text-[9px] font-bold leading-tight sm:text-[10px] ${
                            done ? 'text-forest-deep' : 'text-ink-muted'
                          }`}
                        >
                          {stepMeta.short}
                        </span>
                        {historyByStatus.get(step) && (
                          <span className="mt-0.5 hidden text-[8px] font-semibold text-ink-muted sm:block">
                            {new Date(historyByStatus.get(step)).toLocaleTimeString('en-IN', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-5 rounded-2xl border border-dashed border-forest/20 bg-cream/70 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-ink">
                    <Info size={13} className="text-forest" /> This is a simulation
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                    No real rider is dispatched. Use the button below to move your order through the
                    next status and watch the tracker update, including delivery completion.
                  </p>
                  {!isDelivered && (
                    <button
                      type="button"
                      onClick={advance}
                      disabled={advancing}
                      className="btn btn-primary btn-sm mt-3"
                    >
                      {advancing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Updating…
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} /> Advance simulated status
                        </>
                      )}
                    </button>
                  )}
                </div>

                {!isDelivered && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="text-[11px] font-bold text-ink-muted transition hover:text-red-600"
                    >
                      Cancel this order
                    </button>
                  </div>
                )}
              </div>
            )}

            {isCancelled && (
              <div className="p-5">
                <p className="text-xs leading-relaxed text-ink-muted">
                  Cancelled {order.cancelledAt ? formatDateTime(order.cancelledAt) : ''}. Any Green
                  Points earned on this order were reversed, and the simulated payment is marked as
                  refunded.
                </p>
                <Link to="/restaurants" className="btn btn-secondary btn-sm mt-3">
                  Browse restaurants <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>

          {/* Courier card */}
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-forest">
                <DeliveryIcon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ink">{deliveryMeta.label}</p>
                <p className="text-[11px] text-ink-muted">
                  {deliveryMeta.description} · Demo courier
                </p>
              </div>
              <span className="rounded-full bg-sage px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-ink-muted">
                Simulated
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-cream/70 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                  <MapPin size={11} /> Delivering to
                </p>
                <p className="mt-1 font-semibold text-ink">
                  {order.address.label} · {order.address.line1}
                </p>
                <p className="text-ink-muted">
                  {order.address.area}, {order.address.city} – {order.address.pincode}
                </p>
              </div>
              <div className="rounded-xl bg-cream/70 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                  <Phone size={11} /> Contact
                </p>
                <p className="mt-1 font-semibold text-ink">+91 {order.contactPhone}</p>
                <p className="text-ink-muted">For delivery updates only</p>
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="card overflow-hidden">
            <div className="border-b border-sage p-5">
              <h2 className="font-display text-lg font-semibold">Items &amp; bill</h2>
              <p className="mt-0.5 text-xs text-ink-muted">From {order.restaurant?.name}</p>
            </div>
            <ul className="divide-y divide-sage">
              {order.items.map((item) => (
                <li key={item.name} className="flex items-center gap-3 p-4">
                  <span className="flex min-w-0 flex-1 items-start gap-2">
                    <span
                      className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-sm border-2 ${
                        item.isVeg ? 'border-emerald-600' : 'border-red-500'
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">{item.name}</span>
                      <span className="text-[11px] text-ink-muted">
                        {inr(item.price)} × {item.quantity}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-extrabold text-ink">{inr(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-sage p-4 text-xs">
              <div className="flex justify-between text-ink-muted">
                <dt>Item total</dt>
                <dd className="font-semibold text-ink">{inr(order.itemTotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Delivery fee</dt>
                <dd className="font-semibold text-ink">{order.deliveryFee === 0 ? 'FREE' : inr(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Packaging fee</dt>
                <dd className="font-semibold text-ink">{inr(order.packagingFee)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>GST (5%)</dt>
                <dd className="font-semibold text-ink">{inr(order.taxes)}</dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-forest/15 pt-2.5 text-sm font-extrabold text-ink">
                <dt>Total</dt>
                <dd>{inr(order.total)}</dd>
              </div>
              <div className="flex justify-between text-[10px] text-ink-muted">
                <dt>Payment</dt>
                <dd>
                  {PAYMENT_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Eco card */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-sage bg-mint-soft/70 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Leaf size={16} className="text-forest" /> Eco impact
              </h2>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                Compared with a petrol scooter and standard packaging with cutlery.
              </p>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Estimated CO₂e saved</p>
              <p className="mt-1 flex items-baseline gap-1 font-display text-4xl font-semibold text-forest">
                {order.eco.co2SavedKg.toFixed(3)}
                <span className="text-sm font-bold text-ink-muted">kg</span>
              </p>

              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-ink-muted">
                    <span>Baseline</span>
                    <span>{order.eco.baselineCo2Kg.toFixed(3)} kg</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sage">
                    <div className="h-full w-full rounded-full bg-stone-400" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-forest">
                    <span>This order</span>
                    <span>{order.eco.actualCo2Kg.toFixed(3)} kg</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sage">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{
                        width: `${Math.max(
                          4,
                          Math.round((order.eco.actualCo2Kg / Math.max(order.eco.baselineCo2Kg, 0.001)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-mint-soft px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-forest-deep">
                  <Sparkles size={13} /> Green Points
                </span>
                <span className="text-sm font-extrabold text-forest">+{order.eco.greenPointsEarned}</span>
              </div>

              <ul className="mt-4 space-y-2 text-[11px] text-ink-muted">
                <li className="flex items-center gap-2">
                  <DeliveryIcon size={13} className="text-forest" /> {deliveryMeta.label} · {order.eco.distanceKm} km
                </li>
                <li className="flex items-center gap-2">
                  <PackagingIcon size={13} className="text-forest" /> {packagingMeta.label} packaging
                </li>
                <li className="flex items-center gap-2">
                  {order.cutlery ? <Truck size={13} className="text-ink-muted" /> : <Bike size={13} className="text-forest" />}
                  {order.cutlery ? 'Disposable cutlery included' : 'No disposable cutlery'}
                </li>
              </ul>

              <p className="mt-4 border-t border-sage pt-3 text-[9px] leading-relaxed text-ink-muted">
                Estimates are directional and documented on the Eco dashboard. They are not a full
                life-cycle assessment.
              </p>
            </div>
          </div>

          <Link to="/eco" className="btn btn-secondary w-full">
            <Leaf size={15} /> Open eco dashboard
          </Link>
        </aside>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this order?"
        description="Cancelling reverses the Green Points earned and marks the simulated payment as refunded."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmCancel(false)}>
            Keep order
          </button>
          <button type="button" className="btn btn-danger" onClick={cancel} disabled={cancelling}>
            {cancelling ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Cancelling…
              </>
            ) : (
              'Yes, cancel order'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
