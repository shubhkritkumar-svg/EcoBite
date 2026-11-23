import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  Leaf,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Users,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDate, inr, shortOrderId } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CUISINES = [
  'North Indian',
  'South Indian',
  'Healthy',
  'Italian',
  'Chinese',
  'Street Food',
  'Mughlai',
  'Seafood',
  'Continental',
  'Desserts',
  'Beverages',
];
const CRITERIA = [
  'Compostable packaging',
  'EV or bicycle delivery fleet',
  'Locally sourced ingredients',
  'Low-waste kitchen',
  'Plant-forward menu',
];
const MODES = ['standard', 'ev', 'bicycle'];
const PACKAGING = ['standard', 'compostable', 'reusable'];
const CATEGORIES = ['Starters', 'Mains', 'Breads', 'Rice & Biryani', 'Desserts', 'Drinks'];
const SPICE_LEVELS = ['None', 'Mild', 'Medium', 'Hot'];
const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';
const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

const emptyRestaurant = {
  name: '',
  description: '',
  cuisines: ['North Indian'],
  area: '',
  city: 'Bengaluru',
  image: DEFAULT_RESTAURANT_IMAGE,
  priceForTwo: 400,
  deliveryTimeMins: 30,
  distanceKm: 2.5,
  isEcoCertified: false,
  ecoCriteria: [],
  deliveryModes: ['standard', 'ev'],
  packagingOptions: ['standard', 'compostable'],
  isActive: true,
};

const emptyMenu = {
  name: '',
  description: '',
  price: 249,
  category: 'Mains',
  image: DEFAULT_FOOD_IMAGE,
  isVeg: true,
  isVegan: false,
  spiceLevel: 'Mild',
  calories: 300,
  available: true,
};

const toggleValue = (list, value) =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

function ChipGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <label
            key={option}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize transition ${
              active ? 'border-forest bg-mint text-forest-deep' : 'border-sage bg-white text-ink-muted'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={active}
              onChange={() => onToggle(option)}
            />
            {active && <Check size={10} strokeWidth={3} />}
            {option}
          </label>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const [tab, setTab] = useState('orders');
  const [adminError, setAdminError] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  const [orders, setOrders] = useState([]);
  const [ordersMeta, setOrdersMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const [menuRestaurantId, setMenuRestaurantId] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuReloadKey, setMenuReloadKey] = useState(0);

  const [restaurantModal, setRestaurantModal] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [restaurantError, setRestaurantError] = useState('');
  const [savingRestaurant, setSavingRestaurant] = useState(false);

  const [menuModal, setMenuModal] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState(emptyMenu);
  const [menuError, setMenuError] = useState('');
  const [savingMenu, setSavingMenu] = useState(false);

  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingStats(true);
    setAdminError('');
    Promise.all([api('/admin/stats'), api('/admin/restaurants')])
      .then(([statsData, restaurantData]) => {
        if (!active) return;
        setStats(statsData.stats);
        setRestaurants(restaurantData.restaurants);
        setMenuRestaurantId((current) => current || restaurantData.restaurants[0]?.id || '');
      })
      .catch((error) => active && setAdminError(error.message))
      .finally(() => active && setLoadingStats(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusFilter });
    if (searchTerm) params.set('search', searchTerm);
    api(`/admin/orders?${params.toString()}`)
      .then((data) => {
        if (!active) return;
        setOrders(data.orders);
        setOrdersMeta({ total: data.total, page: data.page, pages: data.pages });
      })
      .catch((error) => active && toast.error(error.message))
      .finally(() => active && setOrdersLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchTerm, reloadKey]);

  useEffect(() => {
    if (!menuRestaurantId) {
      setMenuItems([]);
      return undefined;
    }
    let active = true;
    setMenuLoading(true);
    api(`/menu-items?restaurantId=${menuRestaurantId}`)
      .then((data) => active && setMenuItems(data.items))
      .catch((error) => active && toast.error(error.message))
      .finally(() => active && setMenuLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuRestaurantId, menuReloadKey]);

  const reloadAdmin = () => setReloadKey((value) => value + 1);

  /* ------------------------------- orders ------------------------------- */

  const updateOrderStatus = async (order, status) => {
    if (status === order.status) return;
    setUpdatingOrderId(order.id);
    try {
      await api(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status } });
      toast.success(`Order ${shortOrderId(order.id)} updated to ${status.replaceAll('_', ' ')}.`);
      setOrders((current) => current.map((entry) => (entry.id === order.id ? { ...entry, status } : entry)));
      reloadAdmin();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingOrderId('');
    }
  };

  const applySearch = (event) => {
    event.preventDefault();
    setSearchTerm(searchDraft.trim());
    setPage(1);
  };

  /* ----------------------------- restaurants ---------------------------- */

  const openCreateRestaurant = () => {
    setEditingRestaurantId(null);
    setRestaurantForm(emptyRestaurant);
    setRestaurantError('');
    setRestaurantModal(true);
  };

  const openEditRestaurant = (restaurant) => {
    setEditingRestaurantId(restaurant.id);
    setRestaurantForm({
      name: restaurant.name,
      description: restaurant.description,
      cuisines: restaurant.cuisines,
      area: restaurant.area,
      city: restaurant.city,
      image: restaurant.image,
      priceForTwo: restaurant.priceForTwo,
      deliveryTimeMins: restaurant.deliveryTimeMins,
      distanceKm: restaurant.distanceKm,
      isEcoCertified: restaurant.isEcoCertified,
      ecoCriteria: restaurant.ecoCriteria || [],
      deliveryModes: restaurant.deliveryModes?.length ? restaurant.deliveryModes : ['standard'],
      packagingOptions: restaurant.packagingOptions?.length
        ? restaurant.packagingOptions
        : ['standard', 'compostable'],
      isActive: restaurant.isActive,
    });
    setRestaurantError('');
    setRestaurantModal(true);
  };

  const submitRestaurant = async (event) => {
    event.preventDefault();
    setRestaurantError('');
    if (
      restaurantForm.name.trim().length < 2 ||
      restaurantForm.description.trim().length < 10 ||
      restaurantForm.area.trim().length < 2 ||
      restaurantForm.cuisines.length === 0 ||
      !restaurantForm.deliveryModes.length ||
      !restaurantForm.packagingOptions.length ||
      !/^https?:\/\//.test(restaurantForm.image)
    ) {
      setRestaurantError(
        'Fill name, description (10+ chars), area, image URL and at least one cuisine, delivery mode and packaging option.'
      );
      return;
    }

    const payload = {
      name: restaurantForm.name.trim(),
      description: restaurantForm.description.trim(),
      cuisines: restaurantForm.cuisines,
      area: restaurantForm.area.trim(),
      city: restaurantForm.city.trim(),
      image: restaurantForm.image.trim(),
      priceForTwo: Number(restaurantForm.priceForTwo),
      deliveryTimeMins: Number(restaurantForm.deliveryTimeMins),
      distanceKm: Number(restaurantForm.distanceKm),
      isEcoCertified: restaurantForm.isEcoCertified,
      ecoCriteria: restaurantForm.ecoCriteria,
      deliveryModes: restaurantForm.deliveryModes,
      packagingOptions: restaurantForm.packagingOptions,
      isActive: restaurantForm.isActive,
    };

    setSavingRestaurant(true);
    try {
      if (editingRestaurantId) {
        await api(`/restaurants/${editingRestaurantId}`, { method: 'PUT', body: payload });
        toast.success('Restaurant updated.');
      } else {
        await api('/restaurants', { method: 'POST', body: payload });
        toast.success('Restaurant created.');
      }
      setRestaurantModal(false);
      reloadAdmin();
    } catch (error) {
      setRestaurantError(error.errors?.[0]?.message || error.message);
    } finally {
      setSavingRestaurant(false);
    }
  };

  const toggleRestaurantActive = async (restaurant) => {
    try {
      await api(`/restaurants/${restaurant.id}`, {
        method: 'PUT',
        body: { isActive: !restaurant.isActive },
      });
      toast.success(`${restaurant.name} is now ${restaurant.isActive ? 'inactive' : 'active'}.`);
      reloadAdmin();
    } catch (error) {
      toast.error(error.message);
    }
  };

  /* -------------------------------- menus ------------------------------- */

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === menuRestaurantId);

  const openCreateMenu = () => {
    setEditingMenuId(null);
    setMenuForm(emptyMenu);
    setMenuError('');
    setMenuModal(true);
  };

  const openEditMenu = (item) => {
    setEditingMenuId(item.id);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      isVeg: item.isVeg,
      isVegan: item.isVegan,
      spiceLevel: item.spiceLevel,
      calories: item.calories,
      available: item.available,
    });
    setMenuError('');
    setMenuModal(true);
  };

  const submitMenu = async (event) => {
    event.preventDefault();
    setMenuError('');
    if (
      menuForm.name.trim().length < 2 ||
      menuForm.description.trim().length < 5 ||
      !/^https?:\/\//.test(menuForm.image) ||
      Number(menuForm.price) < 1
    ) {
      setMenuError('Fill the name, description (5+ chars), image URL and a price of at least ₹1.');
      return;
    }

    const payload = {
      name: menuForm.name.trim(),
      description: menuForm.description.trim(),
      price: Number(menuForm.price),
      category: menuForm.category,
      image: menuForm.image.trim(),
      isVeg: menuForm.isVeg,
      isVegan: menuForm.isVegan,
      spiceLevel: menuForm.spiceLevel,
      calories: Number(menuForm.calories) || 0,
      available: menuForm.available,
    };

    setSavingMenu(true);
    try {
      if (editingMenuId) {
        await api(`/menu-items/${editingMenuId}`, { method: 'PUT', body: payload });
        toast.success('Menu item updated.');
      } else {
        await api('/menu-items', {
          method: 'POST',
          body: { ...payload, restaurant: menuRestaurantId },
        });
        toast.success('Menu item added.');
      }
      setMenuModal(false);
      setMenuReloadKey((value) => value + 1);
      reloadAdmin();
    } catch (error) {
      setMenuError(error.errors?.[0]?.message || error.message);
    } finally {
      setSavingMenu(false);
    }
  };

  const toggleMenuAvailable = async (item) => {
    try {
      await api(`/menu-items/${item.id}`, { method: 'PUT', body: { available: !item.available } });
      setMenuItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, available: !entry.available } : entry))
      );
      toast.success(`${item.name} is now ${item.available ? 'unavailable' : 'available'}.`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  /* ------------------------------ deletes ------------------------------- */

  const runDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.kind === 'restaurant') {
        await api(`/restaurants/${confirm.id}`, { method: 'DELETE' });
        toast.success('Restaurant deleted.');
        if (menuRestaurantId === confirm.id) {
          setMenuRestaurantId('');
          setMenuItems([]);
        }
      } else {
        await api(`/menu-items/${confirm.id}`, { method: 'DELETE' });
        toast.success('Menu item deleted.');
        setMenuReloadKey((value) => value + 1);
      }
      setConfirm(null);
      reloadAdmin();
    } catch (error) {
      toast.error(error.message);
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loadingStats && !stats) return <PageLoader label="Loading the admin console" />;

  if (adminError && !stats) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <AlertCircle size={30} className="mx-auto text-red-500" />
          <h1 className="mt-3 font-display text-2xl font-semibold">Admin data unavailable</h1>
          <p className="mt-2 text-sm text-ink-muted">{adminError}</p>
          <button type="button" className="btn btn-primary mt-5" onClick={reloadAdmin}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total orders', value: stats.orderCount, icon: ShoppingBag },
    { label: 'Active orders', value: stats.activeOrders, icon: Clock },
    { label: 'Customers', value: stats.customerCount, icon: Users },
    { label: 'Restaurants', value: stats.restaurantCount, icon: Store },
    { label: 'Revenue (non-cancelled)', value: inr(stats.revenue), icon: IndianRupee },
    { label: 'Avg order value', value: inr(stats.avgOrderValue), icon: Receipt },
    { label: 'CO₂e saved', value: `${stats.co2SavedKg} kg`, icon: Leaf },
    { label: 'Green Points awarded', value: stats.greenPointsAwarded, icon: Sparkles },
  ];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Admin console
          </span>
          <h1 className="section-title mt-2 text-4xl">Operations dashboard</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Manage orders, restaurants and menus. Changes are saved to MongoDB immediately.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={reloadAdmin}>
          <RefreshCw size={14} /> Refresh data
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">{label}</p>
              <Icon size={15} className="text-forest" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 inline-flex rounded-xl border border-sage bg-white p-1">
        {[
          { id: 'orders', label: 'Orders' },
          { id: 'restaurants', label: 'Restaurants' },
          { id: 'menus', label: 'Menu items' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === item.id ? 'bg-forest text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <section className="card mt-4 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sage p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input w-auto py-2 text-xs"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <form onSubmit={applySearch} className="flex items-center gap-1.5">
                <input
                  className="input w-52 py-2 text-xs"
                  placeholder="Customer name, email or order id"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  <Search size={13} />
                </button>
              </form>
              {searchTerm && (
                <button
                  type="button"
                  className="text-[10px] font-bold text-ink-muted underline"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchDraft('');
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">{ordersMeta.total} orders</p>
          </div>

          {ordersLoading ? (
            <div className="skeleton m-4 h-48 rounded-xl" />
          ) : orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-muted">No orders match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-cream/80 text-[10px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Restaurant</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Set status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage">
                  {orders.map((order) => {
                    const locked = order.status === 'delivered' || order.status === 'cancelled';
                    return (
                      <tr key={order.id} className="hover:bg-cream/40">
                        <td className="px-4 py-3 font-bold text-forest">{shortOrderId(order.id)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-ink">{order.user?.name || 'Deleted user'}</p>
                          <p className="text-[10px] text-ink-muted">{order.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-ink">{order.restaurant?.name}</td>
                        <td className="px-4 py-3 text-ink-muted">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 font-bold text-ink">{inr(order.total)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} short />
                        </td>
                        <td className="px-4 py-3">
                          {locked ? (
                            <span className="text-[10px] font-semibold text-ink-muted">Final</span>
                          ) : (
                            <select
                              className="input w-36 py-1.5 text-[11px]"
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onChange={(event) => updateOrderStatus(order, event.target.value)}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll('_', ' ')}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {ordersMeta.pages > 1 && (
            <div className="flex items-center justify-between border-t border-sage p-4">
              <p className="text-[11px] text-ink-muted">
                Page {ordersMeta.page} of {ordersMeta.pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= ordersMeta.pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'restaurants' && (
        <section className="card mt-4 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-sage p-4">
            <p className="text-sm font-extrabold text-ink">All restaurants ({restaurants.length})</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateRestaurant}>
              <Plus size={14} /> Add restaurant
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-cream/80 text-[10px] uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Cuisines</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={restaurant.image}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-bold text-ink">{restaurant.name}</p>
                          <p className="text-[10px] text-ink-muted">
                            {restaurant.ecoBadge || 'No eco badge'} · ₹{restaurant.priceForTwo} for two
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {restaurant.area}
                      <br />
                      <span className="text-[10px]">{restaurant.city}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{restaurant.cuisines.join(', ')}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{restaurant.menuItemCount}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleRestaurantActive(restaurant)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                          restaurant.isActive
                            ? 'bg-mint text-forest'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                        title="Click to toggle"
                      >
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditRestaurant(restaurant)}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setMenuRestaurantId(restaurant.id);
                            setTab('menus');
                          }}
                        >
                          Menu
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-red-600"
                          onClick={() =>
                            setConfirm({ kind: 'restaurant', id: restaurant.id, name: restaurant.name })
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-sage p-3 text-[10px] text-ink-muted">
            A restaurant with order history cannot be deleted (to protect records). Deactivate it instead.
          </p>
        </section>
      )}

      {tab === 'menus' && (
        <section className="card mt-4 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sage p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="label mb-1" htmlFor="menu-restaurant">
                Restaurant
              </label>
              <select
                id="menu-restaurant"
                className="input w-64 py-2 text-xs"
                value={menuRestaurantId}
                onChange={(event) => setMenuRestaurantId(event.target.value)}
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openCreateMenu}
              disabled={!menuRestaurantId}
            >
              <Plus size={14} /> Add menu item
            </button>
          </div>

          {!menuRestaurantId ? (
            <p className="p-6 text-center text-sm text-ink-muted">Choose a restaurant to manage its menu.</p>
          ) : menuLoading ? (
            <div className="skeleton m-4 h-40 rounded-xl" />
          ) : menuItems.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-ink-muted">
                {selectedRestaurant?.name} has no menu items yet.
              </p>
              <button type="button" className="btn btn-primary btn-sm mt-3" onClick={openCreateMenu}>
                <Plus size={14} /> Add the first item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="bg-cream/80 text-[10px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-cream/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={item.image} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                          <div>
                            <p className="font-bold text-ink">{item.name}</p>
                            <p className="max-w-[220px] truncate text-[10px] text-ink-muted">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{item.category}</td>
                      <td className="px-4 py-3 font-bold text-ink">{inr(item.price)}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {item.isVeg ? 'Veg' : 'Non-veg'}
                        {item.isVegan ? ' · Vegan' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleMenuAvailable(item)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                            item.available ? 'bg-mint text-forest' : 'bg-stone-100 text-stone-600'
                          }`}
                          title="Click to toggle"
                        >
                          {item.available ? 'Available' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditMenu(item)}>
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-red-600"
                            onClick={() => setConfirm({ kind: 'menu', id: item.id, name: item.name })}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Restaurant form */}
      <Modal
        open={restaurantModal}
        onClose={() => setRestaurantModal(false)}
        title={editingRestaurantId ? 'Edit restaurant' : 'Add a restaurant'}
        description="Slug is generated from the name automatically."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submitRestaurant} className="space-y-3">
          {restaurantError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {restaurantError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="r-name">Name</label>
              <input
                id="r-name"
                className="input"
                value={restaurantForm.name}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, name: event.target.value }))}
                placeholder="The Green Tiffin"
              />
            </div>
            <div>
              <label className="label" htmlFor="r-area">Area</label>
              <input
                id="r-area"
                className="input"
                value={restaurantForm.area}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, area: event.target.value }))}
                placeholder="Indiranagar"
              />
            </div>
            <div>
              <label className="label" htmlFor="r-city">City</label>
              <input
                id="r-city"
                className="input"
                value={restaurantForm.city}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, city: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="r-image">Image URL</label>
              <input
                id="r-image"
                className="input"
                value={restaurantForm.image}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, image: event.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="r-description">Description</label>
              <textarea
                id="r-description"
                className="input min-h-20"
                value={restaurantForm.description}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, description: event.target.value }))}
                placeholder="A short description of the kitchen and its eco practices."
              />
            </div>
            <div>
              <label className="label" htmlFor="r-price">Price for two (₹)</label>
              <input
                id="r-price"
                type="number"
                min="100"
                className="input"
                value={restaurantForm.priceForTwo}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, priceForTwo: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="r-time">Delivery time (mins)</label>
              <input
                id="r-time"
                type="number"
                min="5"
                max="120"
                className="input"
                value={restaurantForm.deliveryTimeMins}
                onChange={(event) =>
                  setRestaurantForm((p) => ({ ...p, deliveryTimeMins: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="r-distance">Distance (km)</label>
              <input
                id="r-distance"
                type="number"
                min="0"
                step="0.1"
                className="input"
                value={restaurantForm.distanceKm}
                onChange={(event) => setRestaurantForm((p) => ({ ...p, distanceKm: event.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2 text-xs font-bold text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-sage text-forest focus:ring-forest"
                  checked={restaurantForm.isActive}
                  onChange={(event) => setRestaurantForm((p) => ({ ...p, isActive: event.target.checked }))}
                />
                Active (visible to customers)
              </label>
            </div>
          </div>

          <div>
            <p className="label mb-1.5">Cuisines</p>
            <ChipGroup
              options={CUISINES}
              selected={restaurantForm.cuisines}
              onToggle={(value) =>
                setRestaurantForm((p) => ({ ...p, cuisines: toggleValue(p.cuisines, value) }))
              }
            />
          </div>

          <div>
            <p className="label mb-1.5">Delivery modes</p>
            <ChipGroup
              options={MODES}
              selected={restaurantForm.deliveryModes}
              onToggle={(value) =>
                setRestaurantForm((p) => ({ ...p, deliveryModes: toggleValue(p.deliveryModes, value) }))
              }
            />
          </div>

          <div>
            <p className="label mb-1.5">Packaging options</p>
            <ChipGroup
              options={PACKAGING}
              selected={restaurantForm.packagingOptions}
              onToggle={(value) =>
                setRestaurantForm((p) => ({
                  ...p,
                  packagingOptions: toggleValue(p.packagingOptions, value),
                }))
              }
            />
          </div>

          <div>
            <p className="label mb-1.5">Eco criteria</p>
            <ChipGroup
              options={CRITERIA}
              selected={restaurantForm.ecoCriteria}
              onToggle={(value) =>
                setRestaurantForm((p) => ({ ...p, ecoCriteria: toggleValue(p.ecoCriteria, value) }))
              }
            />
            <label className="mt-2 flex items-center gap-2 text-xs font-bold text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sage text-forest focus:ring-forest"
                checked={restaurantForm.isEcoCertified}
                onChange={(event) =>
                  setRestaurantForm((p) => ({ ...p, isEcoCertified: event.target.checked }))
                }
              />
              Eco Certified badge
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-sage pt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setRestaurantModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingRestaurant}>
              {savingRestaurant ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving…
                </>
              ) : editingRestaurantId ? (
                'Save changes'
              ) : (
                'Create restaurant'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Menu form */}
      <Modal
        open={menuModal}
        onClose={() => setMenuModal(false)}
        title={editingMenuId ? 'Edit menu item' : 'Add a menu item'}
        description={selectedRestaurant ? `For ${selectedRestaurant.name}` : 'Choose a restaurant first.'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={submitMenu} className="space-y-3">
          {menuError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {menuError}
            </div>
          )}

          <div>
            <label className="label" htmlFor="m-name">Item name</label>
            <input
              id="m-name"
              className="input"
              value={menuForm.name}
              onChange={(event) => setMenuForm((p) => ({ ...p, name: event.target.value }))}
              placeholder="Quinoa Garden Bowl"
            />
          </div>
          <div>
            <label className="label" htmlFor="m-description">Description</label>
            <textarea
              id="m-description"
              className="input min-h-16"
              value={menuForm.description}
              onChange={(event) => setMenuForm((p) => ({ ...p, description: event.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="m-price">Price (₹)</label>
              <input
                id="m-price"
                type="number"
                min="1"
                className="input"
                value={menuForm.price}
                onChange={(event) => setMenuForm((p) => ({ ...p, price: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="m-category">Category</label>
              <select
                id="m-category"
                className="input"
                value={menuForm.category}
                onChange={(event) => setMenuForm((p) => ({ ...p, category: event.target.value }))}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-spice">Spice level</label>
              <select
                id="m-spice"
                className="input"
                value={menuForm.spiceLevel}
                onChange={(event) => setMenuForm((p) => ({ ...p, spiceLevel: event.target.value }))}
              >
                {SPICE_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-calories">Calories</label>
              <input
                id="m-calories"
                type="number"
                min="0"
                className="input"
                value={menuForm.calories}
                onChange={(event) => setMenuForm((p) => ({ ...p, calories: event.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="m-image">Image URL</label>
              <input
                id="m-image"
                className="input"
                value={menuForm.image}
                onChange={(event) => setMenuForm((p) => ({ ...p, image: event.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-ink">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sage text-forest focus:ring-forest"
                checked={menuForm.isVeg}
                onChange={(event) => setMenuForm((p) => ({ ...p, isVeg: event.target.checked }))}
              />
              Vegetarian
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sage text-forest focus:ring-forest"
                checked={menuForm.isVegan}
                onChange={(event) => setMenuForm((p) => ({ ...p, isVegan: event.target.checked }))}
              />
              Vegan
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sage text-forest focus:ring-forest"
                checked={menuForm.available}
                onChange={(event) => setMenuForm((p) => ({ ...p, available: event.target.checked }))}
              />
              Available now
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-sage pt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setMenuModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingMenu || !menuRestaurantId}>
              {savingMenu ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving…
                </>
              ) : editingMenuId ? (
                'Save changes'
              ) : (
                'Add item'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === 'restaurant' ? 'Delete restaurant?' : 'Delete menu item?'}
        description={
          confirm?.kind === 'restaurant'
            ? `“${confirm?.name}” and its menu items will be removed. Restaurants with order history are protected.`
            : `“${confirm?.name}” will be removed from the menu.`
        }
      >
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={runDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
