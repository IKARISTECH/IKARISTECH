// web/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { globalLoading } from "./loading/globalLoading";

// ✅ Tema REAL del sistema (DashboardLayout usa: ik_theme = "light" | "iris")
const saved = localStorage.getItem("ik_theme") || "light"; // "light" | "iris"

// Si tu CSS usa data-theme, setéalo aquí.
// Si usa clases theme-light/theme-iris, también te lo dejo.
document.documentElement.setAttribute("data-theme", saved);
document.documentElement.classList.remove("theme-light", "theme-iris");
document.documentElement.classList.add(`theme-${saved}`);

// ✅ Boot loader
globalLoading.start();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
