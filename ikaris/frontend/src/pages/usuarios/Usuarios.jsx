import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useUsuariosStore } from '../../store/usuariosStore';
import { useAuthStore }     from '../../store/authStore';
import { useThemeStore }    from '../../store/themeStore';
import { useAlert }         from '../../hooks/useAlert';
import { Icons }            from '../../components/ui/Icons';

const ROLES = [
  { value: 'administrador', label: 'Administrador', color: '#7c3aed' },
  { value: 'gerente',       label: 'Gerente',       color: '#2563eb' },
  { value: 'supervisor',    label: 'Supervisor',    color: '#0891b2' },
  { value: 'contador',      label: 'Contador',      color: '#059669' },
  { value: 'rh',            label: 'RH',            color: '#d97706' },
  { value: 'trabajador',    label: 'Trabajador',    color: '#6b7280' },
  { value: 'invitado',      label: 'Invitado',      color: '#9ca3af' },
];

const ROL_COLOR = {
  dueño:         { bg: '#f3e8ff', text: '#7c3aed' },
  administrador: { bg: '#ede9fe', text: '#6d28d9' },
  gerente:       { bg: '#dbeafe', text: '#1d4ed8' },
  supervisor:    { bg: '#cffafe', text: '#0e7490' },
  contador:      { bg: '#d1fae5', text: '#065f46' },
  rh:            { bg: '#fef3c7', text: '#92400e' },
  trabajador:    { bg: '#f3f4f6', text: '#374151' },
  invitado:      { bg: '#f9fafb', text: '#6b7280' },
  soporte:       { bg: '#fee2e2', text: '#991b1b' },
};

const MODULOS = [
  { key: 'dashboard',      label: 'Dashboard' },
  { key: 'clientes',       label: 'Clientes' },
  { key: 'facturacion',    label: 'Facturación' },
  { key: 'inventario',     label: 'Inventario' },
  { key: 'compras',        label: 'Compras' },
  { key: 'tareas',         label: 'Tareas' },
  { key: 'calendario',     label: 'Calendario' },
  { key: 'reuniones',      label: 'Reuniones' },
  { key: 'formularios',    label: 'Formularios' },
  { key: 'rh',             label: 'RH' },
  { key: 'reportes',       label: 'Reportes' },
  { key: 'usuarios',       label: 'Usuarios' },
  { key: 'auditoria',      label: 'Auditoría' },
  { key: 'configuracion',  label: 'Configuración' },
];

const PERMS = ['puede_ver','puede_crear','puede_editar','puede_eliminar','puede_exportar','puede_aprobar'];
const PERM_LABELS = { puede_ver:'Ver', puede_crear:'Crear', puede_editar:'Editar', puede_eliminar:'Eliminar', puede_exportar:'Exportar', puede_aprobar:'Aprobar' };

const inputStyle = (dark) => ({
  width:'100%', padding:'9px 12px', fontSize:13, borderRadius:10,
  background: dark?'rgba(255,255,255,0.06)':'#f9fafb',
  border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`,
  color: dark?'#f3f4f6':'#111827', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box',
});

// ── Modal Invitar ──────────────────────────────────────────────────────────
function InvitarModal({ open, onClose }) {
  const { departamentos, invitarUsuario, cargarUsuarios } = useUsuariosStore();
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();
  const [form, setForm] = useState({ nombre:'', apellido:'', correo:'', rol:'trabajador', departamento_id:'', puesto_id:'' });
  const [saving, setSaving] = useState(false);

  const puestos = departamentos.find((d) => d.id === form.departamento_id)?.puestos || [];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k==='departamento_id'?{puesto_id:''}:{}) }));
  const iStyle = inputStyle(dark);

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.correo.trim()) return alert.warning('Campos requeridos','Nombre y correo son obligatorios.');
    setSaving(true);
    const r = await invitarUsuario(form);
    setSaving(false);
    if (r.success) { alert.success('Invitación enviada',`Correo enviado a ${form.correo}`); cargarUsuarios(); onClose(); setForm({ nombre:'', apellido:'', correo:'', rol:'trabajador', departamento_id:'', puesto_id:'' }); }
    else alert.error('Error', r.message);
  };

  if (!open) return null;
  return createPortal(
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} transition={{ type:'spring', stiffness:300, damping:28 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background:dark?'#18181f':'white', borderRadius:20, width:'100%', maxWidth:500, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:700, fontSize:16, color:dark?'#f9fafb':'#111827', margin:0 }}>Invitar colaborador</p>
            <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>Le llegará un correo con su código de acceso</p>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" style={{width:14,height:14}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Nombre *</label><input value={form.nombre} onChange={set('nombre')} placeholder="Juan" style={iStyle} /></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Apellido</label><input value={form.apellido} onChange={set('apellido')} placeholder="García" style={iStyle} /></div>
          </div>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Correo *</label><input type="email" value={form.correo} onChange={set('correo')} placeholder="juan@empresa.com" style={iStyle} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Rol</label>
              <select value={form.rol} onChange={set('rol')} style={iStyle}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
            </div>
            <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Departamento</label>
              <select value={form.departamento_id} onChange={set('departamento_id')} style={iStyle}>
                <option value="">Sin departamento</option>
                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
          </div>
          {puestos.length > 0 && (
            <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Puesto</label>
              <select value={form.puesto_id} onChange={set('puesto_id')} style={iStyle}>
                <option value="">Sin puesto</option>
                {puestos.filter((p) => p.activo !== false).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
        </div>
        <div style={{ padding:'16px 24px', borderTop:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:12, border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:13, fontWeight:500, cursor:'pointer' }}>Cancelar</button>
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={handleSubmit} disabled={saving}
            style={{ flex:2, padding:'10px', borderRadius:12, border:'none', background:saving?'#8b5cf6':'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>
            {saving ? 'Enviando...' : 'Enviar invitación'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Panel detalle usuario ──────────────────────────────────────────────────
function UsuarioDetalle({ usuarioId, usuarios, onClose, puedeAdmin, onActualizar, onDesactivar, onActivar, onReenviar, usuarioActualId }) {
  const { departamentos, obtenerPermisos, guardarPermisos } = useUsuariosStore();
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();
  const u = usuarios.find((x) => x.id === usuarioId);

  const [tab,      setTab]      = useState('info'); // info | permisos
  const [editando, setEditando] = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [resetting,setResetting]= useState(false);
  const [newPass,  setNewPass]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [permisos, setPermisos] = useState({});
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms,  setSavingPerms]  = useState(false);

  useEffect(() => {
    if (u) { setForm({ nombre:u.nombre, apellido:u.apellido, rol:u.rol, departamento_id:u.departamento_id||'', puesto_id:u.puesto_id||'' }); setTab('info'); setEditando(false); }
  }, [u?.id]);

  useEffect(() => {
    if (tab === 'permisos' && usuarioId) {
      setLoadingPerms(true);
      obtenerPermisos(usuarioId).then((r) => {
        const mapa = {};
        MODULOS.forEach((m) => { mapa[m.key] = { puede_ver:false, puede_crear:false, puede_editar:false, puede_eliminar:false, puede_exportar:false, puede_aprobar:false }; });
        (r.data || []).forEach((p) => { if (mapa[p.modulo]) mapa[p.modulo] = p; });
        setPermisos(mapa);
        setLoadingPerms(false);
      });
    }
  }, [tab, usuarioId]);

  if (!u) return null;

  const esMismo  = u.id === usuarioActualId;
  const esDueno  = u.rol === 'dueño';
  const rolStyle = ROL_COLOR[u.rol] || ROL_COLOR.trabajador;
  const puestos  = departamentos.find((d) => d.id === (form.departamento_id || u.departamento_id))?.puestos || [];
  const iStyle   = inputStyle(dark);
  const labelS   = { fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' };
  const secS     = { padding:'16px 0', borderTop:`1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` };

  const handleGuardar = async () => {
    setSaving(true);
    const r = await onActualizar(u.id, form);
    setSaving(false);
    if (r.success) { alert.success('Guardado', `${u.nombre} fue actualizado.`); setEditando(false); }
    else alert.error('Error', r.message);
  };

  const handleReset = async () => {
    if (newPass.length < 8) return alert.warning('Débil','Mínimo 8 caracteres.');
    setResetting(true);
    try {
      const { default: api } = await import('../../utils/apiClient');
      await api.put(`/usuarios/${u.id}/reset-password`, { password: newPass });
      alert.success('Restablecida',`Contraseña de ${u.nombre} cambiada.`); setNewPass('');
    } catch (err) { alert.error('Error', err.response?.data?.message || 'No se pudo restablecer.'); }
    finally { setResetting(false); }
  };

  const togglePerm = (modulo, perm) => {
    setPermisos((prev) => ({ ...prev, [modulo]: { ...prev[modulo], [perm]: !prev[modulo]?.[perm] } }));
  };

  const toggleModulo = (modulo) => {
    const todos = PERMS.every((p) => permisos[modulo]?.[p]);
    setPermisos((prev) => ({ ...prev, [modulo]: Object.fromEntries(PERMS.map((p) => [p, !todos])) }));
  };

  const handleGuardarPermisos = async () => {
    setSavingPerms(true);
    const arr = Object.entries(permisos)
      .filter(([, v]) => PERMS.some((p) => v[p]))
      .map(([modulo, v]) => ({ modulo, ...v }));
    const r = await guardarPermisos(u.id, arr);
    setSavingPerms(false);
    if (r.success) alert.success('Permisos guardados','Los cambios fueron aplicados.');
    else alert.error('Error', r.message);
  };

  return createPortal(
    <>
      <AnimatePresence>
        {usuarioId && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
              style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)' }} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} transition={{ type:'spring', stiffness:300, damping:30 }}
              style={{ position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:560, zIndex:9999, display:'flex', flexDirection:'column', background:dark?'#18181f':'white', boxShadow:'-8px 0 40px rgba(0,0,0,0.2)' }}>

              {/* Header */}
              <div style={{ padding:'20px 24px', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:52, height:52, borderRadius:15, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} style={{ width:'100%', height:'100%', borderRadius:15, objectFit:'cover' }} alt="" />
                        : <span style={{ color:'white', fontWeight:800, fontSize:20 }}>{u.nombre?.[0]?.toUpperCase()}</span>
                      }
                      <div style={{ position:'absolute', bottom:1, right:1, width:12, height:12, borderRadius:'50%', background:u.online?'#22c55e':'#e5e7eb', border:'2px solid white' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight:800, fontSize:16, color:dark?'#f9fafb':'#111827', margin:0 }}>
                        {u.nombre} {u.apellido}
                        {esMismo && <span style={{ fontSize:10, color:'#9ca3af', marginLeft:6 }}>(tú)</span>}
                      </p>
                      <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 6px' }}>{u.correo}</p>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:dark?`${rolStyle.text}20`:rolStyle.bg, color:rolStyle.text, textTransform:'capitalize' }}>{u.rol}</span>
                        {u.departamentos && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', color:dark?'#9ca3af':'#6b7280' }}>{u.departamentos.nombre}</span>}
                        {u.puestos && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', color:dark?'#9ca3af':'#6b7280' }}>{u.puestos.nombre}</span>}
                        {!u.activo && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:dark?'rgba(251,191,36,0.15)':'#fef3c7', color:'#d97706' }}>Pendiente</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg viewBox="0 0 24 24" style={{width:13,height:13}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', gap:4, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', borderRadius:10, padding:3 }}>
                  {[{key:'info',label:'Información'},{key:'permisos',label:'Permisos'}].map(({key,label}) => (
                    <button key={key} onClick={() => setTab(key)}
                      style={{ flex:1, padding:'7px', borderRadius:8, border:'none', background:tab===key?(dark?'#2d2d3a':'white'):'transparent', color:tab===key?(dark?'#f3f4f6':'#111827'):'#9ca3af', fontSize:12, fontWeight:tab===key?600:400, cursor:'pointer', boxShadow:tab===key?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body scrolleable */}
              <div style={{ flex:1, overflowY:'auto', padding:'0 24px 24px' }}>

                {/* ── TAB INFO ── */}
                {tab === 'info' && (
                  <>
                    {/* Datos generales */}
                    <div style={secS}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <p style={{ fontWeight:700, fontSize:13, color:dark?'#f3f4f6':'#374151', margin:0 }}>Información general</p>
                        {puedeAdmin && !esDueno && (
                          <button onClick={() => setEditando((v) => !v)}
                            style={{ fontSize:12, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                            {editando ? 'Cancelar' : 'Editar'}
                          </button>
                        )}
                      </div>

                      {editando ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div><label style={labelS}>Nombre</label><input value={form.nombre} onChange={(e) => setForm((f) => ({...f,nombre:e.target.value}))} style={iStyle} /></div>
                            <div><label style={labelS}>Apellido</label><input value={form.apellido} onChange={(e) => setForm((f) => ({...f,apellido:e.target.value}))} style={iStyle} /></div>
                          </div>
                          <div><label style={labelS}>Rol</label>
                            <select value={form.rol} onChange={(e) => setForm((f) => ({...f,rol:e.target.value}))} style={iStyle}>
                              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                            <div><label style={labelS}>Departamento</label>
                              <select value={form.departamento_id} onChange={(e) => setForm((f) => ({...f,departamento_id:e.target.value,puesto_id:''}))} style={iStyle}>
                                <option value="">Sin departamento</option>
                                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                              </select>
                            </div>
                            <div><label style={labelS}>Puesto</label>
                              <select value={form.puesto_id} onChange={(e) => setForm((f) => ({...f,puesto_id:e.target.value}))} style={iStyle}>
                                <option value="">Sin puesto</option>
                                {puestos.filter((p) => p.activo !== false).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                              </select>
                            </div>
                          </div>
                          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}} onClick={handleGuardar} disabled={saving}
                            style={{ padding:'10px', borderRadius:12, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                          </motion.button>
                        </div>
                      ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          {[
                            {l:'Nombre',       v:`${u.nombre} ${u.apellido}`},
                            {l:'Correo',        v:u.correo},
                            {l:'Rol',           v:u.rol},
                            {l:'Departamento',  v:u.departamentos?.nombre||'—'},
                            {l:'Puesto',        v:u.puestos?.nombre||'—'},
                            {l:'Estado',        v:u.activo?'Activo':'Pendiente'},
                            {l:'Última conexión',v:u.online?'En línea':u.ultima_conexion?new Date(u.ultima_conexion).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}):'Nunca'},
                          ].map(({l,v}) => (
                            <div key={l} style={{ background:dark?'rgba(255,255,255,0.04)':'#f9fafb', borderRadius:10, padding:'10px 12px' }}>
                              <p style={{ fontSize:10, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 3px' }}>{l}</p>
                              <p style={{ fontSize:13, fontWeight:500, color:dark?'#e5e7eb':'#111827', margin:0, textTransform:'capitalize' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reset password */}
                    {puedeAdmin && !esDueno && !esMismo && u.activo && (
                      <div style={secS}>
                        <p style={{ fontWeight:700, fontSize:13, color:dark?'#f3f4f6':'#374151', margin:'0 0 8px' }}>Restablecer contraseña</p>
                        <p style={{ fontSize:12, color:'#9ca3af', marginBottom:10 }}>Establece una nueva contraseña temporal.</p>
                        <div style={{ position:'relative', marginBottom:10 }}>
                          <input type={showPass?'text':'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Nueva contraseña (mín. 8 caracteres)" style={{...iStyle,paddingRight:40}} />
                          <button type="button" onClick={() => setShowPass((v) => !v)}
                            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}>
                            {showPass ? <Icons.eyeOff className="w-4 h-4" /> : <Icons.eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button onClick={handleReset} disabled={resetting||newPass.length<8}
                          style={{ width:'100%', padding:'9px', borderRadius:12, border:'none', background:resetting||newPass.length<8?'#c4b5fd':'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:resetting||newPass.length<8?'not-allowed':'pointer' }}>
                          {resetting ? 'Restableciendo...' : 'Restablecer contraseña'}
                        </button>
                      </div>
                    )}

                    {/* Reenviar invitación */}
                    {puedeAdmin && !u.activo && (
                      <div style={secS}>
                        <p style={{ fontWeight:700, fontSize:13, color:dark?'#f3f4f6':'#374151', margin:'0 0 8px' }}>Invitación pendiente</p>
                        <p style={{ fontSize:12, color:'#9ca3af', marginBottom:10 }}>Este usuario aún no ha activado su cuenta.</p>
                        <button onClick={() => onReenviar(u.id)}
                          style={{ width:'100%', padding:'9px', borderRadius:12, border:`1px solid ${dark?'rgba(124,58,237,0.3)':'#ede9fe'}`, background:dark?'rgba(124,58,237,0.1)':'#f5f3ff', color:'#7c3aed', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                          Reenviar correo de invitación
                        </button>
                      </div>
                    )}

                    {/* Zona de peligro */}
                    {puedeAdmin && !esDueno && !esMismo && (
                      <div style={{ ...secS, marginTop:8 }}>
                        <p style={{ fontWeight:700, fontSize:13, color:'#ef4444', margin:'0 0 8px' }}>Zona de peligro</p>
                        <div style={{ display:'flex', gap:8 }}>
                          {u.activo ? (
                            <button onClick={() => { onDesactivar(u.id,`${u.nombre} ${u.apellido}`); onClose(); }}
                              style={{ flex:1, padding:'9px', borderRadius:12, border:'1px solid #fecaca', background:dark?'rgba(239,68,68,0.1)':'#fef2f2', color:'#ef4444', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                              Desactivar usuario
                            </button>
                          ) : (
                            <button onClick={() => { onActivar(u.id); onClose(); }}
                              style={{ flex:1, padding:'9px', borderRadius:12, border:'1px solid #bbf7d0', background:dark?'rgba(34,197,94,0.1)':'#f0fdf4', color:'#16a34a', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                              Reactivar usuario
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── TAB PERMISOS ── */}
                {tab === 'permisos' && (
                  <div style={{ paddingTop:16 }}>
                    {esDueno || (u.rol === 'administrador') ? (
                      <div style={{ padding:20, background:dark?'rgba(124,58,237,0.1)':'#f5f3ff', borderRadius:14, textAlign:'center' }}>
                        <p style={{ fontSize:14, fontWeight:600, color:'#7c3aed', margin:0 }}>Acceso total</p>
                        <p style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>Los {u.rol}es tienen acceso completo a todos los módulos.</p>
                      </div>
                    ) : loadingPerms ? (
                      <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                        <svg style={{ width:24, height:24 }} className="animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize:12, color:'#9ca3af', marginBottom:14 }}>Define qué puede hacer {u.nombre} en cada módulo.</p>

                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {/* Header */}
                          <div style={{ display:'grid', gridTemplateColumns:'140px repeat(6,1fr)', gap:4, paddingBottom:6, borderBottom:`1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` }}>
                            <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase' }}>Módulo</div>
                            {PERMS.map((p) => <div key={p} style={{ fontSize:9, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', textAlign:'center' }}>{PERM_LABELS[p]}</div>)}
                          </div>

                          {MODULOS.map(({ key, label }) => {
                            const modPerm = permisos[key] || {};
                            const todos   = PERMS.every((p) => modPerm[p]);
                            return (
                              <div key={key} style={{ display:'grid', gridTemplateColumns:'140px repeat(6,1fr)', gap:4, padding:'6px 0', borderBottom:`1px solid ${dark?'rgba(255,255,255,0.04)':'#f9fafb'}`, alignItems:'center' }}>
                                <button onClick={() => toggleModulo(key)}
                                  style={{ fontSize:12, fontWeight:todos?700:400, color:todos?'#7c3aed':(dark?'#d1d5db':'#374151'), background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}>
                                  {label}
                                </button>
                                {PERMS.map((perm) => (
                                  <div key={perm} style={{ display:'flex', justifyContent:'center' }}>
                                    <button onClick={() => togglePerm(key, perm)}
                                      style={{ width:20, height:20, borderRadius:6, border:`2px solid ${modPerm[perm]?'#7c3aed':(dark?'rgba(255,255,255,0.2)':'#e5e7eb')}`, background:modPerm[perm]?'#7c3aed':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                                      {modPerm[perm] && <svg viewBox="0 0 24 24" style={{width:11,height:11}} fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>

                        <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={handleGuardarPermisos} disabled={savingPerms}
                          style={{ width:'100%', marginTop:16, padding:'11px', borderRadius:12, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>
                          {savingPerms ? 'Guardando permisos...' : 'Guardar permisos'}
                        </motion.button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}

// ── Tarjeta de usuario ─────────────────────────────────────────────────────
function UsuarioCard({ u, onClick, onDesactivar, puedeAdmin, usuarioActual }) {
  const dark     = useThemeStore((s) => s.isDark);
  const rolStyle = ROL_COLOR[u.rol] || ROL_COLOR.trabajador;
  const esMismo  = u.id === usuarioActual;
  const esDueno  = u.rol === 'dueño';

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      whileHover={{ y:-2 }} onClick={() => onClick(u.id)}
      style={{ background:dark?'#18181f':'white', borderRadius:16, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, padding:18, cursor:'pointer', position:'relative', transition:'background 0.3s, border 0.3s' }}>

      <div style={{ position:'absolute', top:14, right:14, width:8, height:8, borderRadius:'50%', background:u.online?'#22c55e':u.activo?'#d1d5db':'#fbbf24', boxShadow:u.online?'0 0 6px #22c55e':undefined }} />

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {u.avatar_url ? <img src={u.avatar_url} style={{ width:'100%', height:'100%', borderRadius:13, objectFit:'cover' }} alt="" /> : <span style={{ color:'white', fontWeight:800, fontSize:17 }}>{u.nombre?.[0]?.toUpperCase()}</span>}
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{ fontWeight:700, fontSize:14, color:dark?'#f3f4f6':'#111827', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u.nombre} {u.apellido}{esMismo&&<span style={{ fontSize:10, color:'#9ca3af', marginLeft:6 }}>(tú)</span>}
          </p>
          <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.correo}</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:dark?`${rolStyle.text}20`:rolStyle.bg, color:rolStyle.text, textTransform:'capitalize' }}>{u.rol}</span>
        {u.departamentos && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', color:dark?'#9ca3af':'#6b7280' }}>{u.departamentos.nombre}</span>}
        {u.puestos && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', color:dark?'#9ca3af':'#6b7280' }}>{u.puestos.nombre}</span>}
        {!u.activo && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:dark?'rgba(251,191,36,0.15)':'#fef3c7', color:'#d97706' }}>Pendiente</span>}
      </div>

      <p style={{ fontSize:11, color:'#9ca3af', marginBottom:puedeAdmin&&!esDueno&&!esMismo?10:0 }}>
        {u.online?'En línea ahora':u.ultima_conexion?`Última vez: ${new Date(u.ultima_conexion).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})}`:'Sin conexiones'}
      </p>

      {puedeAdmin && !esDueno && !esMismo && (
        <div style={{ display:'flex', gap:6, paddingTop:10, borderTop:`1px solid ${dark?'rgba(255,255,255,0.05)':'#f9fafb'}` }} onClick={(e) => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); onClick(u.id); }}
            style={{ flex:1, padding:'6px', borderRadius:9, border:`1px solid ${dark?'rgba(255,255,255,0.1)':'#e5e7eb'}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:11, fontWeight:500, cursor:'pointer' }}>
            Ver detalle
          </button>
          {u.activo ? (
            <button onClick={(e) => { e.stopPropagation(); onDesactivar(u.id,`${u.nombre} ${u.apellido}`); }}
              style={{ flex:1, padding:'6px', borderRadius:9, border:'none', background:dark?'rgba(239,68,68,0.12)':'#fee2e2', color:'#ef4444', fontSize:11, fontWeight:500, cursor:'pointer' }}>
              Desactivar
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onClick(u.id); }}
              style={{ flex:1, padding:'6px', borderRadius:9, border:'none', background:dark?'rgba(124,58,237,0.15)':'#ede9fe', color:'#7c3aed', fontSize:11, fontWeight:500, cursor:'pointer' }}>
              Ver invitación
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Panel de departamentos y puestos ───────────────────────────────────────
function DepartamentosPanel() {
  const { departamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento, crearPuesto, eliminarPuesto, cargarDepartamentos } = useUsuariosStore();
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();

  const [formDepto,  setFormDepto]  = useState({ nombre:'', descripcion:'', color:'#7c3aed' });
  const [editDepto,  setEditDepto]  = useState(null);
  const [formPuesto, setFormPuesto] = useState({ departamento_id:'', nombre:'', descripcion:'' });
  const [saving,     setSaving]     = useState(false);
  const [abierto,    setAbierto]    = useState(false);
  const [puestoOpen, setPuestoOpen] = useState(false);

  const COLORES = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#db2777','#6b7280','#ea580c','#4f46e5'];
  const iStyle = inputStyle(dark);

  const handleCrearDepto = async () => {
    if (!formDepto.nombre.trim()) return alert.warning('Requerido','El nombre es obligatorio.');
    setSaving(true);
    const r = editDepto
      ? await actualizarDepartamento(editDepto.id, formDepto)
      : await crearDepartamento(formDepto);
    setSaving(false);
    if (r.success) {
      alert.success(editDepto?'Actualizado':'Creado', formDepto.nombre);
      setFormDepto({ nombre:'', descripcion:'', color:'#7c3aed' });
      setEditDepto(null); setAbierto(false);
      cargarDepartamentos();
    } else alert.error('Error', r.message);
  };

  const handleEliminarDepto = (d) => {
    alert.confirm(`¿Eliminar departamento "${d.nombre}"?`, 'Los usuarios de este departamento quedarán sin departamento.', async () => {
      const r = await eliminarDepartamento(d.id);
      if (r.success) { alert.success('Eliminado', d.nombre); cargarDepartamentos(); }
      else alert.error('Error', r.message);
    }, { confirmText:'Eliminar', tipo:'error' });
  };

  const handleCrearPuesto = async () => {
    if (!formPuesto.nombre.trim() || !formPuesto.departamento_id) return alert.warning('Requerido','Nombre y departamento son obligatorios.');
    setSaving(true);
    const r = await crearPuesto(formPuesto);
    setSaving(false);
    if (r.success) { alert.success('Puesto creado', formPuesto.nombre); setFormPuesto({ departamento_id:'', nombre:'', descripcion:'' }); setPuestoOpen(false); }
    else alert.error('Error', r.message);
  };

  return (
    <div style={{ marginTop:40, paddingTop:32, borderTop:`2px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:800, color:dark?'#f9fafb':'#111827', margin:0 }}>Departamentos y puestos</h2>
          <p style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>Organiza la estructura de tu empresa</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setPuestoOpen((v) => !v)}
            style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:12, fontWeight:500, cursor:'pointer' }}>
            + Puesto
          </button>
          <button onClick={() => { setEditDepto(null); setFormDepto({ nombre:'', descripcion:'', color:'#7c3aed' }); setAbierto((v) => !v); }}
            style={{ padding:'8px 14px', borderRadius:10, border:'none', background:'#7c3aed', color:'white', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            + Departamento
          </button>
        </div>
      </div>

      {/* Form nuevo departamento */}
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', marginBottom:16 }}>
            <div style={{ background:dark?'#18181f':'white', borderRadius:14, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, padding:20 }}>
              <p style={{ fontWeight:700, fontSize:13, color:dark?'#f3f4f6':'#374151', margin:'0 0 14px' }}>{editDepto ? 'Editar departamento' : 'Nuevo departamento'}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Nombre *</label><input value={formDepto.nombre} onChange={(e) => setFormDepto((f) => ({...f,nombre:e.target.value}))} placeholder="Ej. Ventas" style={iStyle} /></div>
                <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Descripción</label><input value={formDepto.descripcion} onChange={(e) => setFormDepto((f) => ({...f,descripcion:e.target.value}))} placeholder="Descripción breve..." style={iStyle} /></div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Color</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {COLORES.map((c) => (
                    <button key={c} onClick={() => setFormDepto((f) => ({...f,color:c}))}
                      style={{ width:28, height:28, borderRadius:'50%', background:c, border:formDepto.color===c?'3px solid white':'3px solid transparent', outline:formDepto.color===c?`2px solid ${c}`:'none', cursor:'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setAbierto(false); setEditDepto(null); }} style={{ flex:1, padding:'9px', borderRadius:10, border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:13, cursor:'pointer' }}>Cancelar</button>
                <button onClick={handleCrearDepto} disabled={saving} style={{ flex:2, padding:'9px', borderRadius:10, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  {saving ? 'Guardando...' : editDepto ? 'Actualizar' : 'Crear departamento'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form nuevo puesto */}
      <AnimatePresence>
        {puestoOpen && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', marginBottom:16 }}>
            <div style={{ background:dark?'#18181f':'white', borderRadius:14, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, padding:20 }}>
              <p style={{ fontWeight:700, fontSize:13, color:dark?'#f3f4f6':'#374151', margin:'0 0 14px' }}>Nuevo puesto</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
                <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Departamento *</label>
                  <select value={formPuesto.departamento_id} onChange={(e) => setFormPuesto((f) => ({...f,departamento_id:e.target.value}))} style={iStyle}>
                    <option value="">Seleccionar...</option>
                    {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Puesto *</label><input value={formPuesto.nombre} onChange={(e) => setFormPuesto((f) => ({...f,nombre:e.target.value}))} placeholder="Ej. Vendedor" style={iStyle} /></div>
                <div><label style={{ fontSize:11, fontWeight:600, color:'#9ca3af', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Descripción</label><input value={formPuesto.descripcion} onChange={(e) => setFormPuesto((f) => ({...f,descripcion:e.target.value}))} placeholder="Opcional..." style={iStyle} /></div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setPuestoOpen(false)} style={{ flex:1, padding:'9px', borderRadius:10, border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, background:'transparent', color:dark?'#d1d5db':'#374151', fontSize:13, cursor:'pointer' }}>Cancelar</button>
                <button onClick={handleCrearPuesto} disabled={saving} style={{ flex:2, padding:'9px', borderRadius:10, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  {saving ? 'Guardando...' : 'Crear puesto'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de departamentos */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {departamentos.map((d) => (
          <div key={d.id} style={{ background:dark?'#18181f':'white', borderRadius:14, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, overflow:'hidden' }}>
            {/* Header depto */}
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:d.puestos?.length>0?`1px solid ${dark?'rgba(255,255,255,0.06)':'#f3f4f6'}`:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:d.color||'#7c3aed', flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:dark?'#f3f4f6':'#111827', margin:0 }}>{d.nombre}</p>
                  {d.descripcion && <p style={{ fontSize:11, color:'#9ca3af', margin:'1px 0 0' }}>{d.descripcion}</p>}
                </div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => { setEditDepto(d); setFormDepto({ nombre:d.nombre, descripcion:d.descripcion||'', color:d.color||'#7c3aed' }); setAbierto(true); }}
                  style={{ width:26, height:26, borderRadius:7, border:'none', background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke={dark?'#9ca3af':'#6b7280'} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => handleEliminarDepto(d)}
                  style={{ width:26, height:26, borderRadius:7, border:'none', background:dark?'rgba(239,68,68,0.12)':'#fee2e2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg viewBox="0 0 24 24" style={{width:12,height:12}} fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/></svg>
                </button>
              </div>
            </div>
            {/* Puestos del depto */}
            {d.puestos?.filter((p) => p.activo !== false).length > 0 && (
              <div style={{ padding:'8px 16px 12px' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Puestos</p>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {d.puestos.filter((p) => p.activo !== false).map((p) => (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px', background:dark?'rgba(255,255,255,0.03)':'#f9fafb', borderRadius:8 }}>
                      <span style={{ fontSize:12, color:dark?'#d1d5db':'#374151' }}>{p.nombre}</span>
                      <button onClick={() => { alert.confirm(`¿Eliminar puesto "${p.nombre}"?`,'',async()=>{ await eliminarPuesto(p.id, d.id); },{ confirmText:'Eliminar', tipo:'error' }); }}
                        style={{ width:20, height:20, borderRadius:5, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}>
                        <svg viewBox="0 0 24 24" style={{width:11,height:11}} fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Usuarios() {
  const { usuarios, departamentos, loading, cargarUsuarios, cargarDepartamentos, actualizarUsuario, desactivarUsuario, activarUsuario, reenviarInvitacion } = useUsuariosStore();
  const usuarioActual = useAuthStore((s) => s.usuario);
  const dark  = useThemeStore((s) => s.isDark);
  const alert = useAlert();

  const [invitarOpen, setInvitarOpen] = useState(false);
  const [detalleId,   setDetalleId]   = useState(null);
  const [filtro,      setFiltro]      = useState('todos');
  const [search,      setSearch]      = useState('');

  const puedeAdmin = ['dueño','administrador'].includes(usuarioActual?.rol);

  useEffect(() => { cargarUsuarios(); cargarDepartamentos(); }, []);

  const handleDesactivar = (id, nombre) => {
    alert.confirm(`¿Desactivar a ${nombre}?`, 'El usuario perderá acceso al sistema.', async () => {
      const r = await desactivarUsuario(id);
      if (r.success) alert.success('Desactivado', nombre);
      else alert.error('Error', r.message);
    }, { confirmText:'Desactivar', tipo:'warning' });
  };

  const handleActivar = async (id) => {
    const r = await activarUsuario(id);
    if (r.success) alert.success('Reactivado', 'El usuario puede iniciar sesión nuevamente.');
    else alert.error('Error', r.message);
  };

  const handleReenviar = async (id) => {
    const r = await reenviarInvitacion(id);
    if (r.success) alert.success('Reenviada','El correo fue enviado.');
    else alert.error('Error', r.message);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchSearch = !search || `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro==='todos' || (filtro==='activos'&&u.activo) || (filtro==='pendientes'&&!u.activo);
    return matchSearch && matchFiltro;
  });

  const activos    = usuarios.filter((u) => u.activo).length;
  const online     = usuarios.filter((u) => u.online).length;
  const pendientes = usuarios.filter((u) => !u.activo).length;

  return (
    <div style={{ paddingBottom:40 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:dark?'#f9fafb':'#111827', margin:0 }}>Usuarios</h1>
          <p style={{ fontSize:13, color:'#9ca3af', marginTop:4 }}>Gestiona el equipo de tu empresa</p>
        </div>
        {puedeAdmin && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => setInvitarOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#7c3aed', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
            <Icons.plus className="w-4 h-4" />
            Invitar colaborador
          </motion.button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total',      value:usuarios.length, color:'#7c3aed' },
          { label:'Activos',    value:activos,          color:'#22c55e' },
          { label:'En línea',   value:online,            color:'#2563eb' },
          { label:'Pendientes', value:pendientes,        color:'#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:dark?'#18181f':'white', borderRadius:14, padding:'16px 18px', border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}`, transition:'background 0.3s' }}>
            <p style={{ fontSize:24, fontWeight:800, color, margin:0 }}>{value}</p>
            <p style={{ fontSize:12, color:'#9ca3af', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:320 }}>
          <Icons.search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#9ca3af' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo..."
            style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:9, paddingBottom:9, fontSize:13, borderRadius:12, background:dark?'rgba(255,255,255,0.06)':'white', border:`1px solid ${dark?'rgba(255,255,255,0.12)':'#e5e7eb'}`, color:dark?'#f3f4f6':'#111827', outline:'none', boxSizing:'border-box', transition:'background 0.3s' }} />
        </div>
        <div style={{ display:'flex', background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', borderRadius:12, padding:4, gap:3 }}>
          {[{key:'todos',label:'Todos'},{key:'activos',label:'Activos'},{key:'pendientes',label:'Pendientes'}].map(({key,label}) => (
            <button key={key} onClick={() => setFiltro(key)}
              style={{ padding:'6px 14px', borderRadius:9, border:'none', background:filtro===key?(dark?'#2d2d3a':'white'):'transparent', color:filtro===key?(dark?'#f3f4f6':'#111827'):'#9ca3af', fontSize:12, fontWeight:filtro===key?600:400, cursor:'pointer', boxShadow:filtro===key?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chips departamentos */}
      {departamentos.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af' }}>DPTO:</span>
          {departamentos.map((d) => (
            <span key={d.id} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:dark?'rgba(255,255,255,0.06)':'#f3f4f6', color:dark?'#9ca3af':'#6b7280', border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}`, display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:d.color||'#7c3aed', display:'inline-block' }} />
              {d.nombre}
            </span>
          ))}
        </div>
      )}

      {/* Grid usuarios */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', height:200, alignItems:'center' }}>
          <svg style={{ width:28, height:28 }} className="animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:180, background:dark?'#18181f':'white', borderRadius:20, border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#f3f4f6'}` }}>
          <Icons.users style={{ width:36, height:36, color:dark?'#374151':'#e5e7eb', marginBottom:10 }} />
          <p style={{ fontSize:14, fontWeight:600, color:dark?'#6b7280':'#9ca3af' }}>No hay usuarios</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
          <AnimatePresence>
            {usuariosFiltrados.map((u) => (
              <UsuarioCard key={u.id} u={u} onClick={setDetalleId} onDesactivar={handleDesactivar} puedeAdmin={puedeAdmin} usuarioActual={usuarioActual?.id} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Departamentos */}
      {puedeAdmin && <DepartamentosPanel />}

      {/* Modales */}
      <InvitarModal open={invitarOpen} onClose={() => setInvitarOpen(false)} />
      <UsuarioDetalle
        usuarioId={detalleId}
        usuarios={usuarios}
        onClose={() => setDetalleId(null)}
        puedeAdmin={puedeAdmin}
        onActualizar={actualizarUsuario}
        onDesactivar={handleDesactivar}
        onActivar={handleActivar}
        onReenviar={handleReenviar}
        usuarioActualId={usuarioActual?.id}
      />
    </div>
  );
}