import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/apiClient';
import { Icons } from '../../components/ui/Icons';
import { WIDGET_CATALOG, CATEGORIAS, getWidget } from './widgetRegistry';

dayjs.locale('es');

const ResponsiveGridLayout = ReactGridLayout.WidthProvider(
  ReactGridLayout.Responsive
);

const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const ROW_HEIGHT = 80;

const DEFAULT_WIDGETS = [
  { i: 'tareas_total',     x: 0,  y: 0,  w: 2, h: 2 },
  { i: 'tareas_atrasadas', x: 2,  y: 0,  w: 2, h: 2 },
  { i: 'tareas_hoy',       x: 4,  y: 0,  w: 2, h: 2 },
  { i: 'clientes_total',   x: 6,  y: 0,  w: 2, h: 2 },
  { i: 'reuniones_hoy',    x: 8,  y: 0,  w: 2, h: 2 },
  { i: 'equipo_count',     x: 10, y: 0,  w: 2, h: 2 },
  { i: 'grafica_area',     x: 0,  y: 2,  w: 7, h: 3 },
  { i: 'calendario_mini',  x: 7,  y: 2,  w: 3, h: 4 },
  { i: 'equipo_online',    x: 10, y: 2,  w: 2, h: 4 },
  { i: 'tareas_recientes', x: 0,  y: 5,  w: 3, h: 4 },
  { i: 'eventos_proximos', x: 3,  y: 5,  w: 3, h: 4 },
  { i: 'grafica_barras',   x: 6,  y: 5,  w: 6, h: 3 },
];

// ── Modal de selección de widgets ─────────────────────────────────────────
function WidgetModal({ open, onClose, activeWidgets, onAdd, onRemove, data }) {
  const [cat, setCat] = useState(CATEGORIAS[0]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white dark:bg-[#18181f] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Personalizar dashboard</h2>
              <p className="text-xs text-gray-400 mt-0.5">Elige los widgets que quieres ver</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Categorías */}
          <div className="flex gap-1.5 px-5 py-3 border-b border-gray-100 dark:border-white/10 overflow-x-auto shrink-0">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  cat === c
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Grid de widgets con preview */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WIDGET_CATALOG.filter((w) => w.categoria === cat).map((w) => {
                const activo = activeWidgets.includes(w.id);
                return (
                  <motion.div
                    key={w.id}
                    layout
                    className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                      activo
                        ? 'border-violet-500 shadow-lg shadow-violet-500/10'
                        : 'border-gray-100 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                    onClick={() => activo ? onRemove(w.id) : onAdd(w.id)}
                  >
                    {/* Badge activo */}
                    {activo && (
                      <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      </div>
                    )}

                    {/* Preview del widget */}
                    <div className="h-32 bg-gray-50 dark:bg-white/3 p-3 pointer-events-none select-none overflow-hidden">
                      <div className="transform scale-[0.65] origin-top-left w-[154%] h-[154%]">
                        {w.render({ data })}
                      </div>
                    </div>

                    {/* Info */}
                    <div className={`px-3 py-2.5 border-t ${activo ? 'border-violet-200 dark:border-violet-700/30 bg-violet-50 dark:bg-violet-900/10' : 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#18181f]'}`}>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{w.nombre}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{w.descripcion}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
            <p className="text-xs text-gray-400">
              {activeWidgets.length} widget{activeWidgets.length !== 1 ? 's' : ''} activos
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Aplicar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [layouts, setLayouts]       = useState({ lg: DEFAULT_WIDGETS });
  const [activeWidgets, setActiveWidgets] = useState(DEFAULT_WIDGETS.map((w) => w.i));
  const [editMode, setEditMode]     = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const saveTimeout                 = useRef(null);
  const usuario                     = useAuthStore((s) => s.usuario);
  const empresa                     = useAuthStore((s) => s.empresa);

  // Cargar datos y layout guardado
  useEffect(() => {
    const cargar = async () => {
      try {
        const [metricasRes, layoutRes] = await Promise.all([
          api.get('/dashboard/metricas'),
          api.get('/layout'),
        ]);
        setData(metricasRes.data.data);

        const saved = layoutRes.data.data;
        if (saved?.layout?.length && saved?.widgets?.length) {
          setLayouts({ lg: saved.layout });
          setActiveWidgets(saved.widgets);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Guardar con debounce
  const guardar = useCallback((newLayouts, newWidgets) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await api.post('/layout', {
          layout:  newLayouts?.lg || newLayouts || layouts.lg,
          widgets: newWidgets || activeWidgets,
        });
      } catch (err) {
        console.error('Error guardando:', err);
      }
    }, 800);
  }, [layouts, activeWidgets]);

  const onLayoutChange = (_, allLayouts) => {
    setLayouts(allLayouts);
    guardar(allLayouts, null);
  };

  const agregarWidget = (id) => {
    if (activeWidgets.includes(id)) return;
    const wDef = getWidget(id);
    if (!wDef) return;
    const maxY = (layouts.lg || []).reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
    const nuevoItem = { i: id, x: 0, y: maxY, w: wDef.defaultSize.w, h: wDef.defaultSize.h, minW: wDef.minSize.w, minH: wDef.minSize.h };
    const newLayouts = { ...layouts, lg: [...(layouts.lg || []), nuevoItem] };
    const newWidgets = [...activeWidgets, id];
    setLayouts(newLayouts);
    setActiveWidgets(newWidgets);
    guardar(newLayouts, newWidgets);
  };

  const quitarWidget = (id) => {
    const newLayouts = { ...layouts, lg: (layouts.lg || []).filter((item) => item.i !== id) };
    const newWidgets = activeWidgets.filter((w) => w !== id);
    setLayouts(newLayouts);
    setActiveWidgets(newWidgets);
    guardar(newLayouts, newWidgets);
  };

  const hora   = dayjs().hour();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="pb-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {saludo}, {usuario?.nombre}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
            {dayjs().format('dddd D [de] MMMM')} — {empresa?.nombre}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setEditMode((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              editMode
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'bg-white dark:bg-[#18181f] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Icons.menu className="w-4 h-4" />
            {editMode ? 'Listo' : 'Editar'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#18181f] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
          >
            <Icons.plus className="w-4 h-4" />
            Widgets
          </motion.button>
        </div>
      </div>

      {/* Banner modo edición */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/30 rounded-xl overflow-hidden"
          >
            <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
              Modo edición — arrastra los widgets desde el borde superior y redimensiona desde la esquina inferior derecha.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="w-7 h-7 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <ResponsiveGridLayout
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          onLayoutChange={onLayoutChange}
          isDraggable={editMode}
          isResizable={editMode}
          margin={[12, 12]}
          containerPadding={[0, 0]}
         draggableHandle=".drag-handle"
          resizeHandles={['se']}
        >
          {activeWidgets.map((widgetId) => {
            const wDef = getWidget(widgetId);
            if (!wDef) return null;
            return (
              <div key={widgetId} className="group react-grid-item">
<div className={`h-full bg-white dark:bg-[#18181f] rounded-2xl border p-4 relative transition-all duration-200 ${
  editMode
    ? 'border-violet-200 dark:border-violet-700/40 shadow-md'
    : 'border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md'
}`}>

                  {/* Handle drag — solo en modo edición */}
{editMode && (
  <div className="drag-handle absolute top-0 left-0 right-0 h-7 flex items-center justify-center z-20 bg-gradient-to-b from-violet-50/80 dark:from-violet-900/20 to-transparent rounded-t-2xl cursor-grab active:cursor-grabbing">
    <div className="flex gap-0.5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="w-0.5 h-3 bg-violet-300 dark:bg-violet-600 rounded-full" />
      ))}
    </div>
  </div>
)}

                  {/* Botón eliminar — solo en modo edición */}
                  {editMode && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => { e.stopPropagation(); quitarWidget(widgetId); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-100 dark:bg-red-900/40 text-red-500 rounded-full flex items-center justify-center z-10 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </motion.button>
                  )}

                  {/* Contenido del widget — con padding top en modo edición */}
                  <div className={editMode ? 'pt-5 h-full' : 'h-full'}>
                    {wDef.render({ data })}
                  </div>
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}

      {/* Modal de widgets */}
      <WidgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activeWidgets={activeWidgets}
        onAdd={(id) => { agregarWidget(id); }}
        onRemove={(id) => { quitarWidget(id); }}
        data={data}
      />
    </div>
  );
}