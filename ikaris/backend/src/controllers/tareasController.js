const supabase = require('../config/supabase');

// ── Helpers ────────────────────────────────────────────────────────────────
const puedeGestionar = (rol) =>
  ['dueño', 'administrador', 'gerente', 'supervisor'].includes(rol);

// ── Listar tareas (con filtros de rol/depto) ───────────────────────────────
const listarTareas = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    const { estado, prioridad, departamento_id, asignado_a, search, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('tareas')
      .select(`
        *,
        asignado_a_usuario:usuarios!tareas_asignado_a_fkey(id, nombre, apellido, avatar_url),
        creado_por_usuario:usuarios!tareas_creado_por_fkey(id, nombre, apellido),
        departamento:departamentos(id, nombre, color)
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    // Si no puede gestionar, solo ve sus tareas o las de su departamento
    if (!puedeGestionar(rol)) {
      // Obtener departamento del usuario
      const { data: u } = await supabase
        .from('usuarios')
        .select('departamento_id')
        .eq('id', usuarioId)
        .single();

      if (u?.departamento_id) {
        query = query.or(`asignado_a.eq.${usuarioId},departamento_id.eq.${u.departamento_id}`);
      } else {
        query = query.eq('asignado_a', usuarioId);
      }
    }

    // Filtros opcionales
    if (estado)          query = query.eq('estado', estado);
    if (prioridad)       query = query.eq('prioridad', prioridad);
    if (departamento_id) query = query.eq('departamento_id', departamento_id);
    if (asignado_a)      query = query.eq('asignado_a', asignado_a);
    if (search)          query = query.ilike('titulo', `%${search}%`);

    // Paginación
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count });
  } catch (err) {
    next(err);
  }
};

// ── Obtener tarea por ID ───────────────────────────────────────────────────
const obtenerTarea = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;
    const { id } = req.params;

    const { data: tarea, error } = await supabase
      .from('tareas')
      .select(`
        *,
        asignado_a_usuario:usuarios!tareas_asignado_a_fkey(id, nombre, apellido, avatar_url, rol),
        creado_por_usuario:usuarios!tareas_creado_por_fkey(id, nombre, apellido),
        departamento:departamentos(id, nombre, color)
      `)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !tarea) throw { status: 404, message: 'Tarea no encontrada' };

    // Archivos
    const { data: archivos } = await supabase
      .from('tarea_archivos')
      .select('*, subido_por_usuario:usuarios(nombre, apellido)')
      .eq('tarea_id', id)
      .order('created_at', { ascending: false });

    // Comentarios
    const { data: comentarios } = await supabase
      .from('tarea_comentarios')
      .select('*, usuario:usuarios(id, nombre, apellido, avatar_url)')
      .eq('tarea_id', id)
      .order('created_at', { ascending: true });

    res.json({ success: true, data: { ...tarea, archivos: archivos || [], comentarios: comentarios || [] } });
  } catch (err) {
    next(err);
  }
};

// ── Crear tarea ────────────────────────────────────────────────────────────
const crearTarea = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    const { titulo, descripcion, asignado_a, departamento_id, prioridad, fecha_inicio, fecha_limite } = req.body;

    if (!titulo?.trim()) throw { status: 400, message: 'El título es requerido' };

    // Solo roles con permiso pueden asignar a otros
    const asignacion = puedeGestionar(rol) ? asignado_a : usuarioId;

    const { data, error } = await supabase
      .from('tareas')
      .insert({
        empresa_id:     empresaId,
        titulo:         titulo.trim(),
        descripcion,
        asignado_a:     asignacion || null,
        departamento_id: departamento_id || null,
        creado_por:     usuarioId,
        prioridad:      prioridad || 'media',
        estado:         'pendiente',
        fecha_inicio:   fecha_inicio || null,
        fecha_limite:   fecha_limite || null,
      })
      .select()
      .single();

    if (error) throw error;

// Log auditoría (silencioso si falla)
    try {
      await supabase.schema('auditoria').from('logs').insert({
        empresa_id:    empresaId,
        usuario_id:    usuarioId,
        accion:        'crear_tarea',
        modulo:        'tareas',
        registro_id:   data.id,
        datos_despues: data,
      });
    } catch (_) {}

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Actualizar tarea ───────────────────────────────────────────────────────
const actualizarTarea = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    const { id } = req.params;
    let campos = { ...req.body };

    const { data: existente } = await supabase
      .from('tareas')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (!existente) throw { status: 404, message: 'Tarea no encontrada' };

    if (!puedeGestionar(rol)) {
      if (existente.asignado_a !== usuarioId) {
        throw { status: 403, message: 'Sin permisos para editar esta tarea' };
      }
      const { estado } = campos;
      if (!estado) throw { status: 400, message: 'Solo puedes cambiar el estado' };
      campos = { estado };
    }

    if (campos.estado === 'aprobada' || campos.estado === 'entregada') {
      campos.fecha_completada = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tareas')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Cambiar estado ─────────────────────────────────────────────────────────
const cambiarEstado = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'en_proceso', 'entregada', 'rechazada', 'aprobada'];
    if (!estadosValidos.includes(estado)) throw { status: 400, message: 'Estado inválido' };

    // Solo admins pueden aprobar/rechazar
    if (['aprobada', 'rechazada'].includes(estado) && !puedeGestionar(rol)) {
      throw { status: 403, message: 'Solo supervisores pueden aprobar o rechazar tareas' };
    }

    const updates = {
      estado,
      updated_at: new Date().toISOString(),
    };
    if (['aprobada', 'entregada'].includes(estado)) {
      updates.fecha_completada = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tareas')
      .update(updates)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Eliminar tarea ─────────────────────────────────────────────────────────
const eliminarTarea = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    const { id } = req.params;

    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos para eliminar tareas' };

    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (err) {
    next(err);
  }
};

// ── Agregar comentario ─────────────────────────────────────────────────────
const agregarComentario = async (req, res, next) => {
  try {
    const { empresaId, usuarioId } = req.usuario;
    const { id } = req.params;
    const { contenido } = req.body;

    if (!contenido?.trim()) throw { status: 400, message: 'El comentario no puede estar vacío' };

    const { data, error } = await supabase
      .from('tarea_comentarios')
      .insert({
        empresa_id: empresaId,
        tarea_id:   id,
        usuario_id: usuarioId,
        contenido:  contenido.trim(),
      })
      .select('*, usuario:usuarios(id, nombre, apellido, avatar_url)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Subir archivo ──────────────────────────────────────────────────────────
const subirArchivo = async (req, res, next) => {
  try {
    const { empresaId, usuarioId } = req.usuario;
    const { id } = req.params;
    const { nombre, tipo, tamaño, base64 } = req.body;

    if (!base64 || !nombre) throw { status: 400, message: 'Archivo requerido' };

    // Convertir base64 a buffer
    const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
    const path   = `${empresaId}/${id}/${Date.now()}-${nombre}`;

    const { error: uploadError } = await supabase.storage
      .from('tarea-archivos')
      .upload(path, buffer, { contentType: tipo || 'application/octet-stream' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('tarea-archivos')
      .getPublicUrl(path);

const { data, error } = await supabase
      .from('tarea_archivos')
      .insert({
        empresa_id: empresaId,
        tarea_id:   id,
        nombre,
        url:        publicUrl,
        tipo,
        tamaño,
        subido_por: usuarioId,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-cambiar estado a "entregada" si estaba pendiente o en_proceso
    const { data: tareaActual } = await supabase
      .from('tareas')
      .select('estado')
      .eq('id', id)
      .single();

    if (tareaActual && ['pendiente', 'en_proceso'].includes(tareaActual.estado)) {
      await supabase
        .from('tareas')
        .update({ estado: 'entregada', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── Obtener usuarios y departamentos para asignación ───────────────────────
const obtenerOpciones = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;

    const [{ data: usuarios }, { data: departamentos }] = await Promise.all([
      supabase.from('usuarios')
        .select('id, nombre, apellido, rol, avatar_url, departamento_id')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .order('nombre'),
      supabase.from('departamentos')
        .select('id, nombre, color')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .order('nombre'),
    ]);

    res.json({ success: true, data: { usuarios: usuarios || [], departamentos: departamentos || [] } });
  } catch (err) {
    next(err);
  }
};

// ── Obtener entrega del usuario actual para una tarea ──────────────────────
const obtenerMiEntrega = async (req, res, next) => {
  try {
    const { empresaId, usuarioId } = req.usuario;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tarea_entregas')
      .select('*, usuario:usuarios(id, nombre, apellido, avatar_url)')
      .eq('tarea_id', id)
      .eq('usuario_id', usuarioId)
      .eq('empresa_id', empresaId)
      .single();

    // Si no existe, retornar estado pendiente
    if (error || !data) {
      return res.json({ success: true, data: { estado: 'pendiente', archivos: [], usuario_id: usuarioId } });
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Listar todas las entregas de una tarea (solo admins) ───────────────────
const listarEntregas = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;

    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos' };

    const { data, error } = await supabase
      .from('tarea_entregas')
      .select('*, usuario:usuarios(id, nombre, apellido, avatar_url, correo, departamentos(nombre))')
      .eq('tarea_id', id)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { next(err); }
};

// ── Subir entrega (trabajador) ─────────────────────────────────────────────
const subirEntrega = async (req, res, next) => {
  try {
    const { empresaId, usuarioId } = req.usuario;
    const { id } = req.params;
    const { nombre, tipo, tamaño, base64, comentario } = req.body;

    let archivoUrl = null;

    if (base64 && nombre) {
      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
      const path   = `${empresaId}/${id}/${usuarioId}/${Date.now()}-${nombre}`;

      const { error: uploadError } = await supabase.storage
        .from('tarea-archivos')
        .upload(path, buffer, { contentType: tipo || 'application/octet-stream', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tarea-archivos').getPublicUrl(path);

      archivoUrl = publicUrl;
    }

    // Buscar entrega existente
    const { data: existente } = await supabase
      .from('tarea_entregas')
      .select('id, archivos')
      .eq('tarea_id', id)
      .eq('usuario_id', usuarioId)
      .single();

    const archivosActuales = existente?.archivos || [];
    const nuevosArchivos = archivoUrl
      ? [...archivosActuales, { nombre, url: archivoUrl, tipo, tamaño, fecha: new Date().toISOString() }]
      : archivosActuales;

    const payload = {
      empresa_id:    empresaId,
      tarea_id:      id,
      usuario_id:    usuarioId,
      estado:        'entregada',
      archivos:      nuevosArchivos,
      comentario:    comentario || existente?.comentario || null,
      fecha_entrega: new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    };

    let data, error;
    if (existente) {
      ({ data, error } = await supabase
        .from('tarea_entregas').update(payload)
        .eq('id', existente.id).select('*, usuario:usuarios(id, nombre, apellido, avatar_url)').single());
    } else {
      ({ data, error } = await supabase
        .from('tarea_entregas').insert(payload)
        .select('*, usuario:usuarios(id, nombre, apellido, avatar_url)').single());
    }

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Admin aprueba o rechaza entrega individual ─────────────────────────────
const revisarEntrega = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id, entregaId } = req.params;
    const { estado, comentario } = req.body;

    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos' };
    if (!['aprobada','rechazada','no_entregada'].includes(estado))
      throw { status: 400, message: 'Estado inválido' };

    const { data, error } = await supabase
      .from('tarea_entregas')
      .update({ estado, comentario, updated_at: new Date().toISOString() })
      .eq('id', entregaId)
      .eq('empresa_id', empresaId)
      .select('*, usuario:usuarios(id, nombre, apellido, avatar_url)').single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Marcar como no entregadas las vencidas (cron o manual) ────────────────
const marcarVencidas = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos' };

    // Buscar tareas vencidas
    const { data: tareasVencidas } = await supabase
      .from('tareas')
      .select('id, asignado_a')
      .eq('empresa_id', empresaId)
      .lt('fecha_limite', new Date().toISOString())
      .neq('asignado_a', null);

    let marcadas = 0;
    for (const t of (tareasVencidas || [])) {
      // Verificar si ya tiene entrega
      const { data: entrega } = await supabase
        .from('tarea_entregas')
        .select('id, estado')
        .eq('tarea_id', t.id)
        .eq('usuario_id', t.asignado_a)
        .single();

      if (!entrega || entrega.estado === 'pendiente') {
        await supabase.from('tarea_entregas').upsert({
          empresa_id: empresaId,
          tarea_id:   t.id,
          usuario_id: t.asignado_a,
          estado:     'no_entregada',
          archivos:   [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tarea_id,usuario_id' });
        marcadas++;
      }
    }

    res.json({ success: true, marcadas });
  } catch (err) { next(err); }
};

module.exports = {
  listarTareas, obtenerTarea, crearTarea,
  actualizarTarea, cambiarEstado, eliminarTarea,
  agregarComentario, subirArchivo, obtenerOpciones,
  obtenerMiEntrega, listarEntregas, subirEntrega,
  revisarEntrega, marcarVencidas,
};