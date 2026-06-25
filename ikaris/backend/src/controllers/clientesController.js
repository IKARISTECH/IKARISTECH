const supabase = require('../config/supabase');

const puedeGestionar = (rol) =>
  ['dueño', 'administrador', 'gerente', 'supervisor', 'contador', 'ventas'].includes(rol);

// ── Listar clientes ────────────────────────────────────────────────────────
const listarClientes = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;
    const { search, activo, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (search) query = query.or(`nombre.ilike.%${search}%,razon_social.ilike.%${search}%,rfc.ilike.%${search}%,correo.ilike.%${search}%`);
    if (activo !== undefined) query = query.eq('activo', activo === 'true');

    const from = (page - 1) * limit;
    query = query.range(from, from + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count });
  } catch (err) { next(err); }
};

// ── Obtener cliente por ID ─────────────────────────────────────────────────
const obtenerCliente = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !data) throw { status: 404, message: 'Cliente no encontrado' };
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Crear cliente ──────────────────────────────────────────────────────────
const crearCliente = async (req, res, next) => {
  try {
    const { empresaId, usuarioId, rol } = req.usuario;
    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos para crear clientes' };

    const { nombre, razon_social, rfc, regimen_fiscal, codigo_postal,
            direccion_fiscal, correo, telefono, notas } = req.body;

    if (!nombre?.trim()) throw { status: 400, message: 'El nombre es requerido' };

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        empresa_id: empresaId, nombre: nombre.trim(), razon_social,
        rfc: rfc?.toUpperCase().trim(), regimen_fiscal, codigo_postal,
        direccion_fiscal, correo: correo?.toLowerCase().trim(),
        telefono, notas, created_by: usuarioId,
      })
      .select().single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Actualizar cliente ─────────────────────────────────────────────────────
const actualizarCliente = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;
    if (!puedeGestionar(rol)) throw { status: 403, message: 'Sin permisos' };

    const campos = { ...req.body, updated_at: new Date().toISOString() };
    if (campos.rfc) campos.rfc = campos.rfc.toUpperCase().trim();
    if (campos.correo) campos.correo = campos.correo.toLowerCase().trim();

    const { data, error } = await supabase
      .from('clientes').update(campos)
      .eq('id', id).eq('empresa_id', empresaId)
      .select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── Eliminar/desactivar cliente ────────────────────────────────────────────
const eliminarCliente = async (req, res, next) => {
  try {
    const { empresaId, rol } = req.usuario;
    const { id } = req.params;
    if (!['dueño', 'administrador'].includes(rol)) throw { status: 403, message: 'Sin permisos' };

    const { error } = await supabase
      .from('clientes').update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id).eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true, message: 'Cliente desactivado' });
  } catch (err) { next(err); }
};

// ── Estadísticas de clientes ───────────────────────────────────────────────
const estadisticasClientes = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;

    const [
      { count: total },
      { count: activos },
      { data: recientes },
    ] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('activo', true),
      supabase.from('clientes').select('id, nombre, correo, created_at').eq('empresa_id', empresaId)
        .eq('activo', true).order('created_at', { ascending: false }).limit(5),
    ]);

    res.json({ success: true, data: { total: total || 0, activos: activos || 0, recientes: recientes || [] } });
  } catch (err) { next(err); }
};

module.exports = { listarClientes, obtenerCliente, crearCliente, actualizarCliente, eliminarCliente, estadisticasClientes };