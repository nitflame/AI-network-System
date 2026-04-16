const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),

  simulate: (overrides = null) =>
    request('/simulate', {
      method: 'POST',
      body: overrides ? JSON.stringify(overrides) : undefined,
    }),

  predict: (payload) =>
    request('/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  allocate: (payload) =>
    request('/allocate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
