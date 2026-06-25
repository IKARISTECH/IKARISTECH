import { create } from 'zustand';
import api from '../utils/apiClient';

export const useUsuariosStore = create((set, get) => ({
  usuarios:      [],
  departamentos: [],
  loading:       false,

  cargarUsuarios: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/usuarios');
      set({ usuarios: data.data || [] });
    } catch (err) { console.error(err); }
    finally { set({ loading: false }); }
  },

  cargarDepartamentos: async () => {
    try {
      const { data } = await api.get('/usuarios/departamentos');
      set({ departamentos: data.data || [] });
    } catch (err) { console.error(err); }
  },

  invitarUsuario: async (datos) => {
    try {
      const { data } = await api.post('/usuarios/invitar', datos);
      set((s) => ({ usuarios: [data.data, ...s.usuarios] }));
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error al invitar' };
    }
  },

  actualizarUsuario: async (id, datos) => {
    try {
      const { data } = await api.put(`/usuarios/${id}`, datos);
      set((s) => ({ usuarios: s.usuarios.map((u) => u.id === id ? { ...u, ...data.data } : u) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  desactivarUsuario: async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      set((s) => ({ usuarios: s.usuarios.map((u) => u.id === id ? { ...u, activo: false } : u) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  activarUsuario: async (id) => {
    try {
      await api.patch(`/usuarios/${id}/activar`);
      set((s) => ({ usuarios: s.usuarios.map((u) => u.id === id ? { ...u, activo: true } : u) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  reenviarInvitacion: async (id) => {
    try {
      await api.post(`/usuarios/${id}/reenviar-invitacion`);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  obtenerPermisos: async (id) => {
    try {
      const { data } = await api.get(`/usuarios/${id}/permisos`);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  guardarPermisos: async (id, permisos) => {
    try {
      await api.post(`/usuarios/${id}/permisos`, { permisos });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  crearDepartamento: async (datos) => {
    try {
      const { data } = await api.post('/usuarios/departamentos', datos);
      set((s) => ({ departamentos: [...s.departamentos, data.data] }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  actualizarDepartamento: async (id, datos) => {
    try {
      const { data } = await api.put(`/usuarios/departamentos/${id}`, datos);
      set((s) => ({ departamentos: s.departamentos.map((d) => d.id === id ? { ...d, ...data.data } : d) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  eliminarDepartamento: async (id) => {
    try {
      await api.delete(`/usuarios/departamentos/${id}`);
      set((s) => ({ departamentos: s.departamentos.filter((d) => d.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  crearPuesto: async (datos) => {
    try {
      const { data } = await api.post('/usuarios/puestos', datos);
      // Actualizar el departamento con el nuevo puesto
      set((s) => ({
        departamentos: s.departamentos.map((d) =>
          d.id === datos.departamento_id
            ? { ...d, puestos: [...(d.puestos || []), data.data] }
            : d
        ),
      }));
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },

  eliminarPuesto: async (id, departamento_id) => {
    try {
      await api.delete(`/usuarios/puestos/${id}`);
      set((s) => ({
        departamentos: s.departamentos.map((d) =>
          d.id === departamento_id
            ? { ...d, puestos: (d.puestos || []).filter((p) => p.id !== id) }
            : d
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Error' };
    }
  },
}));