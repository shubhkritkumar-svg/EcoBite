import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Info,
  Leaf,
  Loader2,
  Package,
  Recycle,
  Sparkles,
  Sprout,
  TreePine,
  Trophy,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { formatDate } from '../lib/format.js';
import { DELIVERY_MODE_META, REWARD_TIER_META } from '../lib/constants.jsx';
import PageLoader from '../components/PageLoader.jsx';

const DELIVERY_ICONS = { bicycle: Bike, ev: Zap, standard: Package };

export default function EcoDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api('/rewards/summary')
      .then((data) => active && setSummary(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (loading) return <PageLoader label="Crunching your green numbers" />;

  if (error || !summary) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <AlertCircle size={30} className="mx-auto text-red-500" />
          <h1 className="mt-3 font-display text-2xl font-semibold">Could not load your dashboard</h1>
          <p className="mt-2 text-sm text-ink-muted">{error || 'Please try again.'}</p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => setReloadKey((v) => v + 1)}>
            <Loader2 size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const tierMeta = REWARD_TIER_META[summary.tier.name] || REWARD_TIER_META.Seedling;
  const TierIcon = tierMeta.icon;
  const maxModeSaved = Math.max(
    0.001,
    ...summary.savingsByMode.map((row) => Number(row.saved) || 0)
  );
  const a = summary.assumptions;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Leaf size={13} /> Eco dashboard
          </span>
          <h1 className="section-title mt-2 text-4xl">Your green journey</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Every eco choice is tracked, with the assumptions written down. Hello{' '}
            {user?.name?.split(' ')[0] || 'friend'} — here is what your orders have done so far.
          </p>
        </div>
        <Link to="/restaurants" className="btn btn-primary btn-sm">
          Order green <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
            <Sparkles size={12} className="text-forest" /> Green Points
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-forest">{summary.greenPoints}</p>
          <p className="mt-1 text-[11px] text-ink-muted">Earned across {summary.orderCount} orders</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
            <Leaf size={12} className="text-forest" /> CO₂e saved
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-ink">
            {summary.lifetimeSavingsKg.toFixed(2)}
            <span className="ml-1 text-sm font-bold text-ink-muted">kg</span>
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">Versus petrol delivery + standard packaging</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
            <TreePine size={12} className="text-forest" /> Trees equivalent
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-ink">{summary.treesEquivalent}</p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Using ~21 kg CO₂ absorbed per mature tree per year
          </p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
            <Recycle size={12} className="text-forest" /> Eco orders
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-ink">{summary.ecoOrderCount}</p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Orders with a measured carbon saving so far
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Tier */}
          <section className="card overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-mint ${tierMeta.color}`}>
                  <TierIcon size={26} />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-muted">
                    Current tier
                  </p>
                  <p className="font-display text-2xl font-semibold text-ink">{summary.tier.name}</p>
                </div>
              </div>
              <div className="sm:min-w-[240px]">
                {summary.tier.next ? (
                  <>
                    <div className="flex justify-between text-[10px] font-bold text-ink-muted">
                      <span>{summary.greenPoints} pts</span>
                      <span>{summary.tier.nextAt} pts for {summary.tier.next}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sage">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lime-400 to-forest"
                        style={{ width: `${summary.progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-ink-muted">
                      {Math.max(0, summary.tier.nextAt - summary.greenPoints)} points to the next tier
                    </p>
                  </>
                ) : (
                  <p className="rounded-xl bg-mint-soft px-3 py-2 text-[11px] font-bold text-forest">
                    <Trophy size={13} className="mr-1 inline" /> Top tier reached — keep the forest growing!
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-sage bg-sage sm:grid-cols-4">
              {[
                { name: 'Seedling', at: '0+' },
                { name: 'Sprout', at: '100+' },
                { name: 'Sapling', at: '250+' },
                { name: 'Forest Guardian', at: '500+' },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`bg-white px-3 py-2.5 text-center ${
                    tier.name === summary.tier.name ? 'bg-mint-soft' : ''
                  }`}
                >
                  <p className="text-[10px] font-extrabold text-ink">{tier.name}</p>
                  <p className="text-[9px] text-ink-muted">{tier.at} points</p>
                </div>
              ))}
            </div>
          </section>

          {/* Savings by mode */}
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">Savings by delivery mode</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Where your estimated CO₂e savings came from, per courier type.
                </p>
              </div>
              <Bike size={20} className="text-forest" />
            </div>

            {summary.savingsByMode.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-sage bg-cream/60 p-4 text-xs text-ink-muted">
                No completed orders yet. Place an order to see your first saving.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {summary.savingsByMode.map((row) => {
                  const mode = row._id || 'standard';
                  const meta = DELIVERY_MODE_META[mode] || DELIVERY_MODE_META.standard;
                  const Icon = DELIVERY_ICONS[mode] || Package;
                  const saved = Number(row.saved) || 0;
                  return (
                    <li key={mode}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 font-bold text-ink">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-mint text-forest">
                            <Icon size={13} />
                          </span>
                          {meta.label}
                          <span className="text-[10px] font-semibold text-ink-muted">
                            {row.orders} {row.orders === 1 ? 'order' : 'orders'}
                          </span>
                        </span>
                        <span className="font-extrabold text-forest">{saved.toFixed(3)} kg</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sage">
                        <div
                          className="h-full rounded-full bg-forest"
                          style={{ width: `${Math.max(3, Math.round((saved / maxModeSaved) * 100))}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Ledger */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-sage p-5">
              <div>
                <h2 className="font-display text-xl font-semibold">Green Points ledger</h2>
                <p className="mt-1 text-xs text-ink-muted">Latest first. Cancellations reverse points.</p>
              </div>
              <Link to="/profile" className="text-[11px] font-bold text-forest hover:underline">
                View orders
              </Link>
            </div>
            {summary.ledger.length === 0 ? (
              <p className="p-5 text-xs text-ink-muted">
                No points yet. Choose an EV or bicycle courier, eco packaging or skip cutlery to start.
              </p>
            ) : (
              <ul className="divide-y divide-sage">
                {summary.ledger.map((entry) => (
                  <li key={entry.id || entry._id} className="flex items-center gap-3 p-4">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        entry.points >= 0 ? 'bg-mint text-forest' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {entry.points >= 0 ? <Sprout size={16} /> : <UtensilsCrossed size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink">{entry.description}</p>
                      <p className="text-[10px] text-ink-muted">
                        {formatDate(entry.createdAt)} · CO₂e {entry.co2SavedKg >= 0 ? '−' : '+'}
                        {Math.abs(entry.co2SavedKg).toFixed(3)} kg
                      </p>
                    </div>
                    <span
                      className={`text-sm font-extrabold ${
                        entry.points >= 0 ? 'text-forest' : 'text-red-600'
                      }`}
                    >
                      {entry.points >= 0 ? '+' : ''}
                      {entry.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Sparkles size={16} className="text-forest" /> How to earn points
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs">
              {[
                { icon: Zap, label: 'Pick EV or bicycle delivery', points: `+${a.points?.lowCarbonDelivery ?? 10}` },
                { icon: Recycle, label: 'Choose compostable or reusable packaging', points: `+${a.points?.ecoPackaging ?? 10}` },
                { icon: UtensilsCrossed, label: 'Skip disposable cutlery', points: `+${a.points?.noCutlery ?? 5}` },
              ].map(({ icon: Icon, label, points }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mint-soft text-forest">
                    <Icon size={13} />
                  </span>
                  <span className="flex-1 text-ink">{label}</span>
                  <span className="font-extrabold text-forest">{points}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-forest/15 bg-mint-soft p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-deep">
              <Info size={16} /> Calculation assumptions
            </h2>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
              These are simplified, documented factors for comparing choices on the same order — not
              a full life-cycle assessment.
            </p>
            <dl className="mt-3 space-y-1.5 text-[10px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Petrol scooter</dt>
                <dd className="font-bold text-ink">{a.petrolTwoWheelerKgPerKm} kg CO₂e/km</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Electric scooter</dt>
                <dd className="font-bold text-ink">{a.electricScooterKgPerKm} kg CO₂e/km</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Bicycle courier</dt>
                <dd className="font-bold text-ink">0 kg CO₂e/km</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Standard packaging</dt>
                <dd className="font-bold text-ink">{a.packagingKg.standard} kg/order</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Compostable packaging</dt>
                <dd className="font-bold text-ink">{a.packagingKg.compostable} kg/order</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Reusable tiffin</dt>
                <dd className="font-bold text-ink">{a.packagingKg.reusable} kg/order</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Single-use cutlery set</dt>
                <dd className="font-bold text-ink">{a.cutleryKg} kg/order</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-forest/10 pt-2.5 text-[9px] leading-relaxed text-ink-muted">
              Sources and reasoning are listed in the project README and docs/API.md. A typical tree
              absorbs about 21 kg CO₂ per year (used for the trees equivalent).
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
