import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTareasStore } from '../../store/tareasStore';
import { useAuthStore }   from '../../store/authStore';
import { useThemeStore }  from '../../store/themeStore';
import { useAlert }       from '../../hooks/useAlert';
import { Icons }          from '../../components/ui/Icons';

const ESTADO_BADGE = {
  pendiente:    { label:'Pendiente',    bg:'rgba(251,191,36,0.15)',  text:'#d97706' },
  entregada:    { label:'Entregada',    bg:'rgba(34,197,94,0.15)',   text:'#16a34a' },
  no_entregada: { label:'No entregada', bg:'rgba(239,68,68,0.15)',   text:'#dc2626' },
  aprobada:     { label:'Aprobada',     bg:'rgba(124,58,237,0.15)',  text:'#7c3aed' },
  rechazada:    { label:'Rechazada',    bg:'rgba(239,68,68,0.15)',   text:'#dc2626' },
};

const PRIORIDAD_COLOR = {
  baja:'#22c55e', media:'#3b82f6', alta:'#f97316', urgente:'#ef4444',
};

// ── Preview de archivo ─────────────────────────────────────────────────────
function ArchivoPreview({ archivo, onClose }) {
  if (!archivo) return null;
  const esImagen = archivo.tipo?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(archivo.nombre||archivo.name||'');
  const esPDF    = /\.pdf$/i.test(archivo.nombre||archivo.name||'');
  const url      = archivo.url || archivo;

  return createPortal(
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
      style={{ position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.92)',backdropFilter:'blur(12px)',display:'flex',flexDirection:'column' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',flexShrink:0 }} onClick={e=>e.stopPropagation()}>
        <p style={{ color:'white',fontWeight:600,fontSize:14,margin:0 }}>{archivo.nombre||archivo.name}</p>
        <div style={{ display:'flex',gap:8 }}>
          <a href={url} download target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
            style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 16px',background:'#7c3aed',color:'white',borderRadius:12,fontSize:13,fontWeight:600,textDecoration:'none' }}>
            Descargar
          </a>
          <button onClick={onClose} style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.1)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }} onClick={e=>e.stopPropagation()}>
        {esImagen
          ? <img src={url} alt="" style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:12 }} />
          : esPDF
            ? <iframe src={url} style={{ width:'100%',height:'100%',border:'none',borderRadius:12 }} title="PDF" />
            : <div style={{ textAlign:'center' }}>
                <p style={{ color:'rgba(255,255,255,0.6)',marginBottom:16 }}>Vista previa no disponible</p>
                <a href={url} download style={{ padding:'10px 24px',background:'#7c3aed',color:'white',borderRadius:12,textDecoration:'none' }}>Descargar</a>
              </div>
        }
      </div>
    </motion.div>,
    document.body
  );
}

// ── Sección de entrega del trabajador ─────────────────────────────────────
function MiEntregaSection({ tarea, dark }) {
  const { miEntrega, cargarMiEntrega, subirEntrega: subirEnt } = useTareasStore();
  const alert   = useAlert();
  const fileRef = useRef(null);
  const [subiendo,       setSubiendo]       = useState(false);
  const [comentario,     setComentario]     = useState('');
  const [archivoPreview, setArchivoPreview] = useState(null);

  useEffect(() => { cargarMiEntrega(tarea.id); }, [tarea.id]);

  const handleSubir = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20*1024*1024) return alert.warning('Archivo muy grande','Máximo 20MB.');
    setSubiendo(true);
    const r = await subirEnt(tarea.id, file, comentario);
    setSubiendo(false);
    e.target.value = '';
    if (r.success) alert.success('Entrega subida','Tu archivo fue registrado correctamente.');
    else alert.error('Error', r.message);
  };

  const estado  = miEntrega?.estado || 'pendiente';
  const badge   = ESTADO_BADGE[estado] || ESTADO_BADGE.pendiente;
  const vencida = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date();

  const secS = { fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 };
  const inputS = {
    width:'100%', padding:'9px 12px', fontSize:13, borderRadius:10,
    background:dark?'rgba(255,255,255,0.06)':'#f9fafb',
    border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,
    color:dark?'#f3f4f6':'#111827', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box',
  };

  return (
    <div style={{ padding:'16px 0', borderTop:`1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` }}>
      {/* Estado de mi entrega */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <p style={secS}>Mi entrega</p>
        <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, background:badge.bg, color:badge.text }}>
          {badge.label}
        </span>
      </div>

      {/* Archivos subidos */}
      {miEntrega?.archivos?.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <p style={secS}>Archivos enviados ({miEntrega.archivos.length})</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {miEntrega.archivos.map((a, i) => (
              <button key={i} onClick={() => setArchivoPreview(a)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}`, background:dark?'rgba(255,255,255,0.03)':'#fafafa', cursor:'pointer', textAlign:'left', width:'100%' }}
                onMouseEnter={e => e.currentTarget.style.background=dark?'rgba(124,58,237,0.1)':'#f5f3ff'}
                onMouseLeave={e => e.currentTarget.style.background=dark?'rgba(255,255,255,0.03)':'#fafafa'}>
                <div style={{ width:36,height:36,borderRadius:9,background:dark?'rgba(124,58,237,0.2)':'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="#7c3aed" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12,fontWeight:600,color:dark?'#e5e7eb':'#111827',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.nombre}</p>
                  <p style={{ fontSize:10,color:'#9ca3af',margin:0 }}>
                    {a.tamaño ? `${(a.tamaño/1024).toFixed(1)} KB · ` : ''}
                    {a.fecha ? new Date(a.fecha).toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
                  </p>
                </div>
                <svg viewBox="0 0 24 24" style={{width:14,height:14,color:'#9ca3af',flexShrink:0}} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comentario del admin si fue rechazada */}
      {miEntrega?.comentario && estado === 'rechazada' && (
        <div style={{ padding:12, borderRadius:10, background:dark?'rgba(239,68,68,0.1)':'#fef2f2', border:'1px solid #fecaca', marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Motivo de rechazo</p>
          <p style={{ fontSize:13, color:dark?'#fca5a5':'#7f1d1d', margin:0 }}>{miEntrega.comentario}</p>
        </div>
      )}

      {/* Subir entrega — solo si no fue aprobada */}
      {estado !== 'aprobada' && (
        <div>
          {!vencida || estado === 'rechazada' ? (
            <>
              <p style={secS}>{estado === 'rechazada' ? 'Volver a entregar' : 'Subir archivo'}</p>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                placeholder="Comentario opcional para el admin..."
                rows={2} style={{ ...inputS, resize:'none', marginBottom:8 }} />
              <input ref={fileRef} type="file" style={{ display:'none' }} onChange={handleSubir} />
              <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                onClick={() => fileRef.current?.click()} disabled={subiendo}
                style={{ width:'100%', padding:'11px', borderRadius:12, border:'none', background:subiendo?'#8b5cf6':'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:subiendo?'not-allowed':'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {subiendo ? (
                  <>
                    <svg style={{ width:16,height:16,animation:'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                      <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path style={{opacity:.75}} fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {estado === 'entregada' ? 'Agregar otro archivo' : 'Subir entrega'}
                  </>
                )}
              </motion.button>
            </>
          ) : (
            <div style={{ padding:12, borderRadius:10, background:dark?'rgba(239,68,68,0.1)':'#fef2f2', border:'1px solid #fecaca', textAlign:'center' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#ef4444', margin:0 }}>Plazo vencido</p>
              <p style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>No se pueden hacer entregas después de la fecha límite.</p>
            </div>
          )}
        </div>
      )}

      {estado === 'aprobada' && (
        <div style={{ padding:12, borderRadius:10, background:dark?'rgba(124,58,237,0.1)':'#f5f3ff', border:'1px solid #c4b5fd', textAlign:'center' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'#7c3aed', margin:0 }}>Entrega aprobada</p>
          <p style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>El administrador aprobó tu entrega.</p>
        </div>
      )}

      <ArchivoPreview archivo={archivoPreview} onClose={() => setArchivoPreview(null)} />
    </div>
  );
}

// ── Sección de entregas para admin ────────────────────────────────────────
function EntregasAdminSection({ tarea, dark }) {
  const { entregas, cargarEntregas, revisarEntrega } = useTareasStore();
  const alert = useAlert();
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [comentarioRechazo, setComentarioRechazo] = useState({});

  useEffect(() => { cargarEntregas(tarea.id); }, [tarea.id]);

  const handleRevisar = async (entregaId, estado) => {
    const comentario = comentarioRechazo[entregaId] || '';
    if (estado === 'rechazada' && !comentario.trim()) {
      return alert.warning('Requerido','Escribe el motivo del rechazo.');
    }
    const r = await revisarEntrega(tarea.id, entregaId, estado, comentario);
    if (r.success) {
      alert.success(estado === 'aprobada' ? 'Aprobada' : 'Rechazada', 'La entrega fue revisada.');
      setComentarioRechazo((prev) => ({ ...prev, [entregaId]: '' }));
    } else alert.error('Error', r.message);
  };

  const secS = { fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 };
  const inputS = {
    width:'100%', padding:'8px 12px', fontSize:12, borderRadius:8,
    background:dark?'rgba(255,255,255,0.06)':'#f9fafb',
    border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,
    color:dark?'#f3f4f6':'#111827', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box',
  };

  return (
    <div style={{ padding:'16px 0', borderTop:`1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` }}>
      <p style={secS}>Entregas recibidas ({entregas.length})</p>

      {entregas.length === 0 ? (
        <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', padding:'20px 0' }}>
          Nadie ha entregado aún
        </p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {entregas.map((entrega) => {
            const badge = ESTADO_BADGE[entrega.estado] || ESTADO_BADGE.pendiente;
            return (
              <div key={entrega.id} style={{ borderRadius:12, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}`, overflow:'hidden' }}>
                {/* Header usuario */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:dark?'rgba(255,255,255,0.03)':'#fafafa' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      {entrega.usuario?.avatar_url
                        ? <img src={entrega.usuario.avatar_url} style={{ width:'100%',height:'100%',borderRadius:9,objectFit:'cover' }} alt="" />
                        : <span style={{ color:'white',fontWeight:700,fontSize:12 }}>{entrega.usuario?.nombre?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p style={{ fontSize:13,fontWeight:600,color:dark?'#f3f4f6':'#111827',margin:0 }}>
                        {entrega.usuario?.nombre} {entrega.usuario?.apellido}
                      </p>
                      {entrega.fecha_entrega && (
                        <p style={{ fontSize:10,color:'#9ca3af',margin:0 }}>
                          {new Date(entrega.fecha_entrega).toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:badge.bg,color:badge.text }}>
                    {badge.label}
                  </span>
                </div>

                {/* Archivos */}
                {entrega.archivos?.length > 0 && (
                  <div style={{ padding:'10px 14px', borderTop:`1px solid ${dark?'rgba(255,255,255,0.05)':'#f3f4f6'}` }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {entrega.archivos.map((a, i) => (
                        <button key={i} onClick={() => setArchivoPreview(a)}
                          style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,border:`1px solid ${dark?'rgba(255,255,255,0.06)':'#e5e7eb'}`,background:'transparent',cursor:'pointer',textAlign:'left',width:'100%' }}
                          onMouseEnter={e => e.currentTarget.style.background=dark?'rgba(124,58,237,0.1)':'#f5f3ff'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <svg viewBox="0 0 24 24" style={{width:14,height:14,flexShrink:0}} fill="none" stroke="#7c3aed" strokeWidth="1.8">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                          </svg>
                          <span style={{ fontSize:11,color:dark?'#d1d5db':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1 }}>{a.nombre}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones admin */}
                {entrega.estado === 'entregada' && (
                  <div style={{ padding:'10px 14px', borderTop:`1px solid ${dark?'rgba(255,255,255,0.05)':'#f3f4f6'}`, display:'flex', flexDirection:'column', gap:6 }}>
                    <input
                      value={comentarioRechazo[entrega.id]||''}
                      onChange={e => setComentarioRechazo(prev => ({...prev,[entrega.id]:e.target.value}))}
                      placeholder="Motivo de rechazo (requerido para rechazar)..."
                      style={inputS}
                    />
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => handleRevisar(entrega.id,'aprobada')}
                        style={{ flex:1,padding:'8px',borderRadius:9,border:'none',background:dark?'rgba(34,197,94,0.15)':'#dcfce7',color:'#16a34a',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        Aprobar
                      </button>
                      <button onClick={() => handleRevisar(entrega.id,'rechazada')}
                        style={{ flex:1,padding:'8px',borderRadius:9,border:'none',background:dark?'rgba(239,68,68,0.12)':'#fee2e2',color:'#ef4444',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}

                {/* Comentario del admin visible */}
                {entrega.comentario && (
                  <div style={{ padding:'8px 14px', borderTop:`1px solid ${dark?'rgba(255,255,255,0.05)':'#f3f4f6'}`, background:dark?'rgba(239,68,68,0.05)':'#fef9f9' }}>
                    <p style={{ fontSize:11,color:'#ef4444',margin:0 }}>{entrega.comentario}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ArchivoPreview archivo={archivoPreview} onClose={() => setArchivoPreview(null)} />
    </div>
  );
}

// ── Panel principal ────────────────────────────────────────────────────────
export default function TareaDetalle({ tareaId, onClose, onEditar, onEliminar }) {
  const { tarea, loadingTarea, cargarTarea, agregarComentario } = useTareasStore();
  const usuario      = useAuthStore((s) => s.usuario);
  const dark         = useThemeStore((s) => s.isDark);
  const alert        = useAlert();

  const [comentario, setComentario] = useState('');
  const [enviando,   setEnviando]   = useState(false);

  const puedeGestionar = ['dueño','administrador','gerente','supervisor'].includes(usuario?.rol);

  useEffect(() => { if (tareaId) cargarTarea(tareaId); }, [tareaId]);

  const handleComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setEnviando(true);
    const r = await agregarComentario(tareaId, comentario);
    setEnviando(false);
    if (r.success) setComentario('');
    else alert.error('Error', r.message);
  };

  const PRIORIDAD_COLOR_MAP = {
    baja:'text-green-600', media:'text-blue-600', alta:'text-orange-500', urgente:'text-red-600',
  };

  return createPortal(
    <>
      <AnimatePresence>
        {tareaId && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
              style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(5px)',WebkitBackdropFilter:'blur(5px)' }} />

            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring',stiffness:300,damping:30 }}
              style={{ position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:540,zIndex:9999,display:'flex',flexDirection:'column',background:dark?'#18181f':'white',boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>

              {loadingTarea || !tarea ? (
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%' }}>
                  <svg style={{ width:28,height:28 }} className="animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ padding:'20px 24px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
                      <h2 style={{ fontSize:16, fontWeight:800, color:dark?'#f9fafb':'#111827', margin:0, lineHeight:1.3 }}>{tarea.titulo}</h2>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        {puedeGestionar && (
                          <>
                            <button onClick={() => onEditar?.(tarea)}
                              style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,background:'transparent',color:dark?'#d1d5db':'#374151',fontSize:11,fontWeight:500,cursor:'pointer' }}>
                              <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Editar
                            </button>
                            <button onClick={() => onEliminar?.(tarea.id)}
                              style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'none',background:dark?'rgba(239,68,68,0.12)':'#fee2e2',color:'#ef4444',fontSize:11,fontWeight:500,cursor:'pointer' }}>
                              <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
                              </svg>
                              Eliminar
                            </button>
                          </>
                        )}
                        <button onClick={onClose}
                          style={{ width:30,height:30,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'#f3f4f6',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { l:'Prioridad', v: <span style={{ fontWeight:700, color:PRIORIDAD_COLOR[tarea.prioridad], textTransform:'capitalize' }}>{tarea.prioridad}</span> },
                        { l:'Asignado a', v: tarea.asignado_a_usuario ? `${tarea.asignado_a_usuario.nombre} ${tarea.asignado_a_usuario.apellido}` : 'Sin asignar' },
                        ...(tarea.fecha_inicio ? [{ l:'Inicio', v: new Date(tarea.fecha_inicio).toLocaleDateString('es-MX') }] : []),
                        ...(tarea.fecha_limite ? [{ l:'Fecha límite', v: new Date(tarea.fecha_limite).toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}) }] : []),
                        ...(tarea.departamento ? [{ l:'Departamento', v: tarea.departamento.nombre }] : []),
                      ].map(({ l, v }) => (
                        <div key={l} style={{ background:dark?'rgba(255,255,255,0.04)':'#f9fafb', borderRadius:10, padding:'10px 12px' }}>
                          <p style={{ fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 3px' }}>{l}</p>
                          <p style={{ fontSize:13,fontWeight:500,color:dark?'#e5e7eb':'#111827',margin:0 }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contenido scrolleable */}
                  <div style={{ flex:1, overflowY:'auto', padding:'0 24px 24px' }}>

                    {/* Descripción */}
                    {tarea.descripcion && (
                      <div style={{ padding:'16px 0', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` }}>
                        <p style={{ fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>Descripción</p>
                        <p style={{ fontSize:13,color:dark?'#d1d5db':'#374151',lineHeight:1.6,margin:0,whiteSpace:'pre-wrap' }}>{tarea.descripcion}</p>
                      </div>
                    )}

                    {/* Sección de entrega — diferente según rol */}
                    {puedeGestionar
                      ? <EntregasAdminSection tarea={tarea} dark={dark} />
                      : <MiEntregaSection     tarea={tarea} dark={dark} />
                    }

                    {/* Comentarios */}
                    <div style={{ padding:'16px 0' }}>
                      <p style={{ fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12 }}>
                        Comentarios ({tarea.comentarios?.length || 0})
                      </p>
                      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
                        {tarea.comentarios?.length ? tarea.comentarios.map((c) => (
                          <div key={c.id} style={{ display:'flex', gap:10 }}>
                            <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                              {c.usuario?.avatar_url
                                ? <img src={c.usuario.avatar_url} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} alt="" />
                                : <span style={{ color:'white',fontWeight:700,fontSize:11 }}>{c.usuario?.nombre?.[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                                <span style={{ fontSize:12,fontWeight:600,color:dark?'#f3f4f6':'#111827' }}>{c.usuario?.nombre} {c.usuario?.apellido}</span>
                                <span style={{ fontSize:10,color:'#9ca3af' }}>
                                  {new Date(c.created_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                                </span>
                              </div>
                              <p style={{ fontSize:13,color:dark?'#d1d5db':'#374151',margin:0,lineHeight:1.5 }}>{c.contenido}</p>
                            </div>
                          </div>
                        )) : (
                          <p style={{ fontSize:12,color:'#9ca3af',textAlign:'center',padding:'12px 0' }}>Sin comentarios aún</p>
                        )}
                      </div>
                      <form onSubmit={handleComentario} style={{ display:'flex', gap:8 }}>
                        <input type="text" value={comentario} onChange={e => setComentario(e.target.value)}
                          placeholder="Escribe un comentario..."
                          style={{ flex:1,padding:'9px 12px',fontSize:13,borderRadius:12,background:dark?'rgba(255,255,255,0.06)':'#f9fafb',border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,color:dark?'#f3f4f6':'#111827',outline:'none' }} />
                        <button type="submit" disabled={enviando || !comentario.trim()}
                          style={{ width:38,height:38,borderRadius:12,border:'none',background:'#7c3aed',color:'white',cursor:enviando||!comentario.trim()?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:enviando||!comentario.trim()?0.5:1 }}>
                          <svg viewBox="0 0 24 24" style={{width:15,height:15}} fill="none" stroke="white" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9 22,2"/>
                          </svg>
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}