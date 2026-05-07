import { LoginDto, RegisterDto } from '../../../shared/dtos';
import { PublicScheduleResponse } from '../../../shared/interfaces';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.message || 'Error en la petición');
  }
  return payload as T;
}

async function authorizedRequest<T>(token: string | null, path: string, init: RequestInit = {}) {
  if (!token) {
    throw new Error('Autenticación requerida');
  }
  return request<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
}

export const authApi = {
  login(data: LoginDto) {
    return request<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  refresh(refreshToken: string) {
    return request<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  register(data: RegisterDto) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const cartApi = {
  getCart(token: string | null) {
    return authorizedRequest<any>(token, '/cart', { method: 'GET' });
  },
  updateCart(token: string | null, payload: { items: any[] }) {
    return authorizedRequest<any>(token, '/cart', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export const ordersApi = {
  createOrder(token: string | null, payload: any) {
    return authorizedRequest<any>(token, '/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getEstimate() {
    return request<{ queueLength: number; estimatedMinutes: number; averageDelivered: number }>('/orders/estimate', {
      method: 'GET',
    });
  },
  getMyOrders(token: string | null) {
    return authorizedRequest<any>(token, '/orders', { method: 'GET' });
  },
  getAll(token: string | null) {
    return authorizedRequest<any>(token, '/orders', { method: 'GET' });
  },
  getChatHistory(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, `/chat/history/${orderId}`, { method: 'GET' });
  },
  getQuickReplies(token: string | null) {
    return authorizedRequest<string[]>(token, '/chat/quick-replies', { method: 'GET' });
  },
  updateStatus(token: string | null, id: string, status: string) {
    return authorizedRequest<any>(token, `/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

export const productsApi = {
  getAll() {
    return request<any[]>('/products', { method: 'GET' });
  },
};

export const scheduleApi = {
  getPublicSchedule() {
    return request<PublicScheduleResponse>('/schedule/public', {
      method: 'GET',
    });
  },
  getAdminSchedule(token: string | null) {
    return authorizedRequest(token, '/schedule/admin', {
      method: 'GET',
    });
  },
  createWindow(token: string | null, data: any) {
    return authorizedRequest(token, '/schedule/window', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateWindow(token: string | null, id: string, data: any) {
    return authorizedRequest(token, `/schedule/window/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteWindow(token: string | null, id: string) {
    return authorizedRequest(token, `/schedule/window/${id}`, {
      method: 'DELETE',
    });
  },
  createSpecial(token: string | null, data: any) {
    return authorizedRequest(token, '/schedule/special', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateSpecial(token: string | null, id: string, data: any) {
    return authorizedRequest(token, `/schedule/special/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteSpecial(token: string | null, id: string) {
    return authorizedRequest(token, `/schedule/special/${id}`, {
      method: 'DELETE',
    });
  },
};

export const kitchenApi = {
  getMetrics(token: string | null) {
    return authorizedRequest(token, '/kitchen/metrics', {
      method: 'GET',
    });
  },
  setStatus(token: string | null, status: string) {
    return authorizedRequest(token, '/kitchen/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

export const paymentsApi = {
  createIntent(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, '/payments/intent', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },
};

export const zardasApi = {
  getZardas(token: string | null, userId: string) {
    return authorizedRequest<any>(token, `/zardas/${userId}`, { method: 'GET' });
  },
  addZardas(token: string | null, userId: string, amount: number, reason: string) {
    return authorizedRequest<any>(token, `/zardas/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },
};
