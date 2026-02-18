  import React, { useEffect, useMemo, useRef, useState } from "react";
  import { createPortal } from "react-dom";
  import DashboardLayout from "../Dashboard/DashboardLayout";
  import { apiFetch } from "../../api";
  import Swal from "sweetalert2";
  import "./adminPanel.css";
  import { supabase } from "../../supabaseClient";

  import "./deptLevelsManager.css";
  import DeptLevelsManager from "./DeptLevelsManager";


  import {
    FiGrid,
    FiUsers,
    FiLayers,
    FiPlus,
    FiMail,
    FiRefreshCw,
    FiTrash2,
    FiSearch,
    FiCheck,
    FiX,
    FiEdit3,
    FiImage,
  } from "react-icons/fi";

  import { MdWifi, MdWifiOff, MdSchedule } from "react-icons/md";



  import {
    MdWork,
    MdGroups,
    MdShield,
    MdLocalShipping,
    MdSettings,
    MdBarChart,
    MdFolder,
    MdAttachMoney,
    MdSupportAgent,
    MdWarehouse,
    MdBuild,
    MdSchool,
    MdCalendarMonth,
    MdCameraAlt,
    MdKey,
    MdDescription,
    MdPhoneInTalk,
    MdInventory2,
    MdAccountTree,
    MdVerifiedUser,
    MdPersonPin,
    MdFactCheck,
  } from "react-icons/md";

  // ✅ Lista de iconos. El "icon_key" se guarda en DB.
  const ICONS = [
    { key: "briefcase", label: "Trabajo", Icon: MdWork },
    { key: "groups", label: "Grupos", Icon: MdGroups },
    { key: "shield", label: "Seguridad", Icon: MdShield },
    { key: "truck", label: "Logística", Icon: MdLocalShipping },
    { key: "settings", label: "Sistemas", Icon: MdSettings },
    { key: "chart", label: "Reportes", Icon: MdBarChart },
    { key: "folder", label: "Archivo", Icon: MdFolder },
    { key: "money", label: "Finanzas", Icon: MdAttachMoney },
    { key: "support", label: "Soporte", Icon: MdSupportAgent },
    { key: "warehouse", label: "Almacén", Icon: MdWarehouse },
    { key: "build", label: "Mantenimiento", Icon: MdBuild },
    { key: "school", label: "Capacitación", Icon: MdSchool },
    { key: "calendar", label: "Planeación", Icon: MdCalendarMonth },
    { key: "camera", label: "Evidencia", Icon: MdCameraAlt },
    { key: "key", label: "Accesos", Icon: MdKey },
    { key: "docs", label: "Documentos", Icon: MdDescription },
    { key: "phone", label: "Atención", Icon: MdPhoneInTalk },
    { key: "inventory", label: "Inventario", Icon: MdInventory2 },
    { key: "org", label: "Organigrama", Icon: MdAccountTree },
    { key: "verified", label: "Calidad", Icon: MdVerifiedUser },
    { key: "pin", label: "Campo", Icon: MdPersonPin },
    { key: "check", label: "Compliance", Icon: MdFactCheck },
  ];

  function IconByKey({ iconKey }) {
    const hit = ICONS.find((x) => x.key === iconKey);
    const C = hit?.Icon || MdWork;
    return <C />;
  }
function IconSelect({
  value,
  onChange,
  placeholder = "Seleccionar",
  options = [], // [{ value, label, iconKey }]
  className = "",
  disabled = false,
}) {

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // ✅ id único por instancia para cerrar otros selects al abrir éste
  const instanceIdRef = useRef(`iselect_${Math.random().toString(36).slice(2)}_${Date.now()}`);

  const [open, setOpen] = useState(false);

    const [pos, setPos] = useState({ top: 0, left: 0, width: 260 });

    const current = useMemo(() => {
      return options.find((o) => String(o.value) === String(value)) || null;
    }, [options, value]);

    function close() {
      setOpen(false);
    }

    function openMenu() {
      const el = btnRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + 8,
        left: Math.min(r.left, window.innerWidth - Math.max(260, r.width) - 12),
        width: Math.max(260, r.width),
      });
      // ✅ avisa que este select se abrió (para cerrar los demás)
  window.dispatchEvent(
    new CustomEvent("ik_iselect_open", { detail: { id: instanceIdRef.current } })
  );

  setOpen(true);

    }
  // ✅ si otro IconSelect se abre, éste se cierra
  useEffect(() => {
    const onOtherOpen = (ev) => {
      const otherId = ev?.detail?.id;
      if (!otherId) return;
      if (otherId !== instanceIdRef.current) setOpen(false);
    };

    window.addEventListener("ik_iselect_open", onOtherOpen);
    return () => window.removeEventListener("ik_iselect_open", onOtherOpen);
  }, []);

    useEffect(() => {
      if (!open) return;

      const onDown = (e) => {
        const btn = btnRef.current;
        const menu = menuRef.current;

        // si el click fue dentro del botón, no cierres (toggle maneja)
        if (btn && btn.contains(e.target)) return;

        // si el click fue dentro del menú, no cierres
        if (menu && menu.contains(e.target)) return;

        // fuera de ambos => cerrar
        close();
      };

      const onKey = (e) => {
        if (e.key === "Escape") close();
      };

      window.addEventListener("mousedown", onDown);
      window.addEventListener("keydown", onKey);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);

      return () => {
        window.removeEventListener("mousedown", onDown);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close);
      };
    }, [open]);

    return (
      <>
<button
  ref={btnRef}
  type="button"
  className={`ap-iselectBtn ${className} ${disabled ? "is-disabled" : ""}`}
  disabled={disabled}
  onMouseDown={(e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    setOpen((s) => {
      const next = !s;
      if (next) {
        openMenu();
        return true;
      }
      return false;
    });
  }}
  title={current?.label || placeholder}
>

          <span className="ap-iselectLeft">
            <span className="ap-iselectIco">
              {current?.iconKey ? <IconByKey iconKey={current.iconKey} /> : null}
            </span>
            <span className="ap-iselectTxt">{current?.label || placeholder}</span>
          </span>
          <span className="ap-iselectChevron">▾</span>
        </button>

        {open
          ? createPortal(
  <div
    ref={menuRef}
    className="ap-iselectMenu"
    style={{ top: pos.top, left: pos.left, width: pos.width }}
    onMouseDown={(e) => {
      // evita que el click burbujee al documento y cierre por fuera
      e.stopPropagation();
    }}
  >

  {options
    // ✅ NO mostrar la opción ya seleccionada
    .filter((o) => String(o.value) !== String(value))
    .map((o) => {
      return (
        <button
          key={String(o.value)}
          type="button"
          className="ap-iselectItem"
          onClick={() => {
            onChange?.(o.value);
            close();
          }}
          title={o.label}
        >
          <span className="ap-iselectItemIco">
            {o.iconKey ? <IconByKey iconKey={o.iconKey} /> : null}
          </span>
          <span className="ap-iselectItemTxt">{o.label}</span>
          <span className="ap-iselectItemOk"></span>
        </button>
      );
    })}

              </div>,
              document.body
            )
          : null}
      </>
    );
  }




  function hexToRgbCSS(hex) {
    const h = String(hex || "").replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    if (!Number.isFinite(n)) return "124 58 237";
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `${r} ${g} ${b}`;
  }
  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }
  function toTitleCaseWords(input) {
    const s = String(input ?? "");

    // Normaliza: todo minúscula primero
    const lower = s.toLowerCase();

    // Pone mayúscula en la primera letra y después de espacios/guiones/slash
    return lower.replace(/(^|[\s\-\/])(\p{L})/gu, (_, sep, ch) => `${sep}${ch.toUpperCase()}`);
  }
  function formatLastSeen(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // ======================================================
  // ✅ Conexión SaaS: Online / Activo hace Xm / Desconectado
  // ======================================================
  const IK_ONLINE_GRACE_MS = 45 * 1000;      // 45s => NO se cae por refresh
  const IK_RECENT_WINDOW_MS = 5 * 60 * 1000; // 5min => "Activo hace Xm"

  function formatAgoShort(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "—";
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h`;
  }

const IK_AWAY_AFTER_MS = 5 * 60 * 1000; // 5 min

const IK_AWAY_CLOCK_AFTER_MS = 30 * 60 * 1000; // 30 min => mostrar hora completa

function formatClock(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getConnStatus({ authId, onlineSet, lastIso, activityIso }) {
  const hasAuth = !!authId;
  const presenceOnline = hasAuth && onlineSet?.has(String(authId));

  const now = Date.now();

  const lastSeenMs = lastIso ? new Date(lastIso).getTime() : NaN;
  const diffSeen = Number.isFinite(lastSeenMs) ? (now - lastSeenMs) : Infinity;

  const lastActMs = activityIso ? new Date(activityIso).getTime() : NaN;
  const diffAct = Number.isFinite(lastActMs) ? (now - lastActMs) : Infinity;

  // ✅ ONLINE “técnico”: presence o last_seen muy reciente (refresh safe)
  const isOnline = presenceOnline || diffSeen <= IK_ONLINE_GRACE_MS;

  if (isOnline) {
    // ✅ si hay actividad reciente => EN LÍNEA
    if (diffAct <= IK_AWAY_AFTER_MS) {
      return {
        kind: "online",
        label: "En línea",
        diff: diffAct,
      };
    }

    // ✅ AUSENTE (sigue logueado, solo sin actividad)
    if (diffAct <= IK_AWAY_CLOCK_AFTER_MS) {
      return {
        kind: "away",
        label: `Ausente hace ${formatAgoShort(diffAct)}`,
        diff: diffAct,
      };
    }

    return {
      kind: "away",
      label: `Ausente desde ${formatClock(activityIso)}`,
      diff: diffAct,
    };
  }

  // ✅ RECENT (no online, pero visto hace poco)
  if (diffSeen <= IK_RECENT_WINDOW_MS) {
    return {
      kind: "recent",
      label: `Activo hace ${formatAgoShort(diffSeen)}`,
      diff: diffSeen,
    };
  }

  // ✅ OFFLINE
  return {
    kind: "offline",
    label: "Desconectado",
    diff: diffSeen,
  };
}



  // ✅ slug estable (para evitar null/empty y 400 del backend)
  function slugify(input) {
    return String(input ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")     // quita acentos
      .replace(/[^a-z0-9]+/g, "-")         // todo a guiones
      .replace(/(^-|-$)+/g, "")            // recorta guiones extremos
      .slice(0, 64);
  }

  function hsvToHex(h, s, v) {
    // h:0..360, s:0..1, v:0..1
    const c = v * s;

    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const toHex = (n) => {
      const v = Math.round((n + m) * 255);
      return v.toString(16).padStart(2, "0");
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  function hexToRgb(hex) {
    const h = String(hex || "").replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    if (!Number.isFinite(n)) return { r: 124, g: 58, b: 237 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  }

  function ColorSVPicker({ value, onChange, compact = false }) {
    const boxRef = useRef(null);

    const [h, setH] = useState(265);
    const [s, setS] = useState(0.65);
    const [v, setV] = useState(0.85);

    // evita loop: guardamos el último hex que nosotros emitimos
    const lastEmittedRef = useRef("");

    const hex = useMemo(() => hsvToHex(h, s, v), [h, s, v]);

    // ✅ cuando cambia "value" desde afuera, solo sincroniza si NO viene del propio picker
    useEffect(() => {
      if (!value) return;

      const incoming = String(value).toLowerCase();
      const last = String(lastEmittedRef.current || "").toLowerCase();

      // si el padre nos está devolviendo lo mismo que emitimos, NO resincronices
      if (incoming === last) return;

      const { r, g, b } = hexToRgb(value);
      const next = rgbToHsv(r, g, b);

      setH(next.h);
      setS(next.s);
      setV(next.v);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // ✅ emite cambios solo cuando hex cambia por interacción
    useEffect(() => {
      if (!hex) return;
      if (String(hex).toLowerCase() === String(value || "").toLowerCase()) return;

      lastEmittedRef.current = hex;
      onChange?.(hex);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hex]);

    function pickSV(clientX, clientY) {
      const el = boxRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = clamp01((clientX - r.left) / r.width);
      const py = clamp01((clientY - r.top) / r.height);
      setS(px);
      setV(1 - py);
    }

    return (
      <div className={`ap-cpk ${compact ? "ap-cpkCompact" : ""}`}>
        <div
          ref={boxRef}
          className="ap-cpkBox"
          style={{ "--ap-hue": `${h}deg` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pickSV(e.clientX, e.clientY);

            const move = (ev) => pickSV(ev.clientX, ev.clientY);
            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
        >
          <div
            className="ap-cpkDot"
            style={{
              left: `${s * 100}%`,
              top: `${(1 - v) * 100}%`,
            }}
          />
        </div>

        <div className="ap-cpkRow">
          <input
            className="ap-cpkHue"
            type="range"
            min="0"
            max="360"
            value={h}
            onChange={(e) => setH(Number(e.target.value))}
          />
          <div className="ap-cpkSw" title={hex} style={{ background: hex }} />
        </div>
      </div>
    );
  }


  export default function AdminPanel({ ctx }) {
    // ✅ UI base (tabs + search)
    const [view, setView] = useState("depts"); // depts | users | levels
    const [q, setQ] = useState("");

    // ✅ filtros (vista users)
    const [fDept, setFDept] = useState("");       // department_id o "" (todos)
    const [fLevel, setFLevel] = useState("");     // level_id o "" (todos)
    const [fConn, setFConn] = useState("all");    // all | online | offline

// ======================================================
// ✅ Presence GLOBAL (consume lo que emite DashboardLayout -> PresenceTracker)
// ======================================================
const [onlineSet, setOnlineSet] = useState(() => new Set());
const [lastSeen, setLastSeen] = useState(() => ({}));
const [activityMap, setActivityMap] = useState(() => ({}));

useEffect(() => {
  let alive = true;

  // 1) estado inicial
  try {
    const raw = localStorage.getItem("IKARIS_PRESENCE_STATE");
    const j = raw ? JSON.parse(raw) : null;

    const online = Array.isArray(j?.online) ? j.online : [];
    const ls = j?.lastSeen && typeof j.lastSeen === "object" ? j.lastSeen : {};
    const act = j?.activity && typeof j.activity === "object" ? j.activity : {};

    if (alive) {
      setOnlineSet(new Set(online.map((x) => String(x))));
      setLastSeen(ls);
      setActivityMap(act);
    }
  } catch (_) {}

  // 2) realtime updates
  const onPresence = (ev) => {
    if (!alive) return;

    const d = ev?.detail || {};
    const online = Array.isArray(d?.online) ? d.online : [];
    const ls = d?.lastSeen && typeof d.lastSeen === "object" ? d.lastSeen : {};
    const act = d?.activity && typeof d.activity === "object" ? d.activity : {};

    setOnlineSet(new Set(online.map((x) => String(x))));
    setLastSeen(ls);
    setActivityMap(act);
  };

  window.addEventListener("ik_presence_update", onPresence);

  return () => {
    alive = false;
    window.removeEventListener("ik_presence_update", onPresence);
  };
}, []);





  const [departments, setDepartments] = useState([]);
const [levels, setLevels] = useState([]);

  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);



  // ✅ DisplayName real del usuario logueado (Supabase Auth / metadata)
  const [authDisplayName, setAuthDisplayName] = useState("");

  // ✅ edición por fila (users)
  const [editUserId, setEditUserId] = useState(null);

  function startEditUser(u) {
    const p = draftUsers[u.id] || {};

    // ✅ valor visible real (fallback fuerte)
    const visible =
      String(
        p.full_name ??
        u.full_name ??
        u.display_name ??       // si lo mandas después
        u.username ??
        ""
      ).trim();

    setDraftUsers((s) => ({
      ...s,
      [u.id]: {
        ...p,
        // ✅ NO lo pises con "" si ya existía algo
        full_name: (visible || String(p.full_name || "")).toString(),
        username: (p.username ?? u.username ?? "").toString(),
        position: (p.position ?? u.position ?? "").toString(),
        department_id: p.department_id ?? (u.department_id ?? ""),
        level_id: p.level_id ?? (u.level_id ?? ""),
        active: typeof p.active === "boolean" ? p.active : (u.active !== false),
      },
    }));

    setEditUserId(u.id);
  }


  function cancelEditUser() {
    setEditUserId(null);
  }
  async function saveEditUser(id) {
    await saveUserInline(id).catch(() => {});
    setEditUserId(null);
  }

    // ✅ inline drafts (sin botón de pluma)
    const [draftUsers, setDraftUsers] = useState({});
    const [draftDepts, setDraftDepts] = useState({});
    const [draftLvls, setDraftLvls] = useState({});
  // ✅ Un solo editor flotante (panel tipo IMG2)
  const [deptEditor, setDeptEditor] = useState({
    open: false,
    id: null,
    top: 0,
    left: 0,
    pane: "main", // main | icon | color
  });

  // ✅ Crear depto desde card (sin Swal)
  const NEW_DEPT_ID = "__new_dept__";
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [newDeptDraft, setNewDeptDraft] = useState({
    name: "",
    slug: "",
    color: "#7c3aed",
    icon_key: "briefcase", // ✅ default sólido
    sort_order: 0,
    active: true,
  });

  const [deptModal, setDeptModal] = useState({
    open: false,
    id: null,        // NEW_DEPT_ID o id real
    mode: "new",     // new | edit
    phase: "idle",   // idle | enter | exit
  });



  // ✅ snapshot para cancelar (volver al estado anterior)
  const [deptSnapshot, setDeptSnapshot] = useState(null);
  function deptHasUnsavedChanges(id, p) {
    if (!deptSnapshot?.id || deptSnapshot.id !== id) return false;
    const a = deptSnapshot.data || {};
    return (
      String(p.name || "") !== String(a.name || "") ||
      String(p.slug || "") !== String(a.slug || "") ||
      String(p.color || "") !== String(a.color || "") ||
      String(p.icon_key || "") !== String(a.icon_key || "") ||
      Number(p.sort_order || 0) !== Number(a.sort_order || 0) ||
      Boolean(p.active) !== Boolean(a.active)
    );
  }

  async function tryCloseDeptEditor(id, p) {
    if (!deptHasUnsavedChanges(id, p)) {
      setDeptEditor({ open: false, id: null, top: 0, left: 0, pane: "main" });
      setDeptSnapshot(null);
      return;
    }

    await Swal.fire({
      icon: "warning",
      title: "No has guardado los cambios",
      text: "Pulsa (✓) para guardar.",
      confirmButtonText: "Entendido",
    });
  }

    // ====== Loaders ======
async function loadAll() {
try {
  // ✅ Ejecutar bootstrap SOLO 1 vez por sesión (evita duplicados/500)
  const key = `IK_ADMIN_BOOTSTRAP_DONE_${String(ctx?.company?.id || "")}`;
  const already = localStorage.getItem(key) === "1";

  if (!already) {
    await apiFetch("/admin/bootstrap", { method: "POST", silent: true });
    localStorage.setItem(key, "1");
  }
} catch (e) {
  console.error("[ADMIN bootstrap] error:", e);
  await Swal.fire({
    icon: "error",
    title: "Bootstrap falló",
    text: e?.message || "Error en /admin/bootstrap",
  });
  // ⚠️ NO return: igual intenta cargar lo demás
}

  const [d, l, u, i] = await Promise.all([
    apiFetch("/admin/departments"),
    apiFetch("/admin/levels"),
    apiFetch("/admin/users"),
    apiFetch("/admin/invites"),
  ]);



const deps = d.departments || [];
const lvls = l.levels || [];
const usrs = u.users || [];
const invs = i.invites || [];

setDepartments(deps);
setLevels(lvls);
setUsers(usrs);
setInvites(invs);


  // ✅ HIDRATAR lastSeen desde DB (company_users.last_seen_at)
  // Esto hace que "Conexión" funcione aunque Presence falle/ no sincronice.
  try {
    setLastSeen((prev) => {
      const next = { ...(prev || {}) };

      for (const u of (usrs || [])) {
        const authId = String(u?.auth_user_id || "").trim();
        const iso = u?.last_seen_at || null;
        if (!authId || !iso) continue;

        // solo actualiza si viene algo válido
        next[authId] = iso;
      }

      return next;
    });
  } catch (_) {}



      // Pre-carga drafts (para editar directo)
      setDraftUsers((prev) => {
        const next = { ...prev };
        for (const x of usrs) {
  next[x.id] = {
    // ✅ JAMÁS arranques en null si quieres que el input NO se vea vacío
    full_name: (x.full_name ?? x.display_name ?? x.username ?? "").toString(),
    username: (x.username ?? "").toString(),
    position: (x.position ?? "").toString(),
    department_id: x.department_id ?? "",
    level_id: x.level_id ?? "",
    active: x.active !== false,

    auth_providers: Array.isArray(x.auth_providers) ? x.auth_providers : [],
    has_password: x.has_password === true,
  };



        }
        return next;
      });

  setDraftDepts((prev) => {
    const next = { ...prev };
    for (const x of deps) {
      next[x.id] = {
        name: x.name ?? "",
        slug: x.slug ?? "",
        color: x.color ?? "#7c3aed",          // ✅ nunca ""
        icon_key: x.icon_key ?? "briefcase",  // ✅ nunca ""
        sort_order: x.sort_order ?? 0,
        active: x.active !== false,
      };
    }
    return next;
  });

      setDraftLvls((prev) => {
        const next = { ...prev };
        for (const x of lvls) {
          next[x.id] = {
            name: x.name ?? "",
            rank: x.rank ?? 0,
            color: x.color ?? "",
            icon_key: x.icon_key ?? "",
            active: x.active !== false,
          };
        }
        return next;
      });
    }

    useEffect(() => {
      loadAll().catch((e) => {
        Swal.fire({
          icon: "error",
          title: "Admin",
          text: e?.message || "Error cargando admin",
        });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  const [authUid, setAuthUid] = useState(null);
useEffect(() => {
  if (!authUid) return;
  setLastSeen((prev) => ({ ...(prev || {}), [String(authUid)]: new Date().toISOString() }));
}, [authUid]);

  useEffect(() => {
    let alive = true;

    async function readAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data?.user;

        const name =
          String(
            u?.user_metadata?.full_name ||
            u?.user_metadata?.name ||
            u?.user_metadata?.display_name ||
            u?.email?.split("@")?.[0] ||
            ""
          ).trim();

        if (!alive) return;
        setAuthDisplayName(name);
        setAuthUid(u?.id ? String(u.id) : null);
      } catch (_) {}
    }

    readAuth();
    return () => { alive = false; };
  }, []);



  useEffect(() => {
    const companyId = ctx?.company?.id || ctx?.membership?.company_id || ctx?.me?.company?.id;
    if (!companyId) return;

    const ch = supabase
      .channel("ik_admin_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_users", filter: `company_id=eq.${companyId}` },
        (payload) => {
          setUsers((prev) => {
            const ev = payload.eventType;
            if (ev === "INSERT") return [payload.new, ...prev];
            if (ev === "UPDATE") return prev.map((x) => (x.id === payload.new.id ? payload.new : x));
            if (ev === "DELETE") return prev.filter((x) => x.id !== payload.old.id);
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments", filter: `company_id=eq.${companyId}` },
        (payload) => {
          setDepartments((prev) => {
            const ev = payload.eventType;
            if (ev === "INSERT") return [payload.new, ...prev];
            if (ev === "UPDATE") return prev.map((x) => (x.id === payload.new.id ? payload.new : x));
            if (ev === "DELETE") return prev.filter((x) => x.id !== payload.old.id);
            return prev;
          });

          // Mantén drafts sincronizados con cambios externos
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const x = payload.new;
  setDraftDepts((s) => ({
    ...s,
    [x.id]: {
      name: x.name ?? "",
      slug: x.slug ?? "",
      color: x.color ?? "#7c3aed",          // ✅ nunca ""
      icon_key: x.icon_key ?? "briefcase",  // ✅ nunca ""
      sort_order: x.sort_order ?? 0,
      active: x.active !== false,
    },
  }));

          }
          if (payload.eventType === "DELETE") {
            const id = payload.old.id;
            setDraftDepts((s) => {
              const n = { ...s };
              delete n[id];
              return n;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "levels", filter: `company_id=eq.${companyId}` },
        (payload) => {
          setLevels((prev) => {
            const ev = payload.eventType;
            if (ev === "INSERT") return [payload.new, ...prev];
            if (ev === "UPDATE") return prev.map((x) => (x.id === payload.new.id ? payload.new : x));
            if (ev === "DELETE") return prev.filter((x) => x.id !== payload.old.id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.company?.id]);
  useEffect(() => {
    function onDown() {
      // ya no cerramos por click fuera
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

// ✅ tick para que "Activo hace Xm" se actualice sin refrescar
const [nowTick, setNowTick] = useState(Date.now());
useEffect(() => {
  const iv = setInterval(() => setNowTick(Date.now()), 10000);
  return () => clearInterval(iv);
}, []);




    // ====== Maps ======
    const depMap = useMemo(() => {
      const m = new Map();
      for (const d of departments) m.set(d.id, d);
      return m;
    }, [departments]);

    const lvlMap = useMemo(() => {
      const m = new Map();
      for (const x of levels) m.set(x.id, x);
      return m;
    }, [levels]);


    const defaultDir = useMemo(() => {
      return (
        departments.find((x) => String(x.slug || "").toLowerCase() === "direccion") ||
        departments.find((x) => String(x.name || "").toLowerCase().includes("direc")) ||
        null
      );
    }, [departments]);

const defaultLvl = useMemo(() => {
  const act = (levels || []).filter((x) => x?.active !== false);

  // ✅ si existe Dirección, prioriza el "Director" de ese depto
  const dirId = defaultDir?.id ? String(defaultDir.id) : "";
  const actDir = dirId ? act.filter((x) => String(x.department_id || "") === dirId) : act;

  return (
    actDir.find((x) => String(x.name || "").trim().toLowerCase() === "director") ||
    actDir.find((x) => String(x.name || "").toLowerCase().includes("director")) ||
    act.find((x) => String(x.name || "").trim().toLowerCase() === "director") ||
    act.find((x) => String(x.name || "").toLowerCase().includes("director")) ||
    null
  );
}, [levels, defaultDir?.id]);



    // ====== Filters ======
  const filteredDepartments = useMemo(() => {
    let list = departments;

    // ✅ si eliges un depto en el filtro, muestra solo ese
    if (fDept) {
      list = list.filter((d) => String(d.id) === String(fDept));
    }

    // ✅ búsqueda
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((d) => String(d.name || "").toLowerCase().includes(s));
  }, [departments, q, fDept]);


    const filteredLevels = useMemo(() => {
      const s = q.trim().toLowerCase();
      if (!s) return levels;
      return levels.filter((d) => String(d.name || "").toLowerCase().includes(s));
    }, [levels, q]);

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();

return (users || []).filter((u) => {
  // ✅ por defecto NO muestres eliminados/inactivos
  if (u.active === false) return false;

  // 1) search
  if (s) {
    const a = String(u.full_name || "").toLowerCase();
    const b = String(u.username || "").toLowerCase();
    if (!a.includes(s) && !b.includes(s)) return false;
  }

  // 2) dept filter
  if (fDept && String(u.department_id || "") !== String(fDept)) return false;

  // 3) level filter
  if (fLevel && String(u.level_id || "") !== String(fLevel)) return false;

      // 4) conn filter (presence usa auth_user_id)
  // 4) conn filter (online / offline usando presencia + last_seen)
  if (fConn !== "all") {
const authId = String(u.auth_user_id || "");
const lastIso = lastSeen?.[authId] || u.last_seen_at || null;
const activityIso = activityMap?.[authId] || null;

const st = getConnStatus({
  authId,
  onlineSet,
  lastIso,
  activityIso,
});


    // "online" incluye ONLINE real + grace por refresh
    if (fConn === "online" && st.kind !== "online") return false;

    // "offline" incluye RECENT + OFFLINE (si quieres que "offline" sea solo rojo, dímelo)
    if (fConn === "offline" && st.kind === "online") return false;
  }


      return true;
    });
}, [users, q, fDept, fLevel, fConn, onlineSet, lastSeen, nowTick]);



  function openNewDeptCard(anchorEl) {
    // snapshot para “cancelar” (volver a vacío)
    setDeptSnapshot({ id: NEW_DEPT_ID, data: JSON.parse(JSON.stringify(newDeptDraft)) });

    // abre card
    setNewDeptOpen(true);

    // abre editor flotante cerca del botón “Nuevo”
    if (anchorEl?.getBoundingClientRect) {
      const r = anchorEl.getBoundingClientRect();
      setDeptEditor({
        open: true,
        id: NEW_DEPT_ID,
        pane: "main",
        top: r.bottom + 10 + window.scrollY,
        left: Math.min(r.left + window.scrollX, window.innerWidth - 360),
      });
    } else {
      setDeptEditor({ open: true, id: NEW_DEPT_ID, pane: "main", top: 110, left: 80 });
    }
  }

  async function saveNewDept() {
  const cleanName = String(newDeptDraft.name || "").trim();

  const payload = {
    name: cleanName,
    // ✅ si no hay slug, lo generamos (evita null => 400)
    slug: String(newDeptDraft.slug || "").trim() || slugify(cleanName),

    // ✅ JAMÁS null
    color: String(newDeptDraft.color || "#7c3aed"),
    icon_key: String(newDeptDraft.icon_key || "briefcase"),

    sort_order: Number(newDeptDraft.sort_order) || 0,
    active: newDeptDraft.active !== false,
  };


    if (!payload.name) {
      await Swal.fire({
        icon: "warning",
        title: "Falta el nombre",
        text: "Escribe el nombre del departamento.",
      });
      return;
    }

    await apiFetch("/admin/departments", {
      method: "POST",
      body: payload,
    });

    // reset UI
    setNewDeptOpen(false);
    setNewDeptDraft({
      name: "",
      slug: "",
      color: "#7c3aed",
      icon_key: "briefcase", // ✅ también aquí
      sort_order: 0,
      active: true,
    });
    setDeptEditor({ open: false, id: null, top: 0, left: 0, pane: "main" });
    setDeptSnapshot(null);

    await loadAll();
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function animateCloseDeptModal() {
    setDeptModal((s) => ({ ...s, phase: "exit" }));
    await wait(180); // debe coincidir con el CSS
    setDeptModal({ open: false, id: null, mode: "new", phase: "idle" });
  }

  function cancelNewDept() {
    setNewDeptOpen(false);
    setNewDeptDraft({
      name: "",
      slug: "",
      color: "#7c3aed",
      icon_key: "briefcase", // ✅ default
      sort_order: 0,
      active: true,
    });
    setDeptEditor({ open: false, id: null, top: 0, left: 0, pane: "main" });
    setDeptSnapshot(null);
  }


  async function createDepartment() {
    setNewDeptDraft({
      name: "",
      slug: "",
      color: "#7c3aed",
      icon_key: "briefcase",
      sort_order: 0,
      active: true,
    });
    setDeptModal({ open: true, id: NEW_DEPT_ID, mode: "new", phase: "enter" });

  }



    async function createLevel() {
      const { value: formValues } = await Swal.fire({
        title: "Nuevo nivel",
        html:
          `<input id="l_name" class="swal2-input" placeholder="Nombre (ej: Supervisor)" />` +
          `<input id="l_rank" class="swal2-input" placeholder="Rank (0 alto, 10 bajo)" />`,
        focusConfirm: false,
        preConfirm: () => {
          const name = document.getElementById("l_name").value;
          const rank = Number(document.getElementById("l_rank").value || 0);
          return { name, rank };
        },
        showCancelButton: true,
        confirmButtonText: "Crear",
        cancelButtonText: "Cancelar",
      });

      if (!formValues) return;
    await apiFetch("/admin/levels", { method: "POST", body: formValues });
      await loadAll();
    }

  // =========================
  // Invite modal (pro)
  // =========================
  const [inviteOpen, setInviteOpen] = useState({ open: false, phase: "idle" });
  const [inviteDraft, setInviteDraft] = useState({
    email: "",
    temp_password: "",
    full_name: "",
    position: "",
    department_id: "",
    level_id: "",
  });

  // ✅ filtra niveles por depto seleccionado en "Crear usuario" + dedup
const inviteDeptId = String(inviteDraft.department_id || "").trim();

const inviteLevels = useMemo(() => {
  // ✅ si no hay depto => NO mostrar niveles (para que no “crucen”)
  if (!inviteDeptId) return [];

  const act = (levels || []).filter((l) => l?.active !== false);
  const filtered = act.filter((l) => String(l.department_id || "") === inviteDeptId);

  // ✅ dedup por id (por si viene repetido)
  const map = new Map();
  for (const l of filtered) map.set(String(l.id), l);

  return Array.from(map.values());
}, [levels, inviteDeptId]);


// ---- UI password (invite modal) ----
const [showInvitePw, setShowInvitePw] = useState(false);
const [inviteOpenTip, setInviteOpenTip] = useState(false);
const invitePwBoxRef = useRef(null);

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

const invitePwChecks = useMemo(
  () => getPasswordChecks(inviteDraft.temp_password),
  [inviteDraft.temp_password]
);

// cerrar tooltip al click fuera / ESC (solo cuando modal esté abierto)
useEffect(() => {
  if (!inviteOpen.open) return;

  function onDown(e) {
    const t = e.target;
    const inside = invitePwBoxRef.current && invitePwBoxRef.current.contains(t);
    if (!inside) setInviteOpenTip(false);
  }
  function onKey(e) {
    if (e.key === "Escape") setInviteOpenTip(false);
  }

  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("pointerdown", onDown, true);
    document.removeEventListener("keydown", onKey);
  };
}, [inviteOpen.open]);

function openInvite() {
  setInviteDraft({
    email: "",
    temp_password: "",
    full_name: "",
    position: "",
    department_id: "",
    level_id: "",
  });

  setShowInvitePw(false);
  setInviteOpenTip(false);

  setInviteOpen({ open: true, phase: "enter" });
}


function waitInvite(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function animateCloseInviteModal() {
  setInviteOpen((s) => ({ ...s, phase: "exit" }));
  await waitInvite(180);

  setShowInvitePw(false);
  setInviteOpenTip(false);

  setInviteOpen({ open: false, phase: "idle" });
}



  async function submitInvite() {
    const email = String(inviteDraft.email || "").trim();
    const temp_password = String(inviteDraft.temp_password || "").trim();
    const full_name = String(inviteDraft.full_name || "").trim();
    const position = String(inviteDraft.position || "").trim();
    const department_id = inviteDraft.department_id || null;
    const level_id = inviteDraft.level_id || null;

    if (!email) {
      await Swal.fire({ icon: "warning", title: "Falta el correo", text: "Escribe el correo del usuario." });
      return;
    }
    if (!temp_password || temp_password.length < 8) {
      await Swal.fire({ icon: "warning", title: "Contraseña débil", text: "Usa mínimo 8 caracteres." });
      return;
    }

    // ✅ crea usuario SIN enviar correo
    await apiFetch("/admin/users/create-temp", {
      method: "POST",
      body: {
        email,
        temp_password,
        full_name: full_name || null,
        position: position || null,
        department_id,
        level_id,
      },
    });

    await animateCloseInviteModal();
    await loadAll();

    await Swal.fire({
      icon: "success",
      title: "Usuario creado",
      text: "Credenciales temporales listas (no se envió correo).",
      timer: 1200,
      showConfirmButton: false,
    });
  }



    async function resetUserPassword(companyUserId) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "Restablecer contraseña",
        text: "Se enviará un correo con el link de recuperación.",
        showCancelButton: true,
        confirmButtonText: "Enviar",
        cancelButtonText: "Cancelar",
      });
      if (!ok.isConfirmed) return;

      await apiFetch(`/admin/users/${companyUserId}/reset-password`, { method: "POST" });
      Swal.fire({ icon: "success", title: "Enviado", timer: 900, showConfirmButton: false });
    }

async function deleteUser(companyUserId) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Eliminar usuario",
    text: "Esto desactivará al usuario (soft delete).",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!r.isConfirmed) return;

  try {
    await apiFetch(`/admin/users/${companyUserId}`, { method: "DELETE", silent: false });

    // ✅ quítalo de la UI ya (aunque sea soft delete)
    setUsers((prev) => prev.filter((u) => u.id !== companyUserId));

    await Swal.fire({
      icon: "success",
      title: "Usuario eliminado",
      timer: 900,
      showConfirmButton: false,
    });

    await loadAll();
  } catch (e) {
    await Swal.fire({
      icon: "error",
      title: "No se pudo eliminar",
      text: e?.message || e?.error || "Error en /admin/users/:id",
      confirmButtonText: "Ok",
    });
  }
}


async function saveUserInline(id, overrideDraft = null) {
  const p = overrideDraft || draftUsers[id];
  if (!p) return;

  const row = users.find((u) => u.id === id) || {};

  // ✅ dept efectivo SIEMPRE coherente
  const effectiveDeptId =
    (p.department_id && String(p.department_id)) ||
    (row.department_id && String(row.department_id)) ||
    (defaultDir?.id ? String(defaultDir.id) : null);

  // ✅ level: si viene "", se vuelve null
  const nextLevel =
    p.level_id === "" || p.level_id == null
      ? null
      : String(p.level_id);

  const payload = {
    full_name: (p.full_name ?? "").trim() || null,
    position: (p.position ?? "").trim() || null,
    department_id: effectiveDeptId || null,
    level_id: nextLevel,
    active: !!p.active,
  };

  // ✅ Optimista
  setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...payload } : u)));

  // ✅ Guardar (y VER error real)
  try {
    const r = await apiFetch(`/admin/users/${id}`, {
      method: "PATCH",
      body: payload,
      silent: false,
    });

    if (r?.user) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...r.user } : u)));
    }
  } catch (e) {
    await loadAll().catch(() => {});
    await Swal.fire({
      icon: "error",
      title: "No se guardó",
      text: e?.message || e?.error || "Error guardando usuario",
    });
    throw e;
  }

  // ✅ si es "yo" -> metadata
  const ctxAuthId =
    authUid ||
    ctx?.me?.user?.id ||
    ctx?.user?.id ||
    ctx?.authUser?.id ||
    null;

  const meRow = users.find((u) => u.id === id);
  const isMe =
    !!ctxAuthId &&
    !!meRow?.auth_user_id &&
    String(meRow.auth_user_id) === String(ctxAuthId);

  if (isMe) {
    const nextName = (payload.full_name || "").toString().trim();
    try {
      await supabase.auth.updateUser({
        data: { full_name: nextName, name: nextName, display_name: nextName },
      });
    } catch (_) {}

    window.dispatchEvent(new CustomEvent("ik_profile_updated", { detail: { full_name: nextName } }));
    if (nextName) setAuthDisplayName(nextName);
  }
}


    async function saveDeptInline(id) {
      const p = draftDepts[id];
      if (!p) return;

  const cleanName = String(p.name || "").trim();

  await apiFetch(`/admin/departments/${id}`, {
    method: "PATCH",
    body: {
      name: cleanName,
      // ✅ si viene vacío, genera (evita null/"" => 400)
      slug: String(p.slug || "").trim() || slugify(cleanName),

      // ✅ JAMÁS null
      color: String(p.color || "#7c3aed"),
      icon_key: String(p.icon_key || "briefcase"),

      sort_order: Number(p.sort_order) || 0,
      active: !!p.active,
    },
    silent: true,
  });


    }


async function saveLvlInline(id) {
  const p = draftLvls[id];
  if (!p) return;

  await apiFetch(`/admin/levels/${id}`, {
    method: "PATCH",
    body: {
      name: p.name,
      rank: Number(p.rank) || 0,
      color: p.color || null,
      icon_key: p.icon_key || null,
      active: !!p.active,
    },
    silent: true,
  });
}


    // ====== Tabs slider ======
    const tabIndex = view === "depts" ? 0 : view === "users" ? 1 : 2;

    // ====== Top right "Nuevo" contextual ======
  const onNew = view === "depts" ? createDepartment : null;

  function getDeptPayloadForEditor(id) {
    const isNew = id === NEW_DEPT_ID;

  if (isNew) {
    return {
      name: newDeptDraft.name ?? "",
      slug: newDeptDraft.slug ?? "",
      color: newDeptDraft.color ?? "#7c3aed",
      icon_key: newDeptDraft.icon_key ?? "briefcase", // ✅ nunca ""
      sort_order: newDeptDraft.sort_order ?? 0,
      active: newDeptDraft.active !== false,
    };
  }


    const base = departments.find((x) => x.id === id) || {};
    return (
      draftDepts[id] || {
        name: base.name ?? "",
        slug: base.slug ?? "",
        color: base.color ?? "#7c3aed",
        icon_key: base.icon_key ?? "briefcase",
        sort_order: base.sort_order ?? 0,
        active: base.active !== false,
      }
    );
  }

    return (
      <DashboardLayout ctx={ctx}>
  <div className="ap-shell">





          {/* TOP BAR */}
          <div className="ap-top">
            <div className="ap-tabs" role="tablist" aria-label="Admin views">
              <div className="ap-tabRail">
                <div className="ap-tabSlider" style={{ transform: `translateX(${tabIndex * 50}px)` }} />
                <button
                  className={`ap-tab ${view === "depts" ? "is-active" : ""}`}
                  onClick={() => setView("depts")}
                  title="Departamentos"
                >
                  <FiGrid />
                </button>
                <button
                  className={`ap-tab ${view === "users" ? "is-active" : ""}`}
                  onClick={() => setView("users")}
                  title="Usuarios"
                >
                  <FiUsers />
                </button>
  <button
    className={`ap-tab ${view === "levels" ? "is-active" : ""}`}
    onClick={() => setView("levels")}
    title="Organigrama"
  >
    <MdAccountTree />
  </button>

              </div>
            </div>

  {/* ✅ Search + filtros SOLO si NO es "levels" */}
  {view !== "levels" ? (
    <div className="ap-searchRow">
      <div className="ap-searchBoxOnly">
        <FiSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar"
        />
      </div>

      {/* ✅ FILTROS: depts => solo Departamento | users => Dept + Nivel + Conexión */}
      <div className="ap-filtersBar">
        {/* ✅ Siempre disponible: filtro por Departamento */}
        <IconSelect
          className="ap-filterSelect"
          value={fDept}
          onChange={(val) => setFDept(val)}
          placeholder="Departamento"
          options={[
            ...(fDept ? [{ value: "", label: "Todos los departamentos", iconKey: "groups" }] : []),
            ...departments.map((d) => ({
              value: d.id,
              label: d.name,
              iconKey: (draftDepts?.[d.id]?.icon_key ?? d.icon_key) || "briefcase",
            })),
          ]}
        />

        {/* ✅ SOLO en USERS: Nivel + Conexión */}
        {view === "users" ? (
          <>
            <IconSelect
              className="ap-filterSelect"
              value={fLevel}
              onChange={(val) => setFLevel(val)}
              placeholder="Nivel"
              options={[
                ...(fLevel ? [{ value: "", label: "Todos los niveles", iconKey: "verified" }] : []),
...levels
  .filter((l) => l?.active !== false)
  .filter((l) => !fDept || String(l.department_id || "") === String(fDept)) // ✅ respeta depto
  .map((l) => ({
    value: l.id,
    label: l.name,
    iconKey: (draftLvls?.[l.id]?.icon_key ?? l.icon_key) || "verified",
  })),

              ]}
            />

            <IconSelect
              className="ap-filterSelect"
              value={fConn}
              onChange={(val) => setFConn(val)}
              placeholder="Conexión"
              options={[
                ...(fConn !== "all" ? [{ value: "all", label: "Todos", iconKey: "support" }] : []),
                ...(fConn !== "online" ? [{ value: "online", label: "Online", iconKey: "check" }] : []),
                ...(fConn !== "offline" ? [{ value: "offline", label: "Offline", iconKey: "shield" }] : []),
              ]}
            />
          </>
        ) : null}
      </div>
    </div>
  ) : (
    <div style={{ flex: 1 }} />
  )}


  {/* ✅ Acciones SOLO si NO es organigrama */}
  {view !== "levels" ? (
    <div className="ap-actions">
      <button className="ap-iconBtn" onClick={loadAll} title="Actualizar">
        <FiRefreshCw />
      </button>

      <button className="ap-primaryBtn" onClick={openInvite} title="Agregar">
        <FiPlus />
        <span>Agregar</span>
      </button>

      {onNew ? (
        <button className="ap-primaryBtn ap-primaryGhost" onClick={onNew} title="Nuevo">
          <FiPlus />
          <span>Nuevo</span>
        </button>
      ) : null}
    </div>
  ) : null}

          </div>

          {/* CONTENT */}
          {view === "depts" && (
            <div className="ap-section">
  <div className="ap-grid">


    {filteredDepartments.map((d) => {
      const count = users.filter((u) => {
        if (!u.active) return false;
        if (u.department_id === d.id) return true;
        if (!u.department_id && defaultDir?.id === d.id) return true;
        return false;
      }).length;

  return (
    <div
      key={d.id}
      className="ap-card ap-cardCenter"
      style={{
        "--ap-accent": (draftDepts[d.id]?.color ?? d.color) || "#7c3aed",
        "--ap-accent-rgb": hexToRgbCSS((draftDepts[d.id]?.color ?? d.color) || "#7c3aed"),
      }}
      title={d.name}
    >
      {/* ✅ 3 puntitos (menu) */}
      <button
        type="button"
        className="ap-cardDots"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          // snapshot para poder “cancelar” cambios si quieres
          setDeptSnapshot({
            id: d.id,
            data: JSON.parse(
              JSON.stringify(
                draftDepts[d.id] || {
                  name: d.name ?? "",
                  slug: d.slug ?? "",
                  color: d.color ?? "#7c3aed",
                  icon_key: d.icon_key ?? "briefcase",
                  sort_order: d.sort_order ?? 0,
                  active: d.active !== false,
                }
              )
            ),
          });

          // ✅ abre modal edit
          setDeptModal({ open: true, id: d.id, mode: "edit", phase: "enter" });

        }}
        title="Opciones"
      >
        <span className="ap-dots">···</span>
      </button>

      <button
        type="button"
        className="ap-cardIcon"
        title={draftDepts?.[d.id]?.icon_key || d.icon_key || "briefcase"}
        onMouseDown={(e) => {
          e.stopPropagation();

          const r = e.currentTarget.closest(".ap-card")?.getBoundingClientRect?.();
          if (!r) return;

          setDeptEditor({
            open: true,
            id: d.id,
            pane: "icon",
            top: r.bottom + 10 + window.scrollY,
            left: Math.min(r.left + window.scrollX, window.innerWidth - 360),
          });

          setDeptSnapshot({
            id: d.id,
            data: JSON.parse(
              JSON.stringify(
                draftDepts[d.id] || {
                  name: d.name ?? "",
                  slug: d.slug ?? "",
                  color: d.color ?? "#7c3aed",
                  icon_key: d.icon_key ?? "briefcase",
                  sort_order: d.sort_order ?? 0,
                  active: d.active !== false,
                }
              )
            ),
          });
        }}
      >
    <IconByKey iconKey={(draftDepts?.[d.id]?.icon_key ?? d.icon_key) || "briefcase"} />
  </button>

  {/* ✅ Nombre */}
  {(() => {
    const nm = String(draftDepts?.[d.id]?.name ?? d.name ?? "").trim();
    const isLong = nm.length > 18; // ajusta si quieres
    return (
      <div className={`ap-cardName ap-clamp2 ${isLong ? "ap-cardNameSm" : ""}`}>
        {nm || "—"}
      </div>
    );
  })()}

  {/* ✅ Contador */}
  <div className="ap-cardMeta ap-cardMetaCenter">
    <span className="ap-counter">{String(count).padStart(2, "0")}</span>
  </div>
  </div>

  );

    })}
  </div>



  {deptModal.open ? (
    <div className={`ap-modalOverlay ${deptModal.phase === "enter" ? "is-enter" : ""} ${deptModal.phase === "exit" ? "is-exit" : ""}`} 

      onMouseDown={async () => {
        const id = deptModal.id;
        const p = getDeptPayloadForEditor(id);

        // si es new, compara contra snapshot del draft
        if (id === NEW_DEPT_ID) {
          const changed =
            String(newDeptDraft.name || "") !== String(deptSnapshot?.data?.name || "") ||
            String(newDeptDraft.slug || "") !== String(deptSnapshot?.data?.slug || "") ||
            String(newDeptDraft.color || "") !== String(deptSnapshot?.data?.color || "") ||
            String(newDeptDraft.icon_key || "") !== String(deptSnapshot?.data?.icon_key || "");

          if (changed) {
            await Swal.fire({
              icon: "warning",
              title: "No has guardado los cambios",
              text: "Pulsa (✓) para guardar o cierra descartando.",
              confirmButtonText: "Entendido",
            });
            return;
          }

        await animateCloseDeptModal();

          setDeptSnapshot(null);
          return;
        }

        // edit: usa tu detector existente
        await tryCloseDeptEditor(id, p);
        setDeptSnapshot(null);

      }}
    >
      <div className="ap-modal" onMouseDown={(e) => e.stopPropagation()}>
        {(() => {
          const id = deptModal.id;
          const isNew = id === NEW_DEPT_ID;
          const p = getDeptPayloadForEditor(id);

          const count =
            isNew
              ? 0
              : users.filter((u) => u.active && (u.department_id === id)).length;

  async function doSave() {
    if (isNew) {
      const nm = String(newDeptDraft.name || "").trim() || "—";

      await saveNewDept();              // crea + reset UI (tu función)
      setDeptSnapshot(null);

      await animateCloseDeptModal();    // ✅ cierre con animación
      await Swal.fire({
        icon: "success",
        title: "Departamento creado",
        text: `Has creado el departamento: ${nm}`,
        timer: 1400,
        showConfirmButton: false,
      });
      return;
    }

    const nm = String((draftDepts?.[id]?.name ?? p?.name ?? "") || "").trim() || "—";

    await saveDeptInline(id);           // edita
    setDeptSnapshot(null);

    await animateCloseDeptModal();      // ✅ cierre con animación
    await Swal.fire({
      icon: "success",
      title: "Departamento editado",
      text: `Has editado el departamento: ${nm}`,
      timer: 1400,
      showConfirmButton: false,
    });
  }


  async function doDelete() {
    const deptName =
      String((draftDepts?.[id]?.name ?? p?.name ?? "")).trim() || "—";

    const r = await Swal.fire({
      icon: "warning",
      title: "Eliminar departamento",
      text: `¿Quieres eliminar el departamento “${deptName}” de tu organización?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    // ✅ Si canceló: también cierra TU modal grande (con animación)
    if (!r.isConfirmed) {
      await animateCloseDeptModal();
      setDeptSnapshot(null);
      return;
    }

    try {
      // ✅ NO uses DELETE (tu backend no lo tiene). Soft delete directo:
      await apiFetch(`/admin/departments/${id}`, {
        method: "PATCH",
        body: { active: false },
        silent: true,
      });

      // UI inmediata (ocúltalo del grid)
      setDepartments((s) => s.filter((x) => x.id !== id));
      setDraftDepts((s) => ({ ...s, [id]: { ...(s[id] || p), active: false } }));
    }  finally {
    // ✅ cierre con animación SIEMPRE
    await animateCloseDeptModal();
    setDeptSnapshot(null);

    // ✅ toast de éxito (auto-cierra)
    await Swal.fire({
      icon: "success",
      title: "Departamento eliminado",
      text: `“${deptName}” se eliminó exitosamente.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  }



          return (
            <>
              {/* HEADER */}
              <div className="ap-modalTop">
                <div className="ap-modalTitle">
                  <span className="ap-modalBadge" style={{ background: p.color || "#7c3aed" }}>
                    <IconByKey iconKey={p.icon_key || "briefcase"} />
                  </span>
                  <div>
                    <div className="ap-modalH1">
                      {isNew ? "Nuevo departamento" : "Editar departamento"}
                    </div>
                    <div className="ap-modalSub">{p.slug || "—"}</div>
                  </div>
                </div>

                <div className="ap-modalActions">
  <button
    className="ap-modalIconBtn"
    title="Cerrar"
    onClick={async () => {
      // si quieres, aquí podrías reusar tu lógica de “no guardado”
      await animateCloseDeptModal();
      setDeptSnapshot(null);
    }}
  >
    <FiX />
  </button>


                  <button className="ap-modalIconBtn ap-ok" title="Guardar" onClick={() => doSave().catch(() => {})}>
                    <FiCheck />
                  </button>

                  {!isNew ? (
                    <button className="ap-modalIconBtn ap-danger" title="Eliminar" onClick={() => doDelete().catch(() => {})}>
                      <FiTrash2 />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* BODY */}
              <div className="ap-modalBody">
                {/* LEFT: PREVIEW CARD */}
  <div className="ap-modalPreview">
    <div
      className="ap-card ap-cardCenter ap-cardPreview"
      style={{
        "--ap-accent": p.color || "#7c3aed",
        "--ap-accent-rgb": hexToRgbCSS(p.color || "#7c3aed"),
      }}
    >
      <div className="ap-cardIcon">
        <IconByKey iconKey={p.icon_key || "briefcase"} />
      </div>

      <div className="ap-cardName ap-clamp2">
        {p.name || "Nombre"}
      </div>

      <div className="ap-cardMeta ap-cardMetaCenter">
        <span className="ap-counter">{String(count).padStart(2, "0")}</span>
      </div>
    </div>

    {/* ✅ COLOR debajo de la card (compact) */}
    <div className="ap-miniColor">
      <div className="ap-miniColorHead">
        <span className="ap-dot" style={{ background: p.color || "#7c3aed" }} />
        <span>Color</span>
      </div>

      <div className="ap-miniColorBody" onMouseDown={(e) => e.stopPropagation()}>
        <ColorSVPicker
          compact
          value={p.color || "#7c3aed"}
          onChange={(hex) => {
            if (isNew) setNewDeptDraft((s) => ({ ...s, color: hex }));
            else setDraftDepts((s) => ({ ...s, [id]: { ...(s[id] || p), color: hex } }));
          }}
        />
      </div>
    </div>
  </div>


                {/* RIGHT: “submenús” integrados (accordion) */}
                <div className="ap-modalForm">
                  {/* NOMBRE */}
                  <div className="ap-acc">
                    <div className="ap-accHead">
                      <FiEdit3 /> <span>Nombre</span>
                    </div>
                    <div className="ap-accBody">
  <input
    className="ap-lineInput"
    value={p.name || ""}
    onChange={(e) => {
      const next = toTitleCaseWords(e.target.value);

      if (isNew) {
        setNewDeptDraft((s) => ({ ...s, name: next }));
        return;
      }
      setDraftDepts((s) => ({ ...s, [id]: { ...(s[id] || p), name: next } }));
    }}
    placeholder="Nombre"
    autoFocus
  />

                    </div>
                  </div>

                  {/* ICONO */}
                  <div className="ap-acc">
                    <div className="ap-accHead">
                      <FiImage /> <span>Icono</span>
                    </div>
                    <div className="ap-accBody">
                      <div className="ap-iconGrid2 ap-iconGrid2Flat">
                        {ICONS.map((x) => {
                          const C = x.Icon;
                          const active = x.key === (p.icon_key || "");
                          return (
                            <button
                              key={x.key}
                              className={`ap-icoCell2 ${active ? "is-on" : ""}`}
                              title={x.label}
                              onClick={() => {
                                if (isNew) {
                                  setNewDeptDraft((s) => ({ ...s, icon_key: x.key }));
                                } else {
                                  setDraftDepts((s) => ({ ...s, [id]: { ...(s[id] || p), icon_key: x.key } }));
                                }
                              }}
                            >
                              <C />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>



                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  ) : null}



            </div>
          )}

          {view === "users" && (
            <div className="ap-section">
  <div
    className="ap-tableWrap"
    style={{
      "--ap-table-accent-rgb": hexToRgbCSS(
        (() => {
          const first = filteredUsers?.[0];
          const dep0 = first ? (depMap.get(first.department_id) || (first.department_id ? null : defaultDir)) : defaultDir;
          const c =
            (dep0?.id ? (draftDepts?.[dep0.id]?.color ?? dep0?.color) : null) ||
            (defaultDir?.id ? (draftDepts?.[defaultDir.id]?.color ?? defaultDir?.color) : null) ||
            "#7c3aed";
          return c;
        })()
      ),
    }}
  >
    <table className="ap-table">

  <thead>
    <tr>
      <th>Nombre</th>
      <th>Usuario</th>
      <th>Departamento</th>
      <th>Nivel</th>
      <th>Estado</th>
      <th>Conexión</th>
      <th style={{ width: 160, textAlign: "right" }}>Acciones</th>
    </tr>
  </thead>


                  <tbody>
                    {filteredUsers.map((u) => {
                      const dep = depMap.get(u.department_id) || (u.department_id ? null : defaultDir);
                      const lvl = lvlMap.get(u.level_id) || (u.level_id ? null : defaultLvl);

  const ctxAuthId =
    ctx?.me?.user?.id ||
    ctx?.user?.id ||
    ctx?.authUser?.id ||
    null;

  const ctxUsername =
    ctx?.me?.company_user?.username ||
    ctx?.membership?.username ||
    ctx?.me?.username ||
    ctx?.user?.email?.split("@")?.[0] ||
    null;

  // ✅ detecta “yo” por auth uid o por username
  const isMe =
    (!!ctxAuthId && !!u.auth_user_id && u.auth_user_id === ctxAuthId) ||
    (!!ctxUsername && !!u.username && String(u.username) === String(ctxUsername));

  // ✅ nombre desde metadata (y otras posibles ubicaciones)

  const metaName =
    String(
      authDisplayName || // ✅ viene directo de supabase.auth.getUser()
      ctx?.me?.company_user?.full_name ||
      ctx?.me?.profile?.full_name ||
      ctx?.me?.user?.user_metadata?.full_name ||
      ctx?.me?.user?.user_metadata?.name ||
      ctx?.user?.user_metadata?.full_name ||
      ctx?.user?.user_metadata?.name ||
      ""
    ).trim();


  // ✅ fallback fuerte (si no hay full_name aún en DB)
  const fallbackName =
    String(
      u.full_name ||
      (draftUsers?.[u.id]?.full_name ?? "") ||
      (isMe ? metaName : "") ||
      u.username ||
      (draftUsers?.[u.id]?.username ?? "") ||
      "—"
    ).trim();

  const displayName =
    String(
      u.full_name ||
      u.display_name ||            // ✅ viene del backend (Supabase Auth)
      (draftUsers?.[u.id]?.full_name ?? "") ||
      (isMe ? metaName : "") ||
      u.username ||
      (draftUsers?.[u.id]?.username ?? "") ||
      "—"
    ).trim();



                      const p = draftUsers[u.id] || {};

  const depColor =
    (dep?.id ? (draftDepts?.[dep.id]?.color ?? dep?.color) : null) ||
    (defaultDir?.id ? (draftDepts?.[defaultDir.id]?.color ?? defaultDir?.color) : null) ||
    "#7c3aed";

  return (
    <tr
      key={u.id}
      className="ap-userRow"
      style={{ "--ap-row-accent-rgb": hexToRgbCSS(depColor) }}
    >
      <td>
        {editUserId === u.id ? (
          <input
            className="ap-tdInput ap-strongInput"
            value={p.full_name ?? ""}
            onChange={(e) =>
              setDraftUsers((s) => ({ ...s, [u.id]: { ...p, full_name: e.target.value } }))
            }
            placeholder="Nombre"
            autoFocus
          />
        ) : (
          <div className="ap-tdDisplay ap-strongDisplay" title={displayName}>
            {displayName}
          </div>
        )}
      </td>

      <td>
        {editUserId === u.id ? (
          <input
            className="ap-tdInput ap-mono"
            value={p.username ?? u.username ?? ""}
            onChange={(e) =>
              setDraftUsers((s) => ({ ...s, [u.id]: { ...p, username: e.target.value } }))
            }
            placeholder="Usuario"
          />
        ) : (
          <div className="ap-tdDisplay ap-mono" title={u.username}>
            {u.username}
          </div>
        )}
      </td>

  <td>
<IconSelect
  className="ap-tdSelectPro"
  // ✅ usa || para que "" NO bloquee el fallback
  value={(p.department_id || (dep?.id || ""))}
onChange={(val) => {
  const next = { ...p, department_id: val || "", level_id: "" }; // ✅ si cambias depto, resetea nivel
  setDraftUsers((s) => ({ ...s, [u.id]: next }));
  setTimeout(() => saveUserInline(u.id, next), 0);
}}

  placeholder="Departamento"
  options={[
    // ✅ value "" = sin depto (fallback visual), NO lo llames "Dirección"
    {
      value: "",
      label: "Sin departamento",
      iconKey: "groups",
    },
    ...departments.map((d) => ({
      value: d.id,
      label: d.name,
      iconKey: (draftDepts?.[d.id]?.icon_key ?? d.icon_key) || "briefcase",
    })),
  ]}
/>

  </td>


  <td>
    {(() => {
      // dept actual (draft o real)
      const deptId = String(p.department_id || u.department_id || dep?.id || "");


const lvlList = (
  deptId
    ? levels.filter((x) => String(x.department_id || "") === String(deptId))
    : [] // ✅ si no hay depto, NO mostrar niveles
).filter((x) => x?.active !== false);



      return (
<IconSelect
  className="ap-tdSelectPro"
  value={(p.level_id || (lvl?.id || ""))}
  disabled={!deptId} // ✅ bloquea si no hay depto
  onChange={(val) => {
    const effectiveDeptId = p.department_id || u.department_id || dep?.id || "";

    const next = {
      ...p,
      department_id: effectiveDeptId || "",
      level_id: val, // "" o uuid
    };

    setDraftUsers((s) => ({ ...s, [u.id]: next }));
    setTimeout(() => saveUserInline(u.id, next), 0);
  }}
  placeholder={!deptId ? "Selecciona un departamento" : "Nivel"}
  options={[
    { value: "", label: "Sin nivel", iconKey: "verified" },
    ...lvlList.map((l) => ({
      value: l.id,
      label: l.name,
      iconKey: (draftLvls?.[l.id]?.icon_key ?? l.icon_key) || "verified",
    })),
  ]}
/>


      );
    })()}
  </td>



      <td>
        <button
          className={`ap-toggle ${p.active ? "is-on" : ""}`}
          onClick={() => {
            setDraftUsers((s) => ({ ...s, [u.id]: { ...p, active: !p.active } }));
            setTimeout(() => saveUserInline(u.id), 0);

          }}
          title="Activar/Desactivar"
        >
          <span />
        </button>
      </td>
<td>
  {(() => {
    const authId = String(u.auth_user_id || "");
    const lastIso = lastSeen?.[authId] || u.last_seen_at || null;
    const activityIso = activityMap?.[authId] || null;

    const st = getConnStatus({
      authId,
      onlineSet,
      lastIso,
      activityIso,
    });

    const lastClock = formatLastSeen(lastIso);

    // ✅ ícono principal
    const mainIcon =
      st.kind === "online" ? <MdWifi /> :
      st.kind === "away" ? <MdSchedule /> :
      st.kind === "recent" ? <MdSchedule /> :
      <MdWifiOff />;

    // ✅ tooltip: si está online NO muestres "Última"
    const connTitle =
      st.kind === "online"
        ? st.label
        : `${st.label} · Última: ${lastClock}`;

    return (
      <div
        className={`ap-conn ${
          st.kind === "online" ? "is-on" :
          st.kind === "away" ? "is-away" :
          st.kind === "recent" ? "is-recent" :
          "is-off"
        }`}
        title={connTitle}
      >
        <span className="ap-connIco">{mainIcon}</span>

        <span className="ap-connState">{st.label}</span>

        {/* ✅ solo mostrar última hora si NO está online */}
        {st.kind !== "online" ? (
          <span className="ap-connLast">
            <MdSchedule />
            {lastClock}
          </span>
        ) : null}
      </div>
    );
  })()}
</td>



      <td className="ap-actionsRight">
        {editUserId === u.id ? (
          <>
            <button className="ap-rowBtnIcon ap-actOk" onClick={() => saveEditUser(u.id)} title="Guardar">
              <FiCheck />
            </button>
            <button className="ap-rowBtnIcon ap-actCancel" onClick={cancelEditUser} title="Cancelar">
              <FiX />
            </button>
          </>
        ) : (
          <>
            <button className="ap-rowBtnIcon ap-actEdit" onClick={() => startEditUser(u)} title="Editar">

              <FiEdit3 />
            </button>
  {(() => {
    // ✅ Regla: solo permitir reset si tiene password local
    // (en Supabase típicamente "email" = password local)
    const providers = Array.isArray(u.auth_providers) ? u.auth_providers : [];
    const canReset = u.has_password === true || providers.includes("email");

    if (!canReset) {
      return (
        <button
          className="ap-rowBtnIcon ap-actReset"
          type="button"
          disabled
          title="Esta cuenta usa Google. No tiene contraseña local."
          onClick={() => {
            Swal.fire({
              icon: "info",
              title: "Cuenta Google",
              text: "Este usuario inicia sesión con Google y no tiene contraseña local. Si quiere contraseña, debe agregar método 'password' desde su cuenta.",
            });
          }}
          style={{ opacity: 0.35, cursor: "not-allowed" }}
        >
          <FiRefreshCw />
        </button>
      );
    }

    return (
      <button className="ap-rowBtnIcon ap-actReset" onClick={() => resetUserPassword(u.id)} title="Restablecer contraseña">
        <FiRefreshCw />
      </button>
    );
  })()}

            <button className="ap-rowBtnIcon ap-actDelete" onClick={() => deleteUser(u.id)} title="Eliminar">
              <FiTrash2 />
            </button>
          </>
        )}
      </td>
    </tr>
  );

                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
  {view === "levels" && (

    <div className="ap-section">
<DeptLevelsManager
  ctx={ctx}
  departments={departments}
  users={users}
  onReload={loadAll}
/>

    </div>
  )}



        </div>
  {inviteOpen.open ? (
    <div
      className={`ap-invOverlay ${inviteOpen.phase === "enter" ? "is-enter" : ""} ${inviteOpen.phase === "exit" ? "is-exit" : ""}`}
      onMouseDown={() => animateCloseInviteModal().catch(() => {})}
    >
      <div className="ap-invModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ap-invTop">
          <div className="ap-invTitle">
            <span className="ap-invBadge">
              <FiUsers />
            </span>
            <div>
              <div className="ap-invH1">Crear usuario</div>
              <div className="ap-invSub">Correo + contraseña temporal (sin envío de correo)</div>
            </div>
          </div>

          <div className="ap-invActions">
            <button className="ap-modalIconBtn" title="Cerrar" onClick={() => animateCloseInviteModal().catch(() => {})}>
              <FiX />
            </button>
            <button className="ap-modalIconBtn ap-ok" title="Crear" onClick={() => submitInvite().catch(() => {})}>
              <FiCheck />
            </button>
          </div>
        </div>

        <div className="ap-invBody">
          <div className="ap-invField">
            <div className="ap-invLab">Correo</div>
<input
  className="ap-invInput"
  value={inviteDraft.email}
  onChange={(e) => {
    const next = String(e.target.value || "")
      .replace(/\s+/g, "")   // quita espacios (opcional pero recomendado)
      .toLowerCase();        // ✅ fuerza minúsculas
    setInviteDraft((s) => ({ ...s, email: next }));
  }}
  placeholder="correo@empresa.com"
  autoFocus
  inputMode="email"
  autoComplete="email"
  spellCheck={false}
/>

          </div>

<div className="ap-invField" ref={invitePwBoxRef} style={{ position: "relative" }}>
  <div className="ap-invLab">Contraseña temporal</div>

  <div className="ap-pwWrap">
    <input
      className="ap-invInput ap-pwInput"
      type={showInvitePw ? "text" : "password"}
      value={inviteDraft.temp_password}
      onChange={(e) => setInviteDraft((s) => ({ ...s, temp_password: e.target.value }))}
      onFocus={() => setInviteOpenTip(true)}
      placeholder="Mínimo 8 caracteres"
      autoComplete="new-password"
    />

<button
  type="button"
  className="pw-eye"
  onClick={() => setShowInvitePw((v) => !v)}
  aria-label={showInvitePw ? "Ocultar contraseña" : "Mostrar contraseña"}
  tabIndex={-1}
>
  <span className={`eye-ic ${showInvitePw ? "on" : ""}`} />
</button>

  </div>

  {inviteOpenTip && (
    <div className="ap-pwFloat">
      <div className="ap-pwTitle">La contraseña temporal debe cumplir:</div>

      <div className={`ap-pwItem ${invitePwChecks.len ? "ok" : "bad"}`}>
        <span className="ap-pwDot" />
        <span>Al menos 8 caracteres</span>
      </div>

      <div className={`ap-pwItem ${invitePwChecks.upper ? "ok" : "bad"}`}>
        <span className="ap-pwDot" />
        <span>Al menos 1 mayúscula (A-Z)</span>
      </div>

      <div className={`ap-pwItem ${invitePwChecks.lower ? "ok" : "bad"}`}>
        <span className="ap-pwDot" />
        <span>Al menos 1 minúscula (a-z)</span>
      </div>

      <div className={`ap-pwItem ${invitePwChecks.number ? "ok" : "bad"}`}>
        <span className="ap-pwDot" />
        <span>Al menos 1 número (0-9)</span>
      </div>

      <div className={`ap-pwItem ${invitePwChecks.symbol ? "ok" : "bad"}`}>
        <span className="ap-pwDot" />
        <span>Al menos 1 símbolo (!@#$…)</span>
      </div>

      <div className={`ap-pwItem ${invitePwChecks.forbidden ? "ok" : "bad"}`}>
        <span className="ap-pwDot" />
        <span>No usar: . , ; comillas ' " ni ´</span>
      </div>
    </div>
  )}
</div>


          <div className="ap-invField">
            <div className="ap-invLab">Nombre completo</div>
<input
  className="ap-invInput"
  value={inviteDraft.full_name}
  onChange={(e) => {
    const raw = String(e.target.value || "");
    const cleaned = raw.replace(/\s+/g, " ");          // opcional: colapsa dobles espacios
    const next = toTitleCaseWords(cleaned);            // ✅ “Jose De Jesus Lopez Serrano”
    setInviteDraft((s) => ({ ...s, full_name: next }));
  }}
  placeholder="Nombre Apellido"
  autoComplete="name"
  spellCheck={false}
/>

          </div>


          <div className="ap-invField">
            <div className="ap-invLab">Departamento</div>
<IconSelect
  className="ap-invSelect"
  value={inviteDraft.department_id}
  onChange={(val) =>
    setInviteDraft((s) => ({
      ...s,
      department_id: val,
      level_id: "", // ✅ si cambias depto, reinicia nivel
    }))
  }
  placeholder="Departamento"
  options={[
    { value: "", label: "Sin departamento", iconKey: "groups" },
    ...departments.map((d) => ({
      value: d.id,
      label: d.name,
      iconKey: (draftDepts?.[d.id]?.icon_key ?? d.icon_key) || "briefcase",
    })),
  ]}
/>

          </div>

          <div className="ap-invField">
            
            <div className="ap-invLab">Nivel</div>
            
<IconSelect
  className="ap-invSelect"
  value={inviteDraft.level_id}
  onChange={(val) => setInviteDraft((s) => ({ ...s, level_id: val }))}
  disabled={!inviteDraft.department_id} // ✅ bloquea si no hay depto
  placeholder={!inviteDraft.department_id ? "Selecciona un departamento" : "Nivel"}
  options={[
    { value: "", label: "Sin nivel", iconKey: "verified" },
    ...inviteLevels.map((l) => ({
      value: l.id,
      label: l.name,
      iconKey: (draftLvls?.[l.id]?.icon_key ?? l.icon_key) || "verified",
    })),
  ]}
/>


          </div>

          <div className="ap-invHint" style={{textAlign: "center"}}>
            Al entrar, deberá cambiar la contraseña.
          </div>
        </div>
      </div>
    </div>
  ) : null}


      </DashboardLayout>
    );
  }
