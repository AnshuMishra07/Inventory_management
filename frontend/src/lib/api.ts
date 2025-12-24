import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const authAPI = {
  login: (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    return apiClient.post('/auth/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  register: (data: any) => apiClient.post('/auth/register', data),
  getCurrentUser: () => apiClient.get('/auth/me')
};

export const productsAPI = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  search: (query: string) => apiClient.get('/products/search', { params: { q: query } }),
  getLowStock: () => apiClient.get('/products/low-stock')
};

export const inventoryAPI = {
  getAll: (params?: any) => apiClient.get('/inventory', { params }),
  adjust: (data: any) => apiClient.post('/inventory/adjust', data),
  transfer: (data: any) => apiClient.post('/inventory/transfer', data),
  getTransactions: (params?: any) => apiClient.get('/inventory/transactions', { params }),
  getProductInventory: (productId: string) => apiClient.get(`/inventory/product/${productId}/warehouses`)
};

export const salesAPI = {
  getAll: (params?: any) => apiClient.get('/sales', { params }),
  getById: (id: string) => apiClient.get(`/sales/${id}`),
  create: (data: any) => apiClient.post('/sales', data),
  update: (id: string, data: any) => apiClient.put(`/sales/${id}`, data),
  fulfill: (id: string) => apiClient.post(`/sales/${id}/fulfill`)
};

export const customersAPI = {
  getAll: (params?: any) => apiClient.get('/customers', { params }),
  getById: (id: string) => apiClient.get(`/customers/${id}`),
  create: (data: any) => apiClient.post('/customers', data),
  update: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/customers/${id}`)
};

export const alertsAPI = {
  getAll: (params?: any) => apiClient.get('/alerts', { params }),
  acknowledge: (id: string) => apiClient.put(`/alerts/${id}/acknowledge`),
  resolve: (id: string) => apiClient.put(`/alerts/${id}/resolve`),
  check: () => apiClient.post('/alerts/check')
};

export const reportsAPI = {
  inventoryValue: (params?: any) => apiClient.get('/reports/inventory-valuation', { params }),
  salesSummary: (startDate: string, endDate: string) => apiClient.get('/reports/sales-summary', { params: { start_date: startDate, end_date: endDate } }),
  productPerformance: (startDate: string, endDate: string) => apiClient.get('/reports/product-performance', { params: { start_date: startDate, end_date: endDate } }),
  lowStock: () => apiClient.get('/reports/low-stock-summary'),
  getGSTSummary: (startDate: string, endDate: string) =>
    apiClient.get('/reports/gst-summary', {
      params: { start_date: startDate, end_date: endDate }
    }),
  downloadGSTCSV: (startDate: string, endDate: string) =>
    apiClient.get('/reports/gst-summary', {
      params: { start_date: startDate, end_date: endDate, format: 'csv' },
      responseType: 'blob'
    }),
  downloadGSTExcel: (startDate: string, endDate: string) =>
    apiClient.get('/reports/gst-summary', {
      params: { start_date: startDate, end_date: endDate, format: 'excel' },
      responseType: 'blob'
    }),
  getDetailedSalesReport: (startDate: string, endDate: string) =>
    apiClient.get('/reports/detailed-sales-report', {
      params: { start_date: startDate, end_date: endDate }
    }),
  downloadDetailedSalesReport: (startDate: string, endDate: string) =>
    apiClient.get('/reports/detailed-sales-report', {
      params: { start_date: startDate, end_date: endDate, format: 'excel' },
      responseType: 'blob'
    }),
  getStockInventoryReport: (date?: string) =>
    apiClient.get('/reports/stock-inventory', {
      params: { date }
    }),
  downloadStockInventoryExcel: (date?: string) =>
    apiClient.get('/reports/stock-inventory', {
      params: { date, format: 'excel' },
      responseType: 'blob'
    })
};

export const warehousesAPI = {
  getAll: (params?: any) => apiClient.get("/warehouses", { params }),
  getById: (id: string) => apiClient.get(`/warehouses/${id}`),
  create: (data: any) => apiClient.post("/warehouses", data),
  update: (id: string, data: any) => apiClient.put(`/warehouses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/warehouses/${id}`)
};
