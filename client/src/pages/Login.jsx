import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthShell from '../components/AuthShell.jsx';

const DEMOS = [
  { label: 'Customer demo', email: 'demo@ecobite.in', password: 'Demo@123' },
  { label: 'Admin demo', email: 'admin@ecobite.in', password: 'Admin@123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;
  if (user && !submitting) {
    return <Navigate to={from || (user.role === 'admin' ? '/admin' : '/')} replace />;
  }

  const update = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      navigate(from || (loggedIn.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to EcoBite"
      subtitle="Track orders, collect Green Points and keep your eco impact growing."
      footer={
        <>
          New to EcoBite?{' '}
          <Link to="/signup" className="font-bold text-forest hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="login-email">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="login-email"
              type="email"
              className="input pl-10"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="login-password">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="input px-10"
              placeholder="Your password"
              autoComplete="current-password"
              value={form.password}
              onChange={update('password')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted transition hover:bg-sage hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-sage bg-cream/70 p-3.5">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
          <ShieldCheck size={12} /> Seeded demo accounts
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {DEMOS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => setForm({ email: demo.email, password: demo.password })}
              className="rounded-xl border border-sage bg-white px-3 py-2 text-left transition hover:border-forest/30 hover:bg-mint-soft"
            >
              <span className="block text-[11px] font-extrabold text-forest">{demo.label}</span>
              <span className="mt-0.5 block text-[10px] text-ink-muted">{demo.email}</span>
              <span className="block text-[10px] text-ink-muted">{demo.password}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
          Tap an account to autofill, then sign in. Demo credentials exist only after running the seed
          script.
        </p>
      </div>
    </AuthShell>
  );
}
