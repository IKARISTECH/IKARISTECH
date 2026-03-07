import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiGrid,
  FiFileText,
  FiUsers,
  FiFolder,
  FiSettings,
  FiBox,
  FiShoppingCart,
  FiDollarSign,
  FiBriefcase,
  FiBarChart2,
  FiShield,
  FiChevronLeft,
} from "react-icons/fi";

import ikarLogo from "../../../assets/IKAR.png";
import "../../../styles/sidebar.drawer.css";

function Item({ icon, label, active, onClick, disabled, badge }) {
  return (
    <button
      className={`ik-sideitem ${active ? "active" : ""} ${disabled ? "disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
      title={label}
      aria-disabled={disabled ? "true" : "false"}
      type="button"
    >
      <span className="ik-sideitem__icon">{icon}</span>
      <span className="ik-sideitem__label">{label}</span>
      {badge ? <span className="ik-sidebadge">{badge}</span> : null}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="ik-sidesection">
      <div className="ik-sidesection__title">{title}</div>
      <div className="ik-sidesection__items">{children}</div>
    </div>
  );
}

export default function Sidebar({ ctx }) {
  const role = String(ctx?.role || "POLITES").toUpperCase();

  // ✅ Drawer mobile
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touch = useRef({ active: false, startX: 0, startY: 0, openedByEdge: false });

  const plan = String(ctx?.company?.plan || "free").toLowerCase();
  const isAdmin = role === "ARCHON" || role === "EPISTATES";
  const canUsers = isAdmin;
  const canSettings = isAdmin;
  const canFinance = role === "ARCHON";

  // ✅ Permisos por puesto/nivel (module_keys)
  const rawAllowed =
    ctx?.me?.level?.module_keys ||
    ctx?.me?.module_keys ||
    ctx?.user?.level?.module_keys ||
    ctx?.user?.module_keys ||
    ctx?.level?.module_keys ||
    ctx?.module_keys ||
    [];

  const allowedKeys = useMemo(() => {
    const arr = Array.isArray(rawAllowed) ? rawAllowed : [];
    return new Set(arr.map(String));
  }, [rawAllowed]);

  const modules = useMemo(() => {
    const all = [
      {
        title: "Core",
        items: [
          { key: "dashboard", label: "Dashboard", icon: <FiGrid />, path: "/dashboard" },
          { key: "forms", label: "Forms", icon: <FiFileText />, path: "/forms", soon: false },
          { key: "documents", label: "Documents", icon: <FiFolder />, path: "/documents", soon: true },
        ],
      },
      {
        title: "Operación",
        items: [
          { key: "inventory", label: "Inventario", icon: <FiBox />, path: "/inventory", soon: true },
          { key: "purchases", label: "Compras", icon: <FiShoppingCart />, path: "/purchases", soon: true },
          { key: "sales", label: "Ventas", icon: <FiBriefcase />, path: "/sales", soon: true },
        ],
      },
      {
        title: "Finanzas",
        items: [
          {
            key: "treasury",
            label: "Tesorería",
            icon: <FiDollarSign />,
            path: "/treasury",
            soon: true,
            disabled: !canFinance,
            badge: !canFinance ? "ARCHON" : null,
          },
          {
            key: "accounting",
            label: "Contabilidad",
            icon: <FiBarChart2 />,
            path: "/accounting",
            soon: true,
            disabled: !canFinance,
            badge: !canFinance ? "ARCHON" : null,
          },
        ],
      },
      {
        title: "Administración",
        items: [
          {
            key: "admin_users",
            label: "Admin Panel",
            icon: <FiUsers />,
            path: "/admin",
            soon: false,
            disabled: !canUsers,
            badge: !canUsers ? "ADMIN" : null,
          },
          {
            key: "admin_security",
            label: "Seguridad",
            icon: <FiShield />,
            path: "/admin",
            soon: false,
            disabled: !canSettings,
            badge: !canSettings ? "ADMIN" : null,
          },
          {
            key: "admin_settings",
            label: "Settings",
            icon: <FiSettings />,
            path: "/admin",
            soon: false,
            disabled: !canSettings,
            badge: !canSettings ? "ADMIN" : null,
          },
        ],
      },
    ];

    if (allowedKeys.size === 0) return all;

    return all
      .map((sec) => ({
        ...sec,
        items: (sec.items || []).filter((it) => allowedKeys.has(String(it.key))),
      }))
      .filter((sec) => (sec.items || []).length > 0);
  }, [allowedKeys, canFinance, canSettings, canUsers]);

  const location = useLocation();
  const activePath = location.pathname;

  function go(path, soon) {
    if (soon) {
      alert(`Módulo en camino: ${path}`);
      return;
    }
    if (typeof ctx?.go === "function") {
      ctx.go(path);
      return;
    }
    window.location.assign(path);
  }

  // ✅ Toggle desde Topbar (evento)
  useEffect(() => {
    const onToggle = () => setDrawerOpen((v) => !v);
    window.addEventListener("ik_toggle_sidebar", onToggle);
    return () => window.removeEventListener("ik_toggle_sidebar", onToggle);
  }, []);

  // ✅ Swipe edge-open (FB-like)
  useEffect(() => {
    function onTouchStart(e) {
      const t0 = e.touches?.[0];
      if (!t0) return;

      const x = t0.clientX;
      const y = t0.clientY;

      const edge = x <= 18;
      if (!drawerOpen && !edge) return;

      touch.current = { active: true, startX: x, startY: y, openedByEdge: edge };
    }

    function onTouchMove(e) {
      if (!touch.current.active) return;
      const t0 = e.touches?.[0];
      if (!t0) return;

      const dx = t0.clientX - touch.current.startX;
      const dy = t0.clientY - touch.current.startY;

      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) return;

      if (!drawerOpen && touch.current.openedByEdge && dx > 55) {
        setDrawerOpen(true);
        touch.current.active = false;
      }

      if (drawerOpen && dx < -60) {
        setDrawerOpen(false);
        touch.current.active = false;
      }
    }

    function onTouchEnd() {
      touch.current.active = false;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [drawerOpen]);

  const flatItems = useMemo(() => modules.flatMap((sec) => sec.items), [modules]);

  return (
    <>
      {/* =========================
          MOBILE ONLY (drawer NUEVO)
         ========================= */}
      <div
        className={`ik-mSideOverlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={`ik-mSidebar ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <button
          type="button"
          className="ik-mSideHandle"
          aria-label="Cerrar menú"
          title="Cerrar"
          onClick={() => setDrawerOpen(false)}
        >
          <FiChevronLeft />
        </button>

        {/* Arriba SOLO IK centrado (sin contenedor) */}
        <div className="ik-mSideTop" title="IKARIS">
          <img className="ik-mSideBrandImg" src={ikarLogo} alt="IKARIS" />
        </div>

        {/* Mobile nav: icono + texto, todo centrado */}
        <nav className="ik-mSideNav">
          {flatItems.map((m) => {
            const active = activePath === m.path || activePath.startsWith(m.path + "/");
            const tag = m.badge || (m.soon ? "SOON" : "");

            return (
              <button
                key={m.key}
                type="button"
                className={`ik-mSideItem ${active ? "active" : ""} ${m.disabled ? "disabled" : ""}`}
                title={m.label}
                aria-label={m.label}
                aria-disabled={m.disabled ? "true" : "false"}
                onClick={() => {
                  if (m.disabled) return;
                  go(m.path, m.soon);
                  setDrawerOpen(false);
                }}
              >
                <span className="ik-mSideIcon">{m.icon}</span>
                <span className="ik-mSideLabel">{m.label}</span>
                {tag ? <span className="ik-mSideTag">{tag}</span> : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* =========================
          WEB/DESKTOP (sidebar ORIGINAL)
          ✅ se queda EXACTO como antes
         ========================= */}
      <aside className="ik-sidebar ik-sidebar--hover">
        <div className="ik-sidebar__top ik-sidebar__top--center">
          <div className="ik-sidebar__brand" title="IKARIS">
            <img className="ik-sidebar__brandImg" src={ikarLogo} alt="IKARIS" />
          </div>
        </div>

        <div className="ik-sidebar__items">
          {modules.map((sec) => (
            <Section key={sec.title} title={sec.title}>
              {sec.items.map((m) => (
                <Item
                  key={m.key}
                  icon={m.icon}
                  label={m.label}
                  active={activePath === m.path || activePath.startsWith(m.path + "/")}
                  disabled={!!m.disabled}
                  badge={m.badge || (m.soon ? "SOON" : null)}
                  onClick={() => go(m.path, m.soon)}
                />
              ))}
              <div className="ik-sep" />
            </Section>
          ))}
        </div>

        <div className="ik-sidebar__bottom">
          <div className="ik-sidebar__foot">
            <div className="ik-foot__k">IKARIS</div>
            <div className="ik-foot__v">
              Plan: <b>{String(plan).toUpperCase()}</b> · Rol: <b>{role}</b>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}