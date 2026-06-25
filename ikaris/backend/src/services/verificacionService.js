const supabase = require('../config/supabase');
const { generarCodigo, enviarCodigoRegistro, enviarInvitacionUsuario } = require('./emailService');

// ── Crear y guardar código ─────────────────────────────────────────────────
const crearCodigo = async ({ correo, tipo, empresaId = null }) => {
  // Invalidar códigos anteriores del mismo correo+tipo
  await supabase
    .from('codigos_verificacion')
    .update({ usado: true })
    .eq('correo', correo)
    .eq('tipo', tipo)
    .eq('usado', false);

  const codigo = generarCodigo();

  const { error } = await supabase
    .from('codigos_verificacion')
    .insert({
      correo,
      codigo,
      tipo,
      empresa_id: empresaId,
      expira_en:  new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

  if (error) throw new Error('Error generando código');
  return codigo;
};

// ── Solo verifica sin marcar como usado ───────────────────────────────────
const verificarCodigoSinMarcar = async ({ correo, codigo, tipo }) => {
  const { data, error } = await supabase
    .from('codigos_verificacion')
    .select('*')
    .eq('correo', correo)
    .eq('codigo', codigo)
    .eq('tipo', tipo)
    .eq('usado', false)
    .gt('expira_en', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw { status: 400, message: 'Código inválido o expirado' };
  }

  return data;
};

// ── Verifica Y marca como usado ────────────────────────────────────────────
const verificarCodigo = async ({ correo, codigo, tipo }) => {
  const data = await verificarCodigoSinMarcar({ correo, codigo, tipo });

  await supabase
    .from('codigos_verificacion')
    .update({ usado: true })
    .eq('id', data.id);

  return data;
};

// ── Solicitar código de registro ───────────────────────────────────────────
const solicitarCodigoRegistro = async ({ correo, nombre, nombreEmpresa }) => {
  const correoNorm = correo.toLowerCase().trim();

  const { data: existe } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', correoNorm)
    .single();

  if (existe) throw { status: 409, message: 'Este correo ya está registrado' };

  const codigo = await crearCodigo({ correo: correoNorm, tipo: 'registro' });
  await enviarCodigoRegistro({ correo: correoNorm, nombre, nombreEmpresa, codigo });

  return { mensaje: `Código enviado a ${correoNorm}` };
};

// ── Invitar usuario a empresa ──────────────────────────────────────────────
const invitarUsuario = async ({ correo, nombre, nombreEmpresa, rol, empresaId }) => {
  const codigo = await crearCodigo({ correo, tipo: 'invitacion', empresaId });
  await enviarInvitacionUsuario({ correo, nombre, nombreEmpresa, rol, codigo });
  return { mensaje: `Invitación enviada a ${correo}` };
};

module.exports = {
  crearCodigo,
  verificarCodigo,
  verificarCodigoSinMarcar,
  solicitarCodigoRegistro,
  invitarUsuario,
};