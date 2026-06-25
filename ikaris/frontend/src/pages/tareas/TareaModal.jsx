import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTareasStore } from '../../store/tareasStore';
import { useAuthStore }   from '../../store/authStore';
import { useThemeStore }  from '../../store/themeStore';
import { useAlert }       from '../../hooks/useAlert';
import { Icons }          from '../../components/ui/Icons';

const PRIORIDADES = ['baja','media','alta','urgente'];

export default function TareaModal({ open, onClose, tareaEditar = null }) {
  const { opciones, crearTarea, actualizarTarea, cargarTareas } = useTareasStore();
  const usuario = useAuthStore((s) => s.usuario);
  const isDark  = useThemeStore((s) => s.isDark);
  const alert   = useAlert();
  const esEdicion = !!tareaEditar;

  const [form, setForm] = useState({
    titulo: '', descripcion: '', asignado_a: '',
    departamento_id: '', prioridad: 'media',
    fecha_inicio: '', fecha_limite: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tareaEditar) {
      setForm({
        titulo:          tareaEditar.titulo         || '',
        descripcion:     tareaEditar.descripcion    || '',
        asignado_a:      tareaEditar.asignado_a     || '',
        departamento_id: tareaEditar.departamento_id|| '',
        prioridad:       tareaEditar.prioridad      || 'media',
        fecha_inicio:    tareaEditar.fecha_inicio   ? tareaEditar.fecha_inicio.slice(0,16) : '',
        fecha_limite:    tareaEditar.fecha_limite   ? tareaEditar.fecha_limite.slice(0,16) : '',
      });
    } else {
      setForm({ titulo:'', descripcion:'', asignado_a:'', departamento_id:'', prioridad:'media', fecha_inicio:'', fecha_limite:'' });
    }
  }, [tareaEditar, open]);

  const puedeGestionar = ['dueño','administrador','gerente','supervisor'].includes(usuario?.rol);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return alert.warning('Campo requerido', 'El título es obligatorio.');
    setSaving(true);
    const result = esEdicion
      ? await actualizarTarea(tareaEditar.id, form)
      : await crearTarea(form);
    setSaving(false);
    if (result.success) {
      alert.success(esEdicion ? 'Tarea actualizada' : 'Tarea creada', `"${form.titulo}"`);
      cargarTareas();
      onClose();
    } else {
      alert.error('Error', result.message);
    }
  };

  const inputClass = `w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white dark:bg-[#18181f] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">{esEdicion ? 'Editar tarea' : 'Nueva tarea'}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
                <input type="text" value={form.titulo} onChange={set('titulo')} placeholder="Describe la tarea..." className={inputClass} autoFocus />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Instrucciones, detalles, contexto..." rows={3} className={`${inputClass} resize-none`} />
              </div>

              {/* Asignación — solo con permisos */}
              {puedeGestionar && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Asignar a</label>
                    <select value={form.asignado_a} onChange={set('asignado_a')} className={inputClass}>
                      <option value="">Sin asignar</option>
                      {opciones.usuarios.map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Departamento</label>
                    <select value={form.departamento_id} onChange={set('departamento_id')} className={inputClass}>
                      <option value="">Sin departamento</option>
                      {opciones.departamentos.map((d) => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Prioridad */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prioridad</label>
                <div className="flex gap-2">
                  {PRIORIDADES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, prioridad: p }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                        form.prioridad === p
                          ? p === 'urgente' ? 'bg-red-500 text-white'
                          : p === 'alta'    ? 'bg-orange-500 text-white'
                          : p === 'media'   ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha inicio</label>
                  <input type="datetime-local" value={form.fecha_inicio} onChange={set('fecha_inicio')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha límite</label>
                  <input type="datetime-local" value={form.fecha_limite} onChange={set('fecha_limite')} className={inputClass} />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.01 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-violet-600/20"
                >
                  {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear tarea'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}