import { create } from 'zustand';

export const useAlertStore = create((set) => ({
  alert: null,

  showAlert: ({ tipo = 'info', titulo, mensaje, onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'No ahora' }) =>
    set({
      alert: { tipo, titulo, mensaje, onConfirm, onCancel, confirmText, cancelText },
    }),

  closeAlert: () => set({ alert: null }),
}));