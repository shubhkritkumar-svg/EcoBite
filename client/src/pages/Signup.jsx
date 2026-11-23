import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthShell from '../components/AuthShell.jsx';

const initialForm = { name: '', email: '', phone: '', password: '', confirmPassword: '' };

export default function Signup() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  const rules = useMemo(
    () => ({
      length: form.password.length >= 8,
      letter: /[A-Za-z]/.test(form.password),
      digit: /\d/.test(form.password),
      match: form.confirmPassword.length > 0 && form.password === form.confirmPassword,
    }),
    [form.password, form.confirmPassword]
  );
  const strength = [rules.length, rules.letter, rules.digit].filter(Boolean).length;
  const strengthLabel = ['Too short', 'Weak', 'Good', 'Strong'][strength];

  if (user && !submitting) {
    return <Navigate to={from || '/'} replace />;
  }

  const update = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!rules.length || !rules.letter || !rules.digit) {
      setError('Password must be at least 8 characters and include a letter and a number.');
      return;
    }
    if (!rules.match) {
      setError('Passwords do not match.');
      return;
    }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number, or leave it empty.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      toast.success(`Welcome to EcoBite, ${created.name.split(' ')[0]}!`);
      navigate(from || '/', { replace: true });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the movement"
      title="Create your EcoBite account"
      subtitle="Order from green kitchens, earn Green Points and watch your carbon savings add up."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest hover:underline">
            Sign in instead
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
          <label className="label" htmlFor="signup-name">
            Full name
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="signup-name"
              className="input pl-10"
              placeholder="Aanya Sharma"
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="signup-email">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="signup-email"
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
          <label className="label" htmlFor="signup-phone">
            Mobile number <span className="font-medium text-ink-muted/70">(optional)</span>
          </label>
          <div className="relative">
            <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="signup-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="input pl-10"
              placeholder="98765 43210"
              autoComplete="tel-national"
              value={form.phone}
              onChange={update('phone')}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="signup-password">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className="input px-10"
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 rounded-full transition ${
                      index < strength ? (strength === 3 ? 'bg-forest' : 'bg-amber-400') : 'bg-sage'
                    }`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-[10px] font-bold text-ink-muted">{strengthLabel}</span>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="signup-confirm">
            Confirm password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="signup-confirm"
              type={showPassword ? 'text' : 'password'}
              className="input pl-10"
              placeholder="Type it again"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              required
            />
          </div>
        </div>

        <ul className="grid gap-1 text-[10px] font-semibold text-ink-muted sm:grid-cols-2">
          {[
            { ok: rules.length, label: '8+ characters' },
            { ok: rules.letter, label: 'One letter' },
            { ok: rules.digit, label: 'One number' },
            { ok: rules.match, label: 'Passwords match' },
          ].map((rule) => (
            <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? 'text-forest' : ''}`}>
              <span
                className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
                  rule.ok ? 'bg-forest text-white' : 'bg-sage text-ink-muted'
                }`}
              >
                <Check size={9} strokeWidth={3} />
              </span>
              {rule.label}
            </li>
          ))}
        </ul>

        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-muted">
          <Leaf size={12} className="mt-0.5 shrink-0 text-forest" />
          This is a college project. Passwords are hashed with bcrypt and no payment details are
          collected.
        </p>
      </form>
    </AuthShell>
  );
}
