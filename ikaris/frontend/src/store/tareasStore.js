import { create } from 'zustand';
import api from '../utils/apiClient';

export const useTareasStore = create((set, get) => ({
  tareas:       [],
  tarea:        null,
  opciones:     { usuarios: [], departamentos: [] },
  loading:      false,
  loadingTarea: false,
  total:        0,
  filtros: {
    estado: '', prioridad: '', departamento_id: '', asignado_a: '', search: '',
  },

  setFiltro: (key, value) =>
    set((s) => ({ filtros: { ...s.filtros, [key]: value } })),

  cargarTareas: async () => {
    set({ loading: true });
    try {
      const { filtros } = get();
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
      const { data } = await api.get(`/tareas?${params}`);
      set({ tareas: data.data || [], total: data.total || 0 });
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      set({ loading: false });
    }
  },

  cargarTarea: async (id) => {
    set({ loadingTarea: true, tarea: null });
    try {
      const { data } = await api.get(`/tareas/${id}`);
      set({ tarea: data.data });
    } catch (err) {
      console.error('Error cargando tarea:', err);
    } finally {
      set({ loadingTarea: false });
    }
  },

  cargarOpciones: async () => {
    try {
      const { data } = await api.get('/tareas/opciones');
      set({ opciones: data.data });
    } catch (err) {
      console.error('Error cargando opciones:', err);
    }
  },

  crearTarea: async (datos) => {
    try {
      const { data } = await api.post('/tareas', datos);
      set((s) => ({ tareas: [data.data, ...s.tareas] }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al crear' };
    }
  },

actualizarTarea: async (id, datos) => {
    try {
      const { data } = await api.put(`/tareas/${id}`, datos);
      set((s) => ({
        tareas: s.tareas.map((t) => t.id === id ? { ...t, ...data.data } : t),
        tarea:  s.tarea?.id === id ? { ...s.tarea, ...data.data } : s.tarea,
      }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al actualizar' };
    }
  },

  cambiarEstado: async (id, estado) => {
    try {
      const { data } = await api.patch(`/tareas/${id}/estado`, { estado });
      set((s) => ({
        tareas: s.tareas.map((t) => t.id === id ? { ...t, ...data.data } : t),
        tarea:  s.tarea?.id === id ? { ...s.tarea, ...data.data } : s.tarea,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  eliminarTarea: async (id) => {
    try {
      await api.delete(`/tareas/${id}`);
      set((s) => ({ tareas: s.tareas.filter((t) => t.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  agregarComentario: async (tareaId, contenido) => {
    try {
      const { data } = await api.post(`/tareas/${tareaId}/comentarios`, { contenido });
      set((s) => ({
        tarea: s.tarea ? {
          ...s.tarea,
          comentarios: [...(s.tarea.comentarios || []), data.data],
        } : s.tarea,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },
// ── Entregas individuales ──────────────────────────────────────────────
  miEntrega: null,
  entregas:  [],

  cargarMiEntrega: async (tareaId) => {
    try {
      const { data } = await api.get(`/tareas/${tareaId}/mi-entrega`);
      set({ miEntrega: data.data });
      return data.data;
    } catch { return null; }
  },

  cargarEntregas: async (tareaId) => {
    try {
      const { data } = await api.get(`/tareas/${tareaId}/entregas`);
      set({ entregas: data.data || [] });
    } catch (err) { console.error(err); }
  },

  subirEntrega: async (tareaId, file, comentario) => {
    try {
      const reader = new FileReader();
      const base64 = await new Promise((res) => {
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      });
      const { data } = await api.post(`/tareas/${tareaId}/entregar`, {
        nombre: file.name, tipo: file.type, tamaño: file.size, base64, comentario,
      });
      set({ miEntrega: data.data });
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  revisarEntrega: async (tareaId, entregaId, estado, comentario) => {
    try {
      const { data } = await api.patch(`/tareas/${tareaId}/entregas/${entregaId}/revisar`, { estado, comentario });
      set((s) => ({
        entregas: s.entregas.map((e) => e.id === entregaId ? data.data : e),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  subirArchivo: async (tareaId, file) => {
    try {
      const reader = new FileReader();
      const base64 = await new Promise((res) => {
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      });
      const { data } = await api.post(`/tareas/${tareaId}/archivos`, {
        nombre: file.name,
        tipo:   file.type,
        tamaño: file.size,
        base64,
      });
      set((s) => ({
        tarea: s.tarea ? {
          ...s.tarea,
          archivos: [data.data, ...(s.tarea.archivos || [])],
        } : s.tarea,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },
}));