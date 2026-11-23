import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const TONES = {
  success: 'border-emerald-200 bg-white text-emerald-900',
  error: 'border-red-200 bg-white text-red-900',
  info: 'border-sky-200 bg-white text-sky-900',
};

const ICON_TONES = {
  success: 'text-emerald-600',
  error: 'text-red-500',
  info: 'text-sky-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, type = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current.slice(-3), { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), 4200);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-lg animate-pop ${TONES[toast.type] || TONES.info}`}
              role="status"
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${ICON_TONES[toast.type] || ''}`} />
              <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-full p-1 text-ink-muted transition hover:bg-black/5"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
