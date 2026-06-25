const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'IKARIS <no-reply@ikaris.mx>';

// ── Genera código de 6 dígitos ─────────────────────────────────────────────
const generarCodigo = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── Template base HTML ─────────────────────────────────────────────────────
const templateBase = ({ titulo, contenido, codigo, footer }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
          
<!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 32px 24px;text-align:center;">
              <img
                src="https://ytysrkwjcopkgpbfsmmc.supabase.co/storage/v1/object/public/assets/IKARISWHITEWH.png"
                alt="IKARIS"
                width="180"
                style="display:block;margin:0 auto 16px;max-width:180px;height:auto;object-fit:contain;"
              />
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;letter-spacing:-0.3px;">
                ${titulo}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                ${contenido}
              </p>

              <!-- Código -->
              <div style="background:#f3f0ff;border:2px dashed #7c3aed;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
                <p style="color:#6d28d9;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">
                  Tu código de verificación
                </p>
                <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#4c1d95;font-family:'Courier New',monospace;">
                  ${codigo}
                </div>
                <p style="color:#8b5cf6;font-size:12px;margin:10px 0 0;">
                  Válido por <strong>15 minutos</strong>
                </p>
              </div>

              <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
                Si no solicitaste esto, puedes ignorar este correo con seguridad.
                Tu cuenta no será creada sin verificación.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                ${footer || '© Ikaris Tech. Plataforma empresarial segura.'}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Enviar código de registro de empresa ───────────────────────────────────
const enviarCodigoRegistro = async ({ correo, nombre, nombreEmpresa, codigo }) => {
  const { error } = await resend.emails.send({
    from:    FROM,
    to:      correo,
    subject: `${codigo} es tu código de verificación — IKARIS`,
    html: templateBase({
      titulo:   'Verifica tu cuenta',
      contenido: `Hola <strong>${nombre}</strong>, estás a un paso de crear la empresa <strong>${nombreEmpresa}</strong> en IKARIS. Ingresa este código para confirmar tu identidad:`,
      codigo,
      footer:   `Este código fue solicitado para crear la empresa "${nombreEmpresa}".`,
    }),
  });
  if (error) throw new Error(`Error enviando correo: ${error.message}`);
};

// ── Enviar invitación a trabajador ─────────────────────────────────────────
const enviarInvitacionUsuario = async ({ correo, nombre, nombreEmpresa, rol, codigo }) => {
  const linkActivacion = `${process.env.FRONTEND_URL}/activar-cuenta?correo=${encodeURIComponent(correo)}`;
  const { error } = await resend.emails.send({
    from:    FROM,
    to:      correo,
    subject: `Te invitaron a unirte a ${nombreEmpresa} en IKARIS`,
    html: templateBase({
      titulo:   `Invitación a ${nombreEmpresa}`,
      contenido: `Hola <strong>${nombre}</strong>, has sido invitado a unirte a <strong>${nombreEmpresa}</strong> como <strong>${rol}</strong> en IKARIS.<br><br>Usa este código para activar tu cuenta en: <a href="${linkActivacion}" style="color:#7c3aed">${linkActivacion}</a>`,
      codigo,
      footer: `Invitación enviada por un administrador de "${nombreEmpresa}". Si no esperabas esto, ignora este correo.`,
    }),
  });
  if (error) throw new Error(`Error enviando invitación: ${error.message}`);
};

module.exports = {
  generarCodigo,
  enviarCodigoRegistro,
  enviarInvitacionUsuario,
};