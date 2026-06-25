import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/apiClient';

const TOKEN_KEY   = 'ikaris_access_token';
const REFRESH_KEY = 'ikaris_refresh_token';
const RECORDAR_KEY = 'ikaris_recordar';

const getStorage  = (recordar) => recordar ? localStorage : sessionStorage;

const saveTokens  = (accessToken, refreshToken, recordar) => {
  getStorage(recordar).setItem(TOKEN_KEY,   accessToken);
  getStorage(recordar).setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(RECORDAR_KEY, recordar ? '1' : '0');
};

const clearTokens = () => {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(REFRESH_KEY);
  });
  localStorage.removeItem(RECORDAR_KEY);
};

const loadToken = () => {
  const recordar = localStorage.getItem(RECORDAR_KEY) === '1';
  return getStorage(recordar).getItem(TOKEN_KEY) || null;
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario:  null,
      empresa:  null,
      token:    loadToken(),
      recordar: localStorage.getItem(RECORDAR_KEY) === '1',
      loading:  false,
      error:    null,

      login: async ({ correo, password, recordar = false }) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', {
            correo: correo.toLowerCase().trim(),
            password,
          });
          const { usuario, empresa, accessToken, refreshToken } = data.data;
          saveTokens(accessToken, refreshToken, recordar);
          set({ usuario, empresa, token: accessToken, recordar, loading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Error al iniciar sesión';
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      registro: async (datos) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/registro', datos);
          const { usuario, empresa, accessToken, refreshToken } = data.data;
          saveTokens(accessToken, refreshToken, true);
          set({ usuario, empresa, token: accessToken, recordar: true, loading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Error al registrarse';
          set({ loading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        clearTokens();
        set({ usuario: null, empresa: null, token: null, recordar: false });
      },

isAuthenticated: () => !!get().token && !!get().usuario,
      clearError:      () => set({ error: null }),

      actualizarAvatar: async (file) => {
        try {
          const formData = new FormData();
          formData.append('avatar', file);

          const token =
            localStorage.getItem('ikaris_access_token') ||
            sessionStorage.getItem('ikaris_access_token');

          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/perfil/avatar`,
            {
              method:  'PUT',
              headers: { Authorization: `Bearer ${token}` },
              body:    formData,
            }
          );

          const data = await response.json();
          if (!data.success) return { success: false, message: data.message };

          // Actualiza el store (y localStorage por el persist)
          set((s) => ({
            usuario: { ...s.usuario, avatar_url: data.data.avatar_url },
          }));

          return { success: true, avatar_url: data.data.avatar_url };
        } catch (err) {
          return { success: false, message: 'Error al subir la foto' };
        }
      },
    }),
    {
      name: 'ikaris-auth',
      // Persiste usuario y empresa en localStorage
      partialize: (s) => ({
        usuario:  s.usuario,
        empresa:  s.empresa,
        recordar: s.recordar,
      }),
    }
  )
);