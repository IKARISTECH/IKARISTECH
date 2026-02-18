const nodemailer = require("nodemailer");

function mustEnv(name) {
  if (!process.env[name]) throw new Error(`Missing env ${name}`);
  return process.env[name];
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTransport() {
  const host = mustEnv("SMTP_HOST");
  const port = Number(mustEnv("SMTP_PORT"));
  const user = mustEnv("SMTP_USER");
  const pass = mustEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 true, 587 false
    auth: { user, pass },

    // ✅ CLAVE: evita “cuelgues”
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,

    // ✅ Gmail 587 a veces ocupa STARTTLS (nodemailer lo hace solo, pero esto ayuda)
    requireTLS: port === 587,
  });
}

async function sendWelcomeEmail({ to, representativeName, companyName }) {
  const from = mustEnv("SMTP_FROM");
  const transporter = getTransport();

  const subject = `Bienvenido a IKARIS, ${companyName || "tu empresa"}`;

  const html = `
  <div style="font-family:Arial,sans-serif; line-height:1.5; color:#111;">
    <h2>Bienvenido a IKARIS</h2>
    <p>Hola <b>${escapeHtml(representativeName || "equipo")}</b>,</p>
    <p>Tu espacio de empresa <b>${escapeHtml(companyName || "IKARIS")}</b> ya está listo.</p>
    <p>Ya puedes crear formularios, gestionar roles y operar con trazabilidad.</p>
    <br/>
    <p style="font-size:12px; opacity:.7">— IKARIS TECH</p>
  </div>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

// ✅ NUEVO: invitación con mensaje tipo “Te han invitado…”
async function sendInviteEmail({ to, companyName, acceptUrl, invitedByEmail }) {
  const from = mustEnv("SMTP_FROM");
  const transporter = getTransport();

  const subject = `Te han invitado a formar parte de ${companyName}`;

  const html = `
  <div style="font-family:Arial,sans-serif; line-height:1.5; color:#111;">
    <h2>Invitación a empresa</h2>
    <p>Te han invitado a formar parte de <b>${escapeHtml(companyName)}</b> en IKARIS.</p>
    ${invitedByEmail ? `<p>Invitado por: <b>${escapeHtml(invitedByEmail)}</b></p>` : ""}
    <p>Para aceptar la invitación, haz clic aquí:</p>

    <p>
      <a href="${acceptUrl}"
         style="display:inline-block;padding:12px 16px;border-radius:12px;text-decoration:none;border:1px solid #111;color:#111;font-weight:800">
        Aceptar invitación
      </a>
    </p>

    <p style="font-size:12px; opacity:.75">
      Si no esperabas este correo, puedes ignorarlo.
    </p>
    <p style="font-size:12px; opacity:.7">— IKARIS TECH</p>
  </div>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

// ✅ NUEVO: reset password (sin mostrar contraseña)
async function sendResetPasswordEmail({ to, companyName, resetUrl }) {
  const from = mustEnv("SMTP_FROM");
  const transporter = getTransport();

  const subject = `Restablecer contraseña — ${companyName || "IKARIS"}`;

  const html = `
  <div style="font-family:Arial,sans-serif; line-height:1.5; color:#111;">
    <h2>Restablecer contraseña</h2>
    <p>Se solicitó restablecer tu contraseña para <b>${escapeHtml(companyName || "IKARIS")}</b>.</p>
    <p>Haz clic aquí para crear una nueva contraseña:</p>

    <p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 16px;border-radius:12px;text-decoration:none;border:1px solid #111;color:#111;font-weight:800">
        Cambiar contraseña
      </a>
    </p>

    <p style="font-size:12px; opacity:.75">
      Si no fuiste tú, ignora este correo.
    </p>
    <p style="font-size:12px; opacity:.7">— IKARIS TECH</p>
  </div>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

module.exports = {
  sendWelcomeEmail,
  sendInviteEmail,
  sendResetPasswordEmail,
};
