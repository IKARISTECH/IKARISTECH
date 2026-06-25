import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Icons } from '../../components/ui/Icons';
import { useAlert } from '../../hooks/useAlert';
import api from '../../utils/apiClient';

const STEPS = ['Empresa', 'Tu cuenta', 'Contraseña', 'Verificación'];

export default function Registro() {
  const [step, setStep]         = useState(0);
const [enviando, setEnviando]     = useState(false);
const [codigo, setCodigo]         = useState(['', '', '', '', '', '']);
const [showPass, setShowPass]     = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm]         = useState({
    nombreEmpresa: '', nombre: '', apellido: '',
    correo: '', password: '', confirmPassword: '',
  });

  const { registro, loading } = useAuthStore();
  const alert    = useAlert();
  const navigate = useNavigate();

  const setField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Manejar input del código OTP ─────────────────────────────────────────
  const handleCodigoChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...codigo];
    next[index] = value.slice(-1);
    setCodigo(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleCodigoPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setCodigo(paste.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleCodigoKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // ── Validar y avanzar steps ───────────────────────────────────────────────
  const nextStep = async () => {
    if (step === 0 && !form.nombreEmpresa.trim()) {
      return alert.warning('Campo requerido', 'Ingresa el nombre de tu empresa.');
    }
    if (step === 1) {
      if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) {
        return alert.warning('Campos incompletos', 'Completa todos los campos.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
        return alert.warning('Correo inválido', 'Ingresa un correo válido.');
      }
    }
    if (step === 2) {
      if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
        return alert.warning('Contraseña débil', 'Mínimo 8 caracteres, una mayúscula y un número.');
      }
      if (form.password !== form.confirmPassword) {
        return alert.error('Error', 'Las contraseñas no coinciden.');
      }
      // Enviar código al correo antes de mostrar el step 3
      setEnviando(true);
      try {
        await api.post('/auth/solicitar-codigo', {
          correo:        form.correo,
          nombre:        form.nombre,
          nombreEmpresa: form.nombreEmpresa,
        });
        alert.success('Código enviado', `Revisa tu correo ${form.correo}`);
      } catch (err) {
        setEnviando(false);
        return alert.error('Error', err.response?.data?.message || 'No se pudo enviar el código.');
      }
      setEnviando(false);
    }
    setStep((s) => s + 1);
  };

  // ── Submit final ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const codigoStr = codigo.join('');
    if (codigoStr.length !== 6) {
      return alert.warning('Código incompleto', 'Ingresa los 6 dígitos del código.');
    }
    const result = await registro({
      nombreEmpresa: form.nombreEmpresa,
      nombre:        form.nombre,
      apellido:      form.apellido,
      correo:        form.correo,
      password:      form.password,
      codigo:        codigoStr,
    });
    if (result.success) {
      alert.success('¡Bienvenido a IKARIS!', 'Tu empresa fue creada exitosamente.');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      alert.error('Error en el registro', result.message);
      // Si el código es inválido, limpiar los inputs
      setCodigo(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    }
  };

  const reenviarCodigo = async () => {
    setEnviando(true);
    try {
      await api.post('/auth/solicitar-codigo', {
        correo:        form.correo,
        nombre:        form.nombre,
        nombreEmpresa: form.nombreEmpresa,
      });
      setCodigo(['', '', '', '', '', '']);
      alert.info('Código reenviado', `Revisa tu correo ${form.correo}`);
    } catch (err) {
      alert.error('Error', err.response?.data?.message || 'Espera un momento.');
    }
    setEnviando(false);
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
  <p className="text-sm text-gray-500 dark:text-gray-400">Configura tu empresa en minutos</p>
</motion.div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                animate={{
                  backgroundColor: i <= step ? '#7c3aed' : undefined,
                  scale: i === step ? 1.1 : 1,
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i <= step
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </motion.div>
              {i < STEPS.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: i < step ? '#7c3aed' : undefined }}
                  className={`w-6 h-0.5 transition-all ${i < step ? 'bg-violet-600' : 'bg-gray-200 dark:bg-white/10'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#18181f] rounded-2xl border border-gray-200 dark:border-white/10 p-8 shadow-sm"
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
              {STEPS[step]}
            </h2>

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-4">

              {/* Step 0 — Empresa */}
              {step === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={form.nombreEmpresa}
                    onChange={setField('nombreEmpresa')}
                    placeholder="Mi Empresa S.A. de C.V."
                    className={inputClass}
                    autoFocus
                  />
                </div>
              )}

              {/* Step 1 — Datos personales */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
                      <input type="text" value={form.nombre} onChange={setField('nombre')} placeholder="Juan" className={inputClass} autoFocus />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apellido</label>
                      <input type="text" value={form.apellido} onChange={setField('apellido')} placeholder="García" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Correo electrónico</label>
                  <input
  type="email"
  value={form.correo}
  onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value.toLowerCase().trim() }))}
  placeholder="tu@empresa.com"
  className={inputClass}
/>
                  </div>
                </>
              )}

{/* Step 2 — Contraseña */}
{step === 2 && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Contraseña
      </label>
      <div className="relative">
        <input
          type={showPass ? 'text' : 'password'}
          value={form.password}
          onChange={setField('password')}
          placeholder="Mínimo 8 caracteres"
          className={`${inputClass} pr-11`}
          autoFocus
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowPass((v) => !v); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 focus:outline-none"
          title={showPass ? 'Ocultar' : 'Mostrar'}
        >
          {showPass
            ? <Icons.eyeOff className="w-4 h-4" />
            : <Icons.eye    className="w-4 h-4" />
          }
        </button>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Confirmar contraseña
      </label>
      <div className="relative">
        <input
          type={showConfirm ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={setField('confirmPassword')}
          placeholder="Repite tu contraseña"
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowConfirm((v) => !v); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 focus:outline-none"
          title={showConfirm ? 'Ocultar' : 'Mostrar'}
        >
          {showConfirm
            ? <Icons.eyeOff className="w-4 h-4" />
            : <Icons.eye    className="w-4 h-4" />
          }
        </button>
      </div>
    </div>

    <ul className="text-xs space-y-1.5 pt-1">
      {[
        { ok: form.password.length >= 8,        txt: 'Mínimo 8 caracteres' },
        { ok: /[A-Z]/.test(form.password),      txt: 'Al menos una mayúscula' },
        { ok: /[0-9]/.test(form.password),      txt: 'Al menos un número' },
        { ok: form.password === form.confirmPassword && form.password.length > 0, txt: 'Las contraseñas coinciden' },
      ].map(({ ok, txt }) => (
        <li key={txt} className={`flex items-center gap-2 transition-colors ${ok ? 'text-green-500' : 'text-gray-400'}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${ok ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-white/10'}`}>
            {ok ? '✓' : '·'}
          </span>
          {txt}
        </li>
      ))}
    </ul>
  </>
)}

              {/* Step 3 — Código OTP */}
              {step === 3 && (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Código enviado a
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-6">
                    {form.correo}
                  </p>

                  {/* Inputs OTP */}
                  <div className="flex gap-2 justify-center mb-4">
                    {codigo.map((digit, i) => (
                      <motion.input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodigoChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodigoKeyDown(i, e)}
                        onPaste={i === 0 ? handleCodigoPaste : undefined}
                        whileFocus={{ scale: 1.05 }}
                        className={`
                          w-11 h-14 text-center text-xl font-bold rounded-xl
                          border-2 transition-all
                          bg-gray-50 dark:bg-white/5
                          text-gray-900 dark:text-white
                          focus:outline-none focus:border-violet-500
                          ${digit
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-gray-200 dark:border-white/10'
                          }
                        `}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={reenviarCodigo}
                    disabled={enviando}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50 transition-opacity"
                  >
                    {enviando ? 'Enviando...' : '¿No lo recibiste? Reenviar código'}
                  </button>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex gap-3 pt-2">
                {step > 0 && step < 3 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Atrás
                  </button>
                )}
                <motion.button
                  type="submit"
                  disabled={loading || enviando}
                  whileHover={{ scale: (loading || enviando) ? 1 : 1.01 }}
                  whileTap={{ scale: (loading || enviando) ? 1 : 0.98 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-violet-600/25"
                >
                  {enviando ? 'Enviando código...' :
                   loading  ? 'Creando cuenta...' :
                   step < 3 ? 'Siguiente' : 'Verificar y crear cuenta'}
                </motion.button>
              </div>
            </form>

            {step < 3 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}