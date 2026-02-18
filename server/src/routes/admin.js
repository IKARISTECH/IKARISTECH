const express = require("express");
const crypto = require("crypto");
const { supabaseAdmin } = require("../supabaseAdmin");
const { requireAuth, requireArchon } = require("../middleware/auth");
const { sendInviteEmail, sendResetPasswordEmail } = require("../email/smtp");

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

function normEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function safeRole(r) {
  const x = String(r || "POLITES").toUpperCase().trim();
  if (x === "EPISTATES") return "EPISTATES";
  if (x === "POLITES") return "POLITES";
  // ARCHON no se permite crear por invitación
  return "POLITES";
}

/**
 * =========================================================
 * ADMIN BOOTSTRAP (Crear depto/level default si no existen)
 * =========================================================
 */
router.post("/bootstrap", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    // 1) departamento default: DIRECCION
    const { data: deptExisting, error: deptErr } = await supabaseAdmin
      .from("departments")
      .select("*")
      .eq("company_id", companyId)
      .eq("slug", "direccion")
      .limit(1);

    if (deptErr) return res.status(500).json({ error: deptErr.message });

    let dept = deptExisting?.[0] || null;

    if (!dept) {
      const { data: createdDept, error: insDeptErr } = await supabaseAdmin
        .from("departments")
        .insert({
          company_id: companyId,
          name: "DIRECCIÓN",
          slug: "direccion",
          color: "#16a34a",
          icon_key: "briefcase",
          sort_order: 0,
          active: true,
        })
        .select("*")
        .single();

      if (insDeptErr) return res.status(500).json({ error: insDeptErr.message });
      dept = createdDept;
    }

// 2) level default: DIRECTOR (IDEMPOTENTE)
const { data: lvlExisting, error: lvlErr } = await supabaseAdmin
  .from("levels")
  .select("*")
  .eq("company_id", companyId)
  .eq("department_id", dept.id)
  .eq("name", "DIRECTOR")
  .maybeSingle();

if (lvlErr) return res.status(500).json({ error: lvlErr.message });

let lvl = lvlExisting || null;

if (!lvl) {
  const payload = {
    company_id: companyId,
    department_id: dept.id,
    name: "DIRECTOR",
    rank: 0,
    color: "#16a34a",
    icon_key: "verified",
    active: true,
  };

  // ✅ CLAVE: evita 500 por unique levels_unique_per_dept_name
  const { data: upLvl, error: upErr } = await supabaseAdmin
    .from("levels")
    .upsert(payload, { onConflict: "company_id,department_id,name_lc" })
    .select("*")
    .single();

  if (upErr) return res.status(500).json({ error: upErr.message });
  lvl = upLvl;
}


    // ✅ 3) Si el ARCHON (dueño) aún no tiene depto/nivel asignados, pon defaults
    // Nota: req.companyUser es el registro en company_users del usuario actual.
    const patch = {};
    if (!req.companyUser.department_id && dept?.id) patch.department_id = dept.id;
    if (!req.companyUser.level_id && lvl?.id) patch.level_id = lvl.id;

    if (Object.keys(patch).length > 0) {
      patch.updated_at = nowIso();

      await supabaseAdmin
        .from("company_users")
        .update(patch)
        .eq("id", req.companyUser.id)
        .eq("company_id", companyId);
    }

    return res.status(200).json({ ok: true, defaults: { department: dept, level: lvl } });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * DEPARTMENTS CRUD (ARCHON)
 * =========================================================
 */
router.get("/departments", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const { data, error } = await supabaseAdmin
      .from("departments")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, departments: data || [] });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.post("/departments", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const { name, slug, color, icon_key, sort_order } = req.body || {};

    if (!name || !slug) return res.status(400).json({ error: "Missing name/slug" });

    const { data, error } = await supabaseAdmin
      .from("departments")
      .insert({
        company_id: companyId,
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase(),
        color: color ? String(color).trim() : null,
        icon_key: icon_key ? String(icon_key).trim() : null,
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
        active: true,
      })
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "department",
      entity_id: data.id,
      action: "create",
      meta: { name: data.name },
    });

    return res.status(200).json({ ok: true, department: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.patch("/departments/:id", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const id = req.params.id;

    const patch = {};
    const { name, slug, color, icon_key, sort_order, active } = req.body || {};

    if (name !== undefined) patch.name = String(name).trim();
    if (slug !== undefined) patch.slug = String(slug).trim().toLowerCase();
    if (color !== undefined) patch.color = color ? String(color).trim() : null;
    if (icon_key !== undefined) patch.icon_key = icon_key ? String(icon_key).trim() : null;
    if (sort_order !== undefined) patch.sort_order = Number(sort_order) || 0;
    if (active !== undefined) patch.active = !!active;

    const { data, error } = await supabaseAdmin
      .from("departments")
      .update(patch)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "department",
      entity_id: id,
      action: "update",
      meta: patch,
    });

    return res.status(200).json({ ok: true, department: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * LEVELS CRUD (ARCHON)
 * =========================================================
 */
router.get("/levels", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const departmentId = req.query.department_id ? String(req.query.department_id) : null;

    let q = supabaseAdmin
      .from("levels")
      .select("*")
      .eq("company_id", companyId)
      .order("rank", { ascending: true })
      .order("created_at", { ascending: true });

    if (departmentId) q = q.eq("department_id", departmentId);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true, levels: data || [] });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.get("/department-levels", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    const { data, error } = await supabaseAdmin
      .from("department_levels")
      .select("department_id, level_id")
      .eq("company_id", companyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, rows: data || [] });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.post("/levels", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const { name, rank, icon_key, department_id } = req.body || {};

    if (!name) return res.status(400).json({ error: "Missing name" });
    if (!department_id) return res.status(400).json({ error: "Missing department_id" });

    const { data, error } = await supabaseAdmin
      .from("levels")
      .insert({
        company_id: companyId,
        department_id: String(department_id),
        name: String(name).trim(),
        rank: Number.isFinite(rank) ? rank : 0,
        icon_key: icon_key ? String(icon_key).trim() : null,
        active: true,
      })
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "level",
      entity_id: data.id,
      action: "create",
      meta: { name: data.name, department_id: data.department_id },
    });

    return res.status(200).json({ ok: true, level: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});


router.patch("/levels/:id", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const id = req.params.id;

    const patch = {};
    const { name, rank, color, icon_key, active } = req.body || {};
    if (name !== undefined) patch.name = String(name).trim();
    if (rank !== undefined) patch.rank = Number(rank) || 0;
    if (color !== undefined) patch.color = color ? String(color).trim() : null;
    if (icon_key !== undefined) patch.icon_key = icon_key ? String(icon_key).trim() : null;
    if (active !== undefined) patch.active = !!active;

    const { data, error } = await supabaseAdmin
      .from("levels")
      .update(patch)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "level",
      entity_id: id,
      action: "update",
      meta: patch,
    });

    return res.status(200).json({ ok: true, level: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});
/**
 * =========================================================
 * ORG CHART (ARCHON)
 * - Guarda nodos/aristas con layout
 * =========================================================
 */
router.get("/orgchart", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    // 1) chart default (crea si no existe)
    let chart = null;

    const { data: ch0, error: ch0Err } = await supabaseAdmin
      .from("org_charts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (ch0Err) return res.status(500).json({ error: ch0Err.message });
    chart = ch0?.[0] || null;

    if (!chart) {
      const { data: created, error: cErr } = await supabaseAdmin
        .from("org_charts")
        .insert({
          company_id: companyId,
          name: "Organigrama",
          layout: "vertical",
          updated_at: nowIso(),
        })
        .select("*")
        .single();

      if (cErr) return res.status(500).json({ error: cErr.message });
      chart = created;
    }

    // 2) nodes + edges
    const [{ data: nodes, error: nErr }, { data: edges, error: eErr }] = await Promise.all([
      supabaseAdmin
        .from("org_nodes")
        .select("*")
        .eq("company_id", companyId)
        .eq("chart_id", chart.id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("org_edges")
        .select("*")
        .eq("company_id", companyId)
        .eq("chart_id", chart.id)
        .order("created_at", { ascending: true }),
    ]);

    if (nErr) return res.status(500).json({ error: nErr.message });
    if (eErr) return res.status(500).json({ error: eErr.message });

    return res.status(200).json({
      ok: true,
      chart,
      nodes: nodes || [],
      edges: edges || [],
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.post("/orgchart", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    const { chart, nodes, edges } = req.body || {};
    const layout = String(chart?.layout || "vertical");

    // asegurar chart default
    let chartRow = null;
    const { data: ch0 } = await supabaseAdmin
      .from("org_charts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true })
      .limit(1);

    chartRow = ch0?.[0] || null;

    if (!chartRow) {
      const { data: created, error: cErr } = await supabaseAdmin
        .from("org_charts")
        .insert({
          company_id: companyId,
          name: "Organigrama",
          layout,
          updated_at: nowIso(),
        })
        .select("*")
        .single();

      if (cErr) return res.status(500).json({ error: cErr.message });
      chartRow = created;
    } else {
      await supabaseAdmin
        .from("org_charts")
        .update({ layout, updated_at: nowIso() })
        .eq("id", chartRow.id)
        .eq("company_id", companyId);
    }

    // Estrategia simple y robusta: reemplazo total
    // (para canvas es lo más limpio, y evita desync)
    await supabaseAdmin.from("org_edges").delete().eq("company_id", companyId).eq("chart_id", chartRow.id);
    await supabaseAdmin.from("org_nodes").delete().eq("company_id", companyId).eq("chart_id", chartRow.id);

    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeEdges = Array.isArray(edges) ? edges : [];

    if (safeNodes.length) {
      const payloadNodes = safeNodes.map((n) => ({
        company_id: companyId,
        chart_id: chartRow.id,
        kind: n.kind || "position",
        department_id: n.department_id || null,
        level_id: n.level_id || null,
        title: String(n.title || "Puesto").trim(),
        meta: n.meta || {},
        x: Number(n.x) || 0,
        y: Number(n.y) || 0,
        updated_at: nowIso(),
      }));

      const { error: insNErr } = await supabaseAdmin.from("org_nodes").insert(payloadNodes);
      if (insNErr) return res.status(500).json({ error: insNErr.message });
    }

    if (safeEdges.length) {
      // necesitamos mapear source/target a ids nuevos si mandas ids temporales
      // => en frontend mandamos source/target como "idx" basado en orden (más abajo lo hago)
      // aquí asumimos que ya vienen con source_node_id/target_node_id reales
      const payloadEdges = safeEdges.map((e) => ({
        company_id: companyId,
        chart_id: chartRow.id,
        source_node_id: e.source_node_id,
        target_node_id: e.target_node_id,
        label: e.label || null,
      }));

      const { error: insEErr } = await supabaseAdmin.from("org_edges").insert(payloadEdges);
      if (insEErr) return res.status(500).json({ error: insEErr.message });
    }

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "orgchart",
      entity_id: chartRow.id,
      action: "update",
      meta: { layout, nodes: safeNodes.length, edges: safeEdges.length },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * USERS (ARCHON): listar y editar perfil
 * =========================================================
 */
router.get("/users", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    const { data, error } = await supabaseAdmin
      .from("company_users")
      .select(`
        *,
        departments:department_id (id, name, slug, color, icon_key),
        levels:level_id (id, name, rank, color, icon_key)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const users = data || [];

    // ✅ Enriquecer con métodos de auth (password vs google)
    // Nota: para usuarios email/password, Supabase a veces NO trae "identities",
    // pero sí trae app_metadata.providers o provider.
    const ids = users.map((u) => u.auth_user_id).filter(Boolean);

    const authMap = new Map(); // auth_user_id -> { auth_providers: [], has_password: bool }

    // En la práctica, empresas tienen pocos usuarios => OK hacerlo en paralelo.
    await Promise.all(
      ids.map(async (authId) => {
        try {
          const { data: au, error: auErr } = await supabaseAdmin.auth.admin.getUserById(authId);
          if (auErr || !au?.user) {
            authMap.set(authId, { auth_providers: [], has_password: false });
            return;
          }

          const user = au.user;

          // providers desde app_metadata (lo más confiable en admin API)
          let providers = [];
          const p1 = user?.app_metadata?.providers;
          const p2 = user?.app_metadata?.provider;

          if (Array.isArray(p1)) providers = p1.map(String);
          else if (typeof p2 === "string" && p2) providers = [String(p2)];

          // fallback: identities (si vienen)
          if ((!providers || providers.length === 0) && Array.isArray(user.identities)) {
            providers = user.identities.map((x) => String(x?.provider || "")).filter(Boolean);
          }

          providers = Array.from(new Set(providers.map((x) => String(x).toLowerCase())));

          // Regla IKARIS:
          // - si tiene 'email' => hay password local (cambiar/reset aplica)
          // - si solo 'google' => NO hay password local
          const hasPassword = providers.includes("email");

          authMap.set(authId, { auth_providers: providers, has_password: hasPassword });
        } catch (_) {
          authMap.set(authId, { auth_providers: [], has_password: false });
        }
      })
    );

    const enriched = users.map((u) => {
      const extra = authMap.get(u.auth_user_id) || { auth_providers: [], has_password: false };
      return { ...u, ...extra };
    });

    return res.status(200).json({ ok: true, users: enriched });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * USERS (ARCHON): crear usuario directo (sin correo)
 * - Crea auth user con password temporal
 * - Crea company_users membership
 * - NO envía email
 * =========================================================
 */
router.post("/users/create-temp", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    const {
      email,
      temp_password,
      full_name,
      position,
      role,
      department_id,
      level_id,
    } = req.body || {};

    const em = normEmail(email);
    if (!em) return res.status(400).json({ error: "Missing email" });

    const pw = String(temp_password || "").trim();
    if (!pw || pw.length < 8) return res.status(400).json({ error: "WEAK_PASSWORD" });

    // 1) Crear user en Supabase Auth (sin confirmación por correo)
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: em,
      password: pw,
      email_confirm: true,
      user_metadata: {
        full_name: full_name ? String(full_name).trim() : null,
        position: position ? String(position).trim() : null,
      },
    });

    if (cErr || !created?.user?.id) {
      return res.status(400).json({ error: cErr?.message || "Cannot create auth user" });
    }

    const auth_user_id = created.user.id;
    const username = em.split("@")[0] || "user";

// 2) Insertar membership en company_users
const { data: mem, error: mErr } = await supabaseAdmin
  .from("company_users")
  .upsert(
    {
      company_id: companyId,
      auth_user_id,
      username,
      role: safeRole(role),
      department_id: department_id || null,
      level_id: level_id || null,
      full_name: full_name ? String(full_name).trim() : null,
      position: position ? String(position).trim() : null,
      active: true,
      can_create_forms: false,

      // ✅ MARCA como usuario temporal (para que tu SQL lo identifique bien)
      temp_email: em,

      // ✅ forzar cambio de contraseña al primer login
      must_change_password: true,
      password_changed_at: null,

      updated_at: nowIso(),
    },
    { onConflict: "company_id,auth_user_id" }
  )
  .select("*")
  .single();


    if (mErr) {
      // rollback auth user si falla membership
      try {
        await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
      } catch (_) {}
      return res.status(400).json({ error: mErr.message });
    }

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "user",
      entity_id: auth_user_id,
      action: "create",
      meta: {
        email: em,
        role: mem.role,
        department_id: mem.department_id,
        level_id: mem.level_id,
        no_email: true,
      },
    });

    return res.status(200).json({ ok: true, user: mem, auth_user_id });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.patch("/users/:id", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const id = req.params.id;

    const {
      full_name,
      position,
      department_id,
      level_id,
      role,
      active,
      can_create_forms,
    } = req.body || {};

    // ARCHON no se toca por seguridad (tú tienes trigger además)
    const { data: current, error: curErr } = await supabaseAdmin
      .from("company_users")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

if (curErr) return res.status(404).json({ error: "User not found" });

// ✅ ARCHON: solo puede editar SU PROPIO perfil (nombre/puesto/depto/nivel)
// ✅ y NO puede tocar role/active/can_create_forms aquí.
const isSelf = String(current.auth_user_id) === String(req.authUser.id);

if (current.role === "ARCHON" && !isSelf) {
  return res.status(403).json({ error: "Cannot edit other ARCHON" });
}

const patch = { updated_at: nowIso() };

// campos permitidos
if (full_name !== undefined) patch.full_name = String(full_name || "").trim() || null;
if (position !== undefined) patch.position = String(position || "").trim() || null;
if (department_id !== undefined) patch.department_id = department_id || null;
if (level_id !== undefined) patch.level_id = level_id || null;

// ✅ SOLO si NO es ARCHON, se permiten cambios administrativos
if (current.role !== "ARCHON") {
  if (active !== undefined) patch.active = !!active;
  if (can_create_forms !== undefined) patch.can_create_forms = !!can_create_forms;
  if (role !== undefined) patch.role = safeRole(role);
}

    const { data, error } = await supabaseAdmin
      .from("company_users")
      .update(patch)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "user",
      entity_id: current.auth_user_id,
      action: "update",
      meta: patch,
    });

    return res.status(200).json({ ok: true, user: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * USERS (ARCHON): "eliminar" (soft delete + desactivar)
 * =========================================================
 */
router.delete("/users/:id", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const id = req.params.id;

    const { data: current, error: curErr } = await supabaseAdmin
      .from("company_users")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (curErr) return res.status(404).json({ error: "User not found" });
    if (current.role === "ARCHON") return res.status(403).json({ error: "Cannot delete ARCHON" });

    const patch = {
      active: false,
      deleted_at: nowIso(),
      deleted_by: req.authUser.id,
      updated_at: nowIso(),
      full_name: current.full_name || null,
      position: current.position || null,
    };

    const { error } = await supabaseAdmin
      .from("company_users")
      .update(patch)
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "user",
      entity_id: current.auth_user_id,
      action: "delete",
      meta: { soft: true, company_user_id: id },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * INVITACIONES (ARCHON)
 * - Crea invite -> envía correo custom con link
 * =========================================================
 */
router.get("/invites", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    const { data, error } = await supabaseAdmin
      .from("company_invitations")
      .select(`
        *,
        departments:department_id (id, name, slug, color, icon_key),
        levels:level_id (id, name, rank, color, icon_key)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, invites: data || [] });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.post("/invites", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;

    const {
      email,
      full_name,
      position,
      role,
      department_id,
      level_id,
      expires_days,
    } = req.body || {};

    const em = normEmail(email);
    if (!em) return res.status(400).json({ error: "Missing email" });

    const safeExpires = Number(expires_days) > 0 ? Number(expires_days) : 7;
    const token = makeToken();

    // obtener nombre de empresa para correo
    const { data: company, error: compErr } = await supabaseAdmin
      .from("companies")
      .select("id,name,slug")
      .eq("id", companyId)
      .single();

    if (compErr) return res.status(500).json({ error: compErr.message });

    // insert invite
    const { data: invite, error: invErr } = await supabaseAdmin
      .from("company_invitations")
      .upsert(
        {
          company_id: companyId,
          invited_by_auth_user_id: req.authUser.id,
          email: em,
          role: safeRole(role),
          department_id: department_id || null,
          level_id: level_id || null,
          token,
          status: "pending",
          expires_at: new Date(Date.now() + safeExpires * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "company_id,email" }
      )
      .select("*")
      .single();

    if (invErr) return res.status(400).json({ error: invErr.message });

    // link al frontend
    const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
    const acceptUrl = `${WEB_URL}/accept-invite?token=${encodeURIComponent(invite.token)}`;

    // correo custom
    try {
      await sendInviteEmail({
        to: em,
        companyName: company.name,
        acceptUrl,
        fullName: full_name ? String(full_name).trim() : null,
        position: position ? String(position).trim() : null,
      });
    } catch (mailErr) {
      return res.status(500).json({
        error: "Invite created but email failed",
        details: String(mailErr?.message || mailErr),
        invite,
      });
    }

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "invite",
      entity_id: invite.id,
      action: "create",
      meta: { email: em, role: invite.role },
    });

    return res.status(200).json({ ok: true, invite });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

router.post("/invites/:id/revoke", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const id = req.params.id;

    const { data, error } = await supabaseAdmin
      .from("company_invitations")
      .update({ status: "revoked" })
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "invite",
      entity_id: id,
      action: "delete",
      meta: { revoked: true, email: data.email },
    });

    return res.status(200).json({ ok: true, invite: data });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * ACCEPT INVITE (usuario logueado)
 * - NO es ARCHON-only; es del invitado.
 * - Requiere membership? NO, solo JWT.
 * =========================================================
 */
router.post("/accept-invite", requireAuth, async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) return res.status(400).json({ error: "Missing token" });

    const authUser = req.authUser;

    // buscar invite
    const { data: inv, error: invErr } = await supabaseAdmin
      .from("company_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (invErr || !inv) return res.status(404).json({ error: "Invite not found" });

    // validar status
    if (inv.status !== "pending") {
      return res.status(400).json({ error: `Invite not pending (${inv.status})` });
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("company_invitations").update({ status: "expired" }).eq("id", inv.id);
      return res.status(400).json({ error: "Invite expired" });
    }

    // validar email coincide con el usuario logueado
    const userEmail = normEmail(authUser.email);
    if (userEmail !== normEmail(inv.email)) {
      return res.status(403).json({ error: "Email mismatch for invitation" });
    }

    // crear membership (si ya existe, upsert no rompe)
    const username = userEmail.split("@")[0] || "user";

const { data: mem, error: memErr } = await supabaseAdmin
  .from("company_users")
  .upsert(
    {
      company_id: inv.company_id,
      auth_user_id: authUser.id,
      username,
      role: safeRole(inv.role),
      department_id: inv.department_id || null,
      level_id: inv.level_id || null,
      active: true,
      can_create_forms: false,

      // ✅ invitación NO es “password temporal”
      temp_email: null,
      must_change_password: false,
      password_changed_at: null,

      updated_at: nowIso(),
    },
    { onConflict: "company_id,auth_user_id" }
  )
  .select("*")
  .single();


    if (memErr) return res.status(500).json({ error: memErr.message });

    // marcar invite accepted
    await supabaseAdmin
      .from("company_invitations")
      .update({
        status: "accepted",
        accepted_at: nowIso(),
        accepted_by_auth_user_id: authUser.id,
      })
      .eq("id", inv.id);

    await supabaseAdmin.from("audit_log").insert({
      company_id: inv.company_id,
      actor_user_id: authUser.id,
      entity: "invite",
      entity_id: inv.id,
      action: "update",
      meta: { accepted: true, email: userEmail },
    });

    return res.status(200).json({ ok: true, membership: mem });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

/**
 * =========================================================
 * RESET PASSWORD (ARCHON): manda link recovery custom
 * =========================================================
 */
router.post("/users/:id/reset-password", requireAuth, requireArchon, async (req, res) => {
  try {
    const companyId = req.companyUser.company_id;
    const id = req.params.id;

    // get user membership
    const { data: cu, error: cuErr } = await supabaseAdmin
      .from("company_users")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    if (cuErr || !cu) return res.status(404).json({ error: "User not found" });
    if (cu.role === "ARCHON") return res.status(403).json({ error: "Cannot reset ARCHON here" });

    // obtener auth user (para email + providers)
    const { data: au, error: auErr } = await supabaseAdmin.auth.admin.getUserById(cu.auth_user_id);
    if (auErr || !au?.user?.email) return res.status(400).json({ error: "Auth user email not found" });

    const email = normEmail(au.user.email);

    // ✅ Detecta providers (para bloquear Google-only)
    let providers = [];
    const p1 = au.user?.app_metadata?.providers;
    const p2 = au.user?.app_metadata?.provider;

    if (Array.isArray(p1)) providers = p1.map(String);
    else if (typeof p2 === "string" && p2) providers = [String(p2)];

    if ((!providers || providers.length === 0) && Array.isArray(au.user.identities)) {
      providers = au.user.identities.map((x) => String(x?.provider || "")).filter(Boolean);
    }

    providers = Array.from(new Set(providers.map((x) => String(x).toLowerCase())));

    const hasPassword = providers.includes("email");

    // ✅ Regla IKARIS: si no hay password local, NO hay reset.
    if (!hasPassword) {
      return res.status(400).json({
        error: "NO_LOCAL_PASSWORD",
        message: "Esta cuenta usa Google (OAuth) y no tiene contraseña local. No aplica restablecimiento.",
        providers,
      });
    }

    // generar link recovery
    const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
    const redirectTo = `${WEB_URL}/login`;

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkErr) return res.status(500).json({ error: linkErr.message });

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) return res.status(500).json({ error: "No action_link generated" });

    // obtener nombre empresa
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    try {
      await sendResetPasswordEmail({
        to: email,
        companyName: company?.name || "IKARIS",
        resetUrl: actionLink,
      });
    } catch (mailErr) {
      return res.status(500).json({
        error: "Reset link generated but email failed",
        details: String(mailErr?.message || mailErr),
      });
    }

    await supabaseAdmin.from("audit_log").insert({
      company_id: companyId,
      actor_user_id: req.authUser.id,
      entity: "user",
      entity_id: cu.auth_user_id,
      action: "update",
      meta: { reset_password: true },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});


module.exports = router;
