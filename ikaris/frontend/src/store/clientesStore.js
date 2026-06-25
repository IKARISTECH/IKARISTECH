import { create } from 'zustand';
import api from '../utils/apiClient';

export const useClientesStore = create((set, get) => ({
  clientes:       [],
  cliente:        null,
  estadisticas:   null,
  loading:        false,
  loadingCliente: false,
  total:          0,
  filtros: { search: '', activo: 'true' },

  setFiltro: (key, val) => set((s) => ({ filtros: { ...s.filtros, [key]: val } })),

  cargarClientes: async () => {
    set({ loading: true });
    try {
      const { filtros } = get();
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '') params.append(k, v); });
      const { data } = await api.get(`/clientes?${params}`);
      set({ clientes: data.data || [], total: data.total || 0 });
    } catch (err) { console.error(err); }
    finally { set({ loading: false }); }
  },

  cargarCliente: async (id) => {
    set({ loadingCliente: true, cliente: null });
    try {
      const { data } = await api.get(`/clientes/${id}`);
      set({ cliente: data.data });
    } catch (err) { console.error(err); }
    finally { set({ loadingCliente: false }); }
  },

  cargarEstadisticas: async () => {
    try {
      const { data } = await api.get('/clientes/estadisticas');
      set({ estadisticas: data.data });
    } catch (err) { console.error(err); }
  },

  crearCliente: async (datos) => {
    try {
      const { data } = await api.post('/clientes', datos);
      set((s) => ({ clientes: [data.data, ...s.clientes], total: s.total + 1 }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al crear' };
    }
  },

  actualizarCliente: async (id, datos) => {
    try {
      const { data } = await api.put(`/clientes/${id}`, datos);
      set((s) => ({
        clientes: s.clientes.map((c) => c.id === id ? data.data : c),
        cliente: s.cliente?.id === id ? data.data : s.cliente,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al actualizar' };
    }
  },

  eliminarCliente: async (id) => {
    try {
      await api.delete(`/clientes/${id}`);
      set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id), total: s.total - 1 }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },
}));