import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore }  from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAlert }      from '../../hooks/useAlert';
import { Icons }         from '../../components/ui/Icons';
import api               from '../../utils/apiClient';

export default function AceptarInvitacion() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const alert      = useAlert();
  const isDark     = useThemeStore((s) => s.isDark);
  const { login }  = useAuthStore();

  const correoParam = params.get('correo') || '';

  const [step,     setStep]     = useState(0); // 0=código, 1=contraseña
  const [codigo,   setCodigo]   = useState(['','','','','','']);
  const [form,     setForm]     = useState({ correo: correoParam, password: '', confirmPassword: '' });
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleCodigoChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...codigo]; next[i] = v.slice(-1); setCodigo(next);
    if (v && i < 5) document.getElementById(`inv-otp-${i+1}`)?.focus();
  };
  const handleCodigoKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !codigo[i] && i > 0) document.getElementById(`inv-otp-${i-1}`)?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length === 6) { setCodigo(p.split('')); document.getElementById('inv-otp-5')?.focus(); }
  };

  const handleActivar = async (e) => {
    e.preventDefault();
    const codigoStr = codigo.join('');
    if (codigoStr.length !== 6) return alert.warning('Código incompleto','Ingresa los 6 dígitos.');
    if (!form.correo) return alert.warning('Correo requerido','Ingresa tu correo.');
    if (form.password.length < 8) return alert.warning('Contraseña débil','Mínimo 8 caracteres.');
    if (form.password !== form.confirmPassword) return alert.error('Error','Las contraseñas no coinciden.');

    setLoading(true);
    try {
      const { data } = await api.post('/usuarios/aceptar-invitacion', {
        correo:   form.correo.toLowerCase().trim(),
        codigo:   codigoStr,
        password: form.password,
      });

      // Guardar sesión
      localStorage.setItem('ikaris_access_token',  data.data.accessToken);
      localStorage.setItem('ikaris_refresh_token', data.data.refreshToken);
      localStorage.setItem('ikaris_recordar', '1');

      alert.success('¡Bienvenido!', 'Tu cuenta fue activada correctamente.');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      alert.error('Error', err.response?.data?.message || 'Código inválido o expirado.');
      setCodigo(['','','','','','']);
      document.getElementById('inv-otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background:'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.07) 0%, transparent 50%), #f8f7ff' }}>

      <div className="absolute top-[-80px] left-[-60px] w-[400px] h-[400px] bg-violet-300/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-80px] w-[350px] h-[350px] bg-blue-300/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <img src="/assets/IKARISPURPLE.png" alt="IKARIS" className="h-36 w-auto mx-auto mb-3 object-contain" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Activa tu cuenta de colaborador</p>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="bg-white dark:bg-[#18181f] rounded-2xl border border-gray-200 dark:border-white/10 p-8 shadow-sm">

          <form onSubmit={handleActivar} className="space-y-5">

            {/* Correo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Correo de invitación</label>
              <input type="email" value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                placeholder="tu@empresa.com" className={inputClass} />
            </div>

            {/* OTP */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Código de verificación</label>
              <p className="text-xs text-gray-400 mb-3">Revisa el correo de invitación que recibiste.</p>
              <div className="flex gap-2 justify-center">
                {codigo.map((d, i) => (
                  <motion.input key={i} id={`inv-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handleCodigoChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodigoKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    whileFocus={{ scale:1.05 }}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 ${d ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-white/10'}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Crea tu contraseña</label>
              <div className="relative mb-3">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres" className={`${inputClass} pr-11`} />
                <button type="button" onClick={(e) => { e.preventDefault(); setShowPass((v) => !v); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                  {showPass ? <Icons.eyeOff className="w-4 h-4" /> : <Icons.eye className="w-4 h-4" />}
                </button>
              </div>
              <input type="password" value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirma tu contraseña" className={inputClass} />

              {/* Indicadores */}
              <div className="flex gap-3 mt-2 flex-wrap">
                {[
                  { ok: form.password.length >= 8, txt: '8+ chars' },
                  { ok: /[A-Z]/.test(form.password), txt: 'Mayúscula' },
                  { ok: /[0-9]/.test(form.password), txt: 'Número' },
                  { ok: form.password === form.confirmPassword && form.password.length > 0, txt: 'Coinciden' },
                ].map(({ ok, txt }) => (
                  <span key={txt} className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                    {ok ? '✓ ' : ''}{txt}
                  </span>
                ))}
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-violet-600/25">
              {loading ? 'Activando cuenta...' : 'Activar mi cuenta'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}