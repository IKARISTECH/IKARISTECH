import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  WidgetInbox,
  WidgetUsers,
  WidgetMyForms,
  WidgetLastMovements,
  WidgetLastDocuments,
  WidgetCalendar,
  WidgetPerformance,
} from "./widgets/Widgets";

// ✅ iconos estilo “dock” (usa el set que ya traes: react-icons/tb)
import {
  TbLayoutGridAdd,
  TbEdit,
  TbClipboardText,
  TbUpload,
  TbShieldCheck,
  TbUserPlus,
} from "react-icons/tb";

export default function DashboardHome({ ctx }) {
  const nav = useNavigate();

  const companyName = ctx?.company?.name || "Empresa";
  const plan = ctx?.company?.plan || "free";
  // ✅ rol real del ctx (ya viene arreglado desde Dashboard.jsx)
  const role = String(ctx?.role || "POLITES").toUpperCase();
  const canManageUsers = role === "ARCHON" || role === "EPISTATES";

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

  // ✅ atajos tipo “dock”
  const quickActions = useMemo(() => {
    const base = [
      {
        key: "add_widget",
        label: "Nuevo widget",
        icon: <TbLayoutGridAdd />,
        onClick: () => go("/dashboard/widgets/new"),
      },
      {
        key: "edit_widgets",
        label: "Editar widgets",
        icon: <TbEdit />,
        onClick: () => go("/dashboard/widgets/edit"),
      },
      {
        key: "new_form",
        label: "Formulario",
        icon: <TbClipboardText />,
        onClick: () => go("/forms/new"),
      },
      {
        key: "upload_doc",
        label: "Documento",
        icon: <TbUpload />,
        onClick: () => go("/documents/new"),
      },
      {
        key: "audit",
        label: "Auditoría",
        icon: <TbShieldCheck />,
        tone: "ghost",
        onClick: () => go("/audit"),
      },
    ];

    if (canManageUsers) {
base.splice(4, 0, {
  key: "new_user",
  label: "Usuario",
  icon: <TbUserPlus />,
  onClick: () => go("/admin"),
});
    }

    return base;
  }, [canManageUsers]);

  return (
    <div className="ik-home">
      {/* ✅ Dock de acciones (web + móvil) */}
<div className="ik-actionDock" role="group" aria-label="Acciones rápidas">
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
</div>

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

      <div className="ik-grid">
        <section className="ik-card ik-card--myforms">
          <WidgetMyForms ctx={ctx} stats={stats} />
        </section>

        <section className="ik-card ik-card--movements">
          <WidgetLastMovements ctx={ctx} />
        </section>

        <section className="ik-card ik-card--inbox">
          <WidgetInbox ctx={ctx} stats={stats} />
        </section>

        <section className="ik-card ik-card--performance">
          <WidgetPerformance ctx={ctx} />
        </section>

        <section className="ik-card ik-card--calendar">
          <WidgetCalendar ctx={ctx} />
        </section>

        <section className="ik-card ik-card--users">
          <WidgetUsers ctx={ctx} stats={stats} />
        </section>

        <section className="ik-card ik-card--docs">
          <WidgetLastDocuments ctx={ctx} stats={stats} />
        </section>
      </div>
    </div>
  );
}