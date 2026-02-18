    import React, { useEffect, useMemo, useRef, useState } from "react";
    import { createPortal } from "react-dom";
    import { supabase } from "../../../../supabaseClient";
    import { apiFetch } from "../../../../api";

    import Swal from "sweetalert2";
    import "./forcePasswordChangeModal.css";

    function getPasswordChecks(pw) {
    const s = String(pw || "");
    return {
        len: s.length >= 8,
        upper: /[A-Z]/.test(s),
        lower: /[a-z]/.test(s),
        number: /[0-9]/.test(s),
        symbol: /[^A-Za-z0-9]/.test(s),
        forbidden: !/[.,;'"´“”]/.test(s),
    };
    }

    export default function ForcePasswordChangeModal({
    open,
    displayName = "",
    email = "",
    onDone,
    }) {
    const pwBoxRef = useRef(null);
    const confirmBoxRef = useRef(null);


    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
const [openTip, setOpenTip] = useState(null); // "pw" | "confirm" | null
const [showPw, setShowPw] = useState(false);
const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [saving, setSaving] = useState(false);

    const checks = useMemo(() => getPasswordChecks(pw), [pw]);

    const allOk =
        checks.len &&
        checks.upper &&
        checks.lower &&
        checks.number &&
        checks.symbol &&
        checks.forbidden;

    const matchOk = pw.length > 0 && pw === pw2;

    const canSave = allOk && matchOk && !saving;

    // ✅ reset cuando abre + bloquea scroll del body
    useEffect(() => {
        if (!open) return;

        setPw("");
        setPw2("");
setShowPw(false);
setShowConfirmPw(false);
setOpenTip(null);

        setSaving(false);

        // 🔒 scroll lock
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
        document.body.style.overflow = prev;
        };
    }, [open]);


// ✅ cerrar submenu (reglas + match) al click fuera / ESC
useEffect(() => {
  if (!open) return;

  const onDown = (e) => {
    const t = e.target;

    const inPw = pwBoxRef.current && pwBoxRef.current.contains(t);
    const inConfirm = confirmBoxRef.current && confirmBoxRef.current.contains(t);

    // ✅ click fuera = cerrar ambos
    if (!inPw && !inConfirm) {
setOpenTip(null);

    }
  };

  const onEsc = (e) => {
    if (e.key === "Escape") {
   setOpenTip(null);

    }
  };

  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("keydown", onEsc);

  return () => {
    document.removeEventListener("pointerdown", onDown, true);
    document.removeEventListener("keydown", onEsc);
  };
}, [open]);

    // ✅ Enter = Guardar (cuando sea válido)
    useEffect(() => {
        if (!open) return;

        function onKey(e) {
        if (e.key === "Enter") {
            // evita submits raros si hay inputs
            e.preventDefault();
            if (canSave) doSave().catch(() => {});
        }
        }

        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, canSave]); // eslint-disable-line react-hooks/exhaustive-deps

    async function doSave() {
        if (!canSave) {
        await Swal.fire({
            icon: "warning",
            title: "Contraseña inválida",
            text: !allOk ? "Cumple los requisitos de seguridad." : "Las contraseñas no coinciden.",
        });
        return;
        }

        setSaving(true);
        try {
        // ✅ Cambia password (usuario ya logueado)
        const { error } = await supabase.auth.updateUser({ password: pw });
        if (error) throw error;

        // ✅ Apaga flag en DB
        await apiFetch("/auth/mark-password-changed", { method: "POST" });

        await Swal.fire({
            icon: "success",
            title: "Contraseña actualizada",
            timer: 1200,
            showConfirmButton: false,
        });

        onDone?.();
        } catch (e) {
        await Swal.fire({
            icon: "error",
            title: "No se pudo cambiar",
            text: e?.message || "Error cambiando contraseña",
        });
        } finally {
        setSaving(false);
        }
    }

    if (!open) return null;

    return createPortal(
        <div className="ikpw-overlay" aria-hidden="false">
        <div className="ikpw-modal" role="dialog" aria-modal="true">
            <div className="ikpw-head">
            <div className="ikpw-ico">!</div>

            <div className="ikpw-titles">
                <div className="ikpw-h1">Cambia tu contraseña</div>
                <div className="ikpw-sub">
                Esta cuenta fue creada con contraseña temporal. Debes cambiarla para continuar.
                </div>

                {(displayName || email) ? (
                <div className="ikpw-meta">
                    <span className="ikpw-metaLbl">Usuario:</span>
                    <span className="ikpw-metaVal">{displayName || email}</span>
                </div>
                ) : null}
            </div>
            </div>

            <div className="ikpw-body">
            <div className="ikpw-grid">
{/* PASSWORD */}
<div ref={pwBoxRef} style={{ position: "relative" }} className="ikpw-field">
  <div className="ikpw-lab">Nueva contraseña</div>

  <div className="pw-wrap">
    <input
      className="ikpw-input pw-input"
      type={showPw ? "text" : "password"}
      value={pw}
      onChange={(e) => setPw(e.target.value)}
      onFocus={() => setOpenTip("pw")}
      placeholder="Mínimo 8 caracteres"
      autoComplete="new-password"
      autoFocus
    />

    <button
      type="button"
      className="pw-eye"
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      <span className={`eye-ic ${showPw ? "on" : ""}`} />
    </button>
  </div>

  {openTip === "pw" && (
    <div className="pw-float">
      <div className="pw-title">Tu contraseña debe cumplir:</div>

      <div className={`pw-item ${checks.len ? "ok" : "bad"}`}>
        <span className="pw-dot" />
        <span>Al menos 8 caracteres</span>
      </div>

      <div className={`pw-item ${checks.upper ? "ok" : "bad"}`}>
        <span className="pw-dot" />
        <span>Al menos 1 mayúscula (A-Z)</span>
      </div>

      <div className={`pw-item ${checks.lower ? "ok" : "bad"}`}>
        <span className="pw-dot" />
        <span>Al menos 1 minúscula (a-z)</span>
      </div>

      <div className={`pw-item ${checks.number ? "ok" : "bad"}`}>
        <span className="pw-dot" />
        <span>Al menos 1 número (0-9)</span>
      </div>

      <div className={`pw-item ${checks.symbol ? "ok" : "bad"}`}>
        <span className="pw-dot" />
        <span>Al menos 1 símbolo (!@#$…)</span>
      </div>

      <div className={`pw-item ${checks.forbidden ? "ok" : "bad"}`}>
        <span className="pw-dot" />
        <span>No usar: . , ; comillas ' " ni ´</span>
      </div>
    </div>
  )}
</div>


{/* CONFIRM */}
<div ref={confirmBoxRef} style={{ position: "relative" }} className="ikpw-field">
  <div className="ikpw-lab">Confirmación</div>

  <div className="pw-wrap">
    <input
      className="ikpw-input pw-input"
      type={showConfirmPw ? "text" : "password"}
      value={pw2}
      onChange={(e) => setPw2(e.target.value)}
      onFocus={() => setOpenTip("confirm")}
      placeholder="Repite la contraseña"
      autoComplete="new-password"
    />

    <button
      type="button"
      className="pw-eye"
      onClick={() => setShowConfirmPw((v) => !v)}
      aria-label={showConfirmPw ? "Ocultar confirmación" : "Mostrar confirmación"}
    >
      <span className={`eye-ic ${showConfirmPw ? "on" : ""}`} />
    </button>
  </div>

  {openTip === "confirm" && (
    <div className="pw-float">
      <div className="pw-title">Confirmación:</div>

      {!pw2 ? (
        <div className="pw-item bad">
          <span className="pw-dot" />
          <span>Escribe la confirmación</span>
        </div>
      ) : matchOk ? (
        <div className="pw-item ok">
          <span className="pw-dot" />
          <span>Las contraseñas coinciden</span>
        </div>
      ) : (
        <div className="pw-item bad">
          <span className="pw-dot" />
          <span>Las contraseñas no coinciden</span>
        </div>
      )}
    </div>
  )}
</div>


   
            </div>

            <div className="ikpw-foot">
                <div className="ikpw-hint">
                Recomendado: mayúscula, minúscula, número y símbolo.
                </div>

                <button
                className={`ikpw-btn ${canSave ? "is-on" : ""}`}
                onClick={() => doSave().catch(() => {})}
                disabled={!canSave}
                >
                {saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
            </div>
        </div>
        </div>,
        document.body
    );
    }
