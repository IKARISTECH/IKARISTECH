import { useAlertStore } from '../store/alertStore';

export function useAlert() {
  const showAlert = useAlertStore((s) => s.showAlert);

  return {
    // Alerta simple informativa
    info: (titulo, mensaje) =>
      showAlert({ tipo: 'info', titulo, mensaje }),

    // Éxito
    success: (titulo, mensaje) =>
      showAlert({ tipo: 'success', titulo, mensaje }),

    // Error
    error: (titulo, mensaje) =>
      showAlert({ tipo: 'error', titulo, mensaje }),

    // Advertencia
    warning: (titulo, mensaje) =>
      showAlert({ tipo: 'warning', titulo, mensaje }),

    // Notificación
    notification: (titulo, mensaje) =>
      showAlert({ tipo: 'notification', titulo, mensaje }),

    // Confirmación con acción
    confirm: (titulo, mensaje, onConfirm, options = {}) =>
      showAlert({
        tipo: options.tipo || 'warning',
        titulo,
        mensaje,
        onConfirm,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
      }),
  };
}