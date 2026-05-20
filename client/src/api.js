const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export function getServices() {
  return request('/api/services');
}

export function getProducts() {
  return request('/api/products');
}

export function createAppointment(payload) {
  return request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getAppointments() {
  return request('/api/appointments');
}

export function updateAppointmentStatus(id, status) {
  return request(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function createProductOrder(payload) {
  return request('/api/product-orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getProductOrders() {
  return request('/api/product-orders');
}

export function updateProductOrderStatus(id, status) {
  return request(`/api/product-orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function createBridalRequest(payload) {
  return request('/api/bridal-requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getBridalRequests() {
  return request('/api/bridal-requests');
}

export function updateBridalRequestStatus(id, status) {
  return request(`/api/bridal-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function registerClient(payload) {
  return request('/api/auth/client/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function loginClient(payload) {
  return request('/api/auth/client/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function loginBarber(payload) {
  return request('/api/auth/barber/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
