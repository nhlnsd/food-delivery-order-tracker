const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || 'Request failed');
  }

  return json;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),
  register: (name: string, email: string, password: string, role: string) =>
    apiFetch<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
      skipAuth: true,
    }),
  me: () => apiFetch<any>('/api/auth/me'),
};

// Orders
export const ordersApi = {
  placeOrder: (data: {
    restaurantId: number;
    deliveryAddress: string;
    items: { name: string; price: number; quantity: number }[];
    notes?: string;
  }) => apiFetch<any>('/api/order', { method: 'POST', body: JSON.stringify(data) }),

  getMyOrder: () => apiFetch<any>('/api/order/my'),

  getOrder: (id: number) => apiFetch<any>(`/api/order/${id}`),

  getRestaurantOrders: (status?: string) =>
    apiFetch<any>(`/api/order/restaurant${status ? `?status=${status}` : ''}`),

  updateStatus: (id: number, status: string) =>
    apiFetch<any>(`/api/order/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// Restaurants
export const restaurantsApi = {
  list: () => apiFetch<any>('/api/restaurant'),
};

export default apiFetch;
