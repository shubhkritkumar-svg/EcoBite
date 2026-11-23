import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  ChefHat,
  Clock,
  Leaf,
  PackageCheck,
  Quote,
  Recycle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { CUISINE_CARDS } from '../lib/constants.jsx';
import { inr } from '../lib/format.js';
import RestaurantCard from '../components/RestaurantCard.jsx';
import Reveal from '../components/Reveal.jsx';

const kitchenImage =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85';
const thaliImage =
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80';
const curryImage =
  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80';

const promises = [
  { icon: Bike, title: 'Bicycle-first delivery', text: 'Choose a zero-emission courier wherever the kitchen supports it.' },
  { icon: Recycle, title: 'Plastic-free options', text: 'Compostable bagasse or returnable steel tiffins on every order.' },
  { icon: TrendingDown, title: 'Visible carbon savings', text: 'See the estimated CO₂ you saved, with the maths shown openly.' },
  { icon: Sparkles, title: 'Rewards that add up', text: 'Earn Green Points for greener delivery, packaging and cutlery choices.' },
];

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Find a greener kitchen',
    text: 'Search by dish, cuisine or locality. Look for the Eco Certified leaf — it means at least four transparent criteria are met.',
  },
  {
    icon: ShoppingBag,
    number: '02',
    title: 'Pick your eco preferences',
    text: 'At checkout, choose a bicycle or EV courier where supported, swap to compostable or reusable packaging, and skip cutlery.',
  },
  {
    icon: Sprout,
    number: '03',
    title: 'Eat well, earn Green Points',
    text: 'Every low-carbon choice earns points. Track your savings in the Eco Dashboard and climb from Seedling to Forest Guardian.',
  },
];

const testimonials = [
  {
    quote:
      'The reusable tiffin is such a simple idea and the dal tastes like a Sunday lunch at home. I have stopped ordering anywhere else.',
    name: 'Meera R.',
    area: 'Indiranagar',
  },
  {
    quote:
      'I can actually see that my bicycle delivery saved 0.17 kg of CO₂. It is a small number, but 30 orders later it adds up.',
    name: 'Arjun K.',
    area: 'Koramangala',
  },
  {
    quote:
      'Food arrived hot, zero plastic, and the app told me exactly how my points were earned. No vague green claims.',
    name: 'Priya S.',
    area: 'HSR Layout',
  },
];

function FeaturedSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4 rounded-full" />
        <div className="skeleton h-4 w-1/2 rounded-full" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api('/restaurants?sort=rating')
      .then((data) => {
        if (!active) return;
        setFeatured(data.restaurants.slice(0, 4));
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [retryKey]);

  return (
    <>
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border-[40px] border-forest/5" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-mint/50 blur-3xl" />

        <div className="container-page grid items-center gap-14 py-14 lg:grid-cols-[1.02fr_1fr] lg:py-20">
          <div className="relative z-10 animate-fade-up">
            <span className="eyebrow rounded-full border border-forest/15 bg-white/80 px-3.5 py-1.5 backdrop-blur">
              <Leaf size={13} className="text-leaf" />
              Bengaluru&apos;s greenest food delivery
            </span>

            <h1 className="section-title mt-6 text-[2.9rem] leading-[1.03] sm:text-6xl lg:text-[4.1rem]">
              Good food.
              <br />
              <span className="relative text-forest">
                Lighter footprint.
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-full text-lime"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M2 9C72 3 188 2 298 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Order from eight independent Indian kitchens that care about packaging, sourcing and
              flavour. Choose a bicycle or EV courier, skip the plastic, and earn Green Points for
              every better choice.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/restaurants" className="btn btn-primary btn-lg">
                Explore restaurants
                <ArrowRight size={18} />
              </Link>
              <a href="#sustainability" className="btn btn-secondary btn-lg">
                How eco works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Star size={14} className="fill-gold text-gold" /> 4.6 average kitchen rating
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-forest" /> Transparent eco criteria
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-forest" /> 22–35 min delivery
              </span>
            </div>
          </div>

          <div className="relative mx-auto h-[440px] w-full max-w-xl animate-fade-in sm:h-[500px]">
            <div className="absolute right-0 top-4 h-[78%] w-[82%] overflow-hidden rounded-[2.6rem] border-[6px] border-white shadow-soft">
              <img
                src={kitchenImage}
                alt="A colourful plant-forward bowl from Sprout & Sip"
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/35 via-transparent to-transparent" />
            </div>

            <div className="absolute bottom-2 left-0 h-40 w-40 overflow-hidden rounded-[1.8rem] border-[5px] border-white shadow-soft sm:h-48 sm:w-48">
              <img src={thaliImage} alt="Traditional thali at Mango Tree Meals" className="h-full w-full object-cover" />
            </div>

            <div className="absolute -left-2 top-16 hidden h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-lg sm:block animate-float-slow">
              <img src={curryImage} alt="Rich curry at The Green Tiffin" className="h-full w-full object-cover" />
            </div>

            <div className="absolute right-1 top-0 z-10 flex items-center gap-2.5 rounded-2xl border border-forest/10 bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur animate-float sm:right-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-forest">
                <TrendingDown size={17} />
              </span>
              <div>
                <p className="text-sm font-extrabold leading-none text-forest-deep">0.19 kg</p>
                <p className="mt-1 text-[10px] font-semibold text-ink-muted">CO₂ saved on a bike order</p>
              </div>
            </div>

            <div className="absolute bottom-14 right-0 z-10 flex items-center gap-2.5 rounded-2xl border border-forest/10 bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur animate-float-slow">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-lime">
                <Bike size={17} />
              </span>
              <div>
                <p className="text-sm font-extrabold leading-none text-forest-deep">Bike powered</p>
                <p className="mt-1 text-[10px] font-semibold text-ink-muted">EV &amp; bicycle fleet</p>
              </div>
            </div>

            <div className="absolute -bottom-1 right-8 z-10 rounded-2xl border border-lime/30 bg-forest-deep px-4 py-3 text-white shadow-soft sm:right-16">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-lime">Green points</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-extrabold">
                <Leaf size={15} className="text-lime" /> +25 per eco order
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-forest/10 bg-white">
        <div className="container-page grid grid-cols-2 divide-forest/10 py-6 sm:grid-cols-4 sm:divide-x">
          {[
            ['8', 'independent kitchens'],
            ['4', 'Eco Certified partners'],
            ['57', 'dishes to explore'],
            ['₹0', 'hidden eco charges'],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="font-display text-3xl font-semibold text-forest">{value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-18 md:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="eyebrow">
                <UtensilsCrossedIcon /> What are you craving?
              </span>
              <h2 className="section-title mt-3 text-3xl sm:text-4xl">Pick a craving, we&apos;ll find the green option</h2>
            </div>
            <Link
              to="/restaurants"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-forest transition hover:text-forest-dark"
            >
              Browse everything
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {CUISINE_CARDS.map((cuisine, index) => (
            <Reveal key={cuisine.name} delay={index * 40}>
              <Link
                to={`/restaurants?cuisine=${encodeURIComponent(cuisine.name)}`}
                className="group relative block h-36 overflow-hidden rounded-2xl border border-forest/10 bg-sage shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-card sm:h-40"
              >
                <img
                  src={cuisine.image}
                  alt={cuisine.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-3">
                  <span className="text-lg" aria-hidden="true">{cuisine.emoji}</span>
                  <span className="text-sm font-bold text-white">{cuisine.name}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-sage/70 py-18 md:py-24">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <span className="eyebrow">
                  <Star size={13} className="fill-gold text-gold" /> Highest rated kitchens
                </span>
                <h2 className="section-title mt-3 text-3xl sm:text-4xl">Meet your next favourite</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  Eight neighbourhood kitchens, each with its own personality. The leaf badge is earned,
                  never bought.
                </p>
              </div>
              <Link to="/restaurants" className="btn btn-secondary">
                View all 8
                <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loading &&
              Array.from({ length: 4 }).map((_, index) => <FeaturedSkeleton key={index} />)}

            {!loading && error && (
              <div className="card col-span-full flex flex-col items-center gap-3 p-10 text-center">
                <p className="text-sm font-semibold text-red-600">{error}</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetryKey((key) => key + 1)}>
                  Try again
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              featured.map((restaurant, index) => (
                <Reveal key={restaurant.id} delay={index * 70}>
                  <RestaurantCard restaurant={restaurant} priority={index === 0} />
                </Reveal>
              ))}
          </div>
        </div>
      </section>

      <section id="sustainability" className="container-page py-18 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[2.2rem] border-[6px] border-white shadow-soft">
                <img
                  src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1000&q=80"
                  alt="Fresh vegetables and a reusable bowl"
                  className="h-[380px] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-5 -right-3 max-w-[230px] rounded-2xl border border-forest/10 bg-white p-4 shadow-card sm:right-6">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-forest">
                    <PackageCheck size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-forest-deep">100% traceable</p>
                    <p className="text-[10px] text-ink-muted">Every eco claim has criteria</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sage">
                  <div className="h-full w-4/5 rounded-full bg-forest" />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-ink-muted">4 of 5 certification criteria met on average</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <span className="eyebrow">
              <Leaf size={13} /> Sustainability, without the greenwash
            </span>
            <h2 className="section-title mt-3 text-3xl sm:text-4xl">
              Smaller footprint, still a full plate
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              We do not claim to be perfect. What we do is make the eco choice the easy choice, show
              you the assumptions behind every number, and reward you for choosing better.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {promises.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-forest/10 bg-white p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-forest">
                    <Icon size={17} />
                  </span>
                  <h3 className="mt-3 text-sm font-extrabold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{text}</p>
                </div>
              ))}
            </div>

            <Link to="/eco" className="btn btn-primary mt-7">
              See how savings are calculated
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest-deep py-18 text-white md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" />
        <div className="container-page relative grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <Reveal>
            <span className="eyebrow text-lime">
              <Sparkles size={13} /> The green points club
            </span>
            <h2 className="section-title mt-3 text-3xl text-white sm:text-4xl">
              Small choices. Measurable impact.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
              A bicycle delivery, a compostable bowl, one less plastic fork. Individually small,
              together meaningful. Green Points make the trade-off visible — and a little more fun.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ['+10', 'bicycle or EV delivery'],
                ['+10', 'compostable/reusable pack'],
                ['+5', 'say no to cutlery'],
              ].map(([points, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="font-display text-2xl font-semibold text-lime">{points}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/55">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/restaurants" className="btn btn-mint">
                Start earning
                <ArrowRight size={16} />
              </Link>
              <Link to="/signup" className="btn border-white/20 bg-transparent text-white hover:bg-white/10">
                Create free account
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime">How we estimate CO₂</p>
                  <p className="mt-2 font-display text-2xl text-white">A simple, open formula</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime text-forest-deep">
                  <TrendingDown size={22} />
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4 rounded-xl bg-forest-deep/70 p-3.5">
                  <span className="text-white/70">Petrol scooter baseline</span>
                  <code className="font-mono text-lime">0.05 kg CO₂ / km</code>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl bg-forest-deep/70 p-3.5">
                  <span className="text-white/70">Electric scooter</span>
                  <code className="font-mono text-lime">0.025 kg CO₂ / km</code>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl bg-forest-deep/70 p-3.5">
                  <span className="text-white/70">Bicycle courier</span>
                  <code className="font-mono text-lime">0 kg CO₂ / km</code>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl bg-forest-deep/70 p-3.5">
                  <span className="text-white/70">Packaging (standard → compostable)</span>
                  <code className="font-mono text-lime">0.060 → 0.025 kg</code>
                </div>
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-white/45">
                Estimates compare your choices with a standard petrol-scooter, plastic-packaging
                order over the kitchen&apos;s listed distance. These are indicative figures for
                decision-making, not a verified life-cycle assessment.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page py-18 md:py-24">
        <Reveal>
          <div className="text-center">
            <span className="eyebrow">
              <ChefHat size={13} /> How EcoBite works
            </span>
            <h2 className="section-title mx-auto mt-3 max-w-2xl text-3xl sm:text-4xl">
              From craving to carbon-aware in three steps
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, text }, index) => (
            <Reveal key={title} delay={index * 90}>
              <div className="group relative h-full rounded-3xl border border-forest/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-forest transition group-hover:bg-forest group-hover:text-mint">
                    <Icon size={22} />
                  </span>
                  <span className="font-display text-4xl font-semibold text-forest/10">{number}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-sage/70 py-16 md:py-20">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">
                  <Quote size={13} /> Early members
                </span>
                <h2 className="section-title mt-3 text-3xl sm:text-4xl">Loved by Bengaluru&apos;s mindful eaters</h2>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
                Demo testimonials from fictional members, included to show the intended product
                experience for this academic project.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 80}>
                <figure className="card h-full p-6">
                  <div className="flex gap-1 text-gold" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} size={13} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink/80">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-sage pt-4">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-mint text-xs font-extrabold text-forest">
                      {item.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-ink">{item.name}</p>
                      <p className="text-[10px] font-semibold text-ink-muted">{item.area}, Bengaluru</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.4rem] bg-mint px-6 py-12 text-center sm:px-12 md:py-16">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full border-[26px] border-forest/10" />
            <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-lime/40 blur-2xl" />
            <div className="relative mx-auto max-w-2xl">
              <span className="eyebrow">
                <Zap size={13} /> Ready when you are
              </span>
              <h2 className="section-title mt-3 text-3xl sm:text-4xl">
                Your next meal can be your next small win
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Eight kitchens. One better default. Order now and see exactly what your choices
                save.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/restaurants" className="btn btn-primary btn-lg">
                  Order something green
                  <ArrowRight size={18} />
                </Link>
                <Link to="/signup" className="btn btn-secondary btn-lg">
                  Join EcoBite free
                </Link>
              </div>
              <p className="mt-5 text-[11px] font-semibold text-forest/70">
                Demo checkout &amp; tracking · no real payments · available in {inr(0) === '₹0' ? 'INR (₹)' : 'INR'}
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function UtensilsCrossedIcon() {
  return <ChefHat size={13} />;
}
