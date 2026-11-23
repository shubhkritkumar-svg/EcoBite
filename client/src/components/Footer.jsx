import { Link } from 'react-router-dom';
import { Leaf, Mail, MapPin } from 'lucide-react';
import Logo from './Logo.jsx';

const exploreLinks = [
  { label: 'All restaurants', to: '/restaurants' },
  { label: 'Eco dashboard', to: '/eco' },
  { label: 'Your orders', to: '/profile' },
  { label: 'Create an account', to: '/signup' },
];

const cuisineLinks = [
  { label: 'North Indian', to: '/restaurants?cuisine=North%20Indian' },
  { label: 'South Indian', to: '/restaurants?cuisine=South%20Indian' },
  { label: 'Healthy bowls', to: '/restaurants?cuisine=Healthy' },
  { label: 'Italian', to: '/restaurants?cuisine=Italian' },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-forest-deep text-white">
      <div className="container-page grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            Bengaluru&apos;s food delivery marketplace for people who want great meals without the
            plastic and tailpipe guilt.
          </p>
          <div className="mt-6 space-y-2 text-sm text-white/70">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="text-lime" /> Bengaluru, Karnataka
            </p>
            <p className="flex items-center gap-2">
              <Mail size={14} className="text-lime" /> hello@ecobite.in
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {exploreLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime">Cuisines</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {cuisineLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Leaf size={16} className="text-lime" /> Transparent by design
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            Carbon savings use a documented per-order estimate. Eco badges require at least four
            independently verifiable criteria. Payments, live GPS and delivery statuses in this
            project are clearly labelled simulations.
          </p>
          <Link
            to="/eco"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-lime transition hover:text-white"
          >
            See the calculation method →
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} EcoBite. A fictional brand for an academic project.</p>
          <p className="flex items-center gap-1.5">
            Built with React, Express &amp; MongoDB
            <Leaf size={12} className="text-lime/70" />
          </p>
        </div>
      </div>
    </footer>
  );
}
