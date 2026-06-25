const supabase = require('../config/supabase');
const { invitarUsuario } = require('../services/verificacionService');

const ROLES = ['dueño','administrador','gerente','supervisor','contador','rh','trabajador','invitado','soporte'];
const MODULOS = ['dashboard','usuarios','departamentos','formularios','facturacion','clientes','cotizaciones','inventario','compras','tareas','rh','reportes','auditoria','reuniones','calendario','chat','configuracion'];

const soloAdmin    = (rol) => ['dueño','administrador'].includes(rol);
const puedeGestionar = (rol) => ['dueño','administrador','gerente'].includes(rol);

// ── Listar usuarios ────────────────────────────────────────────────────────
const listarUsuarios = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos' };

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, correo, rol, activo, online, ultima_conexion, avatar_url, departamento_id, puesto_id, departamentos(id, nombre, color), puestos(id, nombre)')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { next(err); }
};

// ── Invitar usuario ────────────────────────────────────────────────────────
const invitar = async (req, res, next) => {
  try {
    const { empresaId, rol: rolAdmin } = req.usuario;
    if (!soloAdmin(rolAdmin)) throw { status: 403, message: 'Solo administradores pueden invitar usuarios' };

    const { nombre, apellido, correo, rol = 'trabajador', departamento_id, puesto_id } = req.body;
    if (!nombre || !correo) throw { status: 400, message: 'Nombre y correo son requeridos' };
    if (!ROLES.includes(rol)) throw { status: 400, message: 'Rol inválido' };

    const { data: existe } = await supabase
      .from('usuarios').select('id').eq('empresa_id', empresaId).eq('correo', correo.toLowerCase()).single();
    if (existe) throw { status: 409, message: 'Este correo ya está registrado en la empresa' };

    const { data: empresa } = await supabase.from('empresas').select('nombre').eq('id', empresaId).single();

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .insert({
        empresa_id:     empresaId,
        nombre:         nombre.trim(),
        apellido:       apellido?.trim() || '',
        correo:         correo.toLowerCase().trim(),
        rol,
        departamento_id: departamento_id || null,
        puesto_id:      puesto_id || null,
        activo:         false,
      })
      .select().single();

    if (error) throw error;

    await invitarUsuario({
      correo:        correo.toLowerCase().trim(),
      nombre:        nombre.trim(),
      nombreEmpresa: empresa.nombre,
      rol,
      empresaId,
    });

    res.status(201).json({ success: true, data: usuario, message: `Invitación enviada a ${correo}` });
  } catch (err) { next(err); }
};

// ── Aceptar invitación ─────────────────────────────────────────────────────
const aceptarInvitacion = async (req, res, next) => {
  try {
    const { correo, codigo, password } = req.body;
    if (!correo || !codigo || !password) throw { status: 400, message: 'Datos incompletos' };
    if (password.length < 8) throw { status: 400, message: 'Contraseña muy corta' };

    const { verificarCodigo } = require('../services/verificacionService');
    await verificarCodigo({ correo: correo.toLowerCase(), codigo, tipo: 'invitacion' });

    const correoNorm = correo.toLowerCase().trim();
    const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email: correoNorm, password, email_confirm: true }),
    });

    const authData = await response.json();
    if (!response.ok || !authData.id) throw { status: 400, message: authData.msg || 'Error al crear cuenta' };

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update({ auth_user_id: authData.id, activo: true })
      .eq('correo', correoNorm)
      .select().single();

    if (error) throw error;

    const jwt = require('jsonwebtoken');
    const payload = { sub: authData.id, usuarioId: usuario.id, empresaId: usuario.empresa_id, rol: usuario.rol };
    const accessToken  = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    const refreshToken = jwt.sign({ ...payload, type:'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { data: empresa } = await supabase.from('empresas').select('id, nombre, plan, logo_url').eq('id', usuario.empresa_id).single();

    res.json({ success: true, data: { usuario, empresa, accessToken, refreshToken } });
  } catch (err) { next(err); }
};

// ── Actualizar usuario ─────────────────────────────────────────────────────
const actualizarUsuario = async (req, res, next) => {
  try {
    const { empresaId, rol: rolAdmin, usuarioId } = req.usuario;
    const { id } = req.params;
    const { rol, departamento_id, puesto_id, activo, nombre, apellido } = req.body;

    if (id !== usuarioId && !soloAdmin(rolAdmin)) throw { status: 403, message: 'Sin permisos' };

    const updates = {};
    if (nombre !== undefined)        updates.nombre = nombre.trim();
    if (apellido !== undefined)      updates.apellido = apellido.trim();
    if (departamento_id !== undefined) updates.departamento_id = departamento_id || null;
    if (puesto_id !== undefined)     updates.puesto_id = puesto_id || null;
    if (rol && soloAdmin(rolAdmin) && ROLES.includes(rol)) updates.rol = rol;
    if (activo !== undefined && soloAdmin(rolAdmin)) updates.activo = activo;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('usuarios').update(updates)
      .eq('id', id).eq('empresa_id', empresaId)
      .select('id, nombre, apellido, correo, rol, activo, online, ultima_conexion, avatar_url, departamento_id, puesto_id, departamentos(id, nombre, color), puestos(id, nombre)').single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Desactivar usuario ─────────────────────────────────────────────────────
const desactivarUsuario = async (req, res, next) => {
  try {
    const { empresaId, rol, usuarioId } = req.usuario;
    const { id } = req.params;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    if (id === usuarioId) throw { status: 400, message: 'No puedes desactivar tu propia cuenta' };

    const { error } = await supabase
      .from('usuarios').update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id).eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true, message: 'Usuario desactivado' });
  } catch (err) { next(err); }
};

// ── Activar usuario ────────────────────────────────────────────────────────
const activarUsuario = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };

    const { error } = await supabase
      .from('usuarios').update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id).eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true, message: 'Usuario activado' });
  } catch (err) { next(err); }
};

// ── Reenviar invitación ────────────────────────────────────────────────────
const reenviarInvitacion = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    const { id } = req.params;

    const { data: usuario } = await supabase
      .from('usuarios').select('*, empresas(nombre)').eq('id', id).eq('empresa_id', empresaId).single();
    if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };
    if (usuario.activo) throw { status: 400, message: 'El usuario ya está activo' };

    await invitarUsuario({
      correo: usuario.correo,
      nombre: usuario.nombre,
      nombreEmpresa: usuario.empresas?.nombre || 'IKARIS',
      rol: usuario.rol,
      empresaId,
    });

    res.json({ success: true, message: 'Invitación reenviada' });
  } catch (err) { next(err); }
};

// ── Reset password ─────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;
    const { password } = req.body;

    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    if (!password || password.length < 8) throw { status: 400, message: 'Contraseña muy corta' };

    const { data: usuario } = await supabase
      .from('usuarios').select('auth_user_id').eq('id', id).eq('empresa_id', empresaId).single();
    if (!usuario?.auth_user_id) throw { status: 404, message: 'Usuario no encontrado' };

    const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users/${usuario.auth_user_id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) throw { status: 500, message: 'Error al restablecer contraseña' };
    res.json({ success: true, message: 'Contraseña restablecida' });
  } catch (err) { next(err); }
};

// ── Obtener permisos de un usuario ─────────────────────────────────────────
const obtenerPermisos = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };

    const { data, error } = await supabase
      .from('permisos').select('*')
      .eq('usuario_id', id).eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { next(err); }
};

// ── Guardar permisos de un usuario ─────────────────────────────────────────
const guardarPermisos = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;
    const { permisos } = req.body; // array de { modulo, puede_ver, puede_crear, ... }

    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    if (!Array.isArray(permisos)) throw { status: 400, message: 'Permisos inválidos' };

    // Eliminar permisos existentes y reemplazar
    await supabase.from('permisos').delete().eq('usuario_id', id).eq('empresa_id', empresaId);

    if (permisos.length > 0) {
      const rows = permisos.map((p) => ({
        empresa_id:     empresaId,
        usuario_id:     id,
        modulo:         p.modulo,
        puede_ver:      p.puede_ver      || false,
        puede_crear:    p.puede_crear    || false,
        puede_editar:   p.puede_editar   || false,
        puede_eliminar: p.puede_eliminar || false,
        puede_exportar: p.puede_exportar || false,
        puede_aprobar:  p.puede_aprobar  || false,
        puede_firmar:   p.puede_firmar   || false,
      }));

      const { error } = await supabase.from('permisos').insert(rows);
      if (error) throw error;
    }

    res.json({ success: true, message: 'Permisos guardados' });
  } catch (err) { next(err); }
};

// ── Departamentos ──────────────────────────────────────────────────────────
const listarDepartamentos = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;
    const { data, error } = await supabase
      .from('departamentos')
      .select('*, puestos(id, nombre, descripcion, activo)')
      .eq('empresa_id', empresaId).eq('activo', true).order('nombre');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { next(err); }
};

const crearDepartamento = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    const { nombre, descripcion, color } = req.body;
    if (!nombre?.trim()) throw { status: 400, message: 'El nombre es requerido' };

    const { data, error } = await supabase
      .from('departamentos')
      .insert({ empresa_id: empresaId, nombre: nombre.trim(), descripcion, color: color || '#7c3aed', icono: 'building' })
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const actualizarDepartamento = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    const { id } = req.params;
    const { nombre, descripcion, color } = req.body;

    const { data, error } = await supabase
      .from('departamentos').update({ nombre, descripcion, color, updated_at: new Date().toISOString() })
      .eq('id', id).eq('empresa_id', empresaId).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const eliminarDepartamento = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    const { id } = req.params;

    const { error } = await supabase
      .from('departamentos').update({ activo: false }).eq('id', id).eq('empresa_id', empresaId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── Puestos ────────────────────────────────────────────────────────────────
const crearPuesto = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    const { departamento_id, nombre, descripcion } = req.body;
    if (!nombre?.trim() || !departamento_id) throw { status: 400, message: 'Nombre y departamento requeridos' };

    const { data, error } = await supabase
      .from('puestos')
      .insert({ empresa_id: empresaId, departamento_id, nombre: nombre.trim(), descripcion })
      .select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const eliminarPuesto = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!soloAdmin(rol)) throw { status: 403, message: 'Sin permisos' };
    const { id } = req.params;

    const { error } = await supabase
      .from('puestos').update({ activo: false }).eq('id', id).eq('empresa_id', empresaId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = {
  listarUsuarios, invitar, aceptarInvitacion, actualizarUsuario,
  desactivarUsuario, activarUsuario, reenviarInvitacion, resetPassword,
  obtenerPermisos, guardarPermisos,
  listarDepartamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento,
  crearPuesto, eliminarPuesto,
};