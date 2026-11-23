import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { initials } from '../lib/format.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/eco', label: 'Eco dashboard' },
];

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const navClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-mint text-forest-deep' : 'text-ink/75 hover:bg-sage hover:text-forest'
    }`;

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-forest-deep text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11px] font-semibold">
          <p className="flex items-center gap-1.5 truncate">
            <Leaf size={12} className="text-lime" />
            Compostable packaging &amp; EV couriers at every Eco Certified kitchen
          </p>
          <p className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="text-white/60">Free delivery above ₹499</span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-lime">
              Demo build
            </span>
          </p>
        </div>
      </div>

      <div className="border-b border-forest/10 bg-cream/92 backdrop-blur-xl">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Logo />
            <span className="hidden items-center gap-1.5 rounded-full border border-forest/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-muted lg:inline-flex">
              <MapPin size={13} className="text-forest" />
              Bengaluru
              <ChevronDown size={12} className="text-ink-muted/60" />
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/cart"
              className="relative inline-flex h-10 items-center gap-2 rounded-full border border-forest/15 bg-white px-3 text-sm font-bold text-forest transition hover:border-forest/35 hover:bg-mint-soft sm:px-4"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag size={17} />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[10px] font-extrabold text-white ring-2 ring-cream">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-10 items-center gap-2 rounded-full border border-forest/15 bg-white pl-1.5 pr-3 text-sm font-bold text-ink transition hover:border-forest/35"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-mint text-xs font-extrabold text-forest-deep">
                    {initials(user.name)}
                  </span>
                  <span className="max-w-24 truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`text-ink-muted transition ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-forest/10 bg-white p-1.5 shadow-xl animate-pop"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-ink-muted">{user.email}</p>
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[10px] font-extrabold text-forest">
                        <Leaf size={10} /> {user.greenPoints} Green Points
                      </p>
                    </div>
                    <hr className="my-1 border-sage" />
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-mint-soft"
                    >
                      <UserRound size={16} className="text-forest" /> Profile &amp; orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-mint-soft"
                      >
                        <LayoutDashboard size={16} className="text-forest" /> Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </div>
            )}

            {user && (
              <Link
                to="/profile"
                className="grid h-10 w-10 place-items-center rounded-full bg-mint text-xs font-extrabold text-forest-deep md:hidden"
                aria-label="Your profile"
              >
                {initials(user.name)}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-full border border-forest/15 bg-white text-forest transition hover:bg-mint-soft md:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-forest/10 bg-cream md:hidden">
            <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isActive ? 'bg-mint text-forest-deep' : 'text-ink hover:bg-sage'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isAdmin && (
                <Link to="/admin" className="rounded-xl px-4 py-3 text-sm font-bold text-ink hover:bg-sage">
                  Admin dashboard
                </Link>
              )}
              <hr className="my-2 border-forest/10" />
              {user ? (
                <div className="flex items-center justify-between gap-3 px-1 pb-1">
                  <span className="text-xs font-semibold text-ink-muted">
                    Signed in as <span className="text-ink">{user.name}</span>
                  </span>
                  <button type="button" onClick={handleLogout} className="btn btn-danger btn-sm">
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-1 pb-1">
                  <Link to="/login" className="btn btn-secondary">
                    Log in
                  </Link>
                  <Link to="/signup" className="btn btn-primary">
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
