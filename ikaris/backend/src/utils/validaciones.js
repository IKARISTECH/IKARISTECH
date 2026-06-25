const { z } = require('zod');

const registroSchema = z.object({
  nombreEmpresa: z.string().min(2).max(100),
  nombre:        z.string().min(2).max(50),
  apellido:      z.string().min(2).max(50),
  correo:        z.string().email('Correo inválido'),
  password:      z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  codigo:        z.string().length(6, 'El código debe tener 6 dígitos'),
});

const loginSchema = z.object({
  correo:   z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const codigoSchema = z.object({
  correo: z.string().email(),
  codigo: z.string().length(6),
  tipo:   z.enum(['registro', 'invitacion']),
});

const validar = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errores: err.errors.map((e) => ({
        campo:   e.path.join('.'),
        mensaje: e.message,
      })),
    });
  }
};

module.exports = { registroSchema, loginSchema, codigoSchema, validar };