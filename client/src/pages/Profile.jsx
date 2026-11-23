import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { formatDate, initials, inr, shortOrderId } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

const tierFor = (points) => {
  if (points >= 500) return 'Forest Guardian';
  if (points >= 250) return 'Sapling';
  if (points >= 100) return 'Sprout';
  return 'Seedling';
};

const getId = (address) => address.id || address._id;

const emptyAddress = { label: 'Home', line1: '', area: '', city: 'Bengaluru', pincode: '' };

export default function Profile() {
  const { user, setUser, refreshUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('orders');

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersMeta, setOrdersMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [addressModal, setAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    setOrdersError('');
    api(`/orders?page=${page}`)
      .then((data) => {
        if (!active) return;
        setOrders(data.orders);
        setOrdersMeta({ total: data.total, page: data.page, pages: data.pages });
      })
      .catch((error) => active && setOrdersError(error.message))
      .finally(() => active && setOrdersLoading(false));
    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  useEffect(() => {
    if (user) setProfile({ name: user.name, phone: user.phone || '' });
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    if (profile.name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters.');
      return;
    }
    if (profile.phone && !/^[6-9]\d{9}$/.test(profile.phone.trim())) {
      setProfileError('Enter a valid 10-digit Indian mobile number, or leave it empty.');
      return;
    }
    setSavingProfile(true);
    try {
      const data = await api('/users/me', {
        method: 'PATCH',
        body: { name: profile.name.trim(), phone: profile.phone.trim() },
      });
      setUser(data.user);
      toast.success('Profile updated.');
    } catch (error) {
      setProfileError(error.errors?.[0]?.message || error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const addAddress = async (event) => {
    event.preventDefault();
    setAddressError('');
    if (
      newAddress.line1.trim().length < 5 ||
      newAddress.area.trim().length < 2 ||
      newAddress.city.trim().length < 2
    ) {
      setAddressError('Fill flat/street, area and city.');
      return;
    }
    if (!/^[1-9]\d{5}$/.test(newAddress.pincode.trim())) {
      setAddressError('Enter a valid 6-digit pincode.');
      return;
    }
    setSavingAddress(true);
    try {
      await api('/users/me/addresses', {
        method: 'POST',
        body: {
          label: newAddress.label.trim() || 'Home',
          line1: newAddress.line1.trim(),
          area: newAddress.area.trim(),
          city: newAddress.city.trim(),
          pincode: newAddress.pincode.trim(),
          isDefault: (user.addresses?.length || 0) === 0,
        },
      });
      await refreshUser();
      setAddressModal(false);
      setNewAddress(emptyAddress);
      toast.success('Address saved.');
    } catch (error) {
      setAddressError(error.errors?.[0]?.message || error.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (addressId) => {
    setDeletingId(addressId);
    try {
      await api(`/users/me/addresses/${addressId}`, { method: 'DELETE' });
      await refreshUser();
      toast.success('Address removed.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId('');
    }
  };

  if (!user) return null;

  const addresses = user.addresses || [];
  const tier = tierFor(user.greenPoints);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <UserRound size={13} /> Your account
          </span>
          <h1 className="section-title mt-2 text-4xl">Namaste, {user.name.split(' ')[0]}</h1>
          <p className="mt-2 text-sm text-ink-muted">Manage your details and revisit every order.</p>
        </div>
        <Link to="/eco" className="btn btn-secondary btn-sm">
          <Leaf size={14} /> Eco dashboard
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest font-display text-lg font-semibold text-mint">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-ink">{user.name}</p>
                <p className="truncate text-xs text-ink-muted">{user.email}</p>
                {user.role === 'admin' && (
                  <span className="mt-1 inline-block rounded-full bg-ink px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Admin
                  </span>
                )}
              </div>
            </div>
            <dl className="mt-4 space-y-2 border-t border-sage pt-4 text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Member since</dt>
                <dd className="font-semibold text-ink">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Phone</dt>
                <dd className="font-semibold text-ink">{user.phone ? `+91 ${user.phone}` : 'Not set'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Green tier</dt>
                <dd className="font-semibold text-forest">{tier}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-forest-deep p-5 text-white">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-mint">
              <Sparkles size={12} /> Your impact
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="font-display text-2xl font-semibold">{user.greenPoints}</p>
                <p className="text-[10px] text-white/60">Green Points</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">
                  {Number(user.lifetimeSavingsKg || 0).toFixed(1)}
                  <span className="ml-0.5 text-xs">kg</span>
                </p>
                <p className="text-[10px] text-white/60">CO₂e saved</p>
              </div>
            </div>
            <Link
              to="/eco"
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-mint hover:underline"
            >
              See the full breakdown <ArrowRight size={12} />
            </Link>
          </div>

          <div className="card p-2">
            {[
              { id: 'orders', label: 'Order history', icon: ShoppingBag },
              { id: 'settings', label: 'Profile & addresses', icon: Pencil },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  tab === id ? 'bg-mint text-forest-deep' : 'text-ink-muted hover:bg-cream hover:text-ink'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </aside>

        <section>
          {tab === 'orders' ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold">Order history</h2>
                {ordersMeta.total > 0 && (
                  <span className="text-xs font-semibold text-ink-muted">{ordersMeta.total} orders</span>
                )}
              </div>

              {ordersLoading ? (
                <div className="mt-5 space-y-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="skeleton h-28 rounded-2xl" />
                  ))}
                </div>
              ) : ordersError ? (
                <div className="mt-5 card p-6 text-center">
                  <AlertCircle className="mx-auto text-red-500" size={26} />
                  <p className="mt-2 text-sm font-semibold text-ink">{ordersError}</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-3"
                    onClick={() => setReloadKey((value) => value + 1)}
                  >
                    Try again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  className="mt-5"
                  icon={Package}
                  title="No orders yet"
                  description="Your first eco-friendly meal is one tap away. Order from a green kitchen to start collecting Green Points."
                  action={
                    <Link to="/restaurants" className="btn btn-primary">
                      Explore restaurants <ArrowRight size={15} />
                    </Link>
                  }
                />
              ) : (
                <>
                  <ul className="mt-5 space-y-3">
                    {orders.map((order) => (
                      <li key={order.id}>
                        <Link
                          to={`/orders/${order.id}`}
                          className="card group flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:border-forest/20 sm:flex-row sm:items-center"
                        >
                          <img
                            src={order.restaurant?.image}
                            alt={order.restaurant?.name}
                            className="h-16 w-full rounded-xl object-cover sm:w-20"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-base font-semibold text-ink">
                                {order.restaurant?.name}
                              </p>
                              <StatusBadge status={order.status} short />
                            </div>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-muted">
                              <span className="font-semibold">{shortOrderId(order.id)}</span>
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays size={10} /> {formatDate(order.createdAt)}
                              </span>
                              <span>{order.items?.length || 0} items</span>
                            </p>
                            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                              <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-forest">
                                <Leaf size={10} /> {order.eco?.co2SavedKg?.toFixed?.(3) ?? 0} kg saved
                              </span>
                              <span className="text-ink-muted">+{order.eco?.greenPointsEarned || 0} points</span>
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                            <p className="text-sm font-extrabold text-ink">{inr(order.total)}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest">
                              Track <ArrowRight size={11} className="transition group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {ordersMeta.pages > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={page <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <span className="text-xs font-bold text-ink-muted">
                        Page {ordersMeta.page} of {ordersMeta.pages}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={page >= ordersMeta.pages}
                        onClick={() => setPage((value) => Math.min(ordersMeta.pages, value + 1))}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <form onSubmit={saveProfile} className="card p-5 sm:p-6">
                <h2 className="font-display text-2xl font-semibold">Profile details</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Your email is used for sign in and cannot be changed in this demo.
                </p>

                {profileError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> {profileError}
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="profile-name">Full name</label>
                    <input
                      id="profile-name"
                      className="input"
                      value={profile.name}
                      onChange={(event) => setProfile((p) => ({ ...p, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="profile-phone">Mobile number</label>
                    <input
                      id="profile-phone"
                      className="input"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={profile.phone}
                      onChange={(event) =>
                        setProfile((p) => ({ ...p, phone: event.target.value.replace(/\D/g, '') }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input className="input pl-10 text-ink-muted" value={user.email} disabled />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </button>
                </div>
              </form>

              <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Saved addresses</h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      Pick any of these at checkout for one-tap ordering.
                    </p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddressModal(true)}>
                    <Plus size={14} /> Add address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-sage bg-cream/70 p-4 text-xs text-ink-muted">
                    No saved addresses yet. Add one now, or save it during your next checkout.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {addresses.map((address) => {
                      const id = getId(address);
                      return (
                        <li
                          key={id}
                          className="flex items-start justify-between gap-3 rounded-2xl border border-sage p-3.5"
                        >
                          <div className="flex min-w-0 gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint text-forest">
                              <MapPin size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-ink">
                                {address.label || 'Home'}
                                {address.isDefault && (
                                  <span className="rounded-full bg-mint-soft px-1.5 py-0.5 text-[9px] font-bold text-forest">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                                {address.line1}, {address.area}, {address.city} – {address.pincode}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAddress(id)}
                            disabled={deletingId === id}
                            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${address.label} address`}
                          >
                            {deletingId === id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={addressModal}
        onClose={() => {
          setAddressModal(false);
          setAddressError('');
        }}
        title="Add a delivery address"
        description="Saved addresses are available at checkout."
      >
        <form onSubmit={addAddress} className="space-y-3">
          {addressError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {addressError}
            </div>
          )}
          <div>
            <label className="label" htmlFor="new-label">Label</label>
            <input
              id="new-label"
              className="input"
              maxLength={30}
              value={newAddress.label}
              onChange={(event) => setNewAddress((p) => ({ ...p, label: event.target.value }))}
              placeholder="Home / Work"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-line1">Flat / house, street</label>
            <input
              id="new-line1"
              className="input"
              value={newAddress.line1}
              onChange={(event) => setNewAddress((p) => ({ ...p, line1: event.target.value }))}
              placeholder="Flat 402, Green Meadows, 12th Main"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="new-area">Area</label>
              <input
                id="new-area"
                className="input"
                value={newAddress.area}
                onChange={(event) => setNewAddress((p) => ({ ...p, area: event.target.value }))}
                placeholder="Indiranagar"
              />
            </div>
            <div>
              <label className="label" htmlFor="new-city">City</label>
              <input
                id="new-city"
                className="input"
                value={newAddress.city}
                onChange={(event) => setNewAddress((p) => ({ ...p, city: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="new-pincode">Pincode</label>
            <input
              id="new-pincode"
              className="input max-w-[160px]"
              inputMode="numeric"
              maxLength={6}
              value={newAddress.pincode}
              onChange={(event) => setNewAddress((p) => ({ ...p, pincode: event.target.value.replace(/\D/g, '') }))}
              placeholder="560038"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setAddressModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingAddress}>
              {savingAddress ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving…
                </>
              ) : (
                'Save address'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
