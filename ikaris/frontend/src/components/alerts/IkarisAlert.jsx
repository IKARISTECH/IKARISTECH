import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertStore } from '../../store/alertStore';

// SVGs animados por tipo
const AlertIllustration = ({ tipo }) => {
  const illustrations = {
    success: (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <defs>
          <radialGradient id="sg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d3f9d8" />
            <stop offset="100%" stopColor="#b2f2bb" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#sg)" />
        {/* Círculos decorativos orbitando */}
        <circle cx="60" cy="6" r="4" fill="#51cf66" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="12" r="2.5" fill="#40c057" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from="180 60 60" to="540 60 60" dur="4s" repeatCount="indefinite" />
        </circle>
        {/* Check animado */}
        <circle cx="60" cy="60" r="28" fill="none" stroke="#51cf66" strokeWidth="3">
          <animate attributeName="stroke-dasharray" from="0 176" to="176 0" dur="0.6s" fill="freeze" />
        </circle>
        <polyline points="44,61 55,72 76,50" fill="none" stroke="#2f9e44" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" from="0 60" to="60 0" dur="0.5s" begin="0.3s" fill="freeze" />
        </polyline>
      </svg>
    ),

    error: (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <defs>
          <radialGradient id="eg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe3e3" />
            <stop offset="100%" stopColor="#ffc9c9" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#eg)" />
        {/* Partículas */}
        <circle cx="20" cy="20" r="3" fill="#ff6b6b" opacity="0.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="30" r="2" fill="#fa5252" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="95" r="3.5" fill="#e03131" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        {/* X animada */}
        <circle cx="60" cy="60" r="28" fill="none" stroke="#ff6b6b" strokeWidth="3">
          <animate attributeName="stroke-dasharray" from="0 176" to="176 0" dur="0.5s" fill="freeze" />
        </circle>
        <line x1="46" y1="46" x2="74" y2="74" stroke="#e03131" strokeWidth="4" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" from="0 40" to="40 0" dur="0.4s" begin="0.2s" fill="freeze" />
        </line>
        <line x1="74" y1="46" x2="46" y2="74" stroke="#e03131" strokeWidth="4" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" from="0 40" to="40 0" dur="0.4s" begin="0.35s" fill="freeze" />
        </line>
      </svg>
    ),

    warning: (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <defs>
          <radialGradient id="wg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3bf" />
            <stop offset="100%" stopColor="#ffec99" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#wg)" />
        {/* Destellos */}
        <line x1="60" y1="4" x2="60" y2="14" stroke="#f59f00" strokeWidth="2.5" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="60" y1="106" x2="60" y2="116" stroke="#f59f00" strokeWidth="2.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="4" y1="60" x2="14" y2="60" stroke="#f59f00" strokeWidth="2.5" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        </line>
        <line x1="106" y1="60" x2="116" y2="60" stroke="#f59f00" strokeWidth="2.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />
        </line>
        {/* Triángulo + ! */}
        <polygon points="60,28 90,88 30,88" fill="none" stroke="#f59f00" strokeWidth="3.5" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" from="0 200" to="200 0" dur="0.6s" fill="freeze" />
        </polygon>
        <line x1="60" y1="50" x2="60" y2="70" stroke="#e67700" strokeWidth="4" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" from="0 25" to="25 0" dur="0.3s" begin="0.5s" fill="freeze" />
        </line>
        <circle cx="60" cy="79" r="3" fill="#e67700">
          <animate attributeName="r" from="0" to="3" dur="0.2s" begin="0.7s" fill="freeze" />
        </circle>
      </svg>
    ),

    info: (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <defs>
          <radialGradient id="ig" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dbe4ff" />
            <stop offset="100%" stopColor="#bac8ff" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#ig)" />
        {/* Ondas */}
        <circle cx="60" cy="60" r="36" fill="none" stroke="#748ffc" strokeWidth="1.5" opacity="0.4">
          <animate attributeName="r" values="36;48;36" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="60" r="28" fill="none" stroke="#4c6ef5" strokeWidth="3">
          <animate attributeName="stroke-dasharray" from="0 176" to="176 0" dur="0.5s" fill="freeze" />
        </circle>
        <line x1="60" y1="50" x2="60" y2="75" stroke="#3b5bdb" strokeWidth="4" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="0.4s" begin="0.3s" fill="freeze" />
        </line>
        <circle cx="60" cy="42" r="3" fill="#3b5bdb">
          <animate attributeName="r" from="0" to="3" dur="0.2s" begin="0.6s" fill="freeze" />
        </circle>
      </svg>
    ),

    notification: (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <defs>
          <radialGradient id="ng" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#ng)" />
        {/* Ondas de sonido */}
        <path d="M 78 40 Q 90 60 78 80" fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0.3s" repeatCount="indefinite" />
        </path>
        <path d="M 84 33 Q 100 60 84 87" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        </path>
        {/* Campana */}
        <path d="M60,32 C48,32 40,40 40,52 L40,70 L36,76 L84,76 L80,70 L80,52 C80,40 72,32 60,32 Z" fill="#0ea5e9" />
        <path d="M36,76 L84,76" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="82" r="5" fill="#0284c7" />
        <circle cx="60" cy="32" r="4" fill="#38bdf8">
          <animate attributeName="cy" values="32;28;32" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
  };

  return illustrations[tipo] || illustrations.info;
};

const typeConfig = {
  success:      { confirmBg: 'bg-green-500 hover:bg-green-600',  cancelColor: 'text-green-600' },
  error:        { confirmBg: 'bg-red-500 hover:bg-red-600',      cancelColor: 'text-red-500' },
  warning:      { confirmBg: 'bg-yellow-500 hover:bg-yellow-600', cancelColor: 'text-yellow-600' },
  info:         { confirmBg: 'bg-blue-600 hover:bg-blue-700',    cancelColor: 'text-blue-600' },
  notification: { confirmBg: 'bg-sky-500 hover:bg-sky-600',      cancelColor: 'text-sky-500' },
};

export default function IkarisAlert() {
  const { alert, closeAlert } = useAlertStore();

  const handleConfirm = () => {
    if (alert?.onConfirm) alert.onConfirm();
    closeAlert();
  };

  const handleCancel = () => {
    if (alert?.onCancel) alert.onCancel();
    closeAlert();
  };

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleCancel(); };
    if (alert) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [alert]);

  const config = typeConfig[alert?.tipo] || typeConfig.info;

return (
    <AnimatePresence>
      {alert && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 9999990 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 9999991 }}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div
              className="pointer-events-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ilustración */}
              <div className="flex justify-center items-center pt-10 pb-4 bg-gradient-to-b from-slate-50 to-white dark:from-gray-800 dark:to-gray-900">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                >
                  <AlertIllustration tipo={alert.tipo} />
                </motion.div>
              </div>

              {/* Texto */}
              <div className="px-6 pt-2 pb-6 text-center">
                <motion.h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {alert.titulo}
                </motion.h3>
                <motion.p
                  className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  {alert.mensaje}
                </motion.p>
              </div>

              {/* Botones */}
              <motion.div
                className="flex border-t border-gray-100 dark:border-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <button
                  onClick={handleCancel}
                  className={`flex-1 py-4 text-sm font-semibold uppercase tracking-widest ${config.cancelColor} dark:opacity-80 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                >
                  {alert.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-4 text-sm font-semibold text-white uppercase tracking-widest ${config.confirmBg} transition-colors`}
                >
                  {alert.confirmText}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}