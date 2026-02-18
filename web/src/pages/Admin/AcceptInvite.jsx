import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiFetch } from "../../api";
import { supabase } from "../../supabaseClient";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function AcceptInvite() {
  const q = useQuery();
  const nav = useNavigate();
  const token = q.get("token") || "";

  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          await Swal.fire({ icon: "error", title: "Invitación inválida", text: "Falta token." });
          nav("/login", { replace: true });
          return;
        }

        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (!session) {
          await Swal.fire({
            icon: "info",
            title: "Inicia sesión",
            text: "Para aceptar la invitación, inicia sesión (o crea cuenta) con el correo invitado.",
            confirmButtonText: "Ir a login",
          });
          nav("/login", { replace: true, state: { from: `/accept-invite?token=${encodeURIComponent(token)}` } });
          return;
        }

        await apiFetch("/admin/accept-invite", {
          method: "POST",
          body: JSON.stringify({ token }),
        });

        await Swal.fire({
          icon: "success",
          title: "Listo",
          text: "Ya formas parte de la empresa. Entrando al dashboard…",
          timer: 1200,
          showConfirmButton: false,
        });

        nav("/dashboard", { replace: true });
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo aceptar",
          text: e?.message || "Error",
          confirmButtonText: "Ok",
        });
        nav("/login", { replace: true });
      } finally {
        setBusy(false);
      }
    })();
  }, [token, nav]);

  if (busy) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ opacity: 0.8 }}>Procesando invitación…</div>
      </div>
    );
  }

  return null;
}
