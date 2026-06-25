const supabase  = require('../config/supabase');
const jwt       = require('jsonwebtoken');
const https     = require('https');
const { verificarCodigo, verificarCodigoSinMarcar } = require('./verificacionService');

// ── Generar tokens JWT ─────────────────────────────────────────────────────
const generarTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

// ── Crear usuario en Supabase Auth via fetch directo ──────────────────────
const crearAuthUser = async (email, password) => {
  const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users`;
  const body = JSON.stringify({
    email,
    password,
    email_confirm: true,
  });

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body,
  });

  const data = await response.json();
  console.log('[FETCH AUTH] status:', response.status);
  console.log('[FETCH AUTH] data:', JSON.stringify(data));

  if (!response.ok || !data.id) {
    throw { status: 400, message: data.msg || data.message || 'Error al crear usuario en Auth' };
  }

  return data;
};

// ── Eliminar usuario de Auth (rollback) ───────────────────────────────────
const eliminarAuthUser = async (authUserId) => {
  try {
    const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users/${authUserId}`;
    await fetch(url, {
      method:  'DELETE',
      headers: {
        'apikey':        process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
  } catch (e) {
    console.error('[ROLLBACK ERROR]', e);
  }
};

// ── Registro con código verificado ────────────────────────────────────────
const registrarEmpresa = async ({ nombreEmpresa, nombre, apellido, correo, password, codigo }) => {
  const correoNorm = correo.toLowerCase().trim();

  // 1. Verificar código SIN marcarlo todavía
  await verificarCodigoSinMarcar({ correo: correoNorm, codigo, tipo: 'registro' });

  // 2. Crear usuario en Supabase Auth via REST
  const authUser = await crearAuthUser(correoNorm, password);
  const authUserId = authUser.id;

  try {
    // 3. Crear empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({ nombre: nombreEmpresa, plan: 'gratis' })
      .select()
      .single();
    if (empresaError) throw empresaError;

    // 4. Departamentos por defecto
    await supabase.rpc('crear_departamentos_default', { p_empresa_id: empresa.id });

    // 5. Crear usuario dueño
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        empresa_id:   empresa.id,
        auth_user_id: authUserId,
        nombre,
        apellido,
        correo:       correoNorm,
        rol:          'dueño',
      })
      .select()
      .single();
    if (usuarioError) throw usuarioError;

    // 6. Todo exitoso — marcar código como usado
    await verificarCodigo({ correo: correoNorm, codigo, tipo: 'registro' });

    // 7. Generar tokens
    const payload = {
      sub:       authUserId,
      usuarioId: usuario.id,
      empresaId: empresa.id,
      rol:       'dueño',
    };
    return { usuario, empresa, ...generarTokens(payload) };

  } catch (err) {
    console.error('[REGISTRO ROLLBACK]', err);
    await eliminarAuthUser(authUserId);
    throw { status: 500, message: err.message || 'Error al crear la empresa' };
  }
};

// ── Login ──────────────────────────────────────────────────────────────────
const login = async ({ correo, password }) => {
  const correoNorm = correo.toLowerCase().trim();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email:    correoNorm,
    password,
  });
  if (authError) throw { status: 401, message: 'Correo o contraseña incorrectos' };

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select(`id, nombre, apellido, correo, rol, avatar_url, activo, empresa_id, departamentos(id, nombre)`)
    .eq('auth_user_id', authData.user.id)
    .single();

  if (usuarioError || !usuario) throw { status: 401, message: 'Usuario no encontrado' };
  if (!usuario.activo) throw { status: 403, message: 'Tu cuenta está desactivada' };

  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, nombre, plan, logo_url')
    .eq('id', usuario.empresa_id)
    .single();

  await supabase
    .from('usuarios')
    .update({ online: true, ultima_conexion: new Date().toISOString() })
    .eq('id', usuario.id);

  const payload = {
    sub:       authData.user.id,
    usuarioId: usuario.id,
    empresaId: usuario.empresa_id,
    rol:       usuario.rol,
  };
  return { usuario, empresa, ...generarTokens(payload) };
};

// ── Refresh ────────────────────────────────────────────────────────────────
const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error();

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, rol, empresa_id, activo')
      .eq('id', decoded.usuarioId)
      .single();

    if (!usuario?.activo) throw new Error();

    const payload = {
      sub:       decoded.sub,
      usuarioId: usuario.id,
      empresaId: usuario.empresa_id,
      rol:       usuario.rol,
    };
    return generarTokens(payload);
  } catch {
    throw { status: 401, message: 'Refresh token inválido o expirado' };
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────
const logout = async (usuarioId) => {
  if (usuarioId) {
    await supabase
      .from('usuarios')
      .update({ online: false })
      .eq('id', usuarioId);
  }
};

module.exports = { registrarEmpresa, login, refreshToken, logout };