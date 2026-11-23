import { Sprout } from 'lucide-react';

export default function EmptyState({ icon: Icon = Sprout, title, description, action, className = '' }) {
  return (
    <div className={`card flex flex-col items-center gap-4 px-6 py-14 text-center ${className}`}>
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-mint text-forest">
        <Icon size={28} />
      </span>
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
