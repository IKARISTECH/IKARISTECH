import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../ui/Icons';
import { useAuthStore } from '../../store/authStore';
import { useAlert } from '../../hooks/useAlert';

const PLAN_COLOR = {
  gratis:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  premium:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function ProfileDropdown({ open, onClose }) {
  const ref      = useRef(null);
  const navigate = useNavigate();
  const alert    = useAlert();
  const { usuario, empresa, logout, actualizarAvatar } = useAuthStore();

  const [uploading,   setUploading]   = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSrc,     setCropSrc]     = useState(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!usuario) return null;

  const initials = `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase();
  const planKey  = empresa?.plan?.toLowerCase() || 'gratis';

  const handleChangeFoto = () => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropSrc(ev.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Recibe el blob recortado, lo sube y actualiza el store
  const handleCropDone = async (croppedBlob) => {
    setShowCropper(false);
    setCropSrc(null);
    setUploading(true);

    const result = await actualizarAvatar(croppedBlob);
    setUploading(false);

    if (result.success) {
      alert.success('Foto actualizada', 'Tu foto de perfil fue guardada.');
    } else {
      alert.error('Error', result.message || 'No se pudo guardar la foto.');
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login', { replace: true });
  };

  // Avatar actual: viene del store (persiste entre sesiones)
  const avatarSrc = usuario.avatar_url || null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="absolute right-0 top-[calc(100%+8px)] w-80 z-50 bg-white dark:bg-[#18181f] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 flex items-start gap-4 border-b border-gray-100 dark:border-white/10">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center ring-2 ring-violet-200 dark:ring-violet-900 overflow-hidden">
                  {uploading ? (
                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : avatarSrc ? (
                    <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{initials}</span>
                  )}
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-[#18181f]" />
                {/* Botón cámara */}
                <button
                  onClick={handleChangeFoto}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  title="Cambiar foto"
                >
                  <Icons.camera className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                  {usuario.nombre} {usuario.apellido}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  {usuario.correo}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Icons.building className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {empresa?.nombre || 'Sin empresa'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full capitalize">
                    {usuario.rol}
                  </span>
                  {usuario.departamentos?.nombre && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                      {usuario.departamentos.nombre}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PLAN_COLOR[planKey] || PLAN_COLOR.gratis}`}>
                    {empresa?.plan || 'Gratis'}
                  </span>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="p-2">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 pt-2 pb-1">
                Cuenta
              </p>
              {[
                { label: 'Configuración', icon: Icons.settings, action: () => { navigate('/configuracion'); onClose(); } },
                { label: 'Mi plan',       icon: Icons.plan,     action: () => { navigate('/plan');          onClose(); } },
                { label: 'Ver perfil',    icon: Icons.clients,  action: () => { navigate('/perfil');        onClose(); } },
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                  {label}
                  <Icons.chevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 ml-auto" />
                </button>
              ))}

              <div className="mx-2 my-1.5 h-px bg-gray-100 dark:bg-white/10" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
              >
                <Icons.logout className="w-4 h-4 shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper */}
      <AnimatePresence>
        {showCropper && cropSrc && (
          <ImageCropper
            src={cropSrc}
            onCrop={handleCropDone}
            onClose={() => { setShowCropper(false); setCropSrc(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Cropper circular ───────────────────────────────────────────────────────
function ImageCropper({ src, onCrop, onClose }) {
  const canvasRef    = useRef(null);
  const imageRef     = useRef(null);
  const [scale,      setScale]    = useState(1);
  const [offset,     setOffset]   = useState({ x: 0, y: 0 });
  const [dragging,   setDragging] = useState(false);
  const [dragStart,  setDragStart]= useState({ x: 0, y: 0 });
  const SIZE = 280;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    const x = SIZE / 2 - w / 2 + offset.x;
    const y = SIZE / 2 - h / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imageRef.current = img; draw(); };
    img.src = src;
  }, [src]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  // Retorna un Blob en vez de dataURL para enviarlo como FormData
  const handleCrop = () => {
    const output  = document.createElement('canvas');
    output.width  = 200;
    output.height = 200;
    const ctx = output.getContext('2d');
    const img = imageRef.current;

    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.clip();

    const ratio = 200 / SIZE;
    const sw = img.naturalWidth  * scale;
    const sh = img.naturalHeight * scale;
    const sx = SIZE / 2 - sw / 2 + offset.x;
    const sy = SIZE / 2 - sh / 2 + offset.y;
    ctx.drawImage(img, sx * ratio, sy * ratio, sw * ratio, sh * ratio);

    // Convertir a Blob para enviar como multipart
    output.toBlob((blob) => {
      onCrop(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        exit={{   scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ background: 'var(--color-surface, #18181f)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16, textAlign: 'center' }}>
          Ajusta tu foto de perfil
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{ borderRadius: '50%', cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', textAlign: 'center', marginBottom: 8 }}>Zoom</label>
          <input
            type="range" min="0.5" max="3" step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#7c3aed' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#d1d5db', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleCrop}
            style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Aplicar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}