const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const inr = (value) => inrFormatter.format(Math.round(Number(value) || 0));

export const compactNumber = (value) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value) || 0
  );

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const shortOrderId = (id = '') => `EB-${String(id).slice(-6).toUpperCase()}`;

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const plural = (count, singular, pluralForm) =>
  `${count} ${count === 1 ? singular : pluralForm || `${singular}s`}`;
