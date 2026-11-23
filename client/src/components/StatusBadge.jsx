import { STATUS_META } from '../lib/constants.jsx';

export default function StatusBadge({ status, short = false }) {
  const meta = STATUS_META[status] || STATUS_META.placed;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.color}`}
    >
      <Icon size={12} strokeWidth={2.4} />
      {short ? meta.short : meta.label}
    </span>
  );
}
