const supabase = require('../config/supabase');

const soloAdmin    = (rol) => ['dueño','administrador'].includes(rol);
const puedeEditar  = (rol) => ['dueño','administrador','gerente','supervisor'].includes(rol);

// Generar prefijo de folio
const generarPrefijo = (titulo) => {
  const palabras = titulo.trim().split(/\s+/).slice(0,3);
  return palabras.map((p) => p[0]?.toUpperCase() || '').join('');
};

// ── Listar formularios ─────────────────────────────────────────────────────
const listar = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;

let query = supabase
      .from('formularios')
      .select('id, titulo, descripcion, activo, publicado, prefijo_folio, contador_folio, created_at, updated_at, creado_por, departamentos, usuarios_acceso, campos')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    // Sin permisos: solo ve los que tienen acceso
    if (!puedeEditar(rol)) {
      query = query.or(`usuarios_acceso.cs.{${usuarioId}},publicado.eq.true`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Contar respuestas por formulario
    const ids = (data || []).map((f) => f.id);
    let conteos = {};
    if (ids.length) {
      const { data: resp } = await supabase
        .from('formulario_respuestas')
        .select('formulario_id')
        .eq('empresa_id', empresaId)
        .in('formulario_id', ids);
      (resp || []).forEach((r) => { conteos[r.formulario_id] = (conteos[r.formulario_id] || 0) + 1; });
    }

    res.json({ success: true, data: (data || []).map((f) => ({ ...f, total_respuestas: conteos[f.id] || 0 })) });
  } catch (err) { next(err); }
};

// ── Obtener formulario por ID ───────────────────────────────────────────────
const obtener = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', req.params.id)
      .eq('empresa_id', empresaId)
      .single();
    if (error || !data) throw { status: 404, message: 'Formulario no encontrado' };
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Crear formulario ───────────────────────────────────────────────────────
const crear = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    if (!puedeEditar(rol)) throw { status: 403, message: 'Sin permisos' };

    const { titulo, descripcion, campos, configuracion, departamentos, usuarios_acceso, publicado } = req.body;
    if (!titulo?.trim()) throw { status: 400, message: 'El título es requerido' };

    const prefijo = generarPrefijo(titulo);

    const { data, error } = await supabase
      .from('formularios')
      .insert({
        empresa_id:     empresaId,
        creado_por:     usuarioId,
        titulo:         titulo.trim(),
        descripcion:    descripcion || null,
        campos:         campos || [],
        configuracion:  configuracion || {},
        departamentos:  departamentos || [],
        usuarios_acceso: usuarios_acceso || [],
        publicado:      publicado || false,
        prefijo_folio:  prefijo,
        activo:         true,
      })
      .select().single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Actualizar formulario ──────────────────────────────────────────────────
const actualizar = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!puedeEditar(rol)) throw { status: 403, message: 'Sin permisos' };
    const { id } = req.params;

    const { titulo, descripcion, campos, configuracion, departamentos, usuarios_acceso, publicado, activo } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (titulo !== undefined)          { updates.titulo = titulo; updates.prefijo_folio = generarPrefijo(titulo); }
    if (descripcion !== undefined)     updates.descripcion = descripcion;
    if (campos !== undefined)          updates.campos = campos;
    if (configuracion !== undefined)   updates.configuracion = configuracion;
    if (departamentos !== undefined)   updates.departamentos = departamentos;
    if (usuarios_acceso !== undefined) updates.usuarios_acceso = usuarios_acceso;
    if (publicado !== undefined)       updates.publicado = publicado;
    if (activo !== undefined)          updates.activo = activo;

    const { data, error } = await supabase
      .from('formularios').update(updates)
      .eq('id', id).eq('empresa_id', empresaId)
      .select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Eliminar formulario ────────────────────────────────────────────────────
const eliminar = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!puedeEditar(rol)) throw { status: 403, message: 'Sin permisos' };

    // Eliminar respuestas primero (FK constraint)
    await supabase
      .from('formulario_respuestas')
      .delete()
      .eq('formulario_id', req.params.id)
      .eq('empresa_id', empresaId);

    // Eliminar formulario permanentemente
    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', req.params.id)
      .eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── Listar respuestas ──────────────────────────────────────────────────────
const listarRespuestas = async (req, res, next) => {
  try {
const { empresaId, rol } = req.usuario;
const usuarioId = req.usuario.usuarioId || req.usuario.id || req.usuario.authId;
const { id } = req.params;
const { usuario_id, desde, hasta } = req.query;

let query = supabase
  .from('formulario_respuestas')
  .select('id, folio, respuestas, archivos, created_at, updated_at, respondido_por')
  .eq('formulario_id', id)
  .eq('empresa_id', empresaId)
  .order('created_at', { ascending: false });

if (!puedeEditar(rol)) query = query.eq('respondido_por', usuarioId);
if (usuario_id) query = query.eq('respondido_por', usuario_id);
    if (desde) query = query.gte('created_at', desde);
    if (hasta) query = query.lte('created_at', hasta);

    const { data: respuestas, error } = await query;

    if (error) {
      console.error('ERROR RESPUESTAS:', error);
      throw error;
    }

const usuariosIds = [...new Set((respuestas || []).map(r => r.respondido_por).filter(Boolean))];

    let usuariosMap = {};

if (usuariosIds.length) {
  const idsFiltro = usuariosIds.map((x) => `"${x}"`).join(',');

  const { data: usuariosData, error: usuariosError } = await supabase
    .from('usuarios')
    .select(`
      id,
      auth_user_id,
      nombre,
      apellido,
      avatar_url,
      correo,
      rol,
      departamento_id,
      puesto_id,
      departamento:departamentos(nombre),
      puesto:puestos(nombre)
    `)
    .or(`id.in.(${idsFiltro}),auth_user_id.in.(${idsFiltro})`);

  if (usuariosError) {
    console.error('ERROR USUARIOS RESPUESTAS:', usuariosError);
    throw usuariosError;
  }

  usuariosMap = {};

  (usuariosData || []).forEach((u) => {
    const usuarioNormalizado = {
      id: u.id,
      auth_user_id: u.auth_user_id,
      nombre: u.nombre,
      apellido: u.apellido,
      avatar_url: u.avatar_url,
      correo: u.correo,
      rol: u.rol,
      puesto: u.puesto?.nombre || null,
      departamento_nombre: u.departamento?.nombre || null,
      departamento: u.departamento || null,
    };

    usuariosMap[u.id] = usuarioNormalizado;

    if (u.auth_user_id) {
      usuariosMap[u.auth_user_id] = usuarioNormalizado;
    }
  });
}

    return res.json({
      success: true,
      data: (respuestas || []).map(r => ({
        ...r,
usuario: usuariosMap[r.respondido_por] || null,
      })),
    });
  } catch (err) {
    console.error('listarRespuestas FINAL ERROR:', err);
    next(err);
  }
};
// ── Subir archivo de respuesta a Supabase Storage ──────────────────────────
const subirArchivoRespuesta = async (req, res, next) => {
  try {
const { empresaId } = req.usuario;
const usuarioId = req.usuario.usuarioId || req.usuario.id || req.usuario.authId;
const { id } = req.params;

    if (!req.file) {
      throw { status: 400, message: 'Archivo requerido' };
    }

    const ext = req.file.originalname.split('.').pop();
    const safeName = req.file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    const filePath = `${empresaId}/formularios/${id}/${usuarioId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('formulario-archivos')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from('formulario-archivos')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      data: {
        nombre: req.file.originalname,
        name: req.file.originalname,
        tipo: req.file.mimetype,
        type: req.file.mimetype,
        size: req.file.size,
        path: filePath,
        url: publicData.publicUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};
// ── Crear respuesta ────────────────────────────────────────────────────────
const crearRespuesta = async (req, res, next) => {
  try {
const { empresaId } = req.usuario;
const usuarioId = req.usuario.usuarioId || req.usuario.id || req.usuario.authId;
const { id } = req.params;
const { respuestas, archivos } = req.body;

    console.log('crearRespuesta — body recibido:', JSON.stringify({ respuestas, archivos }, null, 2));

    // Obtener formulario para generar folio
    const { data: form, error: formError } = await supabase
      .from('formularios')
      .select('prefijo_folio, contador_folio')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (formError || !form) throw { status: 404, message: 'Formulario no encontrado' };

    const nuevoContador = (form.contador_folio || 0) + 1;
    const folio = `${form.prefijo_folio || 'F'}${String(nuevoContador).padStart(5, '0')}`;

    // Actualizar contador primero
    const { error: updateError } = await supabase
      .from('formularios')
      .update({ contador_folio: nuevoContador })
      .eq('id', id);

    if (updateError) console.error('Error actualizando contador:', updateError);

console.log('DEBUG USUARIO RESPUESTA:', req.usuario);

const correoUsuario = req.usuario.correo || req.usuario.email || null;

let usuarioReal = null;

let queryUsuario = supabase
  .from('usuarios')
  .select('id, auth_user_id, nombre, apellido, correo')
  .eq('empresa_id', empresaId);

if (correoUsuario) {
  queryUsuario = queryUsuario.eq('correo', correoUsuario);
} else {
  queryUsuario = queryUsuario.eq('id', usuarioId);
}

const { data: usuarioEncontrado, error: usuarioRealError } = await queryUsuario.maybeSingle();

if (usuarioRealError) {
  console.error('Error buscando usuario real:', usuarioRealError);
  throw usuarioRealError;
}

usuarioReal = usuarioEncontrado || { id: usuarioId };

// Insertar respuesta
const { data: inserted, error: insertError } = await supabase
  .from('formulario_respuestas')
  .insert({
    empresa_id: empresaId,
    formulario_id: id,
    respondido_por: usuarioReal.id,
    folio,
    respuestas: respuestas || {},
    archivos: archivos || [],
  })
  .select('id, folio, respuestas, archivos, created_at, updated_at, respondido_por')
  .single();

    if (insertError) {
      console.error('Error insertando respuesta:', insertError);
      throw insertError;
    }

    // Obtener datos del usuario por separado para evitar problemas de FK name
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select(`
  id,
  nombre,
  apellido,
  avatar_url,
  correo,
  rol,
  puesto_id,
  departamento_id,
  departamento:departamentos(nombre),
  puesto:puestos(nombre)
`)
      .eq('id', usuarioReal.id)
      .single();

    res.status(201).json({
      success: true,
      data: {
        ...inserted,
        usuario: usuarioData || null,
      },
    });
  } catch (err) { next(err); }
};
// ── Actualizar respuesta ───────────────────────────────────────────────────
const actualizarRespuesta = async (req, res, next) => {
  try {
const { empresaId, rol } = req.usuario;
const usuarioId = req.usuario.usuarioId || req.usuario.id || req.usuario.authId;
const { respId } = req.params;
    const { data: usuarioReal, error: usuarioRealError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('empresa_id', empresaId)
      .or(`id.eq.${usuarioId},auth_user_id.eq.${usuarioId}`)
      .single();

    if (usuarioRealError || !usuarioReal) {
      console.error('No se encontró usuario real para actualizar respuesta:', usuarioRealError);
      throw { status: 404, message: 'Usuario no encontrado' };
    }

    const { data: existente, error: existenteError } = await supabase
      .from('formulario_respuestas')
      .select('respondido_por')
      .eq('id', respId)
      .eq('empresa_id', empresaId)
      .single();

    if (existenteError || !existente) {
      throw { status: 404, message: 'Respuesta no encontrada' };
    }

    if (!puedeEditar(rol) && existente.respondido_por !== usuarioReal.id) {
      throw { status: 403, message: 'Sin permisos para editar esta respuesta' };
    }

    const { data: updated, error } = await supabase
      .from('formulario_respuestas')
      .update({
        respuestas: req.body.respuestas,
        updated_at: new Date().toISOString(),
      })
      .eq('id', respId)
      .eq('empresa_id', empresaId)
      .select('id, folio, respuestas, archivos, created_at, updated_at, respondido_por')
      .single();

    if (error) throw error;

const { data: usuarioData } = await supabase
  .from('usuarios')
  .select(`
    id,
    nombre,
    apellido,
    avatar_url,
    correo,
    rol,
    departamento_id,
    departamento:departamentos(nombre)
  `)
  .eq('id', usuarioReal.id)
  .single();

    res.json({
      success: true,
      data: {
        ...updated,
        usuario: usuarioData
          ? {
              ...usuarioData,
              puesto: usuarioData.puesto?.nombre || null,
              departamento_nombre: usuarioData.departamento?.nombre || null,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Eliminar respuesta(s) ──────────────────────────────────────────────────
const eliminarRespuesta = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!puedeEditar(rol)) throw { status: 403, message: 'Sin permisos' };

    // Bulk delete viene en body.ids, individual viene en params.respId
    const idsAEliminar = req.body?.ids
      ? (Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids])
      : [req.params.respId];

    if (!idsAEliminar.length || !idsAEliminar[0]) {
      throw { status: 400, message: 'IDs requeridos' };
    }

    const { error } = await supabase
      .from('formulario_respuestas')
      .delete()
      .in('id', idsAEliminar)
      .eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true, eliminados: idsAEliminar.length });
  } catch (err) { next(err); }
};
module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  listarRespuestas,
  crearRespuesta,
  actualizarRespuesta,
  eliminarRespuesta,
  subirArchivoRespuesta,
};