import axios from 'axios';

// Base Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1', // Uses absolute AWS URL in production, or relative Vite proxy locally
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypasses the Ngrok warning page that breaks CORS
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
