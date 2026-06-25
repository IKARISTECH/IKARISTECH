import { create } from 'zustand';
import api from '../utils/apiClient';

export const useCalendarioStore = create((set, get) => ({
  eventos:  [],
  loading:  false,

  cargarEventos: async (desde, hasta) => {
    set({ loading: true });
    try {
      const { data } = await api.get('/calendario', { params: { desde, hasta } });
      set({ eventos: data.data || [] });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  crearEvento: async (datos) => {
    try {
      const { data } = await api.post('/calendario', datos);
      set((s) => ({ eventos: [...s.eventos, data.data] }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al crear evento' };
    }
  },

  actualizarEvento: async (id, datos) => {
    try {
      const { data } = await api.put(`/calendario/${id}`, datos);
      set((s) => ({ eventos: s.eventos.map((e) => e.id === id ? data.data : e) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al actualizar' };
    }
  },

eliminarEvento: async (id) => {
    try {
      await api.delete(`/calendario/${id}`);
      set((s) => ({ eventos: s.eventos.filter((e) => e.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al eliminar' };
    }
  },

  cargarProximos: async () => {
    try {
      const { data } = await api.get('/calendario/proximos');
      return data.data || [];
    } catch {
      return [];
    }
  },
}));