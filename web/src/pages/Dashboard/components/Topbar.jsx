import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiSearch,
  FiLogOut,
  FiGrid,
  FiUsers,
  FiFileText,
  FiSettings,
  FiMenu,
  FiCamera,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiMoon,
  FiSun,
  FiMessageCircle,
  FiStar,
} from "react-icons/fi";

import Swal from "sweetalert2";

import ikarisLogo from "../../../assets/ikaris-tech.png";
import { supabase } from "../../../supabaseClient";
import AvatarPickerModal from "../../../ui/AvatarPickerModal";

/* ✅ nuevo CSS (no inflar dashboard.css) */
import "../../../styles/topbar.avatar.css";






  function initialsFromEmail(email) {
    const s = String(email || "").trim();
    if (!s) return "IK";
    const name = s.split("@")[0] || s;
    const parts = name.split(/[._-]/g).filter(Boolean);
    const a = (parts[0]?.[0] || "I").toUpperCase();
    const b = (parts[1]?.[0] || parts[0]?.[1] || "K").toUpperCase();
    return a + b;
  }

export default function Topbar({ ctx, theme, onToggleTheme }) {
  const navigate = useNavigate();



    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);

// ✅ Multi-tenant real: NUNCA guardes avatar/phone en localStorage global.
// Todo debe venir de DB por (auth_user_id + company_id).
const email = ctx?.me?.user?.email || "";
const company = ctx?.company?.name || "IKARIS";
const role = String(ctx?.role || "POLITES").toUpperCase();
const plan = String(ctx?.company?.plan || "free").toUpperCase();

const userName =
  ctx?.me?.user?.name ||
  ctx?.me?.profile?.name ||
  ctx?.me?.company_user?.username ||
  (email ? email.split("@")[0] : "Usuario");

const representative =
  ctx?.company?.representative_name ||
  ctx?.me?.company_user?.username ||
  userName;

const initials = useMemo(() => initialsFromEmail(email), [email]);

const [phone, setPhone] = useState("");
const [phoneEditing, setPhoneEditing] = useState(false);
const [phoneSaving, setPhoneSaving] = useState(false);

// ✅ cooldown UI (72h)
const COOLDOWN_MS = 72 * 60 * 60 * 1000;
const [phoneUpdatedAt, setPhoneUpdatedAt] = useState(null); // timestamptz string | null
const [nowTick, setNowTick] = useState(Date.now()); // para refrescar contador


// ✅ Avatar viene de DB: company_users.avatar_url (por empresa/cuenta)
const [avatarUrl, setAvatarUrl] = useState("");
// ✅ display name reactivo (se actualiza por evento + realtime)
const [displayName, setDisplayName] = useState("");

// ✅ Placeholder tipo “sin foto” (similar a tu img 3, sin fondo real)
const fallbackAvatarSvg = useMemo(() => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="22" fill="rgba(255,255,255,0.06)"/>
      <path d="M48 50c9.2 0 16.6-7.4 16.6-16.6S57.2 16.8 48 16.8 31.4 24.2 31.4 33.4 38.8 50 48 50Z"
            fill="rgba(255,255,255,0.70)"/>
      <path d="M18.5 82.5c2.8-15.5 15.4-26.5 29.5-26.5h0c14.1 0 26.7 11 29.5 26.5"
            fill="rgba(255,255,255,0.35)"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}, []);



    const menuRef = useRef(null);

const [avatarModalOpen, setAvatarModalOpen] = useState(false);

useEffect(() => {
  let alive = true;

  async function boot() {
    try {
      const authUserId =
        ctx?.me?.user?.id || ctx?.me?.user?.auth_user_id || ctx?.me?.auth_user_id;
      const companyId = ctx?.company?.id;
      if (!authUserId || !companyId) return;

      const { data, error } = await supabase
        .from("company_users")
        .select("phone, avatar_url, phone_updated_at, full_name, username")
        .eq("auth_user_id", authUserId)
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) return;

      if (!alive) return;
setPhone(onlyDigits10(data?.phone || ""));
setAvatarUrl(String(data?.avatar_url || ""));
setPhoneUpdatedAt(data?.phone_updated_at || null);

// ✅ nombre preferido: full_name -> username -> ctx fallback
const dn =
  String(data?.full_name || "").trim() ||
  String(data?.username || "").trim() ||
  String(userName || "").trim();

setDisplayName(dn);


    } catch (e) {
      console.warn("[Topbar] boot sync failed:", e);
    }
  }

  boot();
  return () => {
    alive = false;
  };
}, [ctx?.me, ctx?.company?.id]);

useEffect(() => {
  const onUpd = (ev) => {
    const name = String(ev?.detail?.full_name || "").trim();
    if (!name) return;
    setDisplayName(name);
  };

  window.addEventListener("ik_profile_updated", onUpd);
  return () => window.removeEventListener("ik_profile_updated", onUpd);
}, []);
useEffect(() => {
  const authUserId =
    ctx?.me?.user?.id || ctx?.me?.user?.auth_user_id || ctx?.me?.auth_user_id;
  const companyId = ctx?.company?.id;
  if (!authUserId || !companyId) return;

  const ch = supabase
    .channel("ik_topbar_profile")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "company_users",
        filter: `company_id=eq.${companyId}`,
      },
      (payload) => {
        const row = payload?.new;
        // solo me interesa MI fila
        if (!row || String(row.auth_user_id) !== String(authUserId)) return;

        const nextName =
          String(row.full_name || "").trim() ||
          String(row.username || "").trim();

        if (nextName) setDisplayName(nextName);

        if (row.avatar_url !== undefined) {
          setAvatarUrl(String(row.avatar_url || ""));
        }
        if (row.phone !== undefined) {
          setPhone(onlyDigits10(row.phone || ""));
        }
        if (row.phone_updated_at !== undefined) {
          setPhoneUpdatedAt(row.phone_updated_at || null);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(ch);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [ctx?.company?.id, ctx?.me?.user?.id]);


function quickNav(path) {
  setOpen(false); // ✅ cierra menú perfil si estaba abierto
  navigate(path);
}


    function onSearchSubmit(e) {
      e.preventDefault();
      if (!q.trim()) return;
      // eslint-disable-next-line no-alert
      alert(`Búsqueda global (placeholder): "${q}"`);
    }

    function onlyDigits10(v) {
      return String(v || "").replace(/\D/g, "").slice(0, 10);
    }
function formatMxPhone(v) {
  const d = onlyDigits10(v);
  if (d.length !== 10) return d;
  // 668 257 5759
  return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
}
useEffect(() => {
  const t = setInterval(() => setNowTick(Date.now()), 30000);
  return () => clearInterval(t);
}, []);

function getPhoneLockInfo(phoneUpdatedAtValue) {
  if (!phoneUpdatedAtValue) return { locked: false, unlockAt: null, remainingMs: 0 };

  const updatedMs = new Date(phoneUpdatedAtValue).getTime();
  if (!Number.isFinite(updatedMs)) return { locked: false, unlockAt: null, remainingMs: 0 };

  const unlockAtMs = updatedMs + COOLDOWN_MS;
  const remainingMs = Math.max(0, unlockAtMs - nowTick);

  return {
    locked: remainingMs > 0,
    unlockAt: new Date(unlockAtMs),
    remainingMs,
  };
}

function formatRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function getPhoneLockInfo(phoneUpdatedAtValue) {
  if (!phoneUpdatedAtValue) return { locked: false, unlockAt: null, remainingMs: 0 };

  const updatedMs = new Date(phoneUpdatedAtValue).getTime();
  if (!Number.isFinite(updatedMs)) return { locked: false, unlockAt: null, remainingMs: 0 };

  const unlockAtMs = updatedMs + COOLDOWN_MS;
  const remainingMs = Math.max(0, unlockAtMs - nowTick);

  return {
    locked: remainingMs > 0,
    unlockAt: new Date(unlockAtMs),
    remainingMs,
  };
}

function formatRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function setPhoneClean(v) {
  const clean = onlyDigits10(v);
  setPhone(clean);
  return clean;
}

const phoneSaveLock = useRef(false);
const phoneAbortRef = useRef(null);
const lastPhoneSaveAt = useRef(0);

async function savePhoneToApi(raw) {
  const clean = onlyDigits10(raw);
  if (clean.length !== 10) return { ok: false, reason: "len" };

  // ✅ anti-spam: no más de 1 intento cada 2s
  const now = Date.now();
  if (now - lastPhoneSaveAt.current < 2000) {
    return { ok: false, reason: "cooldown" };
  }

  // ✅ lock (evita doble click / doble enter / rerenders raros)
  if (phoneSaveLock.current) {
    return { ok: false, reason: "locked" };
  }

  phoneSaveLock.current = true;
  lastPhoneSaveAt.current = now;

  // ✅ abort request anterior si existía
  try { phoneAbortRef.current?.abort?.(); } catch {}
  const controller = new AbortController();
  phoneAbortRef.current = controller;

  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify({ phone: clean }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, reason: "api", status: res.status, data: json };
    }

    setPhone(clean);
    return { ok: true };
  } catch (e) {
    if (e?.name === "AbortError") return { ok: false, reason: "aborted" };
    return { ok: false, reason: "net", error: e };
  } finally {
    phoneSaveLock.current = false;
  }
}



async function onPickAvatar(file) {
  try {
    if (!file) return;

    // ✅ validaciones básicas (FB-like)
    const maxMb = 5;
    const isImg = /^image\//.test(file.type);
    if (!isImg) {
      await Swal.fire({ icon: "error", title: "Archivo no válido", text: "Solo imágenes." });
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      await Swal.fire({ icon: "error", title: "Muy pesada", text: `Máximo ${maxMb}MB.` });
      return;
    }

    const authUserId =
      ctx?.me?.user?.id || ctx?.me?.user?.auth_user_id || ctx?.me?.auth_user_id;
    const companyId = ctx?.company?.id;

    if (!authUserId || !companyId) {
      await Swal.fire({ icon: "error", title: "Sesión incompleta", text: "No se detectó usuario/empresa." });
      return;
    }

    // ✅ extensión segura
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "jpg";

    // ✅ path por usuario (evita colisiones, y es compatible con policy)
    const objectPath = `${authUserId}/avatar.${safeExt}`;

    // ✅ subir con upsert
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(objectPath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (upErr) {
      console.warn("[Avatar] upload error:", upErr);
      await Swal.fire({ icon: "error", title: "No se pudo subir", text: "Revisa permisos de Storage/RLS." });
      return;
    }

    // ✅ obtener URL pública
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    const publicUrl = String(pub?.publicUrl || "");

    if (!publicUrl) {
      await Swal.fire({ icon: "error", title: "URL inválida", text: "No se pudo generar URL pública." });
      return;
    }

    // ✅ guardar en DB (por empresa + usuario)
    const { error: dbErr } = await supabase
      .from("company_users")
      .update({ avatar_url: publicUrl })
      .eq("auth_user_id", authUserId)
      .eq("company_id", companyId);

    if (dbErr) {
      console.warn("[Avatar] db update error:", dbErr);
      await Swal.fire({ icon: "error", title: "No se pudo guardar", text: "Revisa RLS en company_users." });
      return;
    }

    // ✅ refrescar UI (cache-bust simple)
    const bust = `t=${Date.now()}`;
    const finalUrl = publicUrl.includes("?") ? `${publicUrl}&${bust}` : `${publicUrl}?${bust}`;
    setAvatarUrl(finalUrl);

    await Swal.fire({ icon: "success", title: "Foto actualizada", timer: 900, showConfirmButton: false });
  } catch (e) {
    console.warn("[Avatar] unexpected:", e);
    await Swal.fire({ icon: "error", title: "Error", text: "Ocurrió un error inesperado." });
  } finally {
    // ✅ permite volver a elegir el mismo archivo

    
  }
}


    // cerrar al click afuera
    useEffect(() => {
      function onDoc(e) {
        if (!open) return;
        if (!menuRef.current) return;
        if (menuRef.current.contains(e.target)) return;
        setOpen(false);
      }
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    

const phoneLock = getPhoneLockInfo(phoneUpdatedAt);
const phoneLocked = phoneLock.locked;

return (
  <header className="ik-topbar">

        <div className="ik-topbar__left">


  <div className="ik-brand">
    <img className="ik-brand__img" src={ikarisLogo} alt="IKARIS Tech" />

  </div>


          <div className="ik-quick">
            <button className="ik-quick__btn" onClick={() => quickNav("/dashboard")} title="Dashboard">
              <FiGrid />
            </button>
            <button className="ik-quick__btn" onClick={() => quickNav("/forms")} title="Forms">
              <FiFileText />
            </button>
<button className="ik-quick__btn" onClick={() => quickNav("/admin")} title="Admin Panel">
  <FiUsers />
</button>
<button className="ik-quick__btn" onClick={() => quickNav("/admin")} title="Admin Panel">
  <FiSettings />
</button>

          </div>
        </div>

        <div className="ik-topbar__mid">
          <form className="ik-search" onSubmit={onSearchSubmit}>
            <FiSearch className="ik-search__icon" />
            <input
              className="ik-search__input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar en todo..."
            />
            {q ? (
              <button type="button" className="ik-search__clear" onClick={() => setQ("")}>
                ×
              </button>
            ) : null}
          </form>
        </div>

<div className="ik-topbar__right">
  {/* 🔔 Notificaciones */}
  <button className="ik-iconbtn" title="Notificaciones">
    <FiBell />
    <span className="ik-dot" />
  </button>

  {/* 💬 Chats */}
  <button
    className="ik-iconbtn"
    title="Chats"
    onClick={() => quickNav("/chats")}
  >
    <FiMessageCircle />
  </button>

  {/* 👤 Perfil (mantiene el menú desplegable) */}
  <div className="ik-profile" ref={menuRef}>
<button
  className="ik-profileIcon"
  onClick={() => setOpen((v) => !v)}
  aria-expanded={open ? "true" : "false"}
  title="Perfil"
  type="button"
>
  <img
    className="ik-profileIcon__img"
    src={avatarUrl || fallbackAvatarSvg}
    alt="avatar"
    onError={(e) => (e.currentTarget.src = fallbackAvatarSvg)}
    draggable={false}
  />
</button>


    {/* ✅ Renderizamos siempre para permitir animación CSS */}


            <div className={`ik-menu ik-menu--profile ${open ? "open" : ""}`}>
              <div className="ik-menu__card">
                <div className="ik-menu__hero">
                  <div className="ik-menu__avatarBig">
                    <img
  className="ik-avatarBig__img"
  src={avatarUrl || fallbackAvatarSvg}
  alt="avatar"
  onError={(e) => (e.currentTarget.src = fallbackAvatarSvg)}
/>

<button
  className="ik-avatarBig__cam"
  type="button"
  onClick={() => setAvatarModalOpen(true)}
  title="Cambiar foto"
>
  <FiCamera />
</button>

                  </div>

                  <div className="ik-menu__who">
                <div className="ik-menu__name">{displayName || representative}</div>
                <div className="ik-menu__sub">{company}</div>

                  </div>
                </div>

                <div className="ik-menu__rows">
<div
  className="ik-themeRow"
  role="button"
  tabIndex={0}
  onClick={onToggleTheme}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleTheme();
    }
  }}
  title="Cambiar tema"
>
  <button
    type="button"
    className={`ik-themeToggle2 ${theme === "iris" ? "on" : ""}`}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleTheme();
    }}
    aria-label="Cambiar tema"
  >
    <span className="ik-themeToggle2__track">
      <span className="ik-themeToggle2__icon ik-themeToggle2__icon--sun"><FiSun /></span>
      <span className="ik-themeToggle2__icon ik-themeToggle2__icon--moon"><FiMoon /></span>

      <span className="ik-themeToggle2__knob">
        <span className="ik-themeToggle2__knobIc">
          {theme === "iris" ? <FiMoon /> : <FiSun />}
        </span>
      </span>
    </span>
  </button>
</div>



                  <div className="ik-row">
                    <span className="ik-row__ic"><FiMail /></span>
                    <span className="ik-row__k">Correo</span>
                    <span className="ik-row__v">{email || "—"}</span>
                  </div>

                  <div className="ik-row">
                    <span className="ik-row__ic"><FiBriefcase /></span>
                    <span className="ik-row__k">Empresa</span>
                    <span className="ik-row__v">{company}</span>
                  </div>


<div className="ik-row">
  <span className="ik-row__ic"><FiPhone /></span>
  <span className="ik-row__k">Teléfono</span>

  <div className="ik-row__right">
    {!phoneEditing ? (
      <button
        type="button"
        className="ik-inlineValueBtn"

        onClick={() => {
          if (phoneLocked) return;
          setPhoneEditing(true);
        }}
        disabled={phoneLocked}
        style={phoneLocked ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
      >
        <span className={`ik-inlineValue ${phone?.length === 10 ? "ok" : ""}`}>
          {phone?.length === 10 ? formatMxPhone(phone) : "Agregar número de teléfono"}
        </span>

       
      </button>
    ) : (
      <input
        autoFocus
        className="ik-lineInput"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhoneClean(e.target.value)}
        placeholder="Agregar número de teléfono"
        aria-label="Teléfono (10 dígitos)"
        onKeyDown={async (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setPhoneEditing(false);
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();
            if (phoneSaving) return;

            // ✅ SweetAlert con Aceptar + Cancelar (obligatorio)
            const ok = await Swal.fire({
              icon: "warning",
              title: "Confirmación",
              text: "Al agregar o editar tu teléfono, no podrás cambiarlo en un plazo de 3 días (72 hrs).",
              showConfirmButton: true,
              showCancelButton: true,
              confirmButtonText: "Aceptar",
              cancelButtonText: "Cancelar",
              focusConfirm: true,
              allowEnterKey: true,
              allowEscapeKey: true,
              allowOutsideClick: true,
              buttonsStyling: true,
            }).then((r) => r.isConfirmed);

            if (!ok) {
              setPhoneEditing(false);
              return;
            }

            setPhoneSaving(true);
            const res = await savePhoneToApi(phone);
            setPhoneSaving(false);

            if (res.ok) {
              setPhoneEditing(false);
              // ✅ bloquear inmediatamente en UI (72h desde ahora)
              setPhoneUpdatedAt(new Date().toISOString());
            } else {
              console.warn("Phone not saved:", res);
            }
          }
        }}
        onBlur={() => {
          setPhoneEditing(false);
        }}
      />
    )}
  </div>
</div>





<div className="ik-row">
  <span className="ik-row__ic">
    <FiStar />
  </span>
  <span className="ik-row__k">Plan</span>
  <span className="ik-row__v">{plan}</span>
</div>

                </div>

                <div className="ik-menu__actions">
                  <button className="ik-menu__item" onClick={() => ctx.logout()}>
                    <FiLogOut />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AvatarPickerModal
  open={avatarModalOpen}
  onClose={() => setAvatarModalOpen(false)}
  onConfirm={async (file) => {
    await onPickAvatar(file);
  }}
/>

      </header>
    );
  }
