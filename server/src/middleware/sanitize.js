const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || BLOCKED_KEYS.has(key)) continue;
      output[key] = clean(nested);
    }
    return output;
  }
  return value;
}

// Defence in depth against MongoDB operator injection. Zod schemas are the
// primary validation layer; this strips dangerous keys before they reach it.
export const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) req.params[key] = clean(req.params[key]);
  }
  next();
};
