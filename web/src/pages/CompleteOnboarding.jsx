// web/src/pages/CompleteOnboarding.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { apiFetch } from "../api";
import AuthLayout from "./AuthLayout";
import "./auth.css";

const SECTORS = [
  "Manufactura automotriz",
  "Manufactura electrónica",
  "Industria alimentaria",
  "Industria farmacéutica",
  "Construcción e infraestructura",
  "Energía renovable",
  "Petróleo y gas",
  "Comercio minorista (retail)",
  "Comercio mayorista",
  "Comercio electrónico (e-commerce)",
  "Transporte terrestre de carga",
  "Transporte marítimo",
  "Transporte aéreo",
  "Logística y cadena de suministro",
  "Desarrollo de software",
  "Servicios de tecnología e IT",
  "Servicios financieros y banca",
  "Seguros y aseguradoras",
  "Bienes raíces e inmobiliaria",
  "Turismo y hotelería",
  "Restaurantes y alimentos preparados",
  "Telecomunicaciones",
  "Agricultura y agroindustria",
  "Ganadería y producción pecuaria",
  "Minería",
  "Medios de comunicación y publicidad",
  "Educación privada",
  "Servicios médicos y hospitales",
  "Consultoría empresarial",
  "Entretenimiento y videojuegos",
  "OTRO",
];

const ORG_TYPES = [
  "Empresas con fines de lucro",
  "Empresas sin fines de lucro",
  "Empresas públicas",
  "Empresas privadas",
  "Empresas mixtas",
  "OTRO",
];

function slugifyCompany(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

function useMediaQuery(query) {
  const get = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);

    if (m.addEventListener) m.addEventListener("change", onChange);
    else m.addListener(onChange);

    setMatches(m.matches);

    return () => {
      if (m.removeEventListener) m.removeEventListener("change", onChange);
      else m.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

export default function CompleteOnboarding() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // ✅ SOLO móvil (bajo 900px) usa wizard
  const stepMode = useMediaQuery("(max-width: 900px)");

  // ✅ Wizard step: 1..2 (solo aplica en móvil)
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    representative_name: "",
    company_name: "",
    country: "México",
    sector: SECTORS[0],
    organization_type: ORG_TYPES[0],
    marketing_opt_in: false,
  });

  useEffect(() => {
    const fromState = location.state?.prefill || null;
    const fromLsRaw = localStorage.getItem("IKARIS_PENDING_COMPANY");
    const fromLs = fromLsRaw ? JSON.parse(fromLsRaw) : null;

    const p = fromState || fromLs;
    if (!p) return;

    setForm((s) => ({
      ...s,
      representative_name: p.representative_name || s.representative_name,
      company_name: p.company_name || s.company_name,
      country: p.country || s.country,
      sector: p.sector || s.sector,
      organization_type: p.organization_type || s.organization_type,
      marketing_opt_in: !!p.marketing_opt_in,
    }));
  }, [location.state]);

  const company_slug = useMemo(() => slugifyCompany(form.company_name), [form.company_name]);
  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();

    // ✅ en móvil wizard, solo submit en step 2
    if (stepMode && step !== 2) return;

    setLoading(true);
    try {
      await apiFetch("/auth/register-company", {
        method: "POST",
        body: JSON.stringify({
          representative_name: form.representative_name?.trim(),
          company_name: form.company_name?.trim(),
          company_slug, // ✅ SE ENVÍA (pero NO se muestra)
          country: form.country?.trim(),
          sector: form.sector,
          organization_type: form.organization_type,
          marketing_opt_in: !!form.marketing_opt_in,
        }),
      });

      localStorage.removeItem("IKARIS_PENDING_COMPANY");

      await Swal.fire({
        icon: "success",
        title: "Empresa creada",
        text: "Listo. Ya puedes usar IKARIS.",
        confirmButtonText: "Entrar",
      });

      window.location.replace("/dashboard");
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo completar",
        text: err?.message || "Error creando empresa",
        confirmButtonText: "Ok",
      });
    } finally {
      setLoading(false);
    }
  }

  async function goNext() {
    if (!stepMode) return;

    if (step === 1) {
      const rep = String(form.representative_name || "").trim();
      const comp = String(form.company_name || "").trim();
      if (!rep || !comp) {
        await Swal.fire({
          icon: "warning",
          title: "Faltan datos",
          text: "Completa el nombre del representante y la empresa.",
          confirmButtonText: "Ok",
        });
        return;
      }
      setStep(2);
    }
  }

  function goBack() {
    if (!stepMode) return;
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <AuthLayout
      title="Completar registro"
      subtitle="Solo falta crear tu empresa para empezar."
      sideTitle="Onboarding"
      sideText="Esto define tu espacio multi-empresa y tu rol ARCHON."
      hideRight
    >
      {/* =========================
         DESKTOP (sin steps)
      ========================= */}
      {!stepMode ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <div className="label">Nombre y apellidos del representante</div>
            <input
              className="input"
              value={form.representative_name}
              onChange={(e) => onChange("representative_name", e.target.value)}
              required
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <div className="label">Empresa</div>
            <input
              className="input"
              value={form.company_name}
              onChange={(e) => onChange("company_name", e.target.value)}
              required
              placeholder="Nombre de la empresa"
            />
          </div>

          <div className="row2">
            <div>
              <div className="label">País</div>
              <input
                className="input"
                value={form.country}
                onChange={(e) => onChange("country", e.target.value)}
                required
              />
            </div>

            <div>
              <div className="label">Sector</div>
              <select
                className="select"
                value={form.sector}
                onChange={(e) => onChange("sector", e.target.value)}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="label">Tipo de organización</div>
            <select
              className="select"
              value={form.organization_type}
              onChange={(e) => onChange("organization_type", e.target.value)}
            >
              {ORG_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.marketing_opt_in}
              onChange={(e) => onChange("marketing_opt_in", e.target.checked)}
            />
            Acepto recibir correos con actualizaciones/ofertas (opcional)
          </label>

          <button className="btn" disabled={loading} type="submit">
            {loading ? "Creando..." : "Crear empresa y entrar"}
          </button>
        </form>
      ) : null}

      {/* =========================
         MÓVIL (wizard con steps)
      ========================= */}
      {stepMode ? (
        <div className="auth-steps">
          <div className="auth-stepper" aria-label="Progreso de onboarding">
            <div className={`auth-step ${step >= 1 ? "on" : ""}`}>
              <div className="auth-step__dot">1</div>
              <div className="auth-step__label">Empresa</div>
            </div>
            <div className={`auth-step__line ${step >= 2 ? "on" : ""}`} />
            <div className={`auth-step ${step >= 2 ? "on" : ""}`}>
              <div className="auth-step__dot">2</div>
              <div className="auth-step__label">Detalles</div>
            </div>
          </div>

          <div className="auth-stepbox">
            <form className="auth-form" onSubmit={handleSubmit}>
              {step === 1 ? (
                <>
                  <div>
                    <div className="label">Nombre y apellidos del representante</div>
                    <input
                      className="input"
                      value={form.representative_name}
                      onChange={(e) => onChange("representative_name", e.target.value)}
                      required
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div>
                    <div className="label">Empresa</div>
                    <input
                      className="input"
                      value={form.company_name}
                      onChange={(e) => onChange("company_name", e.target.value)}
                      required
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div className="auth-step-actions">
                    <span />
                    <button type="button" className="btn" onClick={goNext} disabled={loading}>
                      Siguiente
                    </button>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div>
                    <div className="label">País</div>
                    <input
                      className="input"
                      value={form.country}
                      onChange={(e) => onChange("country", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div className="label">Sector</div>
                    <select
                      className="select"
                      value={form.sector}
                      onChange={(e) => onChange("sector", e.target.value)}
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="label">Tipo de organización</div>
                    <select
                      className="select"
                      value={form.organization_type}
                      onChange={(e) => onChange("organization_type", e.target.value)}
                    >
                      {ORG_TYPES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="check">
                    <input
                      type="checkbox"
                      checked={form.marketing_opt_in}
                      onChange={(e) => onChange("marketing_opt_in", e.target.checked)}
                    />
                    Acepto recibir correos con actualizaciones/ofertas (opcional)
                  </label>

                  <div className="auth-step-actions">
                    <button type="button" className="btn-ghost" onClick={goBack} disabled={loading}>
                      Atrás
                    </button>

                    <button className="btn" disabled={loading} type="submit">
                      {loading ? "Creando..." : "Crear empresa y entrar"}
                    </button>
                  </div>
                </>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </AuthLayout>
  );
}