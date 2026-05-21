const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getBarberToken() {
  return window.localStorage.getItem('stylecut_barber_token') || '';
}

function getClientToken() {
  return window.localStorage.getItem('stylecut_client_token') || '';
}

export function getServices() {
  return request('/api/services');
}

export function getStylists() {
  return request('/api/stylists');
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
  return request('/api/appointments', {
    headers: authHeaders(getBarberToken())
  });
}

export function updateAppointmentStatus(id, status) {
  return request(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(getBarberToken()),
    body: JSON.stringify({ status })
  });
}

export function getClientAppointments() {
  return request('/api/account/appointments', {
    headers: authHeaders(getClientToken())
  });
}

export function createProductOrder(payload) {
  return request('/api/product-orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getProductOrders() {
  return request('/api/product-orders', {
    headers: authHeaders(getBarberToken())
  });
}

export function updateProductOrderStatus(id, status) {
  return request(`/api/product-orders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(getBarberToken()),
    body: JSON.stringify({ status })
  });
}

export function getClientProductOrders() {
  return request('/api/account/product-orders', {
    headers: authHeaders(getClientToken())
  });
}

export function getClientFeedback() {
  return request('/api/account/feedback', {
    headers: authHeaders(getClientToken())
  });
}

export function submitClientFeedback(feedback) {
  return request('/api/account/feedback', {
    method: 'POST',
    headers: authHeaders(getClientToken()),
    body: JSON.stringify({ feedback })
  });
}

export function getClientRating() {
  return request('/api/account/rating', {
    headers: authHeaders(getClientToken())
  });
}

export function submitClientRating(rating) {
  return request('/api/account/rating', {
    method: 'POST',
    headers: authHeaders(getClientToken()),
    body: JSON.stringify({ rating })
  });
}

export function createBridalRequest(payload) {
  return request('/api/bridal-requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getBridalRequests() {
  return request('/api/bridal-requests', {
    headers: authHeaders(getBarberToken())
  });
}

export function updateBridalRequestStatus(id, status) {
  return request(`/api/bridal-requests/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(getBarberToken()),
    body: JSON.stringify({ status })
  });
}

export function getFeedback() {
  return request('/api/feedback', {
    headers: authHeaders(getBarberToken())
  });
}

export function getRatings() {
  return request('/api/ratings', {
    headers: authHeaders(getBarberToken())
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

export function loginClientWithGoogle(payload) {
  return request('/api/auth/client/google', {
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
