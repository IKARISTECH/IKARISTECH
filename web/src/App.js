// web/src/App.js

import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import CompleteOnboarding from "./pages/CompleteOnboarding";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import { supabase } from "./supabaseClient";
import { apiFetch } from "./api";

import { LoadingProvider } from "./loading/LoadingProvider";
import { globalLoading } from "./loading/globalLoading";

// ✅ Forms
import FormsList from "./pages/Forms/FormsList";
import FormBuilder from "./pages/Forms/FormBuilder";
import FormFill from "./pages/Forms/FormFill";
import FormResponses from "./pages/Forms/FormResponses";

// ✅ ErrorBoundary inline
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err) {
    console.error("[ErrorBoundary]", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: "monospace", color: "#fff" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            💥 IKARIS Frontend Error
          </div>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.err?.stack || this.state.err?.message || this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * ✅ Bootstrap único (tipo FB):
 * - corre 1 vez
 * - decide si hay sesión + perfil DB
 * - al terminar: globalLoading.stop() (cierra overlay)
 */
function AuthBootstrap({ children }) {
  const [boot, setBoot] = useState({ ready: false, authed: false });

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        if (!token) {
          if (!alive) return;
          setBoot({ ready: true, authed: false });
          return;
        }

        // validar perfil en DB
        try {
          await apiFetch("/auth/me", { tokenOverride: token });
          if (!alive) return;
          setBoot({ ready: true, authed: true });
          return;
        } catch (e) {
          // sesión existe pero perfil no => cerrar sesión
          try {
            await supabase.auth.signOut();
          } catch (_) {}
          if (!alive) return;
          setBoot({ ready: true, authed: false });
          return;
        }
      } finally {
        // ✅ cierra el BOOT loader (el que se abrió en index.js)
        globalLoading.stop();
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  // Durante boot NO renderizamos nada; el overlay global está activo desde index.js
  if (!boot.ready) return null;

  return children(boot);
}

// ✅ ProtectedRoute sync (ya no hace async)
function ProtectedRoute({ authed, children }) {
  const location = useLocation();
  if (!authed) {
    const from = `${location.pathname}${location.search || ""}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
}

// ✅ PublicOnly sync
function PublicOnly({ authed, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authed) {
      const from = location?.state?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [authed, location?.state?.from, navigate]);

  if (authed) return null;
  return children;
}
function AppRoutes({ boot }) {
  const navigate = useNavigate();

  // ✅ ctx global mínimo (para DashboardLayout en Admin/AcceptInvite)
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(false);

  async function loadMe() {
    setMeLoading(true);
    try {
      const data = await apiFetch("/auth/me");
      setMe(data);
    } catch (e) {
      // Si falla, no rompas todo; solo deja me en null
      console.warn("[AppRoutes] /auth/me failed:", e);
      setMe(null);
    } finally {
      setMeLoading(false);
    }
  }

  // ✅ cuando ya está authed, cargamos /auth/me 1 vez
  useEffect(() => {
    if (!boot?.authed) {
      setMe(null);
      return;
    }
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot?.authed]);

  const ctx = useMemo(() => {
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
      loading: meLoading,
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
  }, [me, meLoading, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnly authed={boot.authed}>
            <Login />
          </PublicOnly>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnly authed={boot.authed}>
            <Register />
          </PublicOnly>
        }
      />

      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute authed={boot.authed}>
            <CompleteOnboarding />
          </ProtectedRoute>
        }
      />

<Route
  path="/dashboard"
  element={
    <ProtectedRoute authed={boot.authed}>
      <DashboardPage ctx={ctx} />
    </ProtectedRoute>
  }
/>

      {/* ✅ ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute authed={boot.authed}>
            {React.createElement(require("./pages/Admin/AdminPanel").default, { ctx })}
          </ProtectedRoute>
        }
      />

      {/* ✅ Invitaciones */}
      <Route
        path="/accept-invite"
        element={
          <ProtectedRoute authed={boot.authed}>
            {React.createElement(require("./pages/Admin/AcceptInvite").default, { ctx })}
          </ProtectedRoute>
        }
      />

      {/* ✅ FORMS */}
      <Route
        path="/forms"
        element={
          <ProtectedRoute authed={boot.authed}>
            <FormsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forms/new"
        element={
          <ProtectedRoute authed={boot.authed}>
            <FormBuilder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forms/:id/edit"
        element={
          <ProtectedRoute authed={boot.authed}>
            <FormBuilder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forms/:id/fill"
        element={
          <ProtectedRoute authed={boot.authed}>
            <FormFill />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forms/:id/responses"
        element={
          <ProtectedRoute authed={boot.authed}>
            <FormResponses />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <Router>
          {/* ✅ base siempre presente para que el blur se vea premium en light/dark */}
          <div className="ik-appBase" aria-hidden="true" />

<AuthBootstrap>
  {(boot) => <AppRoutes boot={boot} />}
</AuthBootstrap>

        </Router>
      </LoadingProvider>
    </ErrorBoundary>
  );
}
