const supabase = require('../config/supabase');

// Obtener layout del usuario
const getLayout = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.usuarioId || req.usuario.id;
    const empresaId = req.usuario.empresaId;

    const { data, error } = await supabase
      .from('dashboard_layouts')
      .select('layout, widgets')
      .eq('usuario_id', usuarioId)
      .single();

    if (error || !data) {
      // Retornar layout vacío si no existe
      return res.json({ success: true, data: { layout: [], widgets: [] } });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Guardar layout del usuario
const saveLayout = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.usuarioId || req.usuario.id;
    const empresaId = req.usuario.empresaId;
    const { layout, widgets } = req.body;

    const { error } = await supabase
      .from('dashboard_layouts')
      .upsert({
        usuario_id: usuarioId,
        empresa_id: empresaId,
        layout,
        widgets,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'usuario_id' });

    if (error) throw error;

    res.json({ success: true, message: 'Layout guardado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLayout, saveLayout };