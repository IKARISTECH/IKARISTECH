const supabase = require('../config/supabase');

const getMetricas = async (req, res, next) => {
  try {
    const { empresaId } = req.usuario;

    const resultados = await Promise.all([
      supabase.from('clientes').select('*', { count:'exact', head:true }).eq('empresa_id', empresaId).eq('activo', true),
      supabase.from('tareas').select('*', { count:'exact', head:true }).eq('empresa_id', empresaId),
      supabase.from('tareas').select('*', { count:'exact', head:true }).eq('empresa_id', empresaId)
        .gte('fecha_limite', new Date().toISOString().split('T')[0])
        .lte('fecha_limite', new Date().toISOString().split('T')[0] + 'T23:59:59'),
      supabase.from('tareas').select('*', { count:'exact', head:true }).eq('empresa_id', empresaId)
        .lt('fecha_limite', new Date().toISOString()).in('estado', ['pendiente','en_proceso']),
      supabase.from('reuniones').select('*', { count:'exact', head:true }).eq('empresa_id', empresaId).eq('estado','programada'),
      supabase.from('formularios').select('*', { count:'exact', head:true }).eq('empresa_id', empresaId).eq('activo',true),
      supabase.from('tareas').select('id, titulo, estado, prioridad, fecha_limite').eq('empresa_id', empresaId)
        .order('created_at', { ascending:false }).limit(5),
      supabase.from('eventos_calendario').select('id, titulo, tipo, fecha_inicio, color').eq('empresa_id', empresaId)
        .gte('fecha_inicio', new Date().toISOString())
        .lte('fecha_inicio', new Date(Date.now() + 7*24*60*60*1000).toISOString())
        .order('fecha_inicio', { ascending:true }).limit(5),
      supabase.from('usuarios').select('id, nombre, apellido, rol, online, ultima_conexion, avatar_url')
        .eq('empresa_id', empresaId).eq('activo',true).order('online', { ascending:false }).limit(6),
supabase.from('clientes').select('id, nombre, correo, created_at')
        .eq('empresa_id', empresaId).eq('activo',true).order('created_at', { ascending:false }).limit(5),

      // Formularios recientes
      supabase.from('formularios').select('id, titulo, publicado, contador_folio')
        .eq('empresa_id', empresaId).eq('activo',true).order('created_at', { ascending:false }).limit(5),

      // Respuestas hoy
      supabase.from('formulario_respuestas').select('*', { count:'exact', head:true })
        .eq('empresa_id', empresaId)
        .gte('created_at', new Date().toISOString().split('T')[0]),
    ]);

    const formulariosRecientes = resultados[10]?.data || [];
    const respuestasHoy        = resultados[11]?.count || 0;
    const [
      { count: totalClientes },
      { count: totalTareas },
      { count: tareasHoy },
      { count: tareasAtrasadas },
      { count: totalReuinones },
      { count: totalFormularios },
      { data: tareasRecientes },
      { data: eventosProximos },
      { data: usuariosActivos },
      { data: clientesRecientes },
    ] = resultados;

    res.json({
      success: true,
      data: {
        metricas: {
          totalClientes:    totalClientes    || 0,
          totalTareas:      totalTareas      || 0,
          tareasHoy:        tareasHoy        || 0,
          tareasAtrasadas:  tareasAtrasadas  || 0,
          totalReuinones:   totalReuinones   || 0,
          totalFormularios: totalFormularios || 0,
        },
        tareasRecientes:   tareasRecientes   || [],
        eventosProximos:   eventosProximos   || [],
        usuariosActivos:   usuariosActivos   || [],
        totalFormularios: totalFormularios || 0,
          respuestasHoy:    respuestasHoy    || 0,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getMetricas };