import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    console.error('❌ API Error:', message);
    
    // Auto logout on unauthorized (401)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    
    return Promise.reject({
      message,
      status: error.response?.status,
      originalError: error,
    });
  }
);

export default api;
