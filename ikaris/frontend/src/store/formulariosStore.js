import { create } from 'zustand';
import api from '../utils/apiClient';

export const useFormulariosStore = create((set, get) => ({
  formularios:  [],
  formulario:   null,
  respuestas:   [],
  loading:      false,
  loadingResp:  false,

  cargarFormularios: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/formularios');
      set({ formularios: data.data || [] });
    } catch (err) { console.error(err); }
    finally { set({ loading: false }); }
  },

  cargarFormulario: async (id) => {
    set({ loading: true, formulario: null });
    try {
      const { data } = await api.get(`/formularios/${id}`);
      set({ formulario: data.data });
    } catch (err) { console.error(err); }
    finally { set({ loading: false }); }
  },

  cargarRespuestas: async (id, filtros = {}) => {
    set({ loadingResp: true });
    try {
      const params = new URLSearchParams(filtros);
      const { data } = await api.get(`/formularios/${id}/respuestas?${params}`);
      set({ respuestas: data.data || [] });
    } catch (err) { console.error(err); }
    finally { set({ loadingResp: false }); }
  },

  crearFormulario: async (datos) => {
    try {
      const { data } = await api.post('/formularios', datos);
      set((s) => ({ formularios: [data.data, ...s.formularios] }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  actualizarFormulario: async (id, datos) => {
    try {
      const { data } = await api.put(`/formularios/${id}`, datos);
      set((s) => ({
        formularios: s.formularios.map((f) => f.id === id ? data.data : f),
        formulario:  s.formulario?.id === id ? data.data : s.formulario,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

eliminarFormulario: async (id) => {
    try {
      await api.delete(`/formularios/${id}`);
      // Quitarlo inmediatamente del estado local sin esperar recarga
      set((s) => ({ formularios: s.formularios.filter((f) => f.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al archivar' };
    }
  },

  enviarRespuesta: async (id, datos) => {
    try {
      const { data } = await api.post(`/formularios/${id}/respuestas`, datos);
      set((s) => ({ respuestas: [data.data, ...s.respuestas] }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  actualizarRespuesta: async (formId, respId, datos) => {
    try {
      const { data } = await api.put(`/formularios/${formId}/respuestas/${respId}`, datos);
      set((s) => ({ respuestas: s.respuestas.map((r) => r.id === respId ? data.data : r) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

eliminarRespuestas: async (formId, ids) => {
    try {
      await api.delete(`/formularios/${formId}/respuestas/bulk`, { data: { ids } });
      set((s) => ({ respuestas: s.respuestas.filter((r) => !ids.includes(r.id)) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },
}));