import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useAlert } from '../../hooks/useAlert';
import { Icons } from '../../components/ui/Icons';
import Toggle from '../../components/ui/Toggle';

export default function Login() {
  const [form, setForm]         = useState({ correo: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const { login, loading }      = useAuthStore();
  const alert                   = useAlert();
  const navigate                = useNavigate();
  const location                = useLocation();
  const destino                 = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.correo || !form.password) {
      return alert.warning('Campos incompletos', 'Ingresa tu correo y contraseña.');
    }
    const result = await login({ ...form, recordar });
    if (result.success) {
      navigate(destino, { replace: true });
    } else {
      alert.error('Error al iniciar sesión', result.message);
    }
  };

  const inputClass = `
    w-full px-4 py-2.5 text-sm rounded-xl
    bg-gray-50 dark:bg-white/5
    border border-gray-200 dark:border-white/10
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-600
    focus:outline-none focus:ring-2 focus:ring-violet-500/60
    transition-all
  `;

return (
<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
  style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.07) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(59,130,246,0.06) 0%, transparent 50%), #f8f7ff' }}
>

    {/* Blobs sutiles */}
    <div className="absolute top-[-100px] left-[-80px] w-[500px] h-[500px] bg-violet-300/10 dark:bg-violet-600/10 rounded-full blur-[130px] pointer-events-none" />
    <div className="absolute bottom-[-80px] right-[-100px] w-[450px] h-[450px] bg-blue-300/10 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
    <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-indigo-300/8 dark:bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
    <div className="w-full max-w-md relative z-10">

        {/* Logo */}
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="text-center mb-8"
>
<img
  src="/assets/IKARISPURPLE.png"
  alt="IKARIS"
  className="h-43 w-auto mx-auto mb-3 object-contain"
/>
  <p className="text-sm text-gray-500 dark:text-gray-400">Inicia sesión en tu empresa</p>
</motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#18181f] rounded-2xl border border-gray-200 dark:border-white/10 p-8 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="tu@empresa.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowPass((v) => !v); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 focus:outline-none"
                >
                  {showPass
                    ? <Icons.eyeOff className="w-4 h-4" />
                    : <Icons.eye    className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Recordarme */}
            <div className="flex items-center justify-between pt-1">
              <Toggle
                active={recordar}
                onChange={setRecordar}
                label="Recordar sesión"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 max-w-[140px] text-right leading-tight">
                {recordar
                  ? 'Tu sesión se mantendrá activa'
                  : 'Se cerrará al cerrar el navegador'
                }
              </span>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-400 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-violet-600/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : 'Iniciar sesión'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
              Registra tu empresa
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}