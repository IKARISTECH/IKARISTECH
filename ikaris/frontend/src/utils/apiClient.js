import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: adjunta el token a cada request ───────────────────────────
api.interceptors.request.use((config) => {
  // Busca en localStorage primero, luego sessionStorage
  const token =
    localStorage.getItem('ikaris_access_token') ||
    sessionStorage.getItem('ikaris_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor: maneja token expirado automáticamente ────────────────────
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isExpired = error.response?.status === 401 &&
                      error.response?.data?.code === 'TOKEN_EXPIRED';

    if (isExpired && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('ikaris_refresh_token');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
          { refreshToken }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem('ikaris_access_token',  newToken);
        localStorage.setItem('ikaris_refresh_token', data.data.refreshToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('ikaris_access_token');
        localStorage.removeItem('ikaris_refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;