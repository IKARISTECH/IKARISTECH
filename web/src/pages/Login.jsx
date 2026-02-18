// web/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";
import { apiFetch } from "../api";
import AuthLayout from "./AuthLayout";
import "./auth.css";
import ikarisLogo from "../assets/IKARIS_ST.png";
import saasImg from "../assets/SAAS.png";
import { FiEye, FiEyeOff } from "react-icons/fi";



export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");          // ✅ FALTABA
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState("error"); // error | ok
  const [loading, setLoading] = useState(false);

useEffect(() => {
  let alive = true;

  async function boot() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      // ✅ Si Supabase detecta refresh token inválido, limpiamos y nos quedamos en /login
      if (error) {
        const msg = String(error?.message || "").toLowerCase();
        if (msg.includes("refresh token") || msg.includes("invalid")) {
          try { await supabase.auth.signOut(); } catch (_) {}
          return; // NO redirigir
        }
      }

      const token = data?.session?.access_token;
      if (token) {
        const from = location?.state?.from || "/dashboard";
        window.location.replace(from);
      }
    } catch (e) {
      // ✅ fallback por si viene como excepción
      const msg = String(e?.message || "").toLowerCase();
      if (msg.includes("refresh token") || msg.includes("invalid")) {
        try { await supabase.auth.signOut(); } catch (_) {}
        return;
      }
    }
  }

  boot();
  return () => { alive = false; };
}, [location?.state?.from]);



  // ✅ helper: si NO quiere mantener sesión, cerramos al cerrar pestaña / recargar
  function armNoRememberLogout() {
    if (remember) return;
    const handler = async () => {
      try {
        await supabase.auth.signOut();
      } catch (_) {}
    };
    window.addEventListener("beforeunload", handler, { once: true });
  }

  async function goAfterLogin() {
    let me = null;

    try {
      me = await apiFetch("/auth/me");
    } catch (e) {
      console.error("[Login] /auth/me error:", e);

      const needsVerification =
        e?.needs_verification ||
        e?.data?.needs_verification ||
        e?.response?.data?.needs_verification;

      const emailFromErr =
        e?.email || e?.data?.email || e?.response?.data?.email || email.trim();

      if (needsVerification) {
        const r = await Swal.fire({
          icon: "warning",
          title: "Verifica tu correo",
          text:
            (e?.provider || e?.data?.provider || e?.response?.data?.provider) === "google"
              ? "Tu empresa aún no está verificada o falta completar configuración."
              : "Tu cuenta existe pero falta confirmar el email. Revisa bandeja y SPAM.",
          showCancelButton: true,
          confirmButtonText: "Reenviar verificación",
          cancelButtonText: "Entendido",
        });

        if (r.isConfirmed) {
          try {
            const { error } = await supabase.auth.resend({
              type: "signup",
              email: emailFromErr,
            });
            if (error) throw error;

            await Swal.fire({
              icon: "success",
              title: "Enlace reenviado",
              text: "Listo. Revisa tu correo y da clic al enlace.",
              confirmButtonText: "Ok",
            });
          } catch (err2) {
            await Swal.fire({
              icon: "error",
              title: "No se pudo reenviar",
              text: err2?.message || "Error reenviando verificación",
              confirmButtonText: "Ok",
            });
          }
        }

        window.location.replace("/login");
        return;
      }

      // Si /auth/me falla por 401/500/timeout, no es onboarding: es fallo de sesión/backend
      try {
        await supabase.auth.signOut();
      } catch (_) {}

      await Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: e?.message || e?.data?.error || "Falló la verificación de sesión en /auth/me",
        confirmButtonText: "Ok",
      });

      window.location.replace("/login");
      return;
    }

    const needsOnboarding =
      me?.needs_onboarding === true ||
      me?.needs_onboarding === 1 ||
      me?.needs_onboarding === "true";

    if (needsOnboarding) {
      await Swal.fire({
        icon: "info",
        title: "Falta completar datos",
        text: "Tu cuenta existe, pero aún no tiene empresa configurada.",
        confirmButtonText: "Completar ahora",
      });
      window.location.replace("/onboarding");
      return;
    }

    if (!me?.company?.id) {
      await Swal.fire({
        icon: "error",
        title: "Error de sesión",
        text: "No se pudo cargar empresa desde /auth/me.",
        confirmButtonText: "Ok",
      });
      window.location.replace("/login");
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Bienvenido",
      text: `Empresa: ${me.company.name}`,
      timer: 1200,
      showConfirmButton: false,
    });

    const from = location?.state?.from || "/dashboard";
    window.location.replace(from);
  }


  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // ✅ si NO recuerda sesión, armamos signOut al recargar/cerrar
      armNoRememberLogout();

      setKind("ok");
      setMsg("Sesión iniciada. Verificando empresa...");
      await goAfterLogin();
    } catch (err) {
      const m = String(err?.message || "");

      if (m.toLowerCase().includes("email") && m.toLowerCase().includes("confirm")) {
        setKind("error");
        setMsg("Tu correo aún no está verificado. Revisa tu bandeja y SPAM.");
      } else {
        setKind("error");
        setMsg(err?.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setMsg("");
    setLoading(true);

    try {
      localStorage.setItem("IKARIS_OAUTH_FLOW", "login");

      const redirectTo = `${window.location.origin}/auth/callback`;

      try {
        await supabase.auth.signOut();
      } catch (_) {}

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (err) {
      setKind("error");
      setMsg(err?.message || "No se pudo iniciar con Google");
      setLoading(false);
    }
  }

return (
<AuthLayout
  brandLogo={ikarisLogo}
  title="Inicia sesión"
  subtitle="Accede a tu empresa y continua tu operación."
  sideImage={saasImg}
  sideTitle="Comienza tu prueba gratuita"
sideText="Todo en un solo lugar para llevar tu empresa."
sidePoints={[
  { k: "cloud",   text: "Listo para usar (no instalas nada)" },
  { k: "forms",   text: "Formularios y evidencia (fotos/archivos)" },
  { k: "flow",    text: "Aprobaciones por área (como un flujo)" },
  { k: "shield",  text: "Permisos por usuario (quién puede qué)" },
  { k: "offline", text: "Funciona sin internet y luego sincroniza" },
  { k: "reports", text: "Reportes claros y seguimiento de cambios" },
]}



>


      {msg ? <div className={`alert ${kind}`}>{msg}</div> : null}

      <div className="auth-form">
        <button
          type="button"
          className="btn-ghost"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continuar con Google
        </button>

        <div className="divider">o inicia con correo</div>

        <form onSubmit={handleLogin} className="auth-form">
          <div>
            <div className="label">Correo</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              required
            />
          </div>

          <div>
            <div className="label">Contraseña</div>

            <div className="pw-wrap">
              <input
                className="input pw-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                className="pw-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPass ? "Ocultar" : "Mostrar"}
              >
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <label
            className="remember-row"
            style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="small">Mantener sesión iniciada</span>
          </label>

          <button className="btn" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="linkrow">
            <Link className="a" to="/register">
              Crear cuenta
            </Link>
            <a className="a" href="#!" onClick={(e) => e.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="small" style={{ marginTop: 8 }}>
            Si tu cuenta requiere verificación, revisa tu correo (y spam). Tienes 24h para confirmar.
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
