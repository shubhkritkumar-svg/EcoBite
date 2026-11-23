import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, description, children, maxWidth = 'max-w-lg' }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-forest-deep/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/20 bg-white shadow-2xl animate-pop sm:rounded-3xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sage bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-muted transition hover:bg-sage hover:text-ink"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
