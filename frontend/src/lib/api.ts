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
    return request<{ 
      access_token: string; 
      refresh_token: string;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>('/auth/login', {
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
  previewOrder(token: string | null, payload: any) {
    return authorizedRequest<any>(token, '/orders/preview', {
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
  getAll(token?: string, activeOnly?: boolean) {
    return request<ProductResponseDto[]>(`/products${activeOnly ? '?activeOnly=true' : ''}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },
  getById(id: string, token?: string, activeOnly?: boolean) {
    return request<ProductResponseDto>(`/products/${id}${activeOnly ? '?activeOnly=true' : ''}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },
  getByCategory(category: string, token?: string) {
    return request<ProductResponseDto[]>(`/products/category/${category}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },
  getCategories(token?: string) {
    return request<{ name: string; count: number }[]>('/products/categories', {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },
  getStats(token?: string) {
    return request<any>('/products/admin/stats', {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },
  getLowStock(token?: string, threshold?: number) {
    return request<ProductResponseDto[]>(`/products/admin/low-stock${threshold ? `?threshold=${threshold}` : ''}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },
  create(token: string, data: CreateProductDto) {
    return request<ProductResponseDto>('/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });
  },
  update(token: string, id: string, data: UpdateProductDto) {
    return request<ProductResponseDto>(`/products/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });
  },
  updateStock(token: string, id: string, data: { stock: number }) {
    return request<ProductResponseDto>(`/products/${id}/stock`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });
  },
  toggleActive(token: string, id: string) {
    return request<ProductResponseDto>(`/products/${id}/toggle`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  delete(token: string, id: string) {
    return request<ProductResponseDto>(`/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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
  getStatus(token: string | null) {
    return request('/kitchen/status', {
      method: 'GET',
    });
  },
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

export const notificationsApi = {
  getBanner() {
    return request('/notifications/banner', {
      method: 'GET',
    });
  },
};

export const analyticsApi = {
  getActivitySignals() {
    return request('/analytics/activity-signals', {
      method: 'GET',
    });
  },
  getPopularProducts() {
    return request('/analytics/popular-products', {
      method: 'GET',
    });
  },
  getDashboardMetrics(token: string | null, queryParams: string = '') {
    return authorizedRequest<any>(token, `/analytics/dashboard${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },
  getSalesReport(token: string | null, period: string, queryParams: string = '') {
    return authorizedRequest<any>(token, `/analytics/sales/${period}${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },
  getCustomerAnalytics(token: string | null, queryParams: string = '') {
    return authorizedRequest<any>(token, `/analytics/customers${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },
  getProductAnalytics(token: string | null, queryParams: string = '') {
    return authorizedRequest<any>(token, `/analytics/products${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },
  getFinancialAnalytics(token: string | null, queryParams: string = '') {
    return authorizedRequest<any>(token, `/analytics/financial${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },
  exportReport(token: string | null, type: string, queryParams: string = '') {
    return authorizedRequest<any>(token, `/analytics/reports/export/${type}${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },
};

export const zardasApi = {
  getBalance(token: string | null, userId: string) {
    return authorizedRequest<any>(token, `/zardas/${userId}/balance`, { method: 'GET' });
  },
  getHistory(token: string | null, userId: string) {
    return authorizedRequest<any>(token, `/zardas/${userId}/history`, { method: 'GET' });
  },
  redeemZardas(token: string | null, userId: string, discountAmount: number, reason: string) {
    return authorizedRequest<any>(token, `/zardas/${userId}/redeem`, {
      method: 'POST',
      body: JSON.stringify({ discountAmount, reason }),
    });
  },
};

export const aboutApi = {
  getAboutData() {
    return request('/about/data', {
      method: 'GET',
    });
  },
};

export const paymentsApi = {
  // Métodos de pago disponibles
  getAvailablePaymentMethods(token: string | null, amount: number) {
    return authorizedRequest<any>(token, `/payments/methods?amount=${amount}`, {
      method: 'GET',
    });
  },

  // Stripe
  createStripeIntent(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, '/payments/stripe/intent', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  // PayPal
  createPayPalPayment(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, '/payments/paypal/create', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  // Bizum
  createBizumPayment(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, '/payments/bizum/create', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  // Efectivo
  processCashPayment(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, '/payments/cash/process', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  // Reembolsos
  refundPayment(token: string | null, paymentIntentId: string, reason?: string) {
    return authorizedRequest<any>(token, '/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, reason }),
    });
  },

  // Facturas
  generateInvoice(token: string | null, orderId: string) {
    return authorizedRequest<any>(token, `/payments/invoices/generate/${orderId}`, {
      method: 'POST',
    });
  },

  getInvoices(token: string | null) {
    return authorizedRequest<any>(token, '/payments/invoices', {
      method: 'GET',
    });
  },

  getInvoice(token: string | null, invoiceId: string) {
    return authorizedRequest<any>(token, `/payments/invoices/${invoiceId}`, {
      method: 'GET',
    });
  },

  // Estadísticas
  getPaymentStats(token: string | null, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return authorizedRequest<any>(token, `/payments/stats?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Comisiones
  getPaymentFees(token: string | null) {
    return authorizedRequest<any>(token, '/payments/methods/fees', {
      method: 'GET',
    });
  },

  // Legacy method for compatibility
  createIntent(token: string | null, orderId: string) {
    return this.createStripeIntent(token, orderId);
  },
};

export const incidentsApi = {
  // Gestión de incidencias
  getIncidents(token: string | null, queryParams: string = '') {
    return authorizedRequest<any>(token, `/incidents${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },

  getIncidentById(token: string | null, id: string) {
    return authorizedRequest<any>(token, `/incidents/${id}`, {
      method: 'GET',
    });
  },

  createIncident(token: string | null, data: any) {
    return authorizedRequest<any>(token, '/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateIncidentStatus(token: string | null, id: string, status: string, adminNotes?: string) {
    return authorizedRequest<any>(token, `/incidents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  addIncidentResponse(token: string | null, id: string, data: any) {
    return authorizedRequest<any>(token, `/incidents/${id}/response`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  escalateIncident(token: string | null, id: string, reason: string) {
    return authorizedRequest<any>(token, `/incidents/${id}/escalate`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  getIncidentStats(token: string | null, queryParams: string = '') {
    return authorizedRequest<any>(token, `/incidents/stats${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
    });
  },

  autoCloseInactiveIncidents(token: string | null, hoursInactive: number) {
    return authorizedRequest<any>(token, '/incidents/auto-close', {
      method: 'POST',
      body: JSON.stringify({ hoursInactive }),
    });
  },
};
