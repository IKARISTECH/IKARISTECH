const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} — ${req.method} ${req.path}`);
  console.error(err.stack || JSON.stringify(err));

  if (err.message === 'No autorizado por CORS') {
    return res.status(403).json({ success: false, message: 'Acceso denegado.' });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errores: err.errors.map((e) => ({ campo: e.path.join('.'), mensaje: e.message })),
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }

  // ── Errores lanzados como objetos { status, message } ──────────────────
  if (err.status && err.message) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  res.status(500).json({ success: false, message: 'Error interno del servidor.' });
};

module.exports = { errorHandler };