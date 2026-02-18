import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiPlus, FiX, FiCheck, FiTrash2, FiEdit3 } from "react-icons/fi";
import { MdWork, MdVerifiedUser, MdGroups, MdShield } from "react-icons/md";
import Swal from "sweetalert2";
import { apiFetch } from "../../api";

// ✅ Iconos disponibles para niveles (guarda icon_key en DB)
const LEVEL_ICONS = [
  { key: "work", label: "Trabajo", Icon: MdWork },
  { key: "verified", label: "Verificado", Icon: MdVerifiedUser },
  { key: "groups", label: "Grupos", Icon: MdGroups },
  { key: "shield", label: "Seguridad", Icon: MdShield },
];

// ✅ Catálogo de módulos (keys = lo que usas en el Sidebar)
const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "forms", label: "Forms" },
  { key: "documents", label: "Documents" },

  { key: "inventory", label: "Inventario" },
  { key: "purchases", label: "Compras" },
  { key: "sales", label: "Ventas" },

  { key: "treasury", label: "Tesorería" },
  { key: "accounting", label: "Contabilidad" },

  { key: "admin_users", label: "Admin Panel" },
  { key: "admin_security", label: "Seguridad" },
  { key: "admin_settings", label: "Settings" },
];


function IconByKey({ iconKey }) {
  const hit = LEVEL_ICONS.find((x) => x.key === iconKey);
  const C = hit?.Icon || MdWork;
  return <C />;
}

function toTitleCaseWords(input) {
  const s = String(input ?? "");
  const lower = s.toLowerCase();
  return lower.replace(/(^|[\s\-\/])(\p{L})/gu, (_, sep, ch) => `${sep}${ch.toUpperCase()}`);
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

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ✅ Detecta si el depto es "Dirección"
function stripAccents(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isDireccionDept(dept) {
  const name = stripAccents(String(dept?.name || "").trim().toLowerCase());
  const slug = stripAccents(String(dept?.slug || "").trim().toLowerCase());
  return slug === "direccion" || name === "direccion" || name.includes("direc");
}


async function ensureDefaultDirectorLevel({ deptId, levels }) {
  const depId = String(deptId || "");
  if (!depId) return;

  // ✅ Buscar Director por nombre
  const hit = (levels || []).find(
    (l) => String(l?.name || "").trim().toLowerCase() === "director"
  );

  // ✅ Si existe y está activo → listo
  if (hit && hit.active !== false) return;

  // ✅ módulos por defecto
  const module_keys = MODULES.map((m) => m.key);

  // ✅ Si existe pero estaba "eliminado" (active:false), REACTIVARLO
  if (hit && hit.active === false) {
    await apiFetch(`/admin/levels/${hit.id}`, {
      method: "PATCH",
      body: {
        active: true,
        rank: Number(hit.rank ?? 0) || 0,
        icon_key: String(hit.icon_key || "verified"),
        module_keys: Array.isArray(hit.module_keys) && hit.module_keys.length ? hit.module_keys : module_keys,
        name: "Director",
      },
      silent: false,

    });
    return;
  }

  // ✅ Si NO existe → crearlo
  await apiFetch("/admin/levels", {
    method: "POST",
    body: {
      name: "Director",
      rank: 0,
      icon_key: "verified",
      module_keys,
      department_id: depId,
      active: true,
    },
    silent: false,

  });
}


export default function DeptLevelsManager({
  ctx,
  departments = [],
  users = [],
  onReload,
}) {
  const [deptId, setDeptId] = useState(() => (departments?.[0]?.id ? String(departments[0].id) : ""));
  const [q, setQ] = useState("");

  // ✅ levels ahora se cargan POR dept
  const cacheKey = (id) => `IK_LVLS_CACHE_${String(id || "")}`;

const [levels, setLevels] = useState(() => {
  try {
    const raw = sessionStorage.getItem(cacheKey(deptId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
});

  const [loadingLevels, setLoadingLevels] = useState(false);

  // ✅ modal pro (tipo dept modal) SIN color
  const [lvlModal, setLvlModal] = useState({ open: false, phase: "idle", mode: "new", id: null });
  const [lvlDraft, setLvlDraft] = useState({ name: "", rank: 0, icon_key: "work", module_keys: [] });



  // menu “···” por card
  const [menu, setMenu] = useState({ open: false, id: null, top: 0, left: 0 });

  const dept = useMemo(() => departments.find((x) => String(x.id) === String(deptId)) || null, [departments, deptId]);
  const deptName = dept?.name || "Departamento";
  const deptColor = dept?.color || "#7c3aed";

  // ✅ si cambia la lista y deptId quedó vacío, selecciona el primero
  useEffect(() => {
    if (!deptId && departments?.[0]?.id) setDeptId(String(departments[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments?.length]);

async function loadLevelsForDept(id) {
  const depId = String(id || "");
  if (!depId) return;

  // ✅ si hay cache, NO muestres “Cargando…”
  let hadCache = false;
  try {
    const raw = sessionStorage.getItem(cacheKey(depId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length) {
      hadCache = true;
      setLevels(parsed);
    }
  } catch (_) {}

  setLoadingLevels(!hadCache);

  try {
    // 1) cargar niveles
    const r = await apiFetch(`/admin/levels?department_id=${encodeURIComponent(depId)}`, { silent: true });
    let list = Array.isArray(r?.levels) ? r.levels : [];

    // 2) si el depto es Dirección, asegurar "Director" default (sin duplicar)
    const depObj = departments.find((d) => String(d.id) === String(depId)) || null;
    if (isDireccionDept(depObj)) {
      await ensureDefaultDirectorLevel({ deptId: depId, levels: list });

      // 3) re-cargar después de crear/activar
      const r2 = await apiFetch(`/admin/levels?department_id=${encodeURIComponent(depId)}`, { silent: true });
      list = Array.isArray(r2?.levels) ? r2.levels : list;

      await onReload?.();
    }

    setLevels(list);

    // ✅ guarda cache
    try {
      sessionStorage.setItem(cacheKey(depId), JSON.stringify(list));
    } catch (_) {}
  } catch (_) {
    if (!hadCache) setLevels([]);
  } finally {
    setLoadingLevels(false);
  }
}


  useEffect(() => {
    loadLevelsForDept(deptId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptId]);

  // ✅ buscador
  const filteredLevels = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = (levels || []).filter((l) => l.active !== false);
    if (!s) return base;
    return base.filter((l) => String(l.name || "").toLowerCase().includes(s));
  }, [levels, q]);

  // ✅ contador realtime (por dept + nivel) usando users
  const levelCountMap = useMemo(() => {
    const map = new Map();
    const depKey = String(deptId || "");

    for (const u of users || []) {
      if (u?.active === false) continue;
      if (String(u?.department_id || "") !== depKey) continue;
      const lvl = String(u?.level_id || "");
      if (!lvl) continue;
      map.set(lvl, (map.get(lvl) || 0) + 1);
    }
    return map;
  }, [users, deptId]);

  async function animateCloseLvlModal() {
    setLvlModal((s) => ({ ...s, phase: "exit" }));
    await wait(180);
    setLvlModal({ open: false, phase: "idle", mode: "new", id: null });
  }

function openCreate() {
  setLvlDraft({ name: "", rank: 0, icon_key: "work", module_keys: [] });
  setLvlModal({ open: true, phase: "enter", mode: "new", id: null });
}


function openEdit(l) {
  setLvlDraft({
    name: String(l?.name || ""),
    rank: Number(l?.rank || 0),
    icon_key: String(l?.icon_key || "work"),
    module_keys: Array.isArray(l?.module_keys) ? l.module_keys : [],
  });
  setLvlModal({ open: true, phase: "enter", mode: "edit", id: String(l?.id || "") });
}

async function saveLevel() {
  const name = String(lvlDraft.name || "").trim();
  const rank = Number(lvlDraft.rank || 0);
  const icon_key = String(lvlDraft.icon_key || "work");
  const department_id = String(deptId || "");
  const module_keys = Array.isArray(lvlDraft.module_keys) ? lvlDraft.module_keys : [];

  if (!name) {
    await Swal.fire({ icon: "warning", title: "Falta el nombre", text: "Escribe el nombre del puesto." });
    return;
  }

  if (lvlModal.mode === "new") {
    await apiFetch("/admin/levels", {
      method: "POST",
      body: { name, rank, icon_key, module_keys, department_id, active: true },
    });
  } else {
    await apiFetch(`/admin/levels/${lvlModal.id}`, {
      method: "PATCH",
      body: { name, rank, icon_key, module_keys },
      silent: true,
    });
  }

  const isNew = lvlModal.mode === "new";
  await animateCloseLvlModal();
  await loadLevelsForDept(deptId);
  await onReload?.();

  await Swal.fire({
    icon: "success",
    title: isNew ? "Puesto creado" : "Puesto editado",
    text: `Listo: ${name}`,
    timer: 1300,
    showConfirmButton: false,
  });
}



  async function deleteLevel(levelId) {
    const l = (levels || []).find((x) => String(x.id) === String(levelId)) || null;
    const nm = String(l?.name || "").trim() || "—";

    const r = await Swal.fire({
      icon: "warning",
      title: "Eliminar puesto",
      text: `¿Quieres eliminar “${nm}”?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!r.isConfirmed) {
      setMenu({ open: false, id: null, top: 0, left: 0 });
      return;
    }

    await apiFetch(`/admin/levels/${levelId}`, {
      method: "PATCH",
      body: { active: false },
      silent: true,
    });

    setMenu({ open: false, id: null, top: 0, left: 0 });
    await animateCloseLvlModal().catch(() => {});
    await loadLevelsForDept(deptId);
    await onReload?.();

    await Swal.fire({
      icon: "success",
      title: "Puesto eliminado",
      text: `“${nm}” se eliminó exitosamente.`,
      timer: 1300,
      showConfirmButton: false,
    });
  }


  // ✅ cerrar menu al click fuera
  useEffect(() => {
    if (!menu.open) return;
    const onDown = () => setMenu({ open: false, id: null, top: 0, left: 0 });
    const onKey = (e) => (e.key === "Escape" ? setMenu({ open: false, id: null, top: 0, left: 0 }) : null);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu.open]);

  return (
    <div className="dlm-wrap">
      {/* LEFT */}
      <div className="dlm-left">
        <div className="dlm-title">Departamentos</div>

        <div className="dlm-deptList">
          {departments.map((d) => {
            const on = String(d.id) === String(deptId);
            return (
              <button
                key={d.id}
                className={`dlm-deptItem ${on ? "is-on" : ""}`}
                onClick={() => setDeptId(String(d.id))}
                title={d.name}
                type="button"
              >
                <span className="dlm-dot" style={{ background: d.color || "#7c3aed" }} />
                <span className="dlm-deptTxt">{d.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT */}
      <div
        className="dlm-right"
        style={{
          "--dlm-accent": deptColor,
          "--dlm-accent-rgb": hexToRgbCSS(deptColor),
        }}
      >
        <div className="dlm-top">
          <div className="dlm-topRow">
            <div>
              <div className="dlm-h1">Puestos / Niveles</div>
              <div className="dlm-sub">
                Administra puestos para: <b>{deptName}</b>
              </div>
            </div>

            <div className="dlm-actions">
              <button className="dlm-iconBtn" type="button" title="Nuevo puesto" onClick={openCreate}>
                <FiPlus />
              </button>
            </div>
          </div>
        </div>

        <div className="dlm-search">
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar puesto..." />
        </div>

        <div className="dlm-grid2">
          {filteredLevels.length === 0 ? (
  loadingLevels ? (
    <div className="dlm-empty" style={{ opacity: 0.6 }}>
      Cargando…
    </div>
  ) : (
    <div className="dlm-empty">No hay puestos aún.</div>
  )
) : (
  <>
    {/* ✅ si está cargando, NO tapes todo: solo baja opacidad */}
    <div style={loadingLevels ? { opacity: 0.55, pointerEvents: "none" } : null}>
      {filteredLevels.map((l) => {
        const count = levelCountMap.get(String(l.id)) || 0;

        return (
          <div key={l.id} className="dlm-card" title={l.name}>
            <button
              type="button"
              className="dlm-dots"
              title="Opciones"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                setMenu({
                  open: true,
                  id: String(l.id),
                  top: r.bottom + 8 + window.scrollY,
                  left: Math.min(r.left + window.scrollX, window.innerWidth - 220),
                });
              }}
            >
              <span className="dlm-dotsTxt">···</span>
            </button>

            <div className="dlm-cardIco">
              <IconByKey iconKey={l.icon_key || "work"} />
            </div>

            <div className="dlm-cardBody">
              <div className="dlm-cardName dlm-clamp2">{l.name}</div>
              <div className="dlm-cardMeta">
                <span className="dlm-badge">{String(count).padStart(2, "0")}</span>
                <span className="dlm-rank2">#{Number(l.rank || 0)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* ✅ indicador sutil */}
    {loadingLevels ? (
      <div className="dlm-foot" style={{ opacity: 0.7 }}>
        <span className="dlm-footDot" /> Actualizando…
      </div>
    ) : null}
  </>
)}

        </div>

        <div className="dlm-foot">
          <span className="dlm-footDot" />
          Tip: Cada departamento tiene sus propios puestos (no se comparten).
        </div>

        {/* ✅ menu portal */}
        {menu.open
          ? createPortal(
              <div
                className="dlm-menu"
                style={{ top: menu.top, left: menu.left }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  className="dlm-menuItem"
                  type="button"
                  onClick={() => {
                    const l = (levels || []).find((x) => String(x.id) === String(menu.id));
                    setMenu({ open: false, id: null, top: 0, left: 0 });
                    openEdit(l);
                  }}
                >
                  <FiEdit3 /> Editar
                </button>

                <button
                  className="dlm-menuItem dlm-menuDanger"
                  type="button"
                  onClick={() => deleteLevel(menu.id).catch(() => {})}
                >
                  <FiTrash2 /> Eliminar
                </button>
              </div>,
              document.body
            )
          : null}

{/* ✅ modal pro (PORTAL a document.body para que NO se encierre en contenedores) */}
{lvlModal.open
  ? createPortal(
      <div
        className={`dlm-modalOverlay ${lvlModal.phase === "enter" ? "is-enter" : ""} ${lvlModal.phase === "exit" ? "is-exit" : ""}`}
        onMouseDown={() => animateCloseLvlModal().catch(() => {})}
      >
        <div
          className="dlm-modal"
          style={{
            "--dlm-accent": deptColor,
            "--dlm-accent-rgb": hexToRgbCSS(deptColor),
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="dlm-modalTop">
            <div className="dlm-modalTitle">
              <span className="dlm-modalBadge">
                <IconByKey iconKey={lvlDraft.icon_key || "work"} />
              </span>
              <div>
                <div className="dlm-modalH1">{lvlModal.mode === "new" ? "Nuevo puesto" : "Editar puesto"}</div>
                <div className="dlm-modalSub">{deptName}</div>
              </div>
            </div>

            <div className="dlm-modalActions">
              <button
                className="dlm-modalIconBtn"
                title="Cerrar"
                type="button"
                onClick={() => animateCloseLvlModal().catch(() => {})}
              >
                <FiX />
              </button>

              <button
                className="dlm-modalIconBtn dlm-ok"
                title="Guardar"
                type="button"
                onClick={() => saveLevel().catch(() => {})}
              >
                <FiCheck />
              </button>

              {lvlModal.mode === "edit" ? (
                <button
                  className="dlm-modalIconBtn dlm-danger"
                  title="Eliminar"
                  type="button"
                  onClick={() => deleteLevel(lvlModal.id).catch(() => {})}
                >
                  <FiTrash2 />
                </button>
              ) : null}
            </div>
          </div>

          <div className="dlm-modalBody">
            {/* LEFT: preview + quick controls (sin espacio muerto) */}
            <div className="dlm-side">
              <div className="dlm-card dlm-cardPreview" style={{ "--dlm-accent-rgb": hexToRgbCSS(deptColor) }}>
                <div className="dlm-cardIco">
                  <IconByKey iconKey={lvlDraft.icon_key || "work"} />
                </div>
                <div className="dlm-cardBody">
                  <div className="dlm-cardName dlm-clamp2">{lvlDraft.name || "Nombre"}</div>
                  <div className="dlm-cardMeta">
                    <span className="dlm-badge">00</span>
                    <span className="dlm-rank2">#{Number(lvlDraft.rank || 0)}</span>
                  </div>
                </div>
              </div>

              {/* quick fields */}
              <div className="dlm-miniGrid">
                <div className="dlm-miniField">
                  <div className="dlm-miniLab">Nombre</div>
                  <input
                    className="dlm-lineInput"
                    value={lvlDraft.name}
                    onChange={(e) => setLvlDraft((s) => ({ ...s, name: toTitleCaseWords(e.target.value) }))}
                    placeholder="Ej: Supervisor"
                    autoFocus
                  />
                </div>

                <div className="dlm-miniField">
                  <div className="dlm-miniLab"># Rank</div>
                  <input
                    className="dlm-lineInput"
                    type="number"
                    value={lvlDraft.rank}
                    onChange={(e) => setLvlDraft((s) => ({ ...s, rank: Number(e.target.value || 0) }))}
                    placeholder="0 alto, 10 bajo"
                  />
                </div>
              </div>

              {/* icon picker */}
              <div className="dlm-miniField">
                <div className="dlm-miniLab">Icono</div>
                <div className="dlm-icoGrid">
                  {LEVEL_ICONS.map((x) => {
                    const C = x.Icon;
                    const on = x.key === (lvlDraft.icon_key || "work");
                    return (
                      <button
                        key={x.key}
                        className={`dlm-icoCell ${on ? "is-on" : ""}`}
                        type="button"
                        title={x.label}
                        onClick={() => setLvlDraft((s) => ({ ...s, icon_key: x.key }))}
                      >
                        <C />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: permisos full */}
            <div className="dlm-main">
              <div className="dlm-acc dlm-accFlat">
<div className="dlm-accHead">
  <span style={{ fontWeight: 1000 }}>▦</span>
  <span className="dlm-accTitle">Permisos</span>

  <span className="dlm-miniMeta">
    {Array.isArray(lvlDraft.module_keys) ? lvlDraft.module_keys.length : 0} de {MODULES.length}
  </span>
</div>


                <div className="dlm-accBody">
                  <div className="dlm-permTop">
                    <button
                      type="button"
                      className="dlm-chipBtn"
                      onClick={() => setLvlDraft((s) => ({ ...s, module_keys: MODULES.map((m) => m.key) }))}
                    >
                      Seleccionar todo
                    </button>

                    <button
                      type="button"
                      className="dlm-chipBtn"
                      onClick={() => setLvlDraft((s) => ({ ...s, module_keys: [] }))}
                    >
                      Limpiar
                    </button>
                  </div>

                  <div className="dlm-permGrid">
                    {MODULES.map((m) => {
                      const on = (lvlDraft.module_keys || []).includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          className={`dlm-permPill ${on ? "is-on" : ""}`}
                          onClick={() =>
                            setLvlDraft((s) => {
                              const cur = Array.isArray(s.module_keys) ? s.module_keys : [];
                              const next = on ? cur.filter((k) => k !== m.key) : [...cur, m.key];
                              return { ...s, module_keys: next };
                            })
                          }
                          title={m.label}
                        >
                          <span className={`dlm-permDot ${on ? "is-on" : ""}`} />
                          <span className="dlm-permTxt">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="dlm-help">
                    Tip: estos permisos controlan qué módulos aparecen en el sidebar para usuarios con este puesto.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  : null}
      </div>
    </div>
  );
}
