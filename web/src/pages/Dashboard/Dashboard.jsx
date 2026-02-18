import React, { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { apiFetch } from "../../api";
import { supabase } from "../../supabaseClient";

import DashboardLayout from "./DashboardLayout";
import DashboardHome from "./DashboardHome";

import ForcePasswordChangeModal from "./components/Auth/ForcePasswordChangeModal";

import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ evita abrir el modal 2 veces
  const pwModalShownRef = useRef(false);

  // ✅ modal pro (react)
  const [pwOpen, setPwOpen] = useState(false);

// ✅ one-time guard por usuario + empresa (evita reabrir aunque backend mande true)
function pwDoneKey(me) {
  const uid = String(me?.user?.id || me?.membership?.auth_user_id || "");
  const cid = String(me?.company?.id || me?.membership?.company_id || "");
  return `IKARIS_PW_DONE_${cid}_${uid}`;
}

function hasPwDone(me) {
  try {
    return localStorage.getItem(pwDoneKey(me)) === "1";
  } catch (_) {
    return false;
  }
}

function setPwDone(me) {
  try {
    localStorage.setItem(pwDoneKey(me), "1");
  } catch (_) {}
}


  async function loadMe() {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/me");

      // Si no hay empresa, mandamos onboarding (por seguridad)
      if (!data?.company?.id) {
        await Swal.fire({
          icon: "info",
          title: "Falta completar datos",
          text: "Tu cuenta existe, pero aún no tiene empresa configurada.",
          confirmButtonText: "Completar ahora",
        });
        window.location.replace("/onboarding");
        return;
      }

      setMe(data);
  } catch (e) {
    console.error("[Dashboard] /auth/me error:", e);

    // ✅ IMPORTANTÍSIMO: si el token/refresh está mal, limpia sesión para evitar loop
    try {
      await supabase.auth.signOut();
    } catch (_) {}

    window.location.replace("/login");
  } finally {
    setLoading(false);
  }

  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
useEffect(() => {
  const must = me?.membership?.must_change_password === true;

  // ✅ si no aplica, no abrir
  if (!must) return;

  // ✅ si ya se completó antes (en este navegador), no abrir nunca más
  if (hasPwDone(me)) return;

  // ✅ Solo una vez por sesión/entrada (evita dobles renders)
  if (pwModalShownRef.current) return;
  pwModalShownRef.current = true;

  setPwOpen(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [me?.membership?.must_change_password, me?.user?.id, me?.company?.id]);

// ✅ si ya no aplica, libera el ref para futuras sesiones limpias
useEffect(() => {
  if (me?.membership?.must_change_password !== true) {
    pwModalShownRef.current = false;
  }
}, [me?.membership?.must_change_password]);


  const ctx = useMemo(() => {
    // ✅ ROL REAL: viene en membership.role
    const role =
      me?.membership?.role ||
      me?.companyUser?.role ||
      me?.user?.role ||
      me?.role ||
      "POLITES";

    return {
      me,
      user: me?.user || null,
      membership: me?.membership || null,
      role,
      company: me?.company || null,
      loading,
      refreshMe: loadMe,
      async logout() {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        window.location.replace("/login");
      },
      go(path) {
        navigate(path);
      },
    };
  }, [me, loading, navigate]);

  return (
    <DashboardLayout ctx={ctx}>
      <ForcePasswordChangeModal
        open={pwOpen && me?.membership?.must_change_password === true}
        displayName={String(me?.membership?.full_name || me?.user?.user_metadata?.full_name || "").trim()}
        email={String(me?.user?.email || "")}
onDone={async () => {
  // ✅ marca como completado (1 sola vez)
  setPwDone(me);

  // ✅ cierra y refresca
  setPwOpen(false);
  await loadMe();
}}

      />

      <DashboardHome ctx={ctx} />
    </DashboardLayout>
  );

}
