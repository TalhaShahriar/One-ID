import axios from 'axios';

/**
 * Configure Axios Instance with unified base URL on same domain/port context.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Request interceptor: Inject the bearer tokens dynamically on outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('votechain_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Gracefully intercept token expiry / authorization failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRequest = error.config && (
        error.config.url.includes('/auth/login') || 
        error.config.url.includes('/auth/register') ||
        error.config.url.includes('/auth/verify-otp') ||
        error.config.url.includes('/auth/verify-mfa')
      );
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/verify-otp' || window.location.pathname === '/mfa';

      if (!isAuthRequest && !isAuthPage) {
        console.warn('⚠️ Crypto session expired or failed credentials match. Redirecting...');
        localStorage.removeItem('votechain_token');
        localStorage.removeItem('votechain_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
