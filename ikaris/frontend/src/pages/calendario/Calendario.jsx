import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter  from 'dayjs/plugin/isSameOrAfter';
import { useCalendarioStore } from '../../store/calendarioStore';
import { useThemeStore }      from '../../store/themeStore';
import { useAlert }           from '../../hooks/useAlert';
import { Icons }              from '../../components/ui/Icons';

dayjs.locale('es');
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const TIPOS = [
  { value: 'actividad',    label: 'Actividad',    color: '#7c3aed' },
  { value: 'reunion',      label: 'Reunión',       color: '#2563eb' },
  { value: 'tarea',        label: 'Tarea',         color: '#059669' },
  { value: 'recordatorio', label: 'Recordatorio',  color: '#d97706' },
  { value: 'vacacion',     label: 'Vacación',      color: '#0891b2' },
  { value: 'otro',         label: 'Otro',          color: '#6b7280' },
];

const COLORES = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#db2777','#ea580c','#4f46e5','#6b7280'];

const TIPO_COLOR = Object.fromEntries(TIPOS.map((t) => [t.value, t.color]));

// ── Helpers ────────────────────────────────────────────────────────────────
const iStyle = (dark) => ({
  width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10,
  background: dark ? 'rgba(255,255,255,0.06)' : '#f9fafb',
  border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
  color: dark ? '#f3f4f6' : '#111827', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
});

const labelS = {
  fontSize: 11, fontWeight: 600, color: '#9ca3af',
  display: 'block', marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: '0.06em',
};

// ── Modal crear/editar evento ──────────────────────────────────────────────
function EventoModal({ open, onClose, evento, diaSeleccionado }) {
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();
  const { crearEvento, actualizarEvento } = useCalendarioStore();
  const editando = !!evento;

  const [form, setForm] = useState({
    titulo: '', descripcion: '', tipo: 'actividad', color: '#7c3aed',
    fecha_inicio: '', fecha_fin: '', todo_el_dia: false, visible_para: 'empresa',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (evento) {
      setForm({
        titulo:       evento.titulo || '',
        descripcion:  evento.descripcion || '',
        tipo:         evento.tipo || 'actividad',
        color:        evento.color || '#7c3aed',
        fecha_inicio: evento.fecha_inicio ? dayjs(evento.fecha_inicio).format('YYYY-MM-DDTHH:mm') : '',
        fecha_fin:    evento.fecha_fin    ? dayjs(evento.fecha_fin).format('YYYY-MM-DDTHH:mm')    : '',
        todo_el_dia:  evento.todo_el_dia  || false,
        visible_para: evento.visible_para || 'empresa',
      });
    } else {
      const base = diaSeleccionado ? dayjs(diaSeleccionado).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm');
      setForm({
        titulo: '', descripcion: '', tipo: 'actividad', color: '#7c3aed',
        fecha_inicio: base, fecha_fin: '', todo_el_dia: false, visible_para: 'empresa',
      });
    }
  }, [evento, diaSeleccionado, open]);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({
      ...f, [k]: val,
      ...(k === 'tipo' ? { color: TIPO_COLOR[val] || '#7c3aed' } : {}),
    }));
  };

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return alert.warning('Campo requerido', 'El título es obligatorio.');
    if (!form.fecha_inicio)  return alert.warning('Campo requerido', 'La fecha de inicio es obligatoria.');
    setSaving(true);
    const r = editando
      ? await actualizarEvento(evento.id, form)
      : await crearEvento(form);
    setSaving(false);
    if (r.success) {
      alert.success(editando ? 'Evento actualizado' : 'Evento creado', form.titulo);
      onClose();
    } else {
      alert.error('Error', r.message);
    }
  };

  if (!open) return null;

  const bg      = dark ? '#18181f' : 'white';
  const border  = dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const textMain= dark ? '#f9fafb' : '#111827';

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} transition={{ type:'spring', stiffness:300, damping:28 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background:bg, borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:700, fontSize:16, color:textMain, margin:0 }}>{editando ? 'Editar evento' : 'Nuevo evento'}</p>
            <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>
              {editando ? 'Modifica los detalles del evento' : 'Agrega un evento al calendario'}
            </p>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={labelS}>Título *</label>
            <input value={form.titulo} onChange={set('titulo')} placeholder="Nombre del evento" style={iStyle(dark)} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={labelS}>Tipo</label>
              <select value={form.tipo} onChange={set('tipo')} style={iStyle(dark)}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Visible para</label>
              <select value={form.visible_para} onChange={set('visible_para')} style={iStyle(dark)}>
                <option value="empresa">Toda la empresa</option>
                <option value="departamento">Mi departamento</option>
                <option value="yo">Solo yo</option>
              </select>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={labelS}>Color</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {COLORES.map((c) => (
                <button key={c} onClick={() => setForm((f) => ({...f, color:c}))}
                  style={{ width:26, height:26, borderRadius:'50%', background:c, border:form.color===c?'3px solid white':'3px solid transparent', outline:form.color===c?`2px solid ${c}`:'none', cursor:'pointer' }} />
              ))}
            </div>
          </div>

          {/* Todo el día */}
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={form.todo_el_dia} onChange={set('todo_el_dia')} style={{ accentColor:'#7c3aed', width:15, height:15 }} />
            <span style={{ fontSize:13, color:dark?'#d1d5db':'#374151' }}>Todo el día</span>
          </label>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={labelS}>Inicio *</label>
              <input type={form.todo_el_dia ? 'date' : 'datetime-local'} value={form.todo_el_dia ? form.fecha_inicio.slice(0,10) : form.fecha_inicio}
                onChange={set('fecha_inicio')} style={iStyle(dark)} />
            </div>
            <div>
              <label style={labelS}>Fin</label>
              <input type={form.todo_el_dia ? 'date' : 'datetime-local'} value={form.todo_el_dia ? (form.fecha_fin||'').slice(0,10) : form.fecha_fin}
                onChange={set('fecha_fin')} style={iStyle(dark)} />
            </div>
          </div>

          <div>
            <label style={labelS}>Descripción</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Detalles del evento (opcional)"
              rows={2} style={{ ...iStyle(dark), resize:'none' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:`1px solid ${border}`, display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px', borderRadius:12, border:`1px solid ${border}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Cancelar
          </button>
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={handleSubmit} disabled={saving}
            style={{ flex:2, padding:'10px', borderRadius:12, border:'none', background:saving?'#8b5cf6':'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>
            {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear evento'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Panel detalle evento ───────────────────────────────────────────────────
function EventoDetalle({ evento, onClose, onEditar, onEliminar }) {
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();

  if (!evento) return null;

  const tipo   = TIPOS.find((t) => t.value === evento.tipo);
  const bg     = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';

  const handleEliminar = () => {
    alert.confirm('¿Eliminar este evento?', `"${evento.titulo}" será eliminado permanentemente.`,
      async () => { await onEliminar(evento.id); onClose(); },
      { confirmText: 'Eliminar', tipo: 'error' }
    );
  };

  return createPortal(
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} />
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
        transition={{ type:'spring', stiffness:320, damping:28 }}
        style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:9999, background:bg, borderRadius:20, width:'100%', maxWidth:400, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        {/* Banda de color */}
        <div style={{ height:6, background:evento.color || '#7c3aed' }} />

        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:11, fontWeight:600, color:evento.color||'#7c3aed', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {tipo?.label || evento.tipo}
              </span>
              <h3 style={{ fontSize:17, fontWeight:700, color:dark?'#f9fafb':'#111827', margin:'4px 0 0', lineHeight:1.3 }}>{evento.titulo}</h3>
            </div>
            <button onClick={onClose}
              style={{ width:28, height:28, borderRadius:8, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}>
              <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Icons.calendar style={{ width:15, height:15, color:'#9ca3af', flexShrink:0 }} />
              <span style={{ fontSize:13, color:dark?'#d1d5db':'#374151' }}>
                {evento.todo_el_dia
                  ? dayjs(evento.fecha_inicio).format('dddd D [de] MMMM, YYYY')
                  : dayjs(evento.fecha_inicio).format('dddd D [de] MMMM, YYYY · HH:mm')}
                {evento.fecha_fin && !evento.todo_el_dia && ` — ${dayjs(evento.fecha_fin).format('HH:mm')}`}
              </span>
            </div>
            {evento.descripcion && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <Icons.form style={{ width:15, height:15, color:'#9ca3af', flexShrink:0, marginTop:2 }} />
                <span style={{ fontSize:13, color:dark?'#d1d5db':'#374151', lineHeight:1.5 }}>{evento.descripcion}</span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleEliminar}
              style={{ flex:1, padding:'9px', borderRadius:12, border:'1px solid #fecaca', background:dark?'rgba(239,68,68,0.1)':'#fef2f2', color:'#ef4444', fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Eliminar
            </button>
            <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={() => { onClose(); onEditar(evento); }}
              style={{ flex:2, padding:'9px', borderRadius:12, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Editar evento
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

// ── Vista mensual ──────────────────────────────────────────────────────────
function VistaMensual({ mes, eventos, onDiaClick, onEventoClick }) {
  const dark = useThemeStore((s) => s.isDark);
  const hoy  = dayjs();

  const inicioMes = mes.startOf('month');
  const diasMes   = mes.daysInMonth();
  const offset    = inicioMes.day() === 0 ? 6 : inicioMes.day() - 1;
  const celdas    = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];

  const getEventosDia = (dia) => {
    if (!dia) return [];
    const fecha = mes.date(dia);
    return eventos.filter((e) => dayjs(e.fecha_inicio).isSame(fecha, 'day'));
  };

  const bg     = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const text   = dark ? '#f3f4f6' : '#111827';
  const textMuted = dark ? '#6b7280' : '#9ca3af';

  return (
    <div style={{ background:bg, borderRadius:16, border:`1px solid ${border}`, overflow:'hidden' }}>
      {/* Header días semana */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:`1px solid ${border}` }}>
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d) => (
          <div key={d} style={{ padding:'10px 0', textAlign:'center', fontSize:11, fontWeight:700, color:textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid días */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {celdas.map((dia, i) => {
          const eventosDia = getEventosDia(dia);
          const esHoy = dia && mes.date(dia).isSame(hoy, 'day');
          const esFinde = i % 7 >= 5;

          return (
            <div key={i}
              onClick={() => dia && onDiaClick(mes.date(dia))}
              style={{
                minHeight: 100, padding:'6px', cursor: dia ? 'pointer' : 'default',
                borderRight: (i + 1) % 7 !== 0 ? `1px solid ${border}` : 'none',
                borderBottom: i < celdas.length - 7 ? `1px solid ${border}` : 'none',
                background: !dia ? (dark ? 'rgba(0,0,0,0.1)' : '#fafafa') : esFinde ? (dark ? 'rgba(255,255,255,0.01)' : '#fafafa') : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (dia) e.currentTarget.style.background = dark ? 'rgba(124,58,237,0.05)' : '#f5f3ff'; }}
              onMouseLeave={(e) => { if (dia) e.currentTarget.style.background = esFinde ? (dark ? 'rgba(255,255,255,0.01)' : '#fafafa') : 'transparent'; }}
            >
              {dia && (
                <>
                  <div style={{
                    width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    marginBottom:4, fontSize:13, fontWeight: esHoy ? 700 : 500,
                    background: esHoy ? '#7c3aed' : 'transparent',
                    color: esHoy ? 'white' : esFinde ? (dark ? '#6b7280' : '#9ca3af') : text,
                  }}>
                    {dia}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {eventosDia.slice(0,3).map((e) => (
                      <div key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); onEventoClick(e); }}
                        style={{
                          fontSize:10, fontWeight:500, padding:'2px 6px', borderRadius:5, cursor:'pointer',
                          background: `${e.color || '#7c3aed'}20`, color: e.color || '#7c3aed',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          borderLeft: `2px solid ${e.color || '#7c3aed'}`,
                        }}>
                        {e.titulo}
                      </div>
                    ))}
                    {eventosDia.length > 3 && (
                      <div style={{ fontSize:9, color:textMuted, paddingLeft:6 }}>+{eventosDia.length - 3} más</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista semanal ──────────────────────────────────────────────────────────
function VistaSemanal({ semana, eventos, onEventoClick, onDiaClick }) {
  const dark = useThemeStore((s) => s.isDark);
  const hoy  = dayjs();
  const dias = Array.from({ length: 7 }, (_, i) => semana.add(i, 'day'));

  const bg     = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const text   = dark ? '#f3f4f6' : '#111827';
  const textMuted = dark ? '#6b7280' : '#9ca3af';

  return (
    <div style={{ background:bg, borderRadius:16, border:`1px solid ${border}`, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:`1px solid ${border}` }}>
        {dias.map((dia) => {
          const esHoy = dia.isSame(hoy, 'day');
          return (
            <div key={dia.toString()}
              onClick={() => onDiaClick(dia)}
              style={{ padding:'12px 8px', textAlign:'center', cursor:'pointer',
                borderRight: `1px solid ${border}`,
                background: esHoy ? (dark ? 'rgba(124,58,237,0.1)' : '#f5f3ff') : 'transparent',
              }}>
              <p style={{ fontSize:10, fontWeight:600, color: esHoy ? '#7c3aed' : textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                {dia.format('ddd')}
              </p>
              <div style={{ width:32, height:32, borderRadius:'50%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center',
                background: esHoy ? '#7c3aed' : 'transparent',
                fontSize:15, fontWeight:700, color: esHoy ? 'white' : text,
              }}>
                {dia.format('D')}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', minHeight:400 }}>
        {dias.map((dia, di) => {
          const evsDia = eventos.filter((e) => dayjs(e.fecha_inicio).isSame(dia, 'day'));
          return (
            <div key={dia.toString()} style={{
              padding:'8px', borderRight: di < 6 ? `1px solid ${border}` : 'none',
              display:'flex', flexDirection:'column', gap:4,
            }}>
              {evsDia.map((e) => (
                <motion.div key={e.id} whileHover={{ scale:1.01 }} onClick={() => onEventoClick(e)}
                  style={{
                    padding:'6px 8px', borderRadius:8, cursor:'pointer',
                    background: `${e.color || '#7c3aed'}15`,
                    borderLeft: `3px solid ${e.color || '#7c3aed'}`,
                  }}>
                  <p style={{ fontSize:11, fontWeight:600, color: e.color || '#7c3aed', margin:0 }}>{e.titulo}</p>
                  {!e.todo_el_dia && (
                    <p style={{ fontSize:10, color:textMuted, margin:'2px 0 0' }}>
                      {dayjs(e.fecha_inicio).format('HH:mm')}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista agenda ───────────────────────────────────────────────────────────
function VistaAgenda({ eventos, onEventoClick }) {
  const dark = useThemeStore((s) => s.isDark);
  const hoy  = dayjs();

  const bg     = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const text   = dark ? '#f3f4f6' : '#111827';
  const textMuted = dark ? '#6b7280' : '#9ca3af';

  const futuros = [...eventos]
    .filter((e) => dayjs(e.fecha_inicio).isSameOrAfter(hoy, 'day'))
    .sort((a, b) => dayjs(a.fecha_inicio).diff(dayjs(b.fecha_inicio)));

  // Agrupar por fecha
  const grupos = {};
  futuros.forEach((e) => {
    const key = dayjs(e.fecha_inicio).format('YYYY-MM-DD');
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(e);
  });

  if (!Object.keys(grupos).length) {
    return (
      <div style={{ background:bg, borderRadius:16, border:`1px solid ${border}`, padding:'60px 24px', textAlign:'center' }}>
        <Icons.calendar style={{ width:40, height:40, color:dark?'#374151':'#e5e7eb', margin:'0 auto 12px' }} />
        <p style={{ fontSize:14, fontWeight:600, color:textMuted }}>No hay eventos próximos</p>
        <p style={{ fontSize:12, color:dark?'#4b5563':'#9ca3af', marginTop:4 }}>Crea un evento para comenzar</p>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {Object.entries(grupos).map(([fecha, evs]) => {
        const dia = dayjs(fecha);
        const esHoy = dia.isSame(hoy, 'day');
        return (
          <div key={fecha}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{
                width:40, height:40, borderRadius:12, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                background: esHoy ? '#7c3aed' : (dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
              }}>
                <span style={{ fontSize:8, fontWeight:700, color: esHoy ? 'rgba(255,255,255,0.7)' : textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {dia.format('MMM')}
                </span>
                <span style={{ fontSize:16, fontWeight:800, color: esHoy ? 'white' : text, lineHeight:1 }}>
                  {dia.format('D')}
                </span>
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color: esHoy ? '#7c3aed' : text, margin:0, textTransform:'capitalize' }}>
                  {esHoy ? 'Hoy' : dia.format('dddd')}
                </p>
                <p style={{ fontSize:11, color:textMuted, margin:0 }}>{dia.format('D [de] MMMM, YYYY')}</p>
              </div>
            </div>
            <div style={{ marginLeft:50, display:'flex', flexDirection:'column', gap:6 }}>
              {evs.map((e) => (
                <motion.div key={e.id} whileHover={{ x:3 }} onClick={() => onEventoClick(e)}
                  style={{
                    background:bg, borderRadius:12, padding:'12px 14px', cursor:'pointer',
                    border:`1px solid ${border}`, borderLeft:`4px solid ${e.color || '#7c3aed'}`,
                    display:'flex', alignItems:'center', gap:12,
                  }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.titulo}</p>
                    <p style={{ fontSize:11, color:textMuted, margin:'2px 0 0' }}>
                      {e.todo_el_dia ? 'Todo el día' : dayjs(e.fecha_inicio).format('HH:mm')}
                      {e.fecha_fin && !e.todo_el_dia ? ` — ${dayjs(e.fecha_fin).format('HH:mm')}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20, background:`${e.color||'#7c3aed'}20`, color:e.color||'#7c3aed', textTransform:'capitalize', flexShrink:0 }}>
                    {TIPOS.find((t) => t.value === e.tipo)?.label || e.tipo}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Calendario() {
  const dark = useThemeStore((s) => s.isDark);
  const { eventos, loading, cargarEventos, eliminarEvento } = useCalendarioStore();
  const alert = useAlert();

  const [vista,            setVista]            = useState('mes');      // mes | semana | agenda
  const [mesActual,        setMesActual]        = useState(dayjs());
  const [semanaActual,     setSemanaActual]     = useState(dayjs().startOf('week').add(1,'day'));
  const [modalOpen,        setModalOpen]        = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [eventoDetalle,    setEventoDetalle]    = useState(null);
  const [diaSeleccionado,  setDiaSeleccionado]  = useState(null);

  // Cargar eventos del mes visible
  useEffect(() => {
    const desde = mesActual.startOf('month').toISOString();
    const hasta  = mesActual.endOf('month').toISOString();
    cargarEventos(desde, hasta);
  }, [mesActual]);

  const navAnterior = () => {
    if (vista === 'mes')    setMesActual((m) => m.subtract(1,'month'));
    if (vista === 'semana') setSemanaActual((s) => s.subtract(1,'week'));
  };
  const navSiguiente = () => {
    if (vista === 'mes')    setMesActual((m) => m.add(1,'month'));
    if (vista === 'semana') setSemanaActual((s) => s.add(1,'week'));
  };
  const navHoy = () => {
    setMesActual(dayjs());
    setSemanaActual(dayjs().startOf('week').add(1,'day'));
  };

  const handleDiaClick = (dia) => {
    setDiaSeleccionado(dia);
    setEventoSeleccionado(null);
    setModalOpen(true);
  };

  const handleEventoClick = (evento) => setEventoDetalle(evento);

  const handleEditar = (evento) => {
    setEventoSeleccionado(evento);
    setModalOpen(true);
  };

  const handleEliminar = async (id) => {
    const r = await eliminarEvento(id);
    if (!r.success) alert.error('Error', r.message);
    else alert.success('Eliminado', 'El evento fue eliminado.');
  };

  const titulo = vista === 'mes'
    ? mesActual.format('MMMM YYYY')
    : vista === 'semana'
      ? `${semanaActual.format('D MMM')} — ${semanaActual.add(6,'day').format('D MMM, YYYY')}`
      : 'Agenda';

  const bg       = dark ? '#0f0f13' : '#f7f7f5';
  const cardBg   = dark ? '#18181f' : 'white';
  const border   = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const text     = dark ? '#f9fafb' : '#111827';
  const textMuted= dark ? '#9ca3af' : '#6b7280';

  return (
    <div style={{ paddingBottom:40 }}>

{/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:text, margin:0 }}>Calendario</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
            <p style={{ fontSize:13, color:textMuted, margin:0 }}>Gestiona tus eventos y actividades</p>
            {eventos.filter((e) => dayjs(e.fecha_inicio).isSame(dayjs(), 'day')).length > 0 && (
              <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:dark?'rgba(124,58,237,0.2)':'#ede9fe', color:'#7c3aed' }}>
                {eventos.filter((e) => dayjs(e.fecha_inicio).isSame(dayjs(), 'day')).length} evento{eventos.filter((e) => dayjs(e.fecha_inicio).isSame(dayjs(), 'day')).length !== 1 ? 's' : ''} hoy
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {/* Stats rápidas */}
          <div style={{ display:'flex', gap:6 }}>
            {[
              { label:'Este mes', value: eventos.filter((e) => dayjs(e.fecha_inicio).isSame(mesActual,'month')).length, color:'#7c3aed' },
              { label:'Hoy',      value: eventos.filter((e) => dayjs(e.fecha_inicio).isSame(dayjs(),'day')).length,      color:'#2563eb' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding:'6px 12px', background:dark?'rgba(255,255,255,0.04)':cardBg, borderRadius:10, border:`1px solid ${border}`, textAlign:'center' }}>
                <p style={{ fontSize:16, fontWeight:800, color, margin:0 }}>{value}</p>
                <p style={{ fontSize:10, color:textMuted, margin:0 }}>{label}</p>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => { setEventoSeleccionado(null); setDiaSeleccionado(null); setModalOpen(true); }}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#7c3aed', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
            <Icons.plus style={{ width:16, height:16 }} />
            Nuevo evento
          </motion.button>
        </div>
      </div>

      {/* Barra de navegación */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>

        {/* Navegación */}
        <div style={{ display:'flex', alignItems:'center', gap:4, background:cardBg, border:`1px solid ${border}`, borderRadius:12, padding:4 }}>
          <button onClick={navAnterior}
            style={{ width:32, height:32, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:textMuted }}>
            <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <button onClick={navHoy}
            style={{ padding:'4px 12px', borderRadius:8, border:'none', background:'transparent', color:text, fontSize:14, fontWeight:700, cursor:'pointer', textTransform:'capitalize', minWidth:160, textAlign:'center' }}>
            {titulo}
          </button>
          <button onClick={navSiguiente}
            style={{ width:32, height:32, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:textMuted }}>
            <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </div>

        {/* Botón Hoy */}
        <button onClick={navHoy}
          style={{ padding:'8px 14px', borderRadius:12, border:`1px solid ${border}`, background:cardBg, color:text, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Hoy
        </button>

        {/* Selector de vista */}
        <div style={{ display:'flex', gap:2, background:cardBg, border:`1px solid ${border}`, borderRadius:12, padding:4, marginLeft:'auto' }}>
          {[{key:'mes',label:'Mes'},{key:'semana',label:'Semana'},{key:'agenda',label:'Agenda'}].map(({key,label}) => (
            <button key={key} onClick={() => setVista(key)}
              style={{ padding:'6px 14px', borderRadius:9, border:'none', fontSize:12, fontWeight:vista===key?600:400, cursor:'pointer',
                background: vista===key ? '#7c3aed' : 'transparent',
                color: vista===key ? 'white' : textMuted,
                transition:'all 0.15s',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Leyenda de tipos */}
      <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
        {TIPOS.map((t) => (
          <div key={t.value} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:t.color }} />
            <span style={{ fontSize:11, color:textMuted }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', height:300, alignItems:'center' }}>
          <svg style={{ width:28, height:28 }} className="animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={vista} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
            {vista === 'mes'    && <VistaMensual  mes={mesActual}       eventos={eventos} onDiaClick={handleDiaClick}   onEventoClick={handleEventoClick} />}
            {vista === 'semana' && <VistaSemanal  semana={semanaActual} eventos={eventos} onDiaClick={handleDiaClick}   onEventoClick={handleEventoClick} />}
            {vista === 'agenda' && <VistaAgenda                         eventos={eventos} onEventoClick={handleEventoClick} />}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modales */}
      <AnimatePresence>
        {modalOpen && (
          <EventoModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEventoSeleccionado(null); setDiaSeleccionado(null); }}
            evento={eventoSeleccionado}
            diaSeleccionado={diaSeleccionado}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {eventoDetalle && (
          <EventoDetalle
            evento={eventoDetalle}
            onClose={() => setEventoDetalle(null)}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}