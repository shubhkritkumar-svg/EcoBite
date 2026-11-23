import { Leaf } from 'lucide-react';

export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
      <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest">
        <Leaf size={24} className="animate-pulse" />
        <span className="absolute inset-0 animate-ping rounded-2xl border border-forest/20" />
      </div>
      <p className="text-sm font-semibold text-ink-muted">{label}…</p>
    </div>
  );
}
