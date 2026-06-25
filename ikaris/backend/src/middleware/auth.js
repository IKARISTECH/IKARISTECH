const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario sigue activo en BD
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, rol, empresa_id, activo')
      .eq('id', decoded.usuarioId)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (!usuario.activo) {
      return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
    }

    // Adjuntar al request para uso en controllers
    req.usuario = {
      id:        usuario.id,
      rol:       usuario.rol,
      empresaId: usuario.empresa_id,
      authId:    decoded.sub,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// Middleware de roles
const requireRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return res.status(403).json({
      success: false,
      message: `Requiere rol: ${roles.join(' o ')}`,
    });
  }
  next();
};

module.exports = { authMiddleware, requireRol };