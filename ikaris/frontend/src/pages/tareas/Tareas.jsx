import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTareasStore } from '../../store/tareasStore';
import { useAuthStore }   from '../../store/authStore';
import { useThemeStore }  from '../../store/themeStore';
import { useAlert }       from '../../hooks/useAlert';
import { Icons }          from '../../components/ui/Icons';
import TareaModal         from './TareaModal';
import TareaDetalle       from './TareaDetalle';

const ESTADOS = [
  { value: '',           label: 'Todos',      color: 'bg-gray-100 text-gray-600' },
  { value: 'pendiente',  label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  { value: 'en_proceso', label: 'En proceso', color: 'bg-blue-100 text-blue-700' },
  { value: 'entregada',  label: 'Entregada',  color: 'bg-green-100 text-green-700' },
  { value: 'rechazada',  label: 'Rechazada',  color: 'bg-red-100 text-red-700' },
  { value: 'aprobada',   label: 'Aprobada',   color: 'bg-violet-100 text-violet-700' },
];

const PRIORIDADES = [
  { value: '',        label: 'Todas',    dot: 'bg-gray-400' },
  { value: 'baja',    label: 'Baja',     dot: 'bg-green-500' },
  { value: 'media',   label: 'Media',    dot: 'bg-blue-500' },
  { value: 'alta',    label: 'Alta',     dot: 'bg-orange-500' },
  { value: 'urgente', label: 'Urgente',  dot: 'bg-red-500' },
];

const ESTADO_STYLES = {
  pendiente:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-700/30' },
  en_proceso: { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-700/30' },
  entregada:  { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   border: 'border-green-200 dark:border-green-700/30' },
  rechazada:  { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       border: 'border-red-200 dark:border-red-700/30' },
  aprobada:   { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-700/30' },
};

const PRIORIDAD_DOT = {
  baja: 'bg-green-500', media: 'bg-blue-500', alta: 'bg-orange-500', urgente: 'bg-red-500',
};

function TareaCard({ tarea, onClick, onEstado, puedeGestionar }) {
  const style  = ESTADO_STYLES[tarea.estado] || ESTADO_STYLES.pendiente;
  const vencida = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date() &&
                  !['aprobada', 'entregada'].includes(tarea.estado);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(tarea.id)}
      className={`
        bg-white dark:bg-[#18181f] rounded-2xl border p-4 cursor-pointer
        hover:shadow-md transition-all duration-200 group
        ${vencida ? 'border-red-200 dark:border-red-700/30' : 'border-gray-100 dark:border-white/10'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORIDAD_DOT[tarea.prioridad] || 'bg-gray-400'}`} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tarea.titulo}</h3>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${style.bg} ${style.text}`}>
          {tarea.estado?.replace('_', ' ')}
        </span>
      </div>

      {/* Descripción */}
      {tarea.descripcion && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{tarea.descripcion}</p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Avatar asignado */}
          {tarea.asignado_a_usuario && (
            <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              {tarea.asignado_a_usuario.avatar_url
                ? <img src={tarea.asignado_a_usuario.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                : <span className="text-[9px] font-bold text-violet-600">
                    {tarea.asignado_a_usuario.nombre?.[0]}{tarea.asignado_a_usuario.apellido?.[0]}
                  </span>
              }
            </div>
          )}
          {/* Departamento */}
          {tarea.departamento && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {tarea.departamento.nombre}
            </span>
          )}
        </div>

        {/* Fecha */}
        {tarea.fecha_limite && (
          <span className={`text-[10px] font-medium ${vencida ? 'text-red-500' : 'text-gray-400'}`}>
            {vencida ? 'Vencida · ' : ''}{new Date(tarea.fecha_limite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>


    </motion.div>
  );
}

export default function Tareas() {
  const {
    tareas, loading, filtros, total,
    cargarTareas, cargarOpciones, setFiltro, cambiarEstado, eliminarTarea,
  } = useTareasStore();
  const usuario = useAuthStore((s) => s.usuario);
  const isDark  = useThemeStore((s) => s.isDark); // fuerza re-render al cambiar tema
  const alert   = useAlert();

const [modalOpen,    setModalOpen]    = useState(false);
  const [tareaEditar,  setTareaEditar]  = useState(null);
  const [detalleId,    setDetalleId]    = useState(null);
  const [vista,        setVista]        = useState('grid');

  const puedeGestionar = ['dueño','administrador','gerente','supervisor'].includes(usuario?.rol);

  useEffect(() => {
    cargarTareas();
    cargarOpciones();
  }, [filtros]);

const handleEditarDesdeDetalle = (tarea) => {
    setDetalleId(null);
    setTimeout(() => { setTareaEditar(tarea); setModalOpen(true); }, 200);
  };

  const handleEliminarDesdeDetalle = (id) => {
    setDetalleId(null);
    setTimeout(() => handleEliminar(id), 200);
  };

  const handleEstado = async (id, estado) => {
    const r = await cambiarEstado(id, estado);
    if (!r.success) alert.error('Error', r.message);
  };

  const handleEliminar = (id) => {
    alert.confirm('¿Eliminar tarea?', 'Esta acción no se puede deshacer.', async () => {
      const r = await eliminarTarea(id);
      if (r.success) alert.success('Eliminada', 'La tarea fue eliminada.');
      else alert.error('Error', r.message);
    }, { confirmText: 'Eliminar', tipo: 'error' });
  };

  // Agrupar por estado para vista kanban
  const kanbanCols = ['pendiente', 'en_proceso', 'entregada', 'aprobada'];
  const porEstado  = (est) => tareas.filter((t) => t.estado === est);

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tareas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} tarea{total !== 1 ? 's' : ''} en total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Vistas */}
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 gap-1">
            {[
              { key: 'grid',   icon: Icons.menu },
              { key: 'lista',  icon: Icons.form },
              { key: 'kanban', icon: Icons.more },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setVista(key)}
                className={`w-8 h-7 flex items-center justify-center rounded-lg transition-all ${
                  vista === key
                    ? 'bg-white dark:bg-[#18181f] shadow-sm text-violet-600'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {puedeGestionar && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setTareaEditar(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-600/20"
            >
              <Icons.plus className="w-4 h-4" />
              Nueva tarea
            </motion.button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={filtros.search}
            onChange={(e) => setFiltro('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#18181f] border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
        </div>

        {/* Estado */}
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setFiltro('estado', e.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filtros.estado === e.value
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-white dark:bg-[#18181f] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-violet-300'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Prioridad */}
        <select
          value={filtros.prioridad}
          onChange={(e) => setFiltro('prioridad', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-[#18181f] border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {PRIORIDADES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="w-7 h-7 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : tareas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-48 bg-white dark:bg-[#18181f] rounded-2xl border border-gray-100 dark:border-white/10"
        >
          <Icons.check className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay tareas</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            {puedeGestionar ? 'Crea la primera tarea con el botón de arriba' : 'No tienes tareas asignadas'}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Vista Grid */}
          {vista === 'grid' && (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {tareas.map((t) => (
                  <TareaCard
                    key={t.id}
                    tarea={t}
                    onClick={setDetalleId}
                    onEstado={handleEstado}
                    puedeGestionar={puedeGestionar}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Vista Lista */}
          {vista === 'lista' && (
            <div className="bg-white dark:bg-[#18181f] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10">
                    {['Tarea', 'Estado', 'Prioridad', 'Asignado a', 'Fecha límite', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  <AnimatePresence>
                    {tareas.map((t) => {
                      const style   = ESTADO_STYLES[t.estado] || ESTADO_STYLES.pendiente;
                      const vencida = t.fecha_limite && new Date(t.fecha_limite) < new Date() && !['aprobada','entregada'].includes(t.estado);
                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setDetalleId(t.id)}
                          className="hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${PRIORIDAD_DOT[t.prioridad]}`} />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{t.titulo}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                              {t.estado?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{t.prioridad}</span>
                          </td>
                          <td className="px-4 py-3">
                            {t.asignado_a_usuario ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {t.asignado_a_usuario.nombre} {t.asignado_a_usuario.apellido}
                              </span>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {t.fecha_limite ? (
                              <span className={`text-xs font-medium ${vencida ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                {new Date(t.fecha_limite).toLocaleDateString('es-MX')}
                              </span>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {puedeGestionar && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEliminar(t.id); }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Vista Kanban */}
          {vista === 'kanban' && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {kanbanCols.map((est) => {
                const style = ESTADO_STYLES[est] || ESTADO_STYLES.pendiente;
                const items = porEstado(est);
                return (
                  <div key={est} className="flex flex-col gap-3">
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${style.bg} ${style.border} border`}>
                      <span className={`text-xs font-semibold capitalize ${style.text}`}>
                        {est.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/50 ${style.text}`}>
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-2 min-h-20">
                      <AnimatePresence>
                        {items.map((t) => (
                          <TareaCard
                            key={t.id}
                            tarea={t}
                            onClick={setDetalleId}
                            onEstado={handleEstado}
                            puedeGestionar={puedeGestionar}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal crear tarea */}
<TareaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setTareaEditar(null); }}
        tareaEditar={tareaEditar}
      />

      <TareaDetalle
        tareaId={detalleId}
        onClose={() => setDetalleId(null)}
        onEditar={handleEditarDesdeDetalle}
        onEliminar={handleEliminarDesdeDetalle}
      />
    </div>
  );
}