import { Link } from 'react-router-dom';
import { ArrowLeft, Bike, Leaf, Sprout, UtensilsCrossed } from 'lucide-react';
import Logo from './Logo.jsx';

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-[calc(100vh-74px)] bg-cream">
      <div className="container-page grid py-8 md:py-12 lg:grid-cols-[1fr_460px] lg:gap-10">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted transition hover:text-forest"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="mt-6 hidden lg:block">
            <Logo />
          </div>

          <div className="mt-6 rounded-3xl border border-sage bg-white p-6 shadow-card sm:p-8">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div>}
        </div>

        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-forest-deep lg:block">
          <img
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"
            alt="Fresh salad bowl with greens"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/70 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-8">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-mint backdrop-blur">
              <Leaf size={12} /> Every order counts
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-white">
              Good food.
              <br />
              A lighter footprint.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
              Choose green kitchens, low-carbon couriers and compostable packaging. We turn every
              eco choice into Green Points you can track.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Bike, label: 'Bicycle & EV fleets' },
                { icon: Sprout, label: 'Compostable packs' },
                { icon: UtensilsCrossed, label: 'Skip cutlery' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <Icon size={16} className="mx-auto text-mint" />
                  <p className="mt-1.5 text-[10px] font-bold leading-tight text-white/80">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[10px] leading-relaxed text-white/40">
              Carbon figures are documented estimates for comparison, not a full life-cycle assessment.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
