import axios from 'axios';

// Base Axios instance
export const api = axios.create({
  baseURL: '/api/v1', // Adjust this if your backend is on a different domain, or use Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('salonApplicationToken');
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If the token expires, log the user out automatically
      localStorage.removeItem('salonApplicationToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
