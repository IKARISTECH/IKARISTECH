import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence }    from 'framer-motion';
import { createPortal }               from 'react-dom';
import { useFormulariosStore }        from '../../store/formulariosStore';
import { useAuthStore }               from '../../store/authStore';
import { useUsuariosStore }           from '../../store/usuariosStore';
import { useThemeStore }              from '../../store/themeStore';
import { useAlert }                   from '../../hooks/useAlert';
import FormularioConstructor          from './FormularioConstructor';
import FormularioResponder            from './FormularioResponder';
import api                            from '../../utils/apiClient';

const puedeEditar = (rol) => ['dueño','administrador','gerente','supervisor'].includes(rol);

const obtenerCamposFormulario = (formulario) => {
  if (Array.isArray(formulario?.campos)) return formulario.campos;

  if (typeof formulario?.campos === 'string') {
    try {
      const parsed = JSON.parse(formulario.campos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(formulario?.estructura)) return formulario.estructura;
  if (Array.isArray(formulario?.fields)) return formulario.fields;

  return [];
};

function FormularioEditor({ open, onClose, formularioEditar }) {
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();
  const { crearFormulario, actualizarFormulario, cargarFormularios } = useFormulariosStore();
  const { departamentos, usuarios, cargarDepartamentos, cargarUsuarios } = useUsuariosStore();

  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const esEdicion = !!formularioEditar;

  // form como ref para evitar pérdida al cambiar steps
  const [form, setForm] = useState({
    titulo:'', descripcion:'', campos:[], departamentos:[], usuarios_acceso:[], publicado:false,
  });
  const formRef = React.useRef(form);

  // Actualizar form y ref juntos, sin perder campos por asincronía
  const updateForm = (updater) => {
    const prev = formRef.current;
    const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

    formRef.current = next;
    setForm(next);
  };

  useEffect(() => {
    if (open) {
      cargarDepartamentos();
      cargarUsuarios();
      const inicial = formularioEditar
        ? {
            ...formularioEditar,
            campos: obtenerCamposFormulario(formularioEditar),
            departamentos: Array.isArray(formularioEditar.departamentos) ? formularioEditar.departamentos : [],
            usuarios_acceso: Array.isArray(formularioEditar.usuarios_acceso) ? formularioEditar.usuarios_acceso : [],
          }
        : { titulo:'', descripcion:'', campos:[], departamentos:[], usuarios_acceso:[], publicado:false };

      formRef.current = inicial;
      setForm(inicial);
      setStep(0);
    }
  }, [open, formularioEditar]);

  const handleGuardar = async () => {
    const datosActuales = {
      ...formRef.current,
      campos: Array.isArray(formRef.current.campos) ? formRef.current.campos : [],
    };

    if (!datosActuales.titulo?.trim()) {
      return alert.warning('Requerido', 'El título es obligatorio.');
    }

    console.log('Guardando con campos:', datosActuales.campos.length, datosActuales.campos);

    setSaving(true);

    const r = esEdicion
      ? await actualizarFormulario(formularioEditar.id, datosActuales)
      : await crearFormulario(datosActuales);

    setSaving(false);

    if (r.success) {
      alert.success(esEdicion ? 'Formulario actualizado' : 'Formulario creado', datosActuales.titulo);
      await cargarFormularios();
      onClose();
    } else {
      alert.error('Error', r.message);
    }
  };
  const bg     = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const text   = dark ? '#f9fafb' : '#111827';
  const textM  = dark ? '#9ca3af' : '#6b7280';
  const inputS = {
    width:'100%', padding:'10px 14px', fontSize:13, borderRadius:10,
    background: dark?'rgba(255,255,255,0.06)':'#f9fafb',
    border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,
    color: dark?'#f3f4f6':'#111827', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box',
  };

  if (!open) return null;

  const STEPS = ['Información','Campos','Acceso'];

  return createPortal(
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'stretch' }}>
      <motion.div initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }} transition={{ type:'spring', stiffness:300, damping:30 }}
        style={{ width:'100%', maxWidth:900, background:bg, display:'flex', flexDirection:'column', boxShadow:'4px 0 40px rgba(0,0,0,0.2)', height:'100vh', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 28px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <p style={{ fontWeight:800, fontSize:18, color:text, margin:0 }}>{esEdicion?'Editar formulario':'Nuevo formulario'}</p>
            <p style={{ fontSize:12, color:textM, margin:'2px 0 0' }}>
              {form.titulo || 'Sin título'} 
              {form.campos?.length > 0 && (
                <span style={{ marginLeft:8, color:'#7c3aed', fontWeight:600 }}>· {form.campos.length} campo{form.campos.length!==1?'s':''}</span>
              )}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:10, border:`1px solid ${border}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:13, cursor:'pointer' }}>Cancelar</button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={handleGuardar} disabled={saving}
              style={{ padding:'8px 20px', borderRadius:10, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>
              {saving ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Publicar formulario'}
            </motion.button>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding:'0 28px', borderBottom:`1px solid ${border}`, display:'flex', gap:0, flexShrink:0 }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              style={{ padding:'14px 20px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:step===i?700:400, color:step===i?'#7c3aed':textM, borderBottom:step===i?'2px solid #7c3aed':'2px solid transparent', transition:'all 0.15s' }}>
              {i+1}. {s}
            </button>
          ))}
        </div>

        {/* Body — TODOS los steps montados, solo visibilidad cambia */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>

          {/* STEP 0 — Información — siempre montado */}
          <div style={{ display: step===0 ? 'block' : 'none', flex:1, overflowY:'auto', padding:28 }}>
            <div style={{ maxWidth:560, display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:textM, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Título del formulario *</label>
                <input value={form.titulo} onChange={(e) => updateForm(f => ({...f, titulo:e.target.value}))}
                  placeholder="Ej. Solicitud de vacaciones" style={{ ...inputS, fontSize:16, fontWeight:500, padding:'12px 16px' }} />
                {form.titulo && (
                  <p style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>
                    Folio: <span style={{ fontFamily:'monospace', fontWeight:700, color:'#7c3aed' }}>
                      {form.titulo.trim().split(/\s+/).slice(0,3).map((p)=>p[0]?.toUpperCase()||'').join('')}00001
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:textM, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => updateForm(f => ({...f, descripcion:e.target.value}))}
                  placeholder="Instrucciones o descripción del formulario..." rows={3}
                  style={{ ...inputS, resize:'none' }} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <button onClick={() => updateForm(f => ({...f, publicado:!f.publicado}))}
                  style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative', background:form.publicado?'#7c3aed':'#e5e7eb', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:form.publicado?22:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:text, margin:0 }}>Publicado</p>
                  <p style={{ fontSize:11, color:textM, margin:0 }}>Todos los usuarios con acceso pueden verlo y responderlo</p>
                </div>
              </label>
              <div style={{ padding:14, borderRadius:12, background:dark?'rgba(124,58,237,0.1)':'#f5f3ff', border:`1px solid ${dark?'rgba(124,58,237,0.2)':'#c4b5fd'}` }}>
                <p style={{ fontSize:12, color:'#7c3aed', margin:0, fontWeight:500 }}>
                  Siguiente: ve a la pestaña <strong>Campos</strong> para agregar las preguntas del formulario.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1 — Campos — siempre montado, solo oculto */}
          <div style={{ display: step===1 ? 'flex' : 'none', flex:1, overflow:'hidden', padding:28, flexDirection:'column' }}>
            <FormularioConstructor
              key={`constructor-${formularioEditar?.id || 'nuevo'}`}
              camposIniciales={form.campos || []}
              onChange={(nuevosCampos) => updateForm(f => ({ ...f, campos: nuevosCampos }))}
            />
          </div>

          {/* STEP 2 — Acceso — siempre montado */}
          <div style={{ display: step===2 ? 'block' : 'none', flex:1, overflowY:'auto', padding:28 }}>
            <div style={{ maxWidth:600 }}>
              <p style={{ fontSize:15, fontWeight:700, color:text, marginBottom:16 }}>Departamentos con acceso</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:8, marginBottom:24 }}>
                {departamentos.map((d) => {
                  const sel = (form.departamentos||[]).includes(d.id);
                  return (
                    <button key={d.id} onClick={() => {
                      const arr = form.departamentos||[];
                      updateForm(f => ({ ...f, departamentos: sel?arr.filter((x)=>x!==d.id):[...arr,d.id] }));
                    }} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:`1.5px solid ${sel?'#7c3aed':(dark?'rgba(255,255,255,0.1)':'#e5e7eb')}`, background:sel?(dark?'rgba(124,58,237,0.15)':'#f5f3ff'):'transparent', cursor:'pointer', textAlign:'left' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:d.color||'#7c3aed', flexShrink:0 }} />
                      <span style={{ fontSize:13, fontWeight:sel?600:400, color:sel?'#7c3aed':(dark?'#d1d5db':'#374151') }}>{d.nombre}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize:15, fontWeight:700, color:text, marginBottom:12 }}>Usuarios con acceso individual</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(usuarios||[]).slice(0,20).map((u) => {
                  const sel = (form.usuarios_acceso||[]).includes(u.id);
                  return (
                    <button key={u.id} onClick={() => {
                      const arr = form.usuarios_acceso||[];
                      updateForm(f => ({ ...f, usuarios_acceso: sel?arr.filter((x)=>x!==u.id):[...arr,u.id] }));
                    }} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`1.5px solid ${sel?'#7c3aed':(dark?'rgba(255,255,255,0.08)':'#e5e7eb')}`, background:sel?(dark?'rgba(124,58,237,0.12)':'#f5f3ff'):'transparent', cursor:'pointer', textAlign:'left' }}>
                      <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {u.avatar_url ? <img src={u.avatar_url} style={{ width:'100%', height:'100%', borderRadius:9, objectFit:'cover' }} alt="" /> : <span style={{ color:'white', fontWeight:700, fontSize:12 }}>{u.nombre?.[0]?.toUpperCase()}</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:sel?600:400, color:sel?'#7c3aed':(dark?'#f3f4f6':'#374151'), margin:0 }}>{u.nombre} {u.apellido}</p>
                        <p style={{ fontSize:11, color:textM, margin:0 }}>{u.correo}</p>
                      </div>
                      {sel && <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="#7c3aed" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Iconos de archivo ──────────────────────────────────────────────────────
function IconoArchivo({ tipo, nombre }) {
  const ext = (nombre||'').split('.').pop()?.toLowerCase();
  const esPDF   = tipo?.includes('pdf')   || ext === 'pdf';
  const esWord  = tipo?.includes('word')  || ['doc','docx'].includes(ext);
  const esExcel = tipo?.includes('sheet') || tipo?.includes('excel') || ['xls','xlsx','csv'].includes(ext);
  const esImg   = tipo?.startsWith('image/') || ['png','jpg','jpeg','gif','webp','svg'].includes(ext);

  if (esPDF)   return <svg viewBox="0 0 24 24" style={{width:28,height:28}} fill="none"><rect width="24" height="24" rx="4" fill="#fee2e2"/><text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="800" fill="#ef4444">PDF</text></svg>;
  if (esWord)  return <svg viewBox="0 0 24 24" style={{width:28,height:28}} fill="none"><rect width="24" height="24" rx="4" fill="#dbeafe"/><text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="800" fill="#2563eb">DOC</text></svg>;
  if (esExcel) return <svg viewBox="0 0 24 24" style={{width:28,height:28}} fill="none"><rect width="24" height="24" rx="4" fill="#dcfce7"/><text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="800" fill="#16a34a">XLS</text></svg>;
  if (esImg)   return <svg viewBox="0 0 24 24" style={{width:28,height:28}} fill="none"><rect width="24" height="24" rx="4" fill="#f3e8ff"/><svg x="4" y="4" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg></svg>;
  return <svg viewBox="0 0 24 24" style={{width:28,height:28}} fill="none"><rect width="24" height="24" rx="4" fill="#f3f4f6"/><svg x="4" y="4" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg></svg>;
}

// ── Vista previa de valor según tipo ──────────────────────────────────────
function ValorCelda({ campo, valor, archivoPreview, alert }) {
  if (valor === undefined || valor === null || valor === '') {
    return <span style={{ color:'#9ca3af', fontSize:12, display:'block', textAlign:'center' }}>—</span>;
  }

  const abrirPreview = (archivo) => {
    if (!archivoPreview || !archivo) return;

    if (typeof archivo === 'string') {
      archivoPreview({
        url: archivo,
        nombre: campo.type === 'firma' ? 'firma.png' : 'archivo',
        tipo: archivo.startsWith('data:image') ? 'image/png' : '',
      });
      return;
    }

    archivoPreview({
      ...archivo,
      url: archivo.url || archivo.preview || archivo.base64 || archivo.dataUrl || archivo.data_url || archivo.ruta || archivo.path || '',
      nombre: archivo.nombre || archivo.name || 'Archivo',
      tipo: archivo.tipo || archivo.type || '',
    });
  };

  const copiar = (texto, tipo) => {
    navigator.clipboard.writeText(texto).then(() => {
      alert?.success(`${tipo} copiado`, texto.length > 40 ? texto.slice(0,40)+'...' : texto);
    });
  };

  switch (campo.type) {
    case 'firma': {
      const firmaUrl = typeof valor === 'string'
        ? valor
        : valor?.url || valor?.dataUrl || valor?.base64 || valor?.preview || '';

      if (firmaUrl && firmaUrl.startsWith('data:image')) {
        return (
          <button
            type="button"
            onClick={() => abrirPreview({ url: firmaUrl, nombre: 'firma.png', tipo: 'image/png' })}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <img
              src={firmaUrl}
              alt="Firma"
              style={{
                height: 42,
                maxWidth: 130,
                objectFit: 'contain',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
              }}
            />
          </button>
        );
      }

      return <span style={{ fontSize:12, color:'#9ca3af', display:'block', textAlign:'center' }}>Sin firma</span>;
    }
    case 'archivo': {
      const archivos = Array.isArray(valor) ? valor : [valor];

      return (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', justifyContent:'center' }}>
          {archivos.map((a, i) => {
            const nombre = a?.nombre || a?.name || `Archivo ${i + 1}`;
            const tipo = a?.tipo || a?.type || '';

            return (
              <button
                key={i}
                type="button"
onClick={() => {
  const url = a?.url || a?.preview || a?.base64 || a?.dataUrl || a?.data_url || a?.ruta || a?.path;

  if (!url) {
    alert?.warning?.('Archivo sin vista previa', 'Este archivo fue guardado antes de activar la vista previa. Vuelve a subirlo en una nueva respuesta.');
    return;
  }

  abrirPreview({
    ...a,
    url,
    nombre: a?.nombre || a?.name || `Archivo ${i + 1}`,
    tipo: a?.tipo || a?.type || '',
  });
}}
                title={nombre}
                style={{
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  padding:0,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                }}
              >
                <IconoArchivo tipo={tipo} nombre={nombre} />
              </button>
            );
          })}
        </div>
      );
    }

case 'tabla': {
      const filas = Array.isArray(valor) ? valor : [];
      if (!filas.length) return <span style={{ fontSize:12, color:'#9ca3af' }}>Vacía</span>;
      // Orden de columnas preferido para tabla de compras
      const ORDEN_COLS = ['articulo','descripcion','unidad','url','cantidad','costo','total'];
      const allCols = Object.keys(filas[0]);
      const cols = [
        ...ORDEN_COLS.filter(k => allCols.includes(k)),
        ...allCols.filter(k => !ORDEN_COLS.includes(k)),
      ];
      const labelCol = { articulo:'Artículo', descripcion:'Descripción', unidad:'Unidad', url:'URL', cantidad:'Cantidad', costo:'Costo', total:'Total' };
      return (
        <div style={{ fontSize:10, border:'1px solid #e5e7eb', borderRadius:6, overflow:'hidden', minWidth:240 }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr style={{ background:'#f5f3ff' }}>
              {cols.map(c => <th key={c} style={{ padding:'3px 6px', color:'#7c3aed', fontWeight:700, whiteSpace:'nowrap', fontSize:9 }}>{labelCol[c]||c}</th>)}
            </tr></thead>
            <tbody>{filas.slice(0,3).map((f,i) => (
              <tr key={i} style={{ borderTop:'1px solid #f3f4f6' }}>
                {cols.map(c => (
                  <td key={c} style={{ padding:'3px 6px', whiteSpace:'nowrap', fontSize:9 }}>
                    {c === 'total'
                      ? <span style={{ fontWeight:700, color:'#7c3aed' }}>${parseFloat(f[c]||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
                      : f[c]||'—'
                    }
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
          {filas.length > 3 && <div style={{ padding:'2px 6px', fontSize:9, color:'#9ca3af', textAlign:'center' }}>+{filas.length-3} filas más</div>}
        </div>
      );
    }

    case 'checkbox':
    case 'multiple':
      if (Array.isArray(valor)) {
        return (
          <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
            {valor.map((v,i) => <span key={i} style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'#ede9fe', color:'#7c3aed', fontWeight:500 }}>{v}</span>)}
          </div>
        );
      }
      return <span style={{ fontSize:12 }}>{String(valor)}</span>;

    case 'porcentaje': {
      const pct = Math.min(100, Math.max(0, parseFloat(valor)||0));
      return (
        <div style={{ minWidth:100 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed' }}>{pct}%</span>
          <div style={{ height:6, borderRadius:99, background:'#e5e7eb', overflow:'hidden', marginTop:3 }}>
            <div style={{ width:`${pct}%`, height:'100%', borderRadius:99, background:'linear-gradient(90deg,#7c3aed,#6d28d9)' }} />
          </div>
        </div>
      );
    }

    case 'moneda':
      return <span style={{ fontSize:12, fontWeight:700, color:'#059669' }}>$ {parseFloat(valor||0).toLocaleString('es-MX', { minimumFractionDigits:2 })}</span>;

    case 'email':
      return (
        <button onClick={() => copiar(valor, 'Correo')}
          title="Clic para copiar"
          style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5 }}>
          <svg viewBox="0 0 24 24" style={{width:12,height:12,flexShrink:0}} fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <span style={{ fontSize:12, color:'#7c3aed', textDecoration:'none' }}>{valor}</span>
        </button>
      );

    case 'url':
      return (
        <button onClick={() => copiar(valor, 'URL')}
          title="Clic para copiar"
          style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5, maxWidth:160 }}>
          <svg viewBox="0 0 24 24" style={{width:12,height:12,flexShrink:0}} fill="none" stroke="#2563eb" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <span style={{ fontSize:12, color:'#2563eb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{valor}</span>
        </button>
      );

    case 'fecha':
      return <span style={{ fontSize:12 }}>{new Date(valor).toLocaleDateString('es-MX')}</span>;

    case 'hora':
      return <span style={{ fontSize:12 }}>{valor}</span>;

    case 'fecha_hora':
      return <span style={{ fontSize:12 }}>{new Date(valor).toLocaleString('es-MX')}</span>;

    case 'calculado':
    case 'formula': {
      const resultado = valor && typeof valor === 'object'
        ? valor.resultado
        : valor;

      return (
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#7c3aed',
            display: 'block',
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          {resultado !== undefined && resultado !== null && resultado !== ''
            ? resultado
            : '—'}
        </span>
      );
    }

    default:
      return <span style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', maxWidth:200, textAlign:'center' }}>{String(valor)}</span>;
  }
}

// ── Modal de previsualización de respuesta ─────────────────────────────────
function ModalVerRespuesta({ respuesta, formulario, onClose, dark, archivoPreview, alert }) {
  if (!respuesta) return null;

  const campos = formulario.campos || [];
  const bg     = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const text   = dark ? '#f9fafb' : '#111827';
  const textM  = dark ? '#9ca3af' : '#6b7280';

  const logoPDF = '/assets/IKARISBLACK.png';

  const limpiarTexto = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const obtenerUrlArchivo = (a) =>
    a?.url || a?.preview || a?.base64 || a?.dataUrl || a?.data_url || a?.ruta || a?.path || '';

  const obtenerNombreArchivo = (a, i = 0) =>
    a?.nombre || a?.name || `Archivo ${i + 1}`;

  const renderValorPDF = (campo, valor) => {
    if (valor === undefined || valor === null || valor === '') return '<span class="vacio">—</span>';

    if (campo.type === 'firma') {
      const firmaUrl = typeof valor === 'string'
        ? valor
        : valor?.url || valor?.dataUrl || valor?.base64 || valor?.preview || '';

      if (firmaUrl) {
        return `<img class="firma-pdf" src="${firmaUrl}" />`;
      }

      return '<span class="vacio">Sin firma</span>';
    }

    if (campo.type === 'archivo') {
      const archivos = Array.isArray(valor) ? valor : [valor];

      return archivos.map((a, i) => {
        const url = obtenerUrlArchivo(a);
        const nombre = limpiarTexto(obtenerNombreArchivo(a, i));
        const tipo = a?.tipo || a?.type || '';
        const esImg = tipo.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(nombre) || url.startsWith('data:image');

        if (esImg && url) {
          return `
            <div class="archivo-pdf">
              <img class="imagen-archivo-pdf" src="${url}" />
              <div>${nombre}</div>
            </div>
          `;
        }

        return `<div class="archivo-nombre-pdf">${nombre}</div>`;
      }).join('');
    }

    if (campo.type === 'tabla' && Array.isArray(valor)) {
      if (!valor.length) return '<span class="vacio">Vacía</span>';

      const cols = Object.keys(valor[0] || {});

      return `
        <table class="tabla-pdf">
          <thead>
            <tr>${cols.map(c => `<th>${limpiarTexto(c)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${valor.map(f => `
              <tr>
                ${cols.map(c => `<td>${limpiarTexto(f[c] ?? '—')}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (Array.isArray(valor)) {
      return valor.map(v => `<span class="tag-pdf">${limpiarTexto(v)}</span>`).join('');
    }

    if (typeof valor === 'object') {
      return limpiarTexto(valor.resultado ?? JSON.stringify(valor));
    }

    return limpiarTexto(valor);
  };

  const exportarRespuestaPDF = () => {
    const usuarioNombre = `${respuesta.usuario?.nombre || ''} ${respuesta.usuario?.apellido || ''}`.trim() || 'Usuario';
    const departamento = respuesta.usuario?.departamento?.nombre || respuesta.usuario?.departamento_nombre || 'Sin departamento';
    const puesto = respuesta.usuario?.puesto || 'Sin puesto';
    const avatar = respuesta.usuario?.avatar_url || '';
const fecha = new Date(respuesta.created_at).toLocaleString('es-MX');
const folioTexto = respuesta.folio || 'SIN FOLIO';

    const htmlCampos = campos.map((c) => `
      <section class="campo">
        <h3>${limpiarTexto(c.label || 'Campo')}</h3>
        <div class="valor">${renderValorPDF(c, respuesta.respuestas?.[c.id])}</div>
      </section>
    `).join('');

const ventana = window.open('', '_blank');

    if (!ventana) {
      alert?.warning?.('Ventana bloqueada', 'Permite ventanas emergentes para exportar el PDF.');
      return;
    }

    ventana.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${limpiarTexto(respuesta.folio || 'respuesta')}</title>
          <style>
            * {
              box-sizing: border-box;
            }

@page {
              margin: 12mm 14mm 16mm 14mm;

              @top-left   { content: none; }
              @top-center { content: none; }
              @top-right  { content: none; }

              @bottom-left   { content: none; }
              @bottom-center { content: none; }
              @bottom-right  { content: none; }
            }

            html {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

 
 
            .logo {
              display: block;
              width: 170px;
              max-height: 95px;
              object-fit: contain;
              margin: 0 auto 14px;
            }

            .encabezado {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              padding: 18px 20px;
              margin-bottom: 20px;
            }

            .titulo-box {
              flex: 1;
            }

            .titulo {
              margin: 0;
              font-size: 23px;
              font-weight: 900;
              text-transform: uppercase;
            }

            .usuario-box {
              display: flex;
              align-items: center;
              gap: 12px;
              min-width: 260px;
              justify-content: flex-end;
            }

            .avatar {
              width: 58px;
              height: 58px;
              border-radius: 14px;
              object-fit: cover;
              background: #7c3aed;
            }

            .avatar-fallback {
              width: 58px;
              height: 58px;
              border-radius: 14px;
              background: #7c3aed;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              font-weight: 900;
            }

            .usuario-nombre {
              margin: 0 0 4px;
              font-weight: 900;
              font-size: 14px;
              text-transform: uppercase;
            }

            .usuario-meta {
              margin: 0 0 3px;
              font-size: 11px;
              color: #4b5563;
            }

            .campo {
              border-bottom: 1px solid #e5e7eb;
              padding: 15px 0;
              text-align: center;
              break-inside: avoid;
            }

            .campo h3 {
              margin: 0 0 10px;
              font-size: 11px;
              letter-spacing: .08em;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: 900;
              text-align: center;
            }

            .valor {
              text-align: center;
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .vacio {
              color: #9ca3af;
              font-weight: 600;
            }

            .tag-pdf {
              display: inline-block;
              margin: 3px;
              padding: 4px 9px;
              border-radius: 999px;
              background: #ede9fe;
              color: #7c3aed;
              font-size: 12px;
              font-weight: 800;
            }

            .firma-pdf {
              max-width: 240px;
              max-height: 110px;
              object-fit: contain;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 6px;
              background: #fff;
            }

            .archivo-pdf {
              display: inline-flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 6px;
              margin: 6px;
              font-size: 11px;
              color: #4b5563;
              max-width: 180px;
            }

            .imagen-archivo-pdf {
              width: 120px;
              height: 90px;
              object-fit: cover;
              border-radius: 10px;
              border: 1px solid #e5e7eb;
            }

            .archivo-nombre-pdf {
              display: inline-block;
              padding: 8px 12px;
              border-radius: 10px;
              background: #f3f4f6;
              color: #374151;
              font-size: 12px;
              font-weight: 700;
              margin: 4px;
            }

            .tabla-pdf {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 11px;
            }

            .tabla-pdf th {
              background: #f5f3ff;
              color: #7c3aed;
              padding: 7px;
              border: 1px solid #e5e7eb;
              text-transform: uppercase;
            }

            .tabla-pdf td {
              padding: 7px;
              border: 1px solid #e5e7eb;
              text-align: center;
            }

@media print {
              body {
                padding: 24px 34px;
              }

              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div id="pdf-content">

          <img class="logo" src="${logoPDF}" />

          <div class="encabezado">
            <div class="titulo-box">
              <h1 class="titulo">${limpiarTexto(formulario.titulo || 'Formulario')}</h1>
            </div>

            <div class="usuario-box">
              ${
                avatar
                  ? `<img class="avatar" src="${avatar}" />`
                  : `<div class="avatar-fallback">${limpiarTexto(usuarioNombre[0] || 'U')}</div>`
              }

              <div>
                <p class="usuario-nombre">${limpiarTexto(usuarioNombre)}</p>
                <p class="usuario-meta"><strong>Puesto:</strong> ${limpiarTexto(puesto)}</p>
                <p class="usuario-meta"><strong>Departamento:</strong> ${limpiarTexto(departamento)}</p>
                <p class="usuario-meta"><strong>Fecha:</strong> ${limpiarTexto(fecha)}</p>
              </div>
            </div>
          </div>

          ${htmlCampos}

          </div>

          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            window.onload = () => {
              setTimeout(async () => {
                const element = document.getElementById('pdf-content');

                const opt = {
                  margin: [12, 14, 16, 14],
                  filename: '${limpiarTexto(folioTexto)}.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true },
                  jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
                  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                const worker = html2pdf().set(opt).from(element).toPdf();

                await worker.get('pdf').then((pdf) => {
                  const total = pdf.internal.getNumberOfPages();

                  for (let i = 1; i <= total; i++) {
                    pdf.setPage(i);

                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    pdf.setFillColor(124, 58, 237);
                    pdf.roundedRect(pageWidth - 50, 6, 38, 10, 2, 2, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('courier', 'bold');
                    pdf.setFontSize(14);
                    pdf.text('${limpiarTexto(folioTexto)}', pageWidth - 31, 12.8, { align: 'center' });

                    const pageText = 'PÁG. ' + i + ' / ' + total;
                    pdf.setFillColor(124, 58, 237);
                    pdf.roundedRect(pageWidth - 50, pageHeight - 16, 38, 10, 2, 2, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('courier', 'bold');
                    pdf.setFontSize(13);
                    pdf.text(pageText, pageWidth - 31, pageHeight - 9.3, { align: 'center' });
                  }
                });

                worker.save();
                setTimeout(() => window.close(), 900);
              }, 600);
            };
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  };

  return createPortal(
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      onClick={onClose}
      style={{
        position:'fixed',
        inset:0,
        zIndex:10000,
        background:'rgba(0,0,0,0.6)',
        backdropFilter:'blur(6px)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:24,
      }}
    >
      <motion.div
        initial={{ scale:0.95, y:20 }}
        animate={{ scale:1, y:0 }}
        exit={{ scale:0.95 }}
        onClick={e => e.stopPropagation()}
        style={{
          background:bg,
          borderRadius:20,
          width:'100%',
          maxWidth:820,
          maxHeight:'85vh',
          display:'flex',
          flexDirection:'column',
          boxShadow:'0 25px 60px rgba(0,0,0,0.3)',
          overflow:'hidden',
        }}
      >
        <div
          style={{
            padding:'18px 24px',
            borderBottom:`1px solid ${border}`,
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            flexShrink:0,
          }}
        >
          <div>
            <span
              style={{
                fontFamily:'monospace',
                fontWeight:800,
                color:'#7c3aed',
                fontSize:16,
                background:dark?'rgba(124,58,237,0.15)':'#f5f3ff',
                padding:'3px 10px',
                borderRadius:8,
              }}
            >
              {respuesta.folio}
            </span>

            <p style={{ fontSize:12, color:textM, margin:'6px 0 0' }}>
              {respuesta.usuario?.nombre} {respuesta.usuario?.apellido} · {new Date(respuesta.created_at).toLocaleString('es-MX')}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button
              onClick={exportarRespuestaPDF}
              title="Exportar respuesta a PDF"
              style={{
                width:34,
                height:34,
                borderRadius:9,
                background:dark?'rgba(124,58,237,0.16)':'#f5f3ff',
                border:`1px solid ${dark?'rgba(124,58,237,0.35)':'#ddd6fe'}`,
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:'#7c3aed',
              }}
            >
              <svg viewBox="0 0 24 24" style={{width:15,height:15}} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>

            <button
              onClick={onClose}
              style={{
                width:34,
                height:34,
                borderRadius:9,
                background:dark?'rgba(255,255,255,0.06)':'#f3f4f6',
                border:'none',
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
              }}
            >
              <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div
          style={{
            flex:1,
            overflowY:'auto',
            padding:'22px 28px',
            display:'flex',
            flexDirection:'column',
            gap:14,
          }}
        >
          {campos.map(c => (
            <div
              key={c.id}
              style={{
                borderBottom:`1px solid ${dark?'rgba(255,255,255,0.04)':'#f3f4f6'}`,
                paddingBottom:14,
                textAlign:'center',
              }}
            >
              <p
                style={{
                  fontSize:11,
                  fontWeight:800,
                  color:textM,
                  textTransform:'uppercase',
                  letterSpacing:'0.06em',
                  margin:'0 0 10px',
                  textAlign:'center',
                }}
              >
                {c.label}
              </p>

              <div
                style={{
                  display:'flex',
                  justifyContent:'center',
                  alignItems:'center',
                  textAlign:'center',
                  width:'100%',
                }}
              >
                <ValorCelda
                  campo={c}
                  valor={respuesta.respuestas?.[c.id]}
                  archivoPreview={archivoPreview}
                  alert={alert}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── RespuestasPanel principal ──────────────────────────────────────────────
function RespuestasPanel({ formulario, onClose }) {
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();
  const usuario = useAuthStore((s) => s.usuario);
  const { cargarFormularios } = useFormulariosStore();

  const puedeAdmin = puedeEditar(usuario?.rol);

  const [modo,           setModo]           = useState('tabla');
  const [respuestas,     setRespuestas]      = useState([]);
  const [loadingResp,    setLoadingResp]     = useState(false);
  const [seleccionadas,  setSeleccionadas]   = useState(new Set());
  const [viendoResp,     setViendoResp]      = useState(null);
  const [editandoResp,   setEditandoResp]    = useState(null);
  const [search,         setSearch]          = useState('');
  const [orden,          setOrden]           = useState('desc'); 
  const [enviando,       setEnviando]        = useState(false);
  const [archivoPreview, setArchivoPreview]  = useState(null);

  const formularioNormalizado = { ...formulario, campos: obtenerCamposFormulario(formulario) };
  const campos = formularioNormalizado.campos;

  const bg     = dark ? '#0f0f13' : '#f7f7f5';
  const cardBg = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const text   = dark ? '#f9fafb' : '#111827';
  const textM  = dark ? '#9ca3af' : '#6b7280';

  const cargarRespuestas = async () => {
    try {
      setLoadingResp(true);
      const { data } = await api.get(`/formularios/${formulario.id}/respuestas`);
      setRespuestas(data?.data || []);
    } catch (err) {
      alert.error('Error', err.response?.data?.message || 'No se pudieron cargar las respuestas.');
    } finally {
      setLoadingResp(false);
    }
  };

  useEffect(() => { cargarRespuestas(); }, [formulario.id]);

  // Filtrar y ordenar
  const respuestasFiltradas = [...respuestas]
    .filter(r => {
      if (!search) return true;
      const s = search.toLowerCase();
      return r.folio?.toLowerCase().includes(s) ||
        `${r.usuario?.nombre} ${r.usuario?.apellido}`.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (orden === 'asc') return new Date(a.created_at) - new Date(b.created_at);
      if (orden === 'desc') return new Date(b.created_at) - new Date(a.created_at);
      if (orden === 'az') return (a.folio||'').localeCompare(b.folio||'');
      if (orden === 'za') return (b.folio||'').localeCompare(a.folio||'');
      return 0;
    });

  const toggleSel = (id) => setSeleccionadas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleTodos = () => setSeleccionadas(seleccionadas.size === respuestasFiltradas.length ? new Set() : new Set(respuestasFiltradas.map(r => r.id)));

  const handleEliminar = () => {
    const ids = [...seleccionadas];
    alert.confirm(`¿Eliminar ${ids.length} respuesta(s)?`, 'Esta acción no se puede deshacer.', async () => {
      try {
        await api.delete(`/formularios/${formulario.id}/respuestas/bulk`, { data: { ids } });
        await cargarRespuestas();
        setSeleccionadas(new Set());
        alert.success('Eliminadas', `${ids.length} respuesta(s) eliminadas.`);
      } catch (err) {
        alert.error('Error', err.response?.data?.message || 'No se pudo eliminar.');
      }
    }, { confirmText:'Eliminar', tipo:'error' });
  };

  const handleEliminarUna = (resp) => {
    alert.confirm(`¿Eliminar ${resp.folio}?`, '', async () => {
      try {
        await api.delete(`/formularios/${formulario.id}/respuestas/bulk`, { data: { ids: [resp.id] } });
        await cargarRespuestas();
        alert.success('Eliminada', resp.folio);
      } catch (err) {
        alert.error('Error', err.response?.data?.message || 'No se pudo eliminar.');
      }
    }, { confirmText:'Eliminar', tipo:'error' });
  };

  const exportarCSV = () => {
    const ids  = seleccionadas.size > 0 ? [...seleccionadas] : respuestasFiltradas.map(r => r.id);
    const data = respuestasFiltradas.filter(r => ids.includes(r.id));
    if (!data.length) return;
    const rows = data.map(r => {
      const row = { Folio: r.folio, Usuario: `${r.usuario?.nombre||''} ${r.usuario?.apellido||''}`, Fecha: new Date(r.created_at).toLocaleString('es-MX') };
      campos.forEach(c => { row[c.label] = JSON.stringify(r.respuestas?.[c.id] ?? ''); });
      return row;
    });
    const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
    a.download = `${formulario.titulo}_respuestas.csv`;
    a.click();
  };

  const handleResponder = async (valores) => {
    if (enviando) return;
    try {
      setEnviando(true);
      const { data } = await api.post(`/formularios/${formulario.id}/respuestas`, { respuestas: valores, archivos: [] });
      if (!data?.success) throw new Error(data?.message || 'Error al guardar');
      alert.success('Respuesta enviada', `Folio: ${data.data?.folio}`);
      await cargarRespuestas();
      await cargarFormularios();
      setModo('tabla');
    } catch (err) {
      alert.error('Error', err.response?.data?.message || err.message || 'No se pudo guardar.');
    } finally {
      setEnviando(false);
    }
  };

  const handleActualizar = async (valores) => {
    try {
      await api.put(`/formularios/${formulario.id}/respuestas/${editandoResp.id}`, {
        respuestas: valores,
      });

      alert.success('Actualizada', 'La respuesta fue actualizada.');
      await cargarRespuestas();
      setEditandoResp(null);
      setModo('tabla');
    } catch (err) {
      alert.error('Error', err.response?.data?.message || err.message || 'No se pudo actualizar.');
    }
  };

  const btnS = (bg2, color) => ({
    display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:9, border:`1px solid ${border}`,
    background: bg2 || cardBg, color: color || (dark?'#d1d5db':'#374151'), fontSize:12, fontWeight:500, cursor:'pointer',
  });

  if (modo === 'responder' || modo === 'editar') {
    return createPortal(
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:9999, background:bg, display:'flex', flexDirection:'column' }}>
        <div style={{ height:64, borderBottom:`1px solid ${border}`, padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:cardBg }}>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:text }}>
              {modo === 'editar' ? `Editar respuesta — ${editandoResp?.folio}` : 'Nueva respuesta'}
            </h2>
            <p style={{ margin:'2px 0 0', fontSize:12, color:textM }}>{formulario.titulo}</p>
          </div>
          <button onClick={() => { setModo('tabla'); setEditandoResp(null); }}
            style={{ ...btnS(), gap:6 }}>
            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
            Volver
          </button>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          <FormularioResponder
            formulario={formularioNormalizado}
            respuestaInicial={modo === 'editar' ? editandoResp : undefined}
            onSubmit={modo === 'editar' ? handleActualizar : handleResponder}
            onCancel={() => { setModo('tabla'); setEditandoResp(null); }}
          />
        </div>
      </motion.div>,
      document.body
    );
  }

// Renderizar el preview FUERA del portal usando un Fragment a nivel de componente
  const previewPortal = archivoPreview ? createPortal(
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      onClick={() => setArchivoPreview(null)}
      style={{
        position:'fixed',
        inset:0,
        zIndex:99999,
        background:'rgba(0,0,0,0.92)',
        backdropFilter:'blur(12px)',
        display:'flex',
        flexDirection:'column',
      }}
    >
      <div
        style={{
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          padding:'16px 24px',
          flexShrink:0,
        }}
        onClick={e=>e.stopPropagation()}
      >
        <p style={{ color:'white',fontWeight:600,fontSize:14,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60%' }}>
          {archivoPreview.nombre || archivoPreview.name || 'Archivo'}
        </p>

        <div style={{ display:'flex',gap:8 }}>
{archivoPreview.url && (
  <a
    href={archivoPreview.url}
    download
    target="_blank"
    rel="noreferrer"
              onClick={e=>e.stopPropagation()}
              style={{
                display:'flex',
                alignItems:'center',
                gap:7,
                padding:'8px 16px',
                background:'#7c3aed',
                color:'white',
                borderRadius:12,
                fontSize:13,
                fontWeight:600,
                textDecoration:'none',
              }}
            >
              Descargar
            </a>
          )}

          <button
            onClick={() => setArchivoPreview(null)}
            style={{
              width:36,
              height:36,
              borderRadius:10,
              background:'rgba(255,255,255,0.1)',
              border:'none',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
            }}
          >
            <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="white" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div
        style={{
          flex:1,
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:24,
        }}
        onClick={e=>e.stopPropagation()}
      >
        {(() => {
          const url = archivoPreview.url || archivoPreview.preview || archivoPreview.base64 || archivoPreview.dataUrl || archivoPreview.data_url || (typeof archivoPreview === 'string' ? archivoPreview : '');
          const nombre = archivoPreview.nombre || archivoPreview.name || '';
          const tipo = archivoPreview.tipo || archivoPreview.type || '';

          const esImg = tipo.startsWith('image/') || url.startsWith('data:image') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(nombre);
          const esPDF = tipo.includes('pdf') || /\.pdf$/i.test(nombre);

          if (esImg) {
            return (
              <img
                src={url}
                alt={nombre}
                style={{
                  maxWidth:'100%',
                  maxHeight:'100%',
                  objectFit:'contain',
                  borderRadius:12,
                  background:'white',
                }}
              />
            );
          }

          if (esPDF && url) {
            return (
              <iframe
                src={url}
                style={{
                  width:'100%',
                  height:'100%',
                  border:'none',
                  borderRadius:12,
                  background:'white',
                }}
                title={nombre}
              />
            );
          }

          return (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:80,height:80,borderRadius:20,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                <svg viewBox="0 0 24 24" style={{width:36,height:36}} fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <p style={{ color:'rgba(255,255,255,0.7)',marginBottom:16,fontSize:14 }}>
                Vista previa no disponible
              </p>
{url && (
  <a
    href={url}
    download
    target="_blank"
    rel="noreferrer"
                  style={{
                    padding:'10px 24px',
                    background:'#7c3aed',
                    color:'white',
                    borderRadius:12,
                    textDecoration:'none',
                    fontSize:13,
                    fontWeight:600,
                  }}
                >
                  Descargar
                </a>
              )}
            </div>
          );
        })()}
      </div>
    </motion.div>,
    document.body
  ) : null;

  return (
    <>
      {createPortal(
        <>
          {/* Overlay semitransparente — no cubre sidebar */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{ position:'fixed', top:0, left:240, right:0, bottom:0, zIndex:9900, background:'rgba(0,0,0,0.25)' }} />

          {/* Panel principal: respeta sidebar, cubre navbar */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
            style={{ position:'fixed', top:0, left:240, right:0, bottom:0, zIndex:9901, background:bg, display:'flex', flexDirection:'column', borderLeft:`1px solid ${border}` }}>

            {/* Header */}
            <div style={{ padding:'16px 24px', background:cardBg, borderBottom:`1px solid ${border}`, flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:text }}>{formulario.titulo}</h2>
                  <p style={{ margin:'3px 0 0', fontSize:13, color:textM }}>{respuestas.length} respuesta{respuestas.length!==1?'s':''}</p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={() => setModo('responder')}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.25)' }}>
                    <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke="white" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    Responder
                  </motion.button>
                  <button onClick={onClose}
                    style={{ width:36, height:36, borderRadius:10, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg viewBox="0 0 24 24" style={{width:15,height:15}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Barra de acciones */}
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ position:'relative', flex:1, maxWidth:300, minWidth:160 }}>
                  <svg viewBox="0 0 24 24" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'#9ca3af' }} fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por folio o usuario..."
                    style={{ width:'100%', paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8, fontSize:12, borderRadius:9, background:dark?'rgba(255,255,255,0.06)':'white', border:`1px solid ${border}`, color:dark?'#f3f4f6':'#111827', outline:'none', boxSizing:'border-box' }} />
                </div>

                <select value={orden} onChange={e => setOrden(e.target.value)}
                  style={{ padding:'8px 10px', borderRadius:9, border:`1px solid ${border}`, background:dark?'rgba(255,255,255,0.06)':'white', color:dark?'#d1d5db':'#374151', fontSize:12, cursor:'pointer', outline:'none' }}>
                  <option value="desc">Más reciente</option>
                  <option value="asc">Más antiguo</option>
                  <option value="az">Folio A→Z</option>
                  <option value="za">Folio Z→A</option>
                </select>

                {puedeAdmin && respuestasFiltradas.length > 0 && (
                  <button onClick={toggleTodos}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:9, border:`1px solid ${border}`, background: seleccionadas.size === respuestasFiltradas.length ? (dark?'rgba(124,58,237,0.2)':'#ede9fe') : (dark?'rgba(255,255,255,0.06)':'white'), color: seleccionadas.size === respuestasFiltradas.length ? '#7c3aed' : (dark?'#d1d5db':'#374151'), fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ width:15, height:15, borderRadius:4, border:`2px solid ${seleccionadas.size === respuestasFiltradas.length ? '#7c3aed' : '#d1d5db'}`, background: seleccionadas.size === respuestasFiltradas.length ? '#7c3aed' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                      {seleccionadas.size === respuestasFiltradas.length && <svg viewBox="0 0 24 24" style={{width:9,height:9}} fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                    </div>
                    {seleccionadas.size === respuestasFiltradas.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                )}

                <div style={{ display:'flex', gap:6, marginLeft:'auto', alignItems:'center' }}>
                  {seleccionadas.size > 0 && (
                    <span style={{ fontSize:12, color:textM, whiteSpace:'nowrap' }}>{seleccionadas.size} seleccionada{seleccionadas.size!==1?'s':''}</span>
                  )}
                  {seleccionadas.size > 0 && puedeAdmin && (
                    <button onClick={handleEliminar}
                      style={{ ...btnS(dark?'rgba(239,68,68,0.15)':'#fee2e2', '#ef4444'), border:'none' }}>
                      <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/></svg>
                      Eliminar ({seleccionadas.size})
                    </button>
                  )}
                  <button onClick={exportarCSV} style={btnS()}>
                    <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Exportar CSV {seleccionadas.size > 0 ? `(${seleccionadas.size})` : ''}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div style={{ flex:1, overflow:'auto', padding:'16px 24px' }}>
              {loadingResp ? (
                <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
                  <svg style={{ width:28, height:28, animation:'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="4"/>
                    <path style={{opacity:.75}} fill="#7c3aed" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </div>
              ) : respuestasFiltradas.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300 }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:dark?'rgba(255,255,255,0.04)':'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    <svg viewBox="0 0 24 24" style={{width:26,height:26}} fill="none" stroke={dark?'#374151':'#d1d5db'} strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <p style={{ fontSize:14, fontWeight:600, color:textM }}>Sin respuestas</p>
                  <button onClick={() => setModo('responder')}
                    style={{ marginTop:12, padding:'10px 20px', borderRadius:10, border:'none', background:'#7c3aed', color:'white', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    Responder ahora
                  </button>
                </div>
              ) : (
                <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ overflowX:'auto', overflowY:'visible' }} className="custom-scroll">
                    <style>{`
                      .custom-scroll::-webkit-scrollbar { height: 6px; }
                      .custom-scroll::-webkit-scrollbar-track { background: ${dark?'rgba(255,255,255,0.04)':'#f9fafb'}; border-radius: 99px; }
                      .custom-scroll::-webkit-scrollbar-thumb { background: ${dark?'rgba(124,58,237,0.4)':'#c4b5fd'}; border-radius: 99px; }
                      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
                    `}</style>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth: Math.max(900, 300 + campos.length * 180) }}>
                      <thead>
                        <tr style={{ background:dark?'rgba(124,58,237,0.1)':'#f9fafb', borderBottom:`1px solid ${border}` }}>
                          <th style={{ padding:'12px 14px', textAlign:'center', fontSize:10, fontWeight:700, color:textM, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', width:120, position:'sticky', left:0, background:dark?'rgba(20,20,30,1)':'#f9fafb', zIndex:2 }}>
                            Acciones
                          </th>
                          <th style={{ padding:'12px 14px', textAlign:'center', fontSize:10, fontWeight:700, color:textM, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>Folio</th>
                          {campos.map(c => (
                            <th key={c.id} style={{ padding:'12px 14px', textAlign:'center', fontSize:10, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', minWidth:160 }}>
                              {c.label || 'Campo'}
                            </th>
                          ))}
<th style={{ padding:'10px 12px', textAlign:'center', fontSize:10, fontWeight:700, color:textM, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', minWidth:220 }}>Respondió</th>
                        </tr>
                      </thead>
                      <tbody>
                        {respuestasFiltradas.map((resp) => (
                          <tr key={resp.id}
                            style={{ borderBottom:`1px solid ${dark?'rgba(255,255,255,0.04)':'#f9fafb'}` }}
                            onMouseEnter={e => e.currentTarget.style.background = dark?'rgba(255,255,255,0.02)':'#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                            <td style={{ padding:'8px 10px', position:'sticky', left:0, background:dark?'#0f0f13':'#f7f7f5', zIndex:1 }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button onClick={() => setViendoResp(resp)} title="Previsualizar"
                                    style={{ width:28, height:28, borderRadius:7, border:`1px solid ${border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:dark?'#d1d5db':'#374151' }}>
                                    <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  </button>
                                  {puedeAdmin && (
                                    <>
                                      <button onClick={() => { setEditandoResp(resp); setModo('editar'); }} title="Editar"
                                        style={{ width:28, height:28, borderRadius:7, border:`1px solid ${border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:dark?'#d1d5db':'#374151' }}>
                                        <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                      <button onClick={() => handleEliminarUna(resp)} title="Eliminar"
                                        style={{ width:28, height:28, borderRadius:7, border:'none', background:dark?'rgba(239,68,68,0.12)':'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/></svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                                {puedeAdmin && (
                                  <button onClick={() => toggleSel(resp.id)}
                                    style={{ width:16, height:16, borderRadius:4, border:`2px solid ${seleccionadas.has(resp.id)?'#7c3aed':'#d1d5db'}`, background:seleccionadas.has(resp.id)?'#7c3aed':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                                    {seleccionadas.has(resp.id) && <svg viewBox="0 0 24 24" style={{width:9,height:9}} fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                                  </button>
                                )}
                              </div>
                            </td>

                            <td style={{ padding:'12px 14px', whiteSpace:'nowrap', textAlign:'center', verticalAlign:'middle' }}>
                              <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:13, color:'#7c3aed', background:dark?'rgba(124,58,237,0.15)':'#f5f3ff', padding:'2px 8px', borderRadius:6 }}>{resp.folio}</span>
                            </td>

                            {campos.map(c => (
                              <td key={c.id} style={{ padding:'10px 14px', verticalAlign:'middle', textAlign:'center' }}>
                                <ValorCelda campo={c} valor={resp.respuestas?.[c.id]} archivoPreview={setArchivoPreview} alert={alert} />
                              </td>
                            ))}

<td style={{ padding:'8px 10px', verticalAlign:'middle', minWidth:220 }}>
  <div
    style={{
      display:'flex',
      alignItems:'center',
      gap:9,
      padding:'9px 11px',
      borderRadius:13,
      border:`1px solid ${dark?'rgba(255,255,255,0.16)':'#d1d5db'}`,
      background:dark?'rgba(255,255,255,0.035)':'#ffffff',
      maxWidth:230,
      margin:'0 auto',
    }}
  >
    <div
      style={{
        width:42,
        height:42,
        borderRadius:11,
        background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        flexShrink:0,
        overflow:'hidden',
      }}
    >
      {resp.usuario?.avatar_url ? (
        <img
          src={resp.usuario.avatar_url}
          alt=""
          style={{
            width:'100%',
            height:'100%',
            objectFit:'cover',
          }}
        />
      ) : (
        <span style={{ color:'white', fontWeight:900, fontSize:15 }}>
          {resp.usuario?.nombre?.[0]?.toUpperCase() || 'U'}
        </span>
      )}
    </div>

    <div style={{ minWidth:0, textAlign:'left' }}>
      <p
        style={{
          fontSize:12,
          fontWeight:900,
          color:text,
          margin:'0 0 3px',
          textTransform:'uppercase',
          lineHeight:1.05,
          whiteSpace:'nowrap',
          overflow:'hidden',
          textOverflow:'ellipsis',
          maxWidth:155,
        }}
      >
        {`${resp.usuario?.nombre || ''} ${resp.usuario?.apellido || ''}`.trim() || 'Usuario'}
      </p>

      <p style={{ fontSize:10, color:textM, margin:'0 0 2px', fontWeight:600, lineHeight:'13px' }}>
        Depto:{' '}
        <span style={{ color:text, fontWeight:700 }}>
          {resp.usuario?.departamento?.nombre || resp.usuario?.departamento_nombre || 'Sin departamento'}
        </span>
      </p>

      <p style={{ fontSize:10, color:textM, margin:'0 0 4px', fontWeight:600, lineHeight:'13px' }}>
        Puesto:{' '}
        <span style={{ color:text, fontWeight:700 }}>
          {resp.usuario?.puesto || 'Sin puesto'}
        </span>
      </p>

      <p style={{ fontSize:10, color:text, margin:0, fontWeight:800, lineHeight:'13px' }}>
        {new Date(resp.created_at).toLocaleDateString('es-MX',{
          day:'2-digit',
          month:'2-digit',
          year:'2-digit',
        })}{' '}
        ·{' '}
        {new Date(resp.created_at).toLocaleTimeString('es-MX',{
          hour:'2-digit',
          minute:'2-digit',
        })}
      </p>
    </div>
  </div>
</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal ver respuesta */}
            <AnimatePresence>
              {viendoResp && (
                <ModalVerRespuesta
                  respuesta={viendoResp}
                  formulario={formularioNormalizado}
                  onClose={() => setViendoResp(null)}
                  dark={dark}
                  archivoPreview={setArchivoPreview}
                  alert={alert}
                />
              )}
            </AnimatePresence>

          </motion.div>
        </>,
        document.body
      )}

      {/* Preview FUERA del portal del panel — directo en document.body */}
      {previewPortal}
    </>
  );
}
// ── Página principal ───────────────────────────────────────────────────────
export default function Formularios() {

  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();
  const { formularios, loading, cargarFormularios, eliminarFormulario } = useFormulariosStore();
  const usuario = useAuthStore((s) => s.usuario);

  const [editorOpen,    setEditorOpen]    = useState(false);
  const [formularioEd,  setFormularioEd]  = useState(null);
  const [respuestasForm,setRespuestasForm]= useState(null);
  const [search,        setSearch]        = useState('');

  const puedo = puedeEditar(usuario?.rol);

  useEffect(() => { cargarFormularios(); }, []);

const handleEliminar = (f) => {
    alert.confirm(`¿Eliminar "${f.titulo}"?`, 'Esta acción no se puede deshacer.', async () => {
      const r = await eliminarFormulario(f.id);
      if (r.success) {
        alert.success('Eliminado', f.titulo);
        cargarFormularios();
      } else {
        alert.error('Error', r.message);
      }
    }, { confirmText:'Eliminar', tipo:'error' });
  };

  const formulariosNormalizados = formularios.map((f) => ({
    ...f,
    campos: obtenerCamposFormulario(f),
  }));

  const formulariosFiltrados = formulariosNormalizados.filter((f) =>
    !search || f.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const bg     = dark ? '#0f0f13' : '#f7f7f5';
  const cardBg = dark ? '#18181f' : 'white';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const text   = dark ? '#f9fafb' : '#111827';
  const textM  = dark ? '#9ca3af' : '#6b7280';

  return (
    <div style={{ paddingBottom:40 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:text, margin:0 }}>Formularios</h1>
          <p style={{ fontSize:13, color:textM, marginTop:4 }}>{formularios.length} formulario{formularios.length!==1?'s':''}</p>
        </div>
        {puedo && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => { setFormularioEd(null); setEditorOpen(true); }}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#7c3aed', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
            <svg viewBox="0 0 24 24" style={{width:16,height:16}} fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo formulario
          </motion.button>
        )}
      </div>

      {/* Búsqueda */}
      <div style={{ position:'relative', maxWidth:360, marginBottom:20 }}>
        <svg viewBox="0 0 24 24" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#9ca3af' }} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar formularios..."
          style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, fontSize:13, borderRadius:12, background:dark?'rgba(255,255,255,0.06)':'white', border:`1px solid ${border}`, color:dark?'#f3f4f6':'#111827', outline:'none', boxSizing:'border-box' }} />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
          <svg style={{ width:28, height:28, animation:'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
            <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="4"/>
            <path style={{opacity:.75}} fill="#7c3aed" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : formulariosFiltrados.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:240, background:cardBg, borderRadius:20, border:`1px solid ${border}` }}>
          <div style={{ width:56, height:56, borderRadius:16, background:dark?'rgba(124,58,237,0.12)':'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
            <svg viewBox="0 0 24 24" style={{width:26,height:26}} fill="none" stroke="#7c3aed" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
            </svg>
          </div>
          <p style={{ fontSize:14, fontWeight:600, color:textM }}>No hay formularios</p>
          {puedo && <p style={{ fontSize:12, color:dark?'#4b5563':'#9ca3af', marginTop:4 }}>Crea el primero con el botón de arriba</p>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:14 }}>
          <AnimatePresence>
            {formulariosFiltrados.map((f) => (
              <motion.div key={f.id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                whileHover={{ y:-2 }}
                style={{ background:cardBg, borderRadius:16, border:`1px solid ${border}`, overflow:'hidden', transition:'box-shadow 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = dark?'0 8px 32px rgba(0,0,0,0.4)':'0 8px 24px rgba(0,0,0,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ height:5, background:'linear-gradient(90deg,#7c3aed,#6d28d9)' }} />
                <div style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:15, fontWeight:700, color:text, margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.titulo}</p>
                      {f.descripcion && <p style={{ fontSize:12, color:textM, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.descripcion}</p>}
                    </div>
                    <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, marginLeft:8, flexShrink:0, background:f.publicado?(dark?'rgba(34,197,94,0.15)':'#dcfce7'):(dark?'rgba(251,191,36,0.15)':'#fef3c7'), color:f.publicado?'#16a34a':'#d97706' }}>
                      {f.publicado ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>

                  <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:20, fontWeight:800, color:'#7c3aed', margin:0 }}>{f.total_respuestas||0}</p>
                      <p style={{ fontSize:10, color:textM, margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>Respuestas</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
<p style={{ fontSize:20, fontWeight:800, color:text, margin:0 }}>{f.campos.length}</p>
<p style={{ fontSize:10, color:textM, margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>Campos</p>
                    </div>
                    {f.prefijo_folio && (
                      <div style={{ textAlign:'center' }}>
                        <p style={{ fontSize:15, fontWeight:800, color:'#7c3aed', margin:0, fontFamily:'monospace' }}>{f.prefijo_folio}</p>
                        <p style={{ fontSize:10, color:textM, margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>Prefijo</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', gap:6 }}>
<button onClick={() => setRespuestasForm(f)}
  style={{ flex:2, padding:'8px', borderRadius:9, border:'none', background:'#7c3aed', color:'white', fontSize:12, fontWeight:600, cursor:'pointer' }}>
  Ver respuestas
</button>
                    {puedo && (
                      <>
                        <button onClick={() => { setFormularioEd(f); setEditorOpen(true); }}
                          style={{ flex:1, padding:'8px', borderRadius:9, border:`1px solid ${border}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                          Editar
                        </button>
                        <button onClick={() => handleEliminar(f)}
                          style={{ width:34, height:34, borderRadius:9, border:'none', background:dark?'rgba(239,68,68,0.12)':'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#ef4444" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <FormularioEditor
            open={editorOpen}
            onClose={() => { setEditorOpen(false); setFormularioEd(null); }}
            formularioEditar={formularioEd}
          />
        )}
      </AnimatePresence>

<AnimatePresence>
  {respuestasForm && (
    <RespuestasPanel
      formulario={respuestasForm}
      onClose={() => setRespuestasForm(null)}
    />
  )}
</AnimatePresence>
    </div>
  );
}
