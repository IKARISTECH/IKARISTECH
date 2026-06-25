import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useClientesStore } from '../../store/clientesStore';
import { useAuthStore }     from '../../store/authStore';
import { useThemeStore }    from '../../store/themeStore';
import { useAlert }         from '../../hooks/useAlert';
import { Icons }            from '../../components/ui/Icons';

// ── Input reutilizable con tema ────────────────────────────────────────────
function ThemedInput({ label, value, onChange, placeholder, type = 'text', textarea = false }) {
  const dark = useThemeStore((s) => s.isDark);
  const style = {
    width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 10,
    background: dark ? 'rgba(255,255,255,0.06)' : '#f9fafb',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
    color: dark ? '#f3f4f6' : '#111827',
    outline: 'none', resize: textarea ? 'vertical' : undefined,
    fontFamily: 'Inter, sans-serif',
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      {textarea
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={style} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={style} />
      }
    </div>
  );
}

// ── Modal crear/editar cliente ─────────────────────────────────────────────
function ClienteModal({ open, onClose, clienteEditar = null }) {
  const { crearCliente, actualizarCliente, cargarClientes } = useClientesStore();
  const alert   = useAlert();
  const dark    = useThemeStore((s) => s.isDark);
  const esEdicion = !!clienteEditar;

  const [form, setForm] = useState({
    nombre: '', razon_social: '', rfc: '', regimen_fiscal: '',
    codigo_postal: '', direccion_fiscal: '', correo: '', telefono: '', notas: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clienteEditar) setForm({ ...clienteEditar });
    else setForm({ nombre: '', razon_social: '', rfc: '', regimen_fiscal: '', codigo_postal: '', direccion_fiscal: '', correo: '', telefono: '', notas: '' });
  }, [clienteEditar, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return alert.warning('Campo requerido', 'El nombre es obligatorio.');
    setSaving(true);
    const r = esEdicion
      ? await actualizarCliente(clienteEditar.id, form)
      : await crearCliente(form);
    setSaving(false);
    if (r.success) {
      alert.success(esEdicion ? 'Cliente actualizado' : 'Cliente creado', form.nombre);
      cargarClientes();
      onClose();
    } else {
      alert.error('Error', r.message);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <motion.div initial={{ scale:0.95, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.95, opacity:0 }}
          transition={{ type:'spring', stiffness:300, damping:28 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: dark ? '#18181f' : 'white', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>

          {/* Header */}
          <div style={{ padding:'20px 24px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontWeight:700, fontSize:16, color: dark?'#f9fafb':'#111827', margin:0 }}>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</p>
              <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>Información del contacto</p>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background: dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 24 24" style={{width:16,height:16,color:dark?'#9ca3af':'#6b7280'}} fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <ThemedInput label="Nombre / Razón social *" value={form.nombre} onChange={set('nombre')} placeholder="Mi Cliente S.A. de C.V." />
              </div>
              <ThemedInput label="RFC" value={form.rfc} onChange={set('rfc')} placeholder="XAXX010101000" />
              <ThemedInput label="Régimen fiscal" value={form.regimen_fiscal} onChange={set('regimen_fiscal')} placeholder="601 - General" />
              <ThemedInput label="Correo" type="email" value={form.correo} onChange={set('correo')} placeholder="contacto@empresa.com" />
              <ThemedInput label="Teléfono" value={form.telefono} onChange={set('telefono')} placeholder="+52 668 000 0000" />
              <ThemedInput label="Código postal" value={form.codigo_postal} onChange={set('codigo_postal')} placeholder="81000" />
              <div style={{ gridColumn:'1/-1' }}>
                <ThemedInput label="Dirección fiscal" value={form.direccion_fiscal} onChange={set('direccion_fiscal')} placeholder="Calle, Colonia, Ciudad" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <ThemedInput label="Notas" value={form.notas} onChange={set('notas')} placeholder="Observaciones del cliente..." textarea />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'16px 24px', borderTop:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:12, border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:'transparent', color: dark?'#d1d5db':'#374151', fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Cancelar
            </button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={saving}
              style={{ flex:2, padding:'10px', borderRadius:12, border:'none', background: saving?'#8b5cf6':'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor: saving?'not-allowed':'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>
              {saving ? 'Guardando...' : esEdicion ? 'Actualizar cliente' : 'Crear cliente'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── Panel de detalle del cliente ───────────────────────────────────────────
function ClienteDetalle({ clienteId, onClose, onEditar }) {
  const { cliente, loadingCliente, cargarCliente } = useClientesStore();
  const dark = useThemeStore((s) => s.isDark);

  useEffect(() => { if (clienteId) cargarCliente(clienteId); }, [clienteId]);

  const campo = (label, valor) => (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:500, color: dark?'#e5e7eb':'#111827' }}>{valor || '—'}</p>
    </div>
  );

  return createPortal(
    <>
      <AnimatePresence>
        {clienteId && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={onClose}
              style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)' }} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              style={{ position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:480, zIndex:9999, display:'flex', flexDirection:'column', background: dark?'#18181f':'white', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>

              {loadingCliente || !cliente ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
                  <svg style={{ width:28, height:28, animation:'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="4"/>
                    <path style={{ opacity:0.75 }} fill="#7c3aed" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ padding:'20px 24px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}` }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ color:'white', fontWeight:800, fontSize:18 }}>
                            {cliente.nombre?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontWeight:700, fontSize:16, color: dark?'#f9fafb':'#111827', margin:0 }}>{cliente.nombre}</p>
                          {cliente.rfc && <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0', fontFamily:'monospace' }}>{cliente.rfc}</p>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => onEditar(cliente)}
                          style={{ padding:'6px 14px', borderRadius:10, border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:'transparent', color: dark?'#d1d5db':'#374151', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                          Editar
                        </button>
                        <button onClick={onClose}
                          style={{ width:32, height:32, borderRadius:10, background: dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Badge estado */}
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: cliente.activo ? (dark?'rgba(34,197,94,0.2)':'#dcfce7') : (dark?'rgba(239,68,68,0.2)':'#fee2e2'), color: cliente.activo ? '#16a34a' : '#dc2626' }}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
                      {campo('Correo', cliente.correo)}
                      {campo('Teléfono', cliente.telefono)}
                      {campo('RFC', cliente.rfc)}
                      {campo('Régimen fiscal', cliente.regimen_fiscal)}
                      {campo('Código postal', cliente.codigo_postal)}
                      {campo('Alta', new Date(cliente.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' }))}
                    </div>

                    {cliente.direccion_fiscal && (
                      <div style={{ marginBottom:16 }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Dirección fiscal</p>
                        <p style={{ fontSize:13, color: dark?'#e5e7eb':'#374151', lineHeight:1.5 }}>{cliente.direccion_fiscal}</p>
                      </div>
                    )}

                    {cliente.notas && (
                      <div style={{ padding:14, borderRadius:12, background: dark?'rgba(255,255,255,0.04)':'#f9fafb', border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}` }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Notas</p>
                        <p style={{ fontSize:13, color: dark?'#d1d5db':'#374151', lineHeight:1.6, margin:0 }}>{cliente.notas}</p>
                      </div>
                    )}
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

// ── Página principal ───────────────────────────────────────────────────────
export default function Clientes() {
  const { clientes, loading, total, filtros, cargarClientes, cargarEstadisticas, setFiltro, eliminarCliente } = useClientesStore();
  const usuario = useAuthStore((s) => s.usuario);
  const alert   = useAlert();

  const [modalOpen,     setModalOpen]     = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [detalleId,     setDetalleId]     = useState(null);
  const [vista,         setVista]         = useState('grid');

  const puedeGestionar = ['dueño','administrador','gerente','supervisor','contador'].includes(usuario?.rol);

  useEffect(() => { cargarClientes(); cargarEstadisticas(); }, [filtros]);

  const handleEliminar = (id, nombre) => {
    alert.confirm(`¿Desactivar a ${nombre}?`, 'El cliente quedará inactivo pero no se eliminará.', async () => {
      const r = await eliminarCliente(id);
      if (r.success) alert.success('Cliente desactivado', nombre);
      else alert.error('Error', r.message);
    }, { confirmText: 'Desactivar', tipo: 'warning' });
  };

const handleEditar = (cliente) => {
    setDetalleId(null);
    setTimeout(() => { setClienteEditar(cliente); setModalOpen(true); }, 200);
  };

  const dark = useThemeStore((s) => s.isDark);

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color: dark?'#f9fafb':'#111827', margin:0 }}>Clientes</h1>
          <p style={{ fontSize:13, color:'#9ca3af', marginTop:4 }}>{total} cliente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Toggle vista */}
          <div style={{ display:'flex', background: dark?'rgba(255,255,255,0.06)':'#f3f4f6', borderRadius:12, padding:4, gap:4 }}>
            {[
              { key:'grid',  icon: <rect x="3" y="3" width="7" height="7" rx="1"/>, icon2: <rect x="14" y="3" width="7" height="7" rx="1"/>, icon3: <rect x="3" y="14" width="7" height="7" rx="1"/>, icon4: <rect x="14" y="14" width="7" height="7" rx="1"/> },
              { key:'lista', icon: <line x1="8" y1="6" x2="21" y2="6"/>, icon2: <line x1="8" y1="12" x2="21" y2="12"/>, icon3: <line x1="8" y1="18" x2="21" y2="18"/>, icon4: <polyline points="3,6 4,7 6,5"/> },
            ].map(({ key }) => (
              <button key={key} onClick={() => setVista(key)}
                style={{ width:32, height:28, borderRadius:8, border:'none', cursor:'pointer', background: vista===key ? (dark?'#18181f':'white') : 'transparent', boxShadow: vista===key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icons.menu className="w-4 h-4" style={{ color: vista===key ? '#7c3aed' : '#9ca3af' }} />
              </button>
            ))}
          </div>

          {puedeGestionar && (
            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              onClick={() => { setClienteEditar(null); setModalOpen(true); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'#7c3aed', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
              <Icons.plus className="w-4 h-4" />
              Nuevo cliente
            </motion.button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div style={{ position:'relative', maxWidth:400, marginBottom:20 }}>
        <Icons.search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#9ca3af' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, RFC, correo..."
          value={filtros.search}
          onChange={(e) => setFiltro('search', e.target.value)}
          style={{ width:'100%', paddingLeft:38, paddingRight:16, paddingTop:9, paddingBottom:9, fontSize:13, borderRadius:12, background: dark?'rgba(255,255,255,0.06)':'white', border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, color: dark?'#f3f4f6':'#111827', outline:'none' }}
        />
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
          <svg style={{ width:28, height:28 }} className="animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : clientes.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, background: dark?'#18181f':'white', borderRadius:20, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}` }}>
          <Icons.clients style={{ width:40, height:40, color: dark?'#374151':'#e5e7eb', marginBottom:12 }} />
          <p style={{ fontSize:14, fontWeight:600, color: dark?'#6b7280':'#9ca3af' }}>No hay clientes aún</p>
          {puedeGestionar && (
            <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Crea el primero con el botón de arriba</p>
          )}
        </motion.div>
      ) : vista === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
          <AnimatePresence>
            {clientes.map((c) => (
              <motion.div key={c.id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
                whileHover={{ y:-2, boxShadow: dark?'0 8px 32px rgba(0,0,0,0.4)':'0 8px 32px rgba(0,0,0,0.08)' }}
                onClick={() => setDetalleId(c.id)}
                style={{ background: dark?'#18181f':'white', borderRadius:16, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, padding:18, cursor:'pointer', transition:'all 0.2s' }}>

                {/* Avatar + nombre */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ color:'white', fontWeight:800, fontSize:16 }}>{c.nombre?.[0]?.toUpperCase()}</span>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontWeight:700, fontSize:14, color: dark?'#f3f4f6':'#111827', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nombre}</p>
                    {c.rfc && <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0', fontFamily:'monospace' }}>{c.rfc}</p>}
                  </div>
                </div>

                {/* Info */}
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {c.correo && (
                    <p style={{ fontSize:12, color: dark?'#9ca3af':'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {c.correo}
                    </p>
                  )}
                  {c.telefono && (
                    <p style={{ fontSize:12, color: dark?'#9ca3af':'#6b7280' }}>{c.telefono}</p>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, paddingTop:12, borderTop:`1px solid ${dark?'rgba(255,255,255,0.06)':'#f9fafb'}` }}>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background: c.activo?(dark?'rgba(34,197,94,0.15)':'#dcfce7'):(dark?'rgba(239,68,68,0.15)':'#fee2e2'), color: c.activo?'#16a34a':'#dc2626' }}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {puedeGestionar && (
                    <div style={{ display:'flex', gap:4 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEditar(c)}
                        style={{ width:28, height:28, borderRadius:8, border:'none', background: dark?'rgba(255,255,255,0.06)':'#f3f4f6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleEliminar(c.id, c.nombre)}
                        style={{ width:28, height:28, borderRadius:8, border:'none', background: dark?'rgba(239,68,68,0.12)':'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#ef4444" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Vista lista */
        <div style={{ background: dark?'#18181f':'white', borderRadius:16, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}` }}>
                {['Cliente','RFC','Correo','Teléfono','Estado',''].map((h) => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {clientes.map((c) => (
                  <motion.tr key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    onClick={() => setDetalleId(c.id)}
                    style={{ borderBottom:`1px solid ${dark?'rgba(255,255,255,0.04)':'#f9fafb'}`, cursor:'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = dark?'rgba(255,255,255,0.03)':'#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ color:'white', fontWeight:800, fontSize:13 }}>{c.nombre?.[0]?.toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color: dark?'#f3f4f6':'#111827' }}>{c.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af', fontFamily:'monospace' }}>{c.rfc || '—'}</td>
                    <td style={{ padding:'12px 16px', fontSize:12, color: dark?'#9ca3af':'#6b7280' }}>{c.correo || '—'}</td>
                    <td style={{ padding:'12px 16px', fontSize:12, color: dark?'#9ca3af':'#6b7280' }}>{c.telefono || '—'}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background: c.activo?(dark?'rgba(34,197,94,0.15)':'#dcfce7'):(dark?'rgba(239,68,68,0.15)':'#fee2e2'), color: c.activo?'#16a34a':'#dc2626' }}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      {puedeGestionar && (
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => handleEditar(c)}
                            style={{ width:28, height:28, borderRadius:8, border:'none', background: dark?'rgba(255,255,255,0.06)':'#f3f4f6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button onClick={() => handleEliminar(c.id, c.nombre)}
                            style={{ width:28, height:28, borderRadius:8, border:'none', background: dark?'rgba(239,68,68,0.12)':'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke="#ef4444" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <ClienteModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setClienteEditar(null); }}
        clienteEditar={clienteEditar}
      />
      <ClienteDetalle
        clienteId={detalleId}
        onClose={() => setDetalleId(null)}
        onEditar={handleEditar}
      />
    </div>
  );
}