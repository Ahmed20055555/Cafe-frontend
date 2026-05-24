import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cafe_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const getStaff = () => api.get('/auth/staff');
export const updateStaff = (id, data) => api.put(`/auth/staff/${id}`, data);

// Upload
export const uploadImage = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Tables
export const getTables = () => api.get('/tables');
export const createTable = (data) => api.post('/tables', data);
export const updateTable = (id, data) => api.put(`/tables/${id}`, data);
export const deleteTable = (id) => api.delete(`/tables/${id}`);
export const getTableQR = (id) => api.get(`/tables/${id}/qr`);
export const assignWaiter = (num, data) => api.post(`/tables/${num}/assign-waiter`, data);

// Categories
export const getCategories = (active) => api.get(`/categories${active ? '?active=true' : ''}`);
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Menu
export const getMenu = (params) => api.get('/menu', { params });
export const getPopularItems = () => api.get('/menu/popular');
export const getLowStockItems = () => api.get('/menu/low-stock');
export const getMenuItem = (id) => api.get(`/menu/${id}`);
export const createMenuItem = (data) => api.post('/menu', data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data);
export const toggleAvailability = (id) => api.patch(`/menu/${id}/availability`);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);

// Sessions
export const startSession = (tableNumber) => api.post('/sessions/start', { tableNumber });
export const getSession = (token) => api.get(`/sessions/${token}`);
export const getSessions = (params) => api.get('/sessions', { params });
export const endSession = (token) => api.patch(`/sessions/${token}/end`);

// Orders
export const placeOrder = (data) => api.post('/orders', data);
export const getOrders = (params) => api.get('/orders', { params });
export const getActiveOrders = () => api.get('/orders/active');
export const getSessionOrders = (token) => api.get(`/orders/session/${token}`);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const updateItemStatus = (id, itemId, status) => api.patch(`/orders/${id}/items/${itemId}/status`, { status });

// Bills
export const generateBill = (sessionToken) => api.post('/bills', { sessionToken });
export const payBill = (id, data) => api.post(`/bills/${id}/pay`, data);
export const getReceipt = (id) => api.get(`/bills/${id}/receipt`, { responseType: 'blob' });

// Analytics
export const getOverview = () => api.get('/analytics/overview');
export const getSales = (days) => api.get(`/analytics/sales?days=${days}`);
export const getPopularItemsAnalytics = () => api.get('/analytics/popular-items');
export const getPeakHours = () => api.get('/analytics/peak-hours');
export const exportReport = (period, format) => api.get(`/analytics/export?period=${period}&format=${format}`, { responseType: 'blob' });

// Extras
export const submitFeedback = (data) => api.post('/feedback', data);
export const getFeedback = () => api.get('/feedback');
export const getLoyalty = (phone) => api.get(`/loyalty/${phone}`);
export const redeemLoyalty = (data) => api.post('/loyalty/redeem', data);
export const createReservation = (data) => api.post('/reservations', data);
export const getReservations = (params) => api.get('/reservations', { params });
export const updateReservation = (id, data) => api.patch(`/reservations/${id}`, data);

export default api;
