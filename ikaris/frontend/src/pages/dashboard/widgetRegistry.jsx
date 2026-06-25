import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

dayjs.locale('es');

// ── Componentes base ───────────────────────────────────────────────────────
const WidgetShell = ({ titulo, subtitulo, children, accion }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-start justify-between mb-3 shrink-0">
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{titulo}</p>
        {subtitulo && <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{subtitulo}</p>}
      </div>
      {accion && (
        <button className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline shrink-0">{accion}</button>
      )}
    </div>
    <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
  </div>
);

const Numero = ({ valor, label, delta, color = 'text-violet-600' }) => (
  <div className="flex flex-col justify-center h-full">
    <p className={`text-4xl font-black ${color} leading-none`}>{valor}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    {delta && <p className="text-xs text-green-500 mt-1 font-medium">{delta}</p>}
  </div>
);

const ESTADO_COLOR = {
  pendiente:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  en_proceso: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  entregada:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rechazada:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  aprobada:   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#ddd6fe', '#ede9fe'];

// ── CATÁLOGO DE WIDGETS ────────────────────────────────────────────────────
export const WIDGET_CATALOG = [
  // ── TAREAS ──────────────────────────────────────────────────────────────
  {
    id: 'tareas_total',
    categoria: 'Tareas',
    nombre: 'Total de tareas',
    descripcion: 'Número total de tareas de la empresa',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Tareas">
        <Numero
          valor={data?.metricas?.totalTareas || 0}
          label="tareas en total"
          color="text-violet-600 dark:text-violet-400"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'tareas_atrasadas',
    categoria: 'Tareas',
    nombre: 'Tareas atrasadas',
    descripcion: 'Tareas vencidas sin completar',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Atrasadas">
        <Numero
          valor={data?.metricas?.tareasAtrasadas || 0}
          label="tareas vencidas"
          color="text-red-500"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'tareas_hoy',
    categoria: 'Tareas',
    nombre: 'Tareas de hoy',
    descripcion: 'Tareas con fecha límite hoy',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Para hoy">
        <Numero
          valor={data?.metricas?.tareasHoy || 0}
          label="vencen hoy"
          color="text-amber-500"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'tareas_recientes',
    categoria: 'Tareas',
    nombre: 'Tareas recientes',
    descripcion: 'Lista de las últimas tareas',
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => (
      <WidgetShell titulo="Recientes" accion="Ver todas">
        <div className="space-y-2 overflow-y-auto h-full pr-1">
          {data?.tareasRecientes?.length ? data.tareasRecientes.map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 dark:border-white/5 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
              <p className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{t.titulo}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${ESTADO_COLOR[t.estado]}`}>
                {t.estado?.replace('_', ' ')}
              </span>
            </div>
          )) : <p className="text-xs text-gray-400 text-center pt-6">Sin tareas</p>}
        </div>
      </WidgetShell>
    ),
  },

  // ── CALENDARIO ──────────────────────────────────────────────────────────
  {
    id: 'calendario_mini',
    categoria: 'Calendario',
    nombre: 'Mini calendario',
    descripcion: 'Calendario mensual con eventos',
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 3, h: 4 },
    render: ({ data }) => {
      const hoy = dayjs();
      const diasConEvento = new Set(
        (data?.eventosProximos || []).map((e) => dayjs(e.fecha_inicio).format('D'))
      );
      const offset = hoy.startOf('month').day();
      const adj = offset === 0 ? 6 : offset - 1;
      const dias = hoy.daysInMonth();
      const celdas = [...Array(adj).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];

      return (
        <WidgetShell titulo={hoy.format('MMMM YYYY')}>
          <div>
            <div className="grid grid-cols-7 mb-1">
              {['L','M','X','J','V','S','D'].map((d) => (
                <div key={d} className="text-center text-[9px] font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {celdas.map((dia, i) => {
                if (!dia) return <div key={`e${i}`} />;
                const esHoy = dia === hoy.date();
                return (
                  <div key={dia} className="flex flex-col items-center">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-medium
                      ${esHoy ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {dia}
                    </div>
                    {diasConEvento.has(String(dia)) && (
                      <div className={`w-1 h-1 rounded-full ${esHoy ? 'bg-white' : 'bg-violet-500'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </WidgetShell>
      );
    },
  },
  {
    id: 'eventos_proximos',
    categoria: 'Calendario',
    nombre: 'Próximos eventos',
    descripcion: 'Eventos de los próximos 7 días',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => (
      <WidgetShell titulo="Próximos 7 días" accion="Calendario">
        <div className="space-y-2 overflow-y-auto h-full">
          {data?.eventosProximos?.length ? data.eventosProximos.map((e) => (
            <div key={e.id} className="flex items-start gap-2">
              <div className="w-1 h-full min-h-[32px] rounded-full shrink-0" style={{ backgroundColor: e.color || '#7c3aed' }} />
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{e.titulo}</p>
                <p className="text-[10px] text-gray-400">{dayjs(e.fecha_inicio).format('ddd D, HH:mm')}</p>
              </div>
            </div>
          )) : <p className="text-xs text-gray-400 text-center pt-6">Sin eventos</p>}
        </div>
      </WidgetShell>
    ),
  },
  {
    id: 'reuniones_hoy',
    categoria: 'Calendario',
    nombre: 'Reuniones programadas',
    descripcion: 'Total de reuniones activas',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Reuniones">
        <Numero
          valor={data?.metricas?.totalReuinones || 0}
          label="programadas"
          color="text-indigo-600 dark:text-indigo-400"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'agenda_semanal',
    categoria: 'Calendario',
    nombre: 'Agenda semanal',
    descripcion: 'Vista de eventos por día esta semana',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    render: ({ data }) => {
      const semana = Array.from({ length: 7 }, (_, i) => dayjs().startOf('week').add(i + 1, 'day'));
      const eventosPorDia = semana.map((dia) => ({
        dia,
        eventos: (data?.eventosProximos || []).filter((e) =>
          dayjs(e.fecha_inicio).isSame(dia, 'day')
        ),
      }));
      return (
        <WidgetShell titulo="Esta semana">
          <div className="grid grid-cols-7 gap-1 h-full">
            {eventosPorDia.map(({ dia, eventos }) => (
              <div key={dia.toString()} className="flex flex-col">
                <p className={`text-[10px] font-bold text-center mb-1 ${dia.isSame(dayjs(), 'day') ? 'text-violet-600' : 'text-gray-400'}`}>
                  {dia.format('ddd')}
                </p>
                <p className={`text-xs font-semibold text-center mb-1 ${dia.isSame(dayjs(), 'day') ? 'text-violet-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  {dia.format('D')}
                </p>
                <div className="space-y-1">
                  {eventos.map((e) => (
                    <div key={e.id} className="text-[9px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded px-1 py-0.5 truncate">
                      {e.titulo}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </WidgetShell>
      );
    },
  },

  // ── CLIENTES ────────────────────────────────────────────────────────────
  {
    id: 'clientes_total',
    categoria: 'Clientes',
    nombre: 'Total clientes',
    descripcion: 'Número de clientes activos',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Clientes">
        <Numero
          valor={data?.metricas?.totalClientes || 0}
          label="clientes activos"
          color="text-blue-600 dark:text-blue-400"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'formularios_activos',
    categoria: 'Clientes',
    nombre: 'Formularios activos',
    descripcion: 'Total de formularios disponibles',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Formularios">
        <Numero
          valor={data?.metricas?.totalFormularios || 0}
          label="formularios activos"
          color="text-pink-600 dark:text-pink-400"
        />
      </WidgetShell>
    ),
  },

  // ── REPORTES / GRÁFICAS ──────────────────────────────────────────────────
  {
    id: 'grafica_area',
    categoria: 'Reportes',
    nombre: 'Actividad del año',
    descripcion: 'Gráfica de área con tareas y clientes',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
    render: () => {
      const datos = [
        { mes: 'Ene', tareas: 12, clientes: 3 },
        { mes: 'Feb', tareas: 19, clientes: 5 },
        { mes: 'Mar', tareas: 8,  clientes: 2 },
        { mes: 'Abr', tareas: 24, clientes: 8 },
        { mes: 'May', tareas: 16, clientes: 4 },
        { mes: 'Jun', tareas: 31, clientes: 11 },
      ];
      return (
        <WidgetShell titulo="Actividad del año" subtitulo="Tareas y clientes">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false}/>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #f0f0f4' }}/>
              <Area type="monotone" dataKey="tareas" stroke="#7c3aed" strokeWidth={2} fill="url(#gT)" name="Tareas"/>
              <Area type="monotone" dataKey="clientes" stroke="#2563eb" strokeWidth={2} fill="url(#gC)" name="Clientes"/>
            </AreaChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    },
  },
  {
    id: 'grafica_barras',
    categoria: 'Reportes',
    nombre: 'Resumen mensual',
    descripcion: 'Gráfica de barras mensual',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    render: () => {
      const datos = [
        { mes: 'Ene', tareas: 12, clientes: 3 },
        { mes: 'Feb', tareas: 19, clientes: 5 },
        { mes: 'Mar', tareas: 8,  clientes: 2 },
        { mes: 'Abr', tareas: 24, clientes: 8 },
        { mes: 'May', tareas: 16, clientes: 4 },
        { mes: 'Jun', tareas: 31, clientes: 11 },
      ];
      return (
        <WidgetShell titulo="Resumen mensual">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false}/>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #f0f0f4' }}/>
              <Bar dataKey="tareas" fill="#7c3aed" radius={[6,6,0,0]} name="Tareas"/>
              <Bar dataKey="clientes" fill="#ddd6fe" radius={[6,6,0,0]} name="Clientes"/>
            </BarChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    },
  },
  {
    id: 'grafica_pie',
    categoria: 'Reportes',
    nombre: 'Distribución de tareas',
    descripcion: 'Gráfica circular por estado',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => {
      const total = data?.metricas?.totalTareas || 0;
      const atrasadas = data?.metricas?.tareasAtrasadas || 0;
      const hoy = data?.metricas?.tareasHoy || 0;
      const resto = Math.max(0, total - atrasadas - hoy);
      const pieData = [
        { name: 'A tiempo', value: resto },
        { name: 'Hoy', value: hoy },
        { name: 'Atrasadas', value: atrasadas },
      ].filter((d) => d.value > 0);

      return (
        <WidgetShell titulo="Por estado">
          {pieData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 text-center pt-6">Sin datos</p>}
        </WidgetShell>
      );
    },
  },

  // ── EQUIPO ───────────────────────────────────────────────────────────────
  {
    id: 'equipo_online',
    categoria: 'Equipo',
    nombre: 'Equipo online',
    descripcion: 'Usuarios conectados ahora',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => (
      <WidgetShell titulo="Equipo" accion="Ver todos">
        <div className="space-y-2 overflow-y-auto h-full">
          {data?.usuariosActivos?.length ? data.usuariosActivos.map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover"/>
                    : <span className="text-[10px] font-bold text-violet-600">{u.nombre?.[0]}{u.apellido?.[0]}</span>
                  }
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#18181f] ${u.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{u.nombre} {u.apellido}</p>
                <p className="text-[10px] text-gray-400 capitalize">{u.rol}</p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.online ? 'bg-green-500' : 'bg-gray-300'}`}/>
            </div>
          )) : <p className="text-xs text-gray-400 text-center pt-6">Sin usuarios</p>}
        </div>
      </WidgetShell>
    ),
  },
  {
    id: 'equipo_count',
    categoria: 'Equipo',
    nombre: 'Usuarios activos',
    descripcion: 'Cantidad de usuarios en la empresa',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Usuarios">
        <Numero
          valor={data?.usuariosActivos?.length || 0}
          label="usuarios activos"
          color="text-emerald-600 dark:text-emerald-400"
        />
      </WidgetShell>
    ),
  },
  // ── WIDGETS ADICIONALES DE TAREAS ─────────────────────────────────────────
  {
    id: 'tareas_kanban_mini',
    categoria: 'Tareas',
    nombre: 'Estado de tareas',
    descripcion: 'Distribución visual por estado',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
    render: ({ data }) => {
      const estados = [
        { label: 'Pendientes', value: data?.metricas?.tareasAtrasadas || 0, color: 'bg-amber-500' },
        { label: 'En proceso', value: Math.max(0, (data?.metricas?.totalTareas || 0) - (data?.metricas?.tareasAtrasadas || 0)), color: 'bg-blue-500' },
        { label: 'Vencidas',   value: data?.metricas?.tareasAtrasadas || 0, color: 'bg-red-500' },
      ];
      const total = estados.reduce((s, e) => s + e.value, 0) || 1;
      return (
        <WidgetShell titulo="Estado de tareas">
          <div className="space-y-2">
            {estados.map((e) => (
              <div key={e.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-500 dark:text-gray-400">{e.label}</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{e.value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${e.color} rounded-full transition-all`} style={{ width: `${(e.value / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </WidgetShell>
      );
    },
  },
  {
    id: 'tareas_urgentes',
    categoria: 'Tareas',
    nombre: 'Urgentes hoy',
    descripcion: 'Contador de tareas urgentes',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Urgentes">
        <Numero
          valor={data?.metricas?.tareasHoy || 0}
          label="vencen hoy"
          color="text-red-600 dark:text-red-400"
          delta={data?.metricas?.tareasAtrasadas > 0 ? `${data.metricas.tareasAtrasadas} atrasadas` : null}
        />
      </WidgetShell>
    ),
  },
  // ── WIDGETS DE CLIENTES ───────────────────────────────────────────────────
  {
    id: 'clientes_recientes',
    categoria: 'Clientes',
    nombre: 'Clientes recientes',
    descripcion: 'Últimos clientes registrados',
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => (
      <WidgetShell titulo="Clientes recientes" accion="Ver todos">
        <div className="space-y-2 overflow-y-auto h-full">
          {data?.clientesRecientes?.length ? data.clientesRecientes.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-1">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">{c.nombre?.[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{c.nombre}</p>
                <p className="text-[10px] text-gray-400 truncate">{c.correo || 'Sin correo'}</p>
              </div>
            </div>
          )) : <p className="text-xs text-gray-400 text-center pt-4">Sin clientes aún</p>}
        </div>
      </WidgetShell>
    ),
  },
  {
    id: 'clientes_activos',
    categoria: 'Clientes',
    nombre: 'Clientes activos',
    descripcion: 'Total de clientes activos',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Clientes activos">
        <Numero
          valor={data?.metricas?.totalClientes || 0}
          label="clientes activos"
          color="text-blue-600 dark:text-blue-400"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'clientes_crecimiento',
    categoria: 'Clientes',
    nombre: 'Crecimiento de clientes',
    descripcion: 'Gráfica de clientes por mes',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    render: () => {
      const datos = [
        { mes: 'Ene', clientes: 2 }, { mes: 'Feb', clientes: 5 },
        { mes: 'Mar', clientes: 3 }, { mes: 'Abr', clientes: 8 },
        { mes: 'May', clientes: 6 }, { mes: 'Jun', clientes: 12 },
      ];
      return (
        <WidgetShell titulo="Crecimiento" subtitulo="Últimos 6 meses">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top:5, right:5, bottom:0, left:-20 }}>
              <defs>
                <linearGradient id="gCl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false}/>
              <XAxis dataKey="mes" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:'12px', fontSize:'12px', border:'1px solid #f0f0f4' }}/>
              <Area type="monotone" dataKey="clientes" stroke="#2563eb" strokeWidth={2} fill="url(#gCl)" name="Clientes"/>
            </AreaChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    },
  },
  {
    id: 'clientes_mapa',
    categoria: 'Clientes',
    nombre: 'Resumen de clientes',
    descripcion: 'Activos vs inactivos',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => {
      const activos   = data?.metricas?.totalClientes || 0;
      const total     = activos;
      const inactivos = 0;
      const pieData   = [
        { name: 'Activos',   value: activos   || 1 },
        { name: 'Inactivos', value: inactivos || 0 },
      ].filter((d) => d.value > 0);
      return (
        <WidgetShell titulo="Clientes">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" paddingAngle={3} dataKey="value">
                <Cell fill="#2563eb"/>
                <Cell fill="#dbeafe"/>
              </Pie>
              <Tooltip contentStyle={{ borderRadius:'12px', fontSize:'12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    },
  },
  // ── WIDGETS DE USUARIOS ───────────────────────────────────────────────────
  {
    id: 'usuarios_online',
    categoria: 'Equipo',
    nombre: 'Usuarios en línea ahora',
    descripcion: 'Quién está conectado en este momento',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => {
      const online = (data?.usuariosActivos || []).filter((u) => u.online).length;
      return (
        <WidgetShell titulo="En línea">
          <Numero valor={online} label="conectados ahora" color="text-green-600 dark:text-green-400" />
        </WidgetShell>
      );
    },
  },
  {
    id: 'usuarios_roles',
    categoria: 'Equipo',
    nombre: 'Distribución por rol',
    descripcion: 'Gráfica de usuarios por rol',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => {
      const usuarios = data?.usuariosActivos || [];
      const roles = {};
      usuarios.forEach((u) => { roles[u.rol] = (roles[u.rol] || 0) + 1; });
      const pieData = Object.entries(roles).map(([name, value]) => ({ name, value }));
      return (
        <WidgetShell titulo="Por rol">
          {pieData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={['#7c3aed','#2563eb','#059669','#d97706','#6b7280'][i % 5]}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:'12px', fontSize:'12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 text-center pt-6">Sin usuarios</p>}
        </WidgetShell>
      );
    },
  },
  {
    id: 'usuarios_actividad',
    categoria: 'Equipo',
    nombre: 'Última actividad',
    descripcion: 'Usuarios ordenados por última conexión',
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => (
      <WidgetShell titulo="Actividad reciente">
        <div className="space-y-2 overflow-y-auto h-full">
          {(data?.usuariosActivos || []).slice(0,6).map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  {u.avatar_url
                    ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    : <span className="text-[10px] font-bold text-violet-600">{u.nombre?.[0]}{u.apellido?.[0]}</span>
                  }
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#18181f] ${u.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{u.nombre} {u.apellido}</p>
                <p className="text-[10px] text-gray-400">{u.online ? 'En línea' : u.ultima_conexion ? new Date(u.ultima_conexion).toLocaleDateString('es-MX',{day:'2-digit',month:'short'}) : 'Sin actividad'}</p>
              </div>
            </div>
          ))}
        </div>
      </WidgetShell>
    ),
  },
  {
    id: 'usuarios_total',
    categoria: 'Equipo',
    nombre: 'Total del equipo',
    descripcion: 'Número total de colaboradores',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Equipo">
        <Numero
          valor={data?.usuariosActivos?.length || 0}
          label="colaboradores"
          color="text-violet-600 dark:text-violet-400"
        />
      </WidgetShell>
    ),
  },
  // ── WIDGETS DE FORMULARIOS ────────────────────────────────────────────────
  {
    id: 'formularios_total',
    categoria: 'Formularios',
    nombre: 'Formularios activos',
    descripcion: 'Total de formularios publicados',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Formularios">
        <Numero
          valor={data?.metricas?.totalFormularios || 0}
          label="formularios activos"
          color="text-pink-600 dark:text-pink-400"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'formularios_respuestas_hoy',
    categoria: 'Formularios',
    nombre: 'Respuestas hoy',
    descripcion: 'Respuestas recibidas en el día',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    render: ({ data }) => (
      <WidgetShell titulo="Respuestas hoy">
        <Numero
          valor={data?.metricas?.respuestasHoy || 0}
          label="enviadas hoy"
          color="text-emerald-600 dark:text-emerald-400"
        />
      </WidgetShell>
    ),
  },
  {
    id: 'formularios_recientes',
    categoria: 'Formularios',
    nombre: 'Formularios recientes',
    descripcion: 'Últimos formularios creados',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
    render: ({ data }) => (
      <WidgetShell titulo="Formularios recientes">
        <div className="space-y-2 overflow-y-auto h-full">
          {(data?.formulariosRecientes || []).length ? (data?.formulariosRecientes || []).map((f) => (
            <div key={f.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 dark:border-white/5 last:border-0">
              <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-pink-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{f.titulo}</p>
                <p className="text-[10px] text-gray-400">{f.total_respuestas || 0} respuesta{f.total_respuestas !== 1 ? 's' : ''}</p>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${f.publicado ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {f.publicado ? 'Activo' : 'Borrador'}
              </span>
            </div>
          )) : <p className="text-xs text-gray-400 text-center pt-6">Sin formularios</p>}
        </div>
      </WidgetShell>
    ),
  },
  {
    id: 'formularios_actividad',
    categoria: 'Formularios',
    nombre: 'Actividad de respuestas',
    descripcion: 'Gráfica de respuestas por día',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    render: () => {
      const datos = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { dia: d.toLocaleDateString('es-MX', { weekday:'short' }), respuestas: Math.floor(Math.random() * 15) };
      });
      return (
        <WidgetShell titulo="Respuestas" subtitulo="Últimos 7 días">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top:5, right:5, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false}/>
              <XAxis dataKey="dia" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:'12px', fontSize:'12px', border:'1px solid #f0f0f4' }}/>
              <Bar dataKey="respuestas" fill="#db2777" radius={[6,6,0,0]} name="Respuestas"/>
            </BarChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    },
  },
];

// ── Agrupar por categoría ──────────────────────────────────────────────────
export const CATEGORIAS = [...new Set(WIDGET_CATALOG.map((w) => w.categoria))];
export const getWidget = (id) => WIDGET_CATALOG.find((w) => w.id === id);