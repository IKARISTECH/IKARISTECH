import React, { useEffect, useMemo, useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import OnboardingModal from "../../Auth/OnboardingModal";
import { supabase } from "../../supabaseClient";
import { apiFetch } from "../../api";


function PresenceTracker({ ctx }) {
  useEffect(() => {
    let ch = null;
    let heartbeat = null;
    let dbHeartbeat = null;
    let alive = true;

const emit = (onlineSet, lastSeenObj, activityObj = null) => {
  try {
    const payload = {
      online: Array.from(onlineSet || [])
        .map((x) => String(x || "").trim())
        .filter(Boolean),

      lastSeen: lastSeenObj || {},

      // ✅ NUEVO: activity map { authId: iso }
      activity:
        activityObj ||
        (window.__IK_PRESENCE_ACTIVITY__ && typeof window.__IK_PRESENCE_ACTIVITY__ === "object"
          ? window.__IK_PRESENCE_ACTIVITY__
          : {}),
    };

    localStorage.setItem("IKARIS_PRESENCE_STATE", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("ik_presence_update", { detail: payload }));
  } catch (_) {}
};



    async function boot() {
      const companyId =
        ctx?.company?.id ||
        ctx?.membership?.company_id ||
        ctx?.me?.company?.id ||
        null;

      if (!companyId) return;

      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user?.id) return;

      const authId = String(user.id);

      // ✅ estado inicial desde localStorage (por si AdminPanel abre antes)
      let onlineSet = new Set();
      let lastSeen = {};
      try {
        const raw = localStorage.getItem("IKARIS_PRESENCE_STATE");
        const j = raw ? JSON.parse(raw) : null;
        onlineSet = new Set((j?.online || []).map(String));
        lastSeen = j?.lastSeen || {};
      } catch (_) {}
      emit(onlineSet, lastSeen);

      ch = supabase.channel(`ik_presence_${companyId}`, {
        config: { presence: { key: authId } },
      });

ch.on("presence", { event: "sync" }, () => {
  if (!alive) return;
  const state = ch.presenceState() || {};
  const keys = Object.keys(state).map(String);

  onlineSet = new Set(keys);

  // ✅ lastSeen (fallback) + activityMap real desde payload
  const nowIso = new Date().toISOString();
  const nextSeen = { ...(lastSeen || {}) };
  const nextAct = { ...(window.__IK_PRESENCE_ACTIVITY__ || {}) };

  keys.forEach((k) => {
    nextSeen[k] = nowIso;

    // presenceState[k] es array de metas (sessions)
    const metas = Array.isArray(state?.[k]) ? state[k] : [];
    // toma el meta más reciente que tenga last_active_at
    let best = null;
    for (const m of metas) {
      const la = m?.last_active_at || m?.online_at || null;
      if (!la) continue;
      if (!best) best = la;
      else if (new Date(la).getTime() > new Date(best).getTime()) best = la;
    }
    if (best) nextAct[k] = String(best);
  });

  lastSeen = nextSeen;

  // ✅ guardamos activity en un global local para reuso
  window.__IK_PRESENCE_ACTIVITY__ = nextAct;

  // ✅ emit ahora incluye activity
  try {
    const payload = {
      online: Array.from(onlineSet || []).map(String).filter(Boolean),
      lastSeen: lastSeen || {},
      activity: nextAct || {},
    };
    localStorage.setItem("IKARIS_PRESENCE_STATE", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("ik_presence_update", { detail: payload }));
  } catch (_) {}
});


      ch.on("presence", { event: "join" }, ({ key }) => {
        if (!alive || !key) return;
        const k = String(key);

        onlineSet = new Set([...(onlineSet || []), k]);
        lastSeen = { ...(lastSeen || {}), [k]: new Date().toISOString() };

        emit(onlineSet, lastSeen);
      });

      ch.on("presence", { event: "leave" }, ({ key }) => {
        if (!alive || !key) return;
        const k = String(key);

        const n = new Set(onlineSet || []);
        n.delete(k);
        onlineSet = n;

        emit(onlineSet, lastSeen);
      });

await ch.subscribe(async (status) => {
  if (!alive) return;

  if (status === "SUBSCRIBED") {
    // ======================================================
    // ✅ ACTIVITY TRACKER (para estado AUSENTE en AdminPanel)
    // - last_active_at se actualiza por eventos reales (mouse/keyboard/etc)
    // - heartbeat mantiene presencia (aunque se throttle en background)
    // ======================================================

    let lastActiveAt = new Date().toISOString();
    let lastSentAtMs = 0;

    const safeTrack = async (force = false) => {
      const nowMs = Date.now();
      // throttle: no spamear track (min 5s) salvo force
      if (!force && nowMs - lastSentAtMs < 5000) return;
      lastSentAtMs = nowMs;

      try {
        await ch.track({
          online_at: new Date().toISOString(),
          last_active_at: lastActiveAt,
        });
      } catch (_) {}
    };

    const bumpActive = (force = false) => {
      lastActiveAt = new Date().toISOString();
      safeTrack(force);
    };

    // ✅ track inicial (activo)
    bumpActive(true);

    // ✅ heartbeat de presencia (mantener online sin false-offline)
    heartbeat = setInterval(() => {
      // NO marcamos activo por heartbeat, solo sostenemos conexión
      safeTrack(false);
    }, 20000);

    // ✅ eventos reales de actividad
    const onUserActivity = () => bumpActive(false);

    window.addEventListener("pointerdown", onUserActivity, { passive: true });
    window.addEventListener("mousemove", onUserActivity, { passive: true });
    window.addEventListener("keydown", onUserActivity);
    window.addEventListener("scroll", onUserActivity, { passive: true });
    window.addEventListener("touchstart", onUserActivity, { passive: true });

    // ✅ cuando vuelve foco/visibilidad/online => marcar activo inmediato
    const onFocus = () => bumpActive(true);
    const onVis = () => {
      if (document.visibilityState === "visible") bumpActive(true);
    };
    const onOnline = () => bumpActive(true);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);

    // guarda para cleanup
    ch.__ik_onUserActivity = onUserActivity;
    ch.__ik_onFocus = onFocus;
    ch.__ik_onVis3 = onVis;
    ch.__ik_onOnline2 = onOnline;

    // ======================================================
    // ✅ DB last_seen_at vía backend (tu lógica actual)
    // ======================================================

    // ✅ Forzar token para ping
    let accessToken = null;
    try {
      const { data: s } = await supabase.auth.getSession();
      accessToken = s?.session?.access_token ? String(s.session.access_token) : null;
    } catch (_) {
      accessToken = null;
    }

    const doPing = async () => {
      try {
        const r = await apiFetch("/auth/ping", {
          method: "POST",
          silent: true,
          tokenOverride: accessToken,
          noAutoLogout: true,
        });

        const at = r?.at ? String(r.at) : null;
        if (at) {
          lastSeen = { ...(lastSeen || {}), [authId]: at };
          emit(onlineSet, lastSeen);
        }
      } catch (_) {}
    };

    await doPing();
    dbHeartbeat = setInterval(doPing, 20000);
  }

  if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
  }
});

    }

    boot().catch(() => {});

    return () => {
      alive = false;

      if (heartbeat) clearInterval(heartbeat);
      if (dbHeartbeat) clearInterval(dbHeartbeat);

      if (ch?.__ik_onVis2) {
        document.removeEventListener("visibilitychange", ch.__ik_onVis2);
      }
// ✅ cleanup activity tracker
if (ch?.__ik_onUserActivity) {
  window.removeEventListener("pointerdown", ch.__ik_onUserActivity);
  window.removeEventListener("mousemove", ch.__ik_onUserActivity);
  window.removeEventListener("keydown", ch.__ik_onUserActivity);
  window.removeEventListener("scroll", ch.__ik_onUserActivity);
  window.removeEventListener("touchstart", ch.__ik_onUserActivity);
}
if (ch?.__ik_onFocus) window.removeEventListener("focus", ch.__ik_onFocus);
if (ch?.__ik_onVis3) document.removeEventListener("visibilitychange", ch.__ik_onVis3);
if (ch?.__ik_onOnline2) window.removeEventListener("online", ch.__ik_onOnline2);

      if (ch) supabase.removeChannel(ch);
    };
  }, [ctx?.company?.id, ctx?.membership?.company_id, ctx?.me?.company?.id]);

  return null;
}


export default function DashboardLayout({ ctx, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ theme global (light = solemne claro, iris = tornasol oscuro)
  const LS_THEME = "ik_theme";
  const [theme, setTheme] = useState("light"); // "light" | "iris"

  useEffect(() => {
    try {
      const t = localStorage.getItem(LS_THEME);
      if (t === "iris" || t === "light") setTheme(t);
    } catch (_) {}
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "light" ? "iris" : "light";
      try {
        localStorage.setItem(LS_THEME, next);
      } catch (_) {}
      return next;
    });
  }

  // ✅ Detecta onboarding desde ctx (viene de /auth/me)
  const needsOnboarding =
    !!ctx?.me?.needs_onboarding ||
    !!ctx?.needs_onboarding ||
    (!!ctx?.me && ctx?.me?.membership == null && ctx?.me?.company == null);

  const [onbOpen, setOnbOpen] = useState(false);

  // ✅ prefill (si lo guardas en localStorage desde login)
  const prefill = useMemo(() => {
    try {
      const raw = localStorage.getItem("IKARIS_PENDING_COMPANY");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }, []);

  useEffect(() => {
    if (needsOnboarding) setOnbOpen(true);
    else setOnbOpen(false);
  }, [needsOnboarding]);

  // ✅ bloquea scroll cuando el modal está abierto
  useEffect(() => {
    if (!onbOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [onbOpen]);

  return (
    <div className={`ik-dashboard theme-${theme}`}>
      {/* ✅ Presence global */}
      <PresenceTracker ctx={ctx} />

      <Topbar
        ctx={ctx}
        theme={theme}
        onToggleTheme={toggleTheme}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      />

      <div className={`ik-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
        <Sidebar
          ctx={ctx}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        <main className="ik-main">{children}</main>

        <OnboardingModal
          open={onbOpen}
          prefill={prefill}
          onDone={() => {
            setOnbOpen(false);
            window.location.replace("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
