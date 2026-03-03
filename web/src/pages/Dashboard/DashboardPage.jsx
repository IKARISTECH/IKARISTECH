import React from "react";
import DashboardLayout from "./DashboardLayout";

// IMPORTA SOLO UNO:
// - si quieres grid editable:
import DashboardGrid from "./DashboardGrid";
// - si quieres el home fijo antiguo, usa DashboardHome en su lugar.

export default function DashboardPage({ ctx }) {
  return (
    <DashboardLayout ctx={ctx}>
      <DashboardGrid ctx={ctx} />
    </DashboardLayout>
  );
}