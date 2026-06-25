const express  = require('express');
const router   = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supabase = require('../config/supabase');

// GET /api/calendario — eventos del mes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { empresaId } = req.usuario;
    const { desde, hasta } = req.query;

    let query = supabase
      .from('eventos_calendario')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha_inicio', { ascending: true });

    if (desde) query = query.gte('fecha_inicio', desde);
    if (hasta) query = query.lte('fecha_inicio', hasta);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/calendario — crear evento
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { empresaId, usuarioId } = req.usuario;
    const { titulo, descripcion, tipo, color, fecha_inicio, fecha_fin, todo_el_dia, visible_para } = req.body;

    if (!titulo || !fecha_inicio) {
      return res.status(400).json({ success: false, message: 'Título y fecha son requeridos' });
    }

    const { data, error } = await supabase
      .from('eventos_calendario')
      .insert({
        empresa_id:   empresaId,
        creado_por:   usuarioId,
        titulo,
        descripcion:  descripcion || null,
        tipo:         tipo || 'actividad',
        color:        color || '#7c3aed',
        fecha_inicio,
        fecha_fin:    fecha_fin || null,
        todo_el_dia:  todo_el_dia || false,
        visible_para: visible_para || 'empresa',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/calendario/:id — actualizar evento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { empresaId } = req.usuario;
    const { titulo, descripcion, tipo, color, fecha_inicio, fecha_fin, todo_el_dia, visible_para } = req.body;

    const { data, error } = await supabase
      .from('eventos_calendario')
      .update({ titulo, descripcion, tipo, color, fecha_inicio, fecha_fin, todo_el_dia, visible_para, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/calendario/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { empresaId } = req.usuario;
    const { error } = await supabase
      .from('eventos_calendario')
      .delete()
      .eq('id', req.params.id)
      .eq('empresa_id', empresaId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// GET /api/calendario/proximos — próximos 24h para notificaciones
router.get('/proximos', authMiddleware, async (req, res) => {
  try {
    const { empresaId, usuarioId } = req.usuario;
    const ahora  = new Date().toISOString();
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('eventos_calendario')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('fecha_inicio', ahora)
      .lte('fecha_inicio', manana)
      .order('fecha_inicio', { ascending: true })
      .limit(10);

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;    