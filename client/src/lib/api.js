const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || [];
  }
}

export const getStoredToken = () => localStorage.getItem('ecobite_token');

export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const authToken = token ?? getStoredToken();
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'Cannot reach the EcoBite server. Make sure the API is running on port 5000.',
      0
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'Something went wrong. Please try again.', response.status, data.errors);
  }

  return data;
}
