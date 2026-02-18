  // web/src/api.js
  import { supabase } from "./supabaseClient";
  import { globalLoading } from "./loading/globalLoading";

  // ✅ Base URL inteligente:
  // - En local puedes usar REACT_APP_API_URL=http://localhost:4000/api
  // - En producción SIEMPRE usa same-origin "/api" (evita localhost)
  const RAW_API_URL = process.env.REACT_APP_API_URL || "/api";

  const isBrowser = typeof window !== "undefined";
  const host = isBrowser ? window.location.hostname : "";
  const isLocalHost = host === "localhost" || host === "127.0.0.1";

  // Si NO estás en localhost (producción), ignoramos cualquier env que apunte a localhost.
  const API_URL =
    !isLocalHost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/i.test(RAW_API_URL)
      ? "/api"
      : RAW_API_URL;

  export async function apiFetch(path, opts = {}) {

    // ✅ Loader global automático (se puede desactivar por request)
    // Soporta: skipLoading (legacy) y silent (nuevo)
    const skipLoading = !!opts.skipLoading || !!opts.silent;
    if (!skipLoading) globalLoading.start();

    // ✅ NUEVO: si skipAuth = true, NO intentamos poner Authorization
    const skipAuth = !!opts.skipAuth;

    // 0) headers base
    const headers = { ...(opts.headers || {}) };

    // 1) JSON por defecto si no es FormData
    const isFormData =
      typeof FormData !== "undefined" && opts.body instanceof FormData;

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    // 2) Authorization:
    // - Si ya viene Authorization, no tocar
    // - Si skipAuth, NO meter Authorization
    // - Si viene tokenOverride úsalo
    // - Si no, intenta getSession con timeout corto
    if (!headers["Authorization"] && !skipAuth) {
      let token = opts.tokenOverride || null;

      if (!token) {
        const withTimeout = (p, ms) =>
          Promise.race([
            p,
            new Promise((_, rej) =>
              setTimeout(() => rej(new Error(`Timeout getSession (${ms}ms)`)), ms)
            ),
          ]);

        try {
          const { data } = await withTimeout(supabase.auth.getSession(), 4000);
          token = data?.session?.access_token || null;
        } catch (_) {
          token = null;
        }
      }

      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    // 3) Timeout duro solo para fetch
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);

    try {
      // ✅ IMPORTANTÍSIMO: quitar props custom antes de pasarlas a fetch
      const {
        tokenOverride,
        skipAuth: _skipAuth,
        skipLoading: _skipLoading,
        silent: _silent,
        ...fetchOpts
      } = opts;

      // ✅ Si Content-Type es JSON y body es objeto, serializa automático
      if (
        fetchOpts.body &&
        !isFormData &&
        typeof fetchOpts.body === "object" &&
        headers["Content-Type"]?.includes("application/json")
      ) {
        fetchOpts.body = JSON.stringify(fetchOpts.body);
      }

      const res = await fetch(`${API_URL}${path}`, {
        ...fetchOpts,
        headers,
        credentials: "include",
        signal: controller.signal,
      });

      const text = await res.text();
      let dataJson = null;

      try {
        dataJson = text ? JSON.parse(text) : null;
      } catch (_) {
        dataJson = text || null;
      }

      if (!res.ok) {
        const errObj =
          dataJson && typeof dataJson === "object"
            ? dataJson
            : { message: String(dataJson || "Error") };

        const msg =
          errObj?.message ||
          errObj?.error ||
          errObj?.details ||
          `HTTP ${res.status}`;

        errObj.status = res.status;

        // ✅ AUTO-RECUPERACIÓN: si la sesión/JWT está inválida, limpiamos para evitar loops
        const low = String(msg || "").toLowerCase();
        const isAuthFail =
          res.status === 401 ||
          (res.status === 403 &&
            (low.includes("jwt") ||
              low.includes("token") ||
              low.includes("unauthorized") ||
              low.includes("forbidden") ||
              low.includes("invalid")));

        // Permite desactivar auto-logout por request
        const noAutoLogout = !!opts.noAutoLogout;

        if (isAuthFail && !noAutoLogout) {
          try {
            await supabase.auth.signOut();
          } catch (_) {}
        }

        throw Object.assign(new Error(msg), errObj);
      }


      return dataJson;

    } catch (e) {
      if (e?.name === "AbortError") {
        const err = new Error("Tiempo de espera agotado (API timeout)");
        err.status = 408;
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(t);
      if (!skipLoading) globalLoading.stop();
    }
  }

