import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-mint text-forest">
        <Compass size={28} />
      </span>
      <p className="mt-5 font-display text-6xl font-semibold text-forest">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">This page went off the menu</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        The link may be outdated, or the page never existed. Head back home and find a green kitchen
        instead.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <Link to="/restaurants" className="btn btn-secondary">
          Browse restaurants
        </Link>
      </div>
    </div>
  );
}
