const authService         = require('../services/authService');
const verificacionService = require('../services/verificacionService');

const solicitarCodigo = async (req, res, next) => {
  try {
    const { correo, nombre, nombreEmpresa } = req.body;
    if (!correo || !nombre || !nombreEmpresa) {
      return res.status(400).json({ success: false, message: 'Faltan datos' });
    }
    const resultado = await verificacionService.solicitarCodigoRegistro({
      correo, nombre, nombreEmpresa,
    });
    res.json({ success: true, message: resultado.mensaje });
  } catch (err) {
    next(err);
  }
};

const registro = async (req, res, next) => {
  try {
    console.log('[REGISTRO] body recibido:', JSON.stringify(req.body, null, 2));
    const resultado = await authService.registrarEmpresa(req.body);
    res.status(201).json({
      success: true,
      message: 'Empresa y cuenta creadas correctamente',
      data: {
        usuario:      resultado.usuario,
        empresa:      resultado.empresa,
        accessToken:  resultado.accessToken,
        refreshToken: resultado.refreshToken,
      },
    });
} catch (err) {
    console.error('[REGISTRO ERROR]', err);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const resultado = await authService.login(req.body);
    res.json({
      success: true,
      message: 'Sesión iniciada',
      data: {
        usuario:      resultado.usuario,
        empresa:      resultado.empresa,
        accessToken:  resultado.accessToken,
        refreshToken: resultado.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token requerido' });
    }
    const tokens = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.usuario?.id);
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ success: true, data: req.usuario });
};

module.exports = { solicitarCodigo, registro, login, refresh, logout, me };