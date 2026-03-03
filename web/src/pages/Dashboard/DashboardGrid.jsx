import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// ✅ IMPORTA TU CSS DEL DASHBOARD (si no, se ve “pelón”)
// ✅ CSS base + UX pro del grid (nuevo, corto)
import "./dashboard.css";
import "./dashboard.grid.pro.css";
import "./dashboard.widgetpicker.css"; // ✅ NUEVO (picker pro)

import {
  TbLayoutGridAdd,
  TbEdit,
  TbClipboardText,
  TbUpload,
  TbShieldCheck,
  TbUserPlus,
  TbDeviceFloppy,
  TbX,
  TbRefresh,
  TbDotsVertical, // ✅ 3 puntitos (swap widget)
  TbSearch,       // ✅ NUEVO: icono de buscar
} from "react-icons/tb";

import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";

import {
  WidgetInbox,
  WidgetUsers,
  WidgetMyForms,
  WidgetLastMovements,
  WidgetLastDocuments,
  WidgetCalendar,
  WidgetPerformance,
} from "./widgets/Widgets";
// ✅ Grid (Notion/Monday vibe) — usa export nativa
import { ResponsiveGridLayout } from "react-grid-layout";
// =========================
// Storage keys
// =========================
const LS_KEY = "ik_dash_layout_v1";

// =========================
// Persist helpers + normalize
// =========================
const GLOBAL_MIN_W = 4; // ✅ mínimo “pro” (como My Forms)
const GLOBAL_MIN_H = 4;

function loadSavedState() {
  const raw = localStorage.getItem(LS_KEY);
  const saved = safeParse(raw);

  const okLayouts =
    saved &&
    typeof saved === "object" &&
    saved.layouts &&
    typeof saved.layouts === "object";

  const okEnabled =
    saved &&
    Array.isArray(saved.enabled);

  return okLayouts && okEnabled ? saved : null;
}
function saveStateToLS(payload) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {}
}

// 🔧 asegura minW/minH y que w/h no bajen del mínimo
function normalizeLayouts(layouts) {
  const out = {};
  Object.keys(layouts || {}).forEach((bp) => {
    out[bp] = (layouts[bp] || []).map((it) => {
      const meta = WIDGETS[it.i];
      const minW = Math.max(GLOBAL_MIN_W, meta?.minW ?? 1);
      const minH = Math.max(GLOBAL_MIN_H, meta?.minH ?? 1);
      const w = Math.max(it.w ?? minW, minW);
      const h = Math.max(it.h ?? minH, minH);
      return { ...it, minW, minH, w, h };
    });
  });
  return out;
}
// =========================
// Widgets registry (tus widgets)
// =========================
const WIDGETS = {
  myforms: {
    label: "My Forms",
    desc: "Formularios recientes y accesos",
    icon: <FiFileText />,
    comp: WidgetMyForms,
    minW: 3,
    minH: 3,
    defW: 4,
    defH: 4,
    group: "core",
  },
  movements: {
    label: "Last Movements",
    desc: "Actividad reciente / auditoría",
    icon: <FiClock />,
    comp: WidgetLastMovements,
    minW: 3,
    minH: 3,
    defW: 5,
    defH: 4,
    group: "core",
  },
  inbox: {
    label: "Pendientes",
    desc: "Checklist y pendientes clave",
    icon: <FiCheckCircle />,
    comp: WidgetInbox,
    minW: 3,
    minH: 3,
    defW: 3,
    defH: 4,
    group: "core",
  },
  performance: {
    label: "Rendimiento",
    desc: "KPIs y tendencia",
    icon: <FiTrendingUp />,
    comp: WidgetPerformance,
    minW: 4,
    minH: 4,
    defW: 6,
    defH: 4,
    group: "analytics",
  },
  calendar: {
    label: "Calendario",
    desc: "Eventos y agenda",
    icon: <FiCalendar />,
    comp: WidgetCalendar,
    minW: 3,
    minH: 4,
    defW: 3,
    defH: 4,
    group: "core",
  },
  users: {
    label: "Users",
    desc: "Gestión / accesos",
    icon: <FiUsers />,
    comp: WidgetUsers,
    minW: 3,
    minH: 3,
    defW: 3,
    defH: 5,
    group: "admin",
  },
  docs: {
    label: "Last Documents",
    desc: "Docs recientes y acceso",
    icon: <FiFileText />,
    comp: WidgetLastDocuments,
    minW: 4,
    minH: 4,
    defW: 6,
    defH: 5,
    group: "core",
  },
};

// =========================
// Defaults pro (limpio: 2-3 widgets sugeridos)
// =========================
function defaultState() {
  // breakpoints: lg, md, sm, xs
  const layouts = {
lg: [
  { i: "myforms",   x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 4 },
  { i: "movements", x: 4, y: 0, w: 8, h: 4, minW: 4, minH: 4 },
  { i: "inbox",     x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 4 },
],
    md: [
      { i: "myforms", x: 0, y: 0, w: 5, h: 4 },
      { i: "movements", x: 5, y: 0, w: 5, h: 4 },
      { i: "inbox", x: 0, y: 4, w: 10, h: 4 },
    ],
    sm: [
      { i: "myforms", x: 0, y: 0, w: 6, h: 4 },
      { i: "movements", x: 0, y: 4, w: 6, h: 4 },
      { i: "inbox", x: 0, y: 8, w: 6, h: 4 },
    ],
    xs: [
      { i: "myforms", x: 0, y: 0, w: 4, h: 4 },
      { i: "movements", x: 0, y: 4, w: 4, h: 4 },
      { i: "inbox", x: 0, y: 8, w: 4, h: 4 },
    ],
  };

  const enabled = ["myforms", "movements", "inbox"]; // ✅ solo 2-3 sugeridos

  return { layouts, enabled };
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toSet(arr) {
  return new Set(Array.isArray(arr) ? arr : []);
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function getNextXY(layout, cols = 12) {
  // coloca al final (y máximo)
  let maxY = 0;
  layout.forEach((it) => {
    if (typeof it.y === "number" && typeof it.h === "number") {
      maxY = Math.max(maxY, it.y + it.h);
    }
  });
  return { x: 0, y: maxY };
}

// agrega item a todos los breakpoints con un tamaño razonable
function addWidgetToLayouts(layouts, id) {
  const meta = WIDGETS[id];
  if (!meta) return layouts;

  const out = { ...layouts };
  const mapCols = { lg: 12, md: 10, sm: 6, xs: 4 };
  const mapW = { lg: meta.defW, md: Math.min(meta.defW, 10), sm: Math.min(meta.defW, 6), xs: Math.min(meta.defW, 4) };

  Object.keys(out).forEach((bp) => {
    const cols = mapCols[bp] ?? 12;
    const current = Array.isArray(out[bp]) ? [...out[bp]] : [];
    if (current.some((x) => x.i === id)) {
      out[bp] = current;
      return;
    }
    const { x, y } = getNextXY(current, cols);
    current.push({
      i: id,
      x,
      y,
      w: Math.max(1, mapW[bp] ?? meta.defW),
      h: meta.defH,
      minW: meta.minW,
      minH: meta.minH,
    });
    out[bp] = current;
  });

  return out;
}

function removeWidgetFromLayouts(layouts, id) {
  const out = {};
  Object.keys(layouts || {}).forEach((bp) => {
    out[bp] = (layouts[bp] || []).filter((x) => x.i !== id);
  });
  return out;
}

export default function DashboardGrid({ ctx }) {
  const nav = useNavigate();

  const role = String(ctx?.role || "POLITES").toUpperCase();
  const canManageUsers = role === "ARCHON" || role === "EPISTATES";

  // ✅ stats placeholder
  const stats = useMemo(() => {
    return {
      formsTotal: 0,
      formsPending: 0,
      usersTotal: 0,
      docsTotal: 0,
      pendingApprovals: 0,
    };
  }, []);

  function go(path) {
    nav(path);
  }

  // ✅ atajos (dock) — luego lo convertimos a widget si quieres
  const quickActions = useMemo(() => {
    const base = [
      { key: "new_form", label: "Formulario", icon: <TbClipboardText />, onClick: () => go("/forms/new") },
      { key: "upload_doc", label: "Documento", icon: <TbUpload />, onClick: () => go("/documents/new") },
      { key: "audit", label: "Auditoría", icon: <TbShieldCheck />, tone: "ghost", onClick: () => go("/audit") },
    ];
    if (canManageUsers) {
      base.unshift({ key: "new_user", label: "Usuario", icon: <TbUserPlus />, onClick: () => go("/admin") });
    }
    return base;
  }, [canManageUsers]);

  // =========================
  // ✅ Layout state (persistente)
  // =========================
const [edit, setEdit] = useState(false);

// ✅ Picker pro (sheet)
const [pickerOpen, setPickerOpen] = useState(false);
const [pickerQuery, setPickerQuery] = useState("");
const [pickerTab, setPickerTab] = useState("all"); // all | core | analytics | admin

// ✅ cuando presionas "..." guardamos qué widget quieres reemplazar
const [swapTarget, setSwapTarget] = useState(null);

function openPicker(tab = "all") {
  setPickerTab(tab);
  setPickerOpen(true);
}

function closePicker() {
  setPickerOpen(false);
  setPickerQuery("");
  setSwapTarget(null);
}

function requestSwap(id) {
  if (!edit) return;
  setSwapTarget(id);
  openPicker("all");
}

// ✅ reemplaza el ID manteniendo posición (misma celda del grid)
function swapWidget(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return;

  // si el nuevo ya existe, solo quitamos el viejo
  const newAlreadyOn = enabled.includes(newId);

  if (newAlreadyOn) {
    setEnabled((prev) => prev.filter((x) => x !== oldId));
    setLayouts((prev) => removeWidgetFromLayouts(prev, oldId));
    setSwapTarget(null);
    return;
  }

  // 1) enabled: reemplazar old -> new
  setEnabled((prev) => prev.map((x) => (x === oldId ? newId : x)));

  // 2) layouts: cambiar i: old -> new en todos los breakpoints
  setLayouts((prev) => {
    const out = {};
    Object.keys(prev || {}).forEach((bp) => {
      out[bp] = (prev[bp] || []).map((it) => (it.i === oldId ? { ...it, i: newId } : it));
    });
    return out;
  });

  setSwapTarget(null);
}

  const [layouts, setLayouts] = useState(() => {
    const saved = loadSavedState();
    if (saved) return normalizeLayouts(saved.layouts);
    return normalizeLayouts(defaultState().layouts);
  });

  const [enabled, setEnabled] = useState(() => {
    const saved = loadSavedState();
    if (saved) return saved.enabled;
    return defaultState().enabled;
  });

  // ✅ refs = “último valor real”, evita stale en refresh / handlers
  const layoutsRef = useRef(layouts);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    layoutsRef.current = layouts;
  }, [layouts]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // ✅ evita que un autosave temprano te pise el LS al montar
  const hydratedRef = useRef(false);
  useEffect(() => {
    hydratedRef.current = true;
  }, []);
  // ✅ width REAL del contenedor (robusto: ResizeObserver)
  const gridRef = useRef(null);
  const [gridW, setGridW] = useState(0);

  const [bp, setBp] = useState("lg"); // ✅ breakpoint actual

// ✅ mide el ancho del canvas del grid (sin depender de hooks de la lib)
useEffect(() => {
  const el = gridRef.current;
  if (!el) return;

  const measure = () => {
    const w = Math.round(el.getBoundingClientRect().width || 0);
    setGridW((prev) => (Math.abs(prev - w) > 1 ? w : prev));
  };

  measure();

  const ro = new ResizeObserver(measure);
  ro.observe(el);

  window.addEventListener("resize", measure);
  return () => {
    ro.disconnect();
    window.removeEventListener("resize", measure);
  };
}, []);
// snapshot para cancelar cambios (estado + localStorage)
const snapRef = useRef(null);
const snapLSRef = useRef(null);

// ✅ para “cancelar” un drag/resize en vivo con ESC (reset interno de RGL)
const [gridKey, setGridKey] = useState(0);
const dragResizeLiveRef = useRef(false);



function enterEdit() {
  snapRef.current = { layouts, enabled };
  snapLSRef.current = loadSavedState(); // ✅ por si ya había algo guardado
  setEdit(true);
  // ✅ ya NO abrimos el picker automáticamente
}

function exitEditCancel() {
  const snap = snapRef.current;
  if (snap?.layouts && snap?.enabled) {
    setLayouts(snap.layouts);
    setEnabled(snap.enabled);

    // ✅ revertimos también lo persistido (para que autosave no “gane”)
    saveStateToLS({ layouts: snap.layouts, enabled: snap.enabled });
  } else if (snapLSRef.current) {
    // fallback: regresa al último guardado real
    saveStateToLS(snapLSRef.current);
  }

  setEdit(false);
  closePicker();
  snapRef.current = null;
  snapLSRef.current = null;
}
// ✅ NO autosave en caliente (así ESC revierte limpio)
// Guardamos SOLO con el botón Guardar (saveLayout) y en beforeunload
useEffect(() => {
  if (!edit) return;
  // intencionalmente vacío
}, [edit, layouts, enabled]);

// ✅ Flush obligatorio en refresh / cerrar: NO dependas de closures
useEffect(() => {
  const onBeforeUnload = () => {
    if (!hydratedRef.current) return;

    // si estabas editando o no, igual guarda el último estado real
    saveStateToLS({
      layouts: normalizeLayouts(layoutsRef.current),
      enabled: enabledRef.current,
    });
  };

  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}, []);

function saveLayout() {
  const payload = {
    layouts: normalizeLayouts(layoutsRef.current),
    enabled: enabledRef.current,
  };
  saveStateToLS(payload);
  setEdit(false);
  closePicker();
  snapRef.current = null;
}

function resetDefault() {
  const d = defaultState();
  const norm = normalizeLayouts(d.layouts);
  setLayouts(norm);
  setEnabled(d.enabled);
  saveStateToLS({ layouts: norm, enabled: d.enabled });
}

/* ✅ ESC:
   - si estás en drag/resize en vivo → REVierte al snapshot y te deja en EDIT
   - si NO estás en drag/resize → cancela y SALE del edit
*/
useEffect(() => {
  const onKeyDown = (e) => {
    if (e.key !== "Escape") return;
    if (!edit) return;

    e.preventDefault();
    e.stopPropagation();

    // ✅ si estabas moviendo/redimensionando AHORITA MISMO
    if (dragResizeLiveRef.current) {
      const snap = snapRef.current;

      if (snap?.layouts && snap?.enabled) {
        setLayouts(snap.layouts);
        setEnabled(snap.enabled);
      }

      // ✅ resetea estado interno del grid para “cortar” el drag/resize
      setGridKey((k) => k + 1);

      // ✅ seguimos en modo edit
      dragResizeLiveRef.current = false;
      return;
    }

    // ✅ si no estabas en movimiento, cancela todo y sale de edit
    exitEditCancel();
  };

  window.addEventListener("keydown", onKeyDown, { capture: true });
  return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
}, [edit, layouts, enabled]);

function toggleWidget(id) {
  const isOn = enabled.includes(id);
  if (isOn) {
    setEnabled((prev) => prev.filter((x) => x !== id));
    setLayouts((prev) => removeWidgetFromLayouts(prev, id));
  } else {
    setEnabled((prev) => uniq([...prev, id]));
    setLayouts((prev) => addWidgetToLayouts(prev, id));
  }
}

/* =========================
   ✅ HARD LOCK fuera de EDIT
   - corta drag/resize aunque el evento “se cuele” al item
   - deja interacción normal dentro del widget
========================= */
function hardLockCapture(e) {
  if (edit) return;
  e.preventDefault();
  e.stopPropagation();
}

function allowOnlyWidgetInteraction(e) {
  if (edit) return;

  const t = e.target;

  // Deja clicks/scroll del contenido e inputs/botones,
  // pero evita que el grid capture el gesto.
  if (
    t.closest(".ik-widgetAuto") ||
    t.closest("button, a, input, textarea, select, option, label")
  ) {
    e.stopPropagation();
    return;
  }

  // Si cae en “zonas muertas” (card, espacios), bloquea duro
  hardLockCapture(e);
}

function removeWidget(id) {
  if (!edit) return;
  toggleWidget(id);
}

  // solo renderiza lo habilitado, pero usando layout para mantener posiciones
  const enabledSet = useMemo(() => toSet(enabled), [enabled]);
  const visibleIds = useMemo(() => Object.keys(WIDGETS).filter((id) => enabledSet.has(id)), [enabledSet]);

  return (
    <div className="ik-home">
      {/* ✅ Barra superior del home: minimal y pro */}
<div className="ik-homebar">
<div className="ik-homebarDock" role="group" aria-label="Acciones del dashboard">
  {/* acciones normales */}
  {quickActions.map((a) => (
    <button
      key={a.key}
      className={`ik-actionIcon ${a.tone === "ghost" ? "ghost" : ""}`}
      onClick={a.onClick}
      type="button"
      aria-label={a.label}
      title={a.label}
    >
      <span className="ik-actionIcon__ic" aria-hidden="true">
        {a.icon}
      </span>
    </button>
  ))}

  {/* ✅ SOLO 1 botón de “widgets” (4 cuadritos) */}
  <button
    className="ik-actionIcon"
    type="button"
    onClick={() => openPicker("all")}
    aria-label="Widgets"
    title="Widgets"
  >
    <span className="ik-actionIcon__ic" aria-hidden="true">
      <TbLayoutGridAdd />
    </span>
  </button>

  {/* controles edición */}
  {!edit ? (
    <button
      className="ik-actionIcon"
      type="button"
      onClick={enterEdit}
      aria-label="Editar"
      title="Editar"
    >
      <span className="ik-actionIcon__ic" aria-hidden="true">
        <TbEdit />
      </span>
    </button>
  ) : (
    <>
      <button
        className="ik-actionIcon"
        type="button"
        onClick={saveLayout}
        aria-label="Guardar"
        title="Guardar"
      >
        <span className="ik-actionIcon__ic" aria-hidden="true">
          <TbDeviceFloppy />
        </span>
      </button>

      <button
        className="ik-actionIcon ghost"
        type="button"
        onClick={exitEditCancel}
        aria-label="Cancelar"
        title="Cancelar"
      >
        <span className="ik-actionIcon__ic" aria-hidden="true">
          <TbX />
        </span>
      </button>
    </>
  )}
</div>
</div>

      {/* ✅ KPIs (si quieres, después los volvemos widget) */}
      <div className="ik-kpis">
        <div className="ik-kpi">
          <div className="ik-kpi__n">{stats.formsTotal}</div>
          <div className="ik-kpi__l">Formularios</div>
        </div>
        <div className="ik-kpi">
          <div className="ik-kpi__n">{stats.formsPending}</div>
          <div className="ik-kpi__l">Pendientes</div>
        </div>
        <div className="ik-kpi">
          <div className="ik-kpi__n">{stats.pendingApprovals}</div>
          <div className="ik-kpi__l">Aprobaciones</div>
        </div>
        <div className="ik-kpi">
          <div className="ik-kpi__n">{stats.docsTotal}</div>
          <div className="ik-kpi__l">Documentos</div>
        </div>
      </div>

      {/* ✅ Empty state pro */}
      {visibleIds.length === 0 ? (
        <div className="ik-emptyDash">
          <div className="ik-emptyDash__title">Tu dashboard está vacío</div>
          <div className="ik-emptyDash__sub">Agrega widgets y acomódalos a tu gusto.</div>
<button
  className="ik-editBtn"
  type="button"
  onClick={() => (edit ? openPicker("all") : enterEdit())}
>
  <TbLayoutGridAdd /> Agregar widgets
</button>
        </div>
      ) : null}

<div ref={gridRef} className={`ik-gridCanvas ${edit ? "is-edit" : ""}`}>
  {gridW > 0 ? (
<ResponsiveGridLayout
  key={gridKey}
  width={gridW}
  className="layout"
  layouts={layouts}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
  rowHeight={64}
  margin={[14, 14]}
  containerPadding={[6, 0]}

  /* ✅ estado */
  isDraggable={edit === true}
  isResizable={edit === true}

  /* ✅ SOLO se puede arrastrar desde un handle que SOLO existe en edit */
  draggableHandle=".__ikDragHandle"

  /* ✅ cancela drag en zonas internas (contenido y botones) */
  draggableCancel=".ik-widgetAuto, .ik-widgetTopActions, button, a, input, textarea, select, option"

  onBreakpointChange={(nextBp) => setBp(nextBp)}
  compactType={null}
  preventCollision={false}
  isBounded={false}

  /* ✅ resize handles SOLO en edit */
  resizeHandles={edit ? ["se"] : []}

  /* ✅ CANCELA DURO: si NO edit → corta drag aunque algo se cuele */
  onDragStart={(layout, oldItem, newItem, placeholder, e, element) => {
    if (!edit) return false;          // 🔥 esto lo detiene en seco
    dragResizeLiveRef.current = true;
  }}
  onDragStop={() => {
    dragResizeLiveRef.current = false;
  }}

  /* ✅ CANCELA DURO resize también */
  onResizeStart={(layout, oldItem, newItem, placeholder, e, element) => {
    if (!edit) return false;          // 🔥 corta resize
    dragResizeLiveRef.current = true;
  }}
  onResizeStop={() => {
    dragResizeLiveRef.current = false;
  }}

  onLayoutChange={(current, allLayouts) => {
    if (!edit) return;

    const norm = normalizeLayouts(allLayouts);
    setLayouts(norm);

    saveStateToLS({
      layouts: norm,
      enabled: enabledRef.current,
    });
  }}
>
      {visibleIds.map((id) => {
        const meta = WIDGETS[id];
        const Cmp = meta.comp;

return (
  <div
    key={id}
    className={`ik-card ik-card--gridItem ${edit ? "ik-editing" : ""}`}
    role="group"
    aria-label={`Widget ${meta?.label || id}`}

    /* ✅ HARD LOCK: fuera de edit no se arrastra NUNCA */
    onMouseDownCapture={allowOnlyWidgetInteraction}
    onTouchStartCapture={allowOnlyWidgetInteraction}
    onPointerDownCapture={allowOnlyWidgetInteraction}
  >
<div className="ik-widget__head" title={edit ? "Arrastra para mover" : meta?.label}>
  <div className="ik-widget__title">{meta?.label || id}</div>

  {/* ✅ controles arriba a la derecha (solo iconos) */}
  {edit ? (
    <div className="ik-widgetTopActions">
      {/* ✅ ESTE es el ÚNICO handle para drag (solo existe en edit) */}
      <button
        className="ik-widgetIconBtn __ikDragHandle"
        type="button"
        title="Mover"
        aria-label="Mover"
        onClick={(e) => {
          // no hace nada, solo es handle
          e.preventDefault();
        }}
      >
        ⋮⋮
      </button>

      <button
        className="ik-widgetIconBtn"
        type="button"
        title="Reemplazar widget"
        aria-label="Reemplazar widget"
        onClick={() => requestSwap(id)}
      >
        <TbDotsVertical />
      </button>

      <button
        className="ik-widgetIconBtn danger"
        type="button"
        title="Quitar widget"
        aria-label="Quitar widget"
        onClick={() => removeWidget(id)}
      >
        <TbX />
      </button>
    </div>
  ) : null}
</div>

    <div className="ik-widgetAuto">
      <Cmp ctx={ctx || {}} stats={stats || {}} />
    </div>
  </div>
);
      })}
    </ResponsiveGridLayout>
  ) : null}
</div>
{/* ✅ Widget Picker PRO (sheet tipo móvil) */}
<div className={`ik-pickerBackdrop ${pickerOpen ? "open" : ""}`} onClick={closePicker} />

<section
  className={`ik-pickerSheet ${pickerOpen ? "open" : ""}`}
  role="dialog"
  aria-modal="true"
  aria-label="Selector de widgets"
>
  <header className="ik-pickerHead">
    <div className="ik-pickerTitle">
      {swapTarget ? "Reemplazar widget" : "Widgets"}
      <div className="ik-pickerSub">
        {swapTarget ? "Elige por cuál lo sustituyes (mantiene posición)" : "Agrega, oculta o busca widgets"}
      </div>
    </div>

    <div className="ik-pickerHeadBtns">
      <button className="ik-pickerIcon" type="button" onClick={resetDefault} title="Reset">
        <TbRefresh />
      </button>
      <button className="ik-pickerIcon" type="button" onClick={closePicker} title="Cerrar">
        <TbX />
      </button>
    </div>
  </header>

  <div className="ik-pickerSearch">
    <TbSearch className="ik-pickerSearchIc" aria-hidden="true" />
    <input
      value={pickerQuery}
      onChange={(e) => setPickerQuery(e.target.value)}
      placeholder="Buscar widget…"
      className="ik-pickerInput"
      type="text"
      autoComplete="off"
    />
  </div>

  <nav className="ik-pickerTabs" aria-label="Categorías">
    {[
      { k: "all", t: "Todos" },
      { k: "core", t: "Core" },
      { k: "analytics", t: "Analytics" },
      { k: "admin", t: "Admin" },
    ].map((x) => (
      <button
        key={x.k}
        type="button"
        className={`ik-tab ${pickerTab === x.k ? "on" : ""}`}
        onClick={() => setPickerTab(x.k)}
      >
        {x.t}
      </button>
    ))}
  </nav>

  <div className="ik-pickerGrid">
    {Object.entries(WIDGETS)
      .filter(([id, meta]) => {
        const q = pickerQuery.trim().toLowerCase();
        const hit =
          !q ||
          String(meta.label || "").toLowerCase().includes(q) ||
          String(meta.desc || "").toLowerCase().includes(q);

        const tabOk = pickerTab === "all" ? true : meta.group === pickerTab;
        return hit && tabOk;
      })
      .map(([id, meta]) => {
        const on = enabledSet.has(id);
        const disabled = swapTarget && id === swapTarget;

        return (
          <button
            key={id}
            type="button"
            className={`ik-wCard ${on ? "on" : ""} ${disabled ? "disabled" : ""}`}
            disabled={disabled}
            onClick={() => {
              if (swapTarget) {
                swapWidget(swapTarget, id);
                closePicker();
                return;
              }
              toggleWidget(id);
            }}
          >
            <div className="ik-wCardTop">
              <div className="ik-wIco" aria-hidden="true">
                {meta.icon}
              </div>
              <div className={`ik-wState ${on ? "on" : ""}`} aria-hidden="true">
                {on ? "Visible" : "Oculto"}
              </div>
            </div>

            <div className="ik-wName">{meta.label}</div>
            <div className="ik-wDesc">{meta.desc || "—"}</div>
          </button>
        );
      })}
  </div>

  {edit ? (
    <footer className="ik-pickerFooter">
      <button className="ik-pickerBtn" type="button" onClick={saveLayout}>
        <TbDeviceFloppy /> Guardar
      </button>
      <button className="ik-pickerBtn ghost" type="button" onClick={exitEditCancel}>
        <TbX /> Cancelar
      </button>
    </footer>
  ) : null}
</section>
    </div>
  );
}