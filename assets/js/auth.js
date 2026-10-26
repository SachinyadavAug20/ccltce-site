// Supabase email/password auth + role-aware UI helpers.
// Loaded on every page via chrome.js. Uses window.SUPABASE_CONFIG from supabase-config.js.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { minecraftFace, navFace } from "./avatar.js";

const cfg = window.SUPABASE_CONFIG || {};
const hasConfig = Boolean(cfg.url && cfg.anonKey && !String(cfg.url).includes("YOUR_PROJECT"));
export const supabase = hasConfig ? createClient(cfg.url, cfg.anonKey) : null;

const ROLE_LABEL = { student: "Student", coding_club_member: "Club Member", admin: "Admin" };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

function showBanner(msg, kind) {
  let el = $(".auth-banner");
  if (!el) {
    el = document.createElement("div");
    el.className = "auth-banner";
    el.setAttribute("role", "status");
    const main = $("main") || document.body;
    main.prepend(el);
  }
  el.textContent = msg;
  el.dataset.kind = kind || "info";
  el.hidden = false;
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { el.hidden = true; }, 6000);
}

function errText(e) {
  return (e && e.message) || "Something went wrong. Try again.";
}

export async function getProfile() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data || { id: user.id, email: user.email, role: "student" };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

function avatarSrc(profile, size) {
  if (profile && profile.avatar_url) return profile.avatar_url;
  const seed = (profile && (profile.id || profile.email)) || "guest";
  return size === "nav" ? navFace(seed) : minecraftFace(seed, size || 80);
}

function closeAllMenus() {
  $$("[data-auth-menu]").forEach((m) => { m.hidden = true; });
  $$("[data-auth-trigger]").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function wireDropdown(slot, profile) {
  const trigger = slot.querySelector("[data-auth-trigger]");
  const menu = slot.querySelector("[data-auth-menu]");
  if (!trigger || !menu) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !menu.hidden;
    closeAllMenus();
    if (!open) {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
  });

  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) {
      closeAllMenus();
      return;
    }
    if (e.target.closest("[data-logout]")) {
      signOut();
    }
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-auth-slot]")) closeAllMenus();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllMenus();
});

function updateNavAuth(profile) {
  $$("[data-auth-slot]").forEach((slot) => {
    if (!profile) {
      slot.innerHTML = '<a href="login.html">Login</a>';
      return;
    }
    const role = ROLE_LABEL[profile.role] || "Member";
    const roleCls = profile.role === "admin" ? "role-admin" : profile.role === "coding_club_member" ? "role-club" : "role-student";
    const name = profile.full_name || (profile.email || "You").split("@")[0];
    const face = avatarSrc(profile, "nav");
    slot.innerHTML =
      '<div class="auth-user">' +
      '<button class="auth-trigger" type="button" data-auth-trigger aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' +
      '<img class="auth-face" src="' + face + '" alt="" width="28" height="28" />' +
      '<span class="auth-chev" aria-hidden="true">▾</span>' +
      "</button>" +
      '<div class="auth-menu" data-auth-menu hidden role="menu">' +
      '<div class="auth-menu-head">' +
      '<img class="auth-menu-face" src="' + face + '" alt="" width="40" height="40" />' +
      '<div class="auth-menu-id">' +
      '<span class="auth-menu-name">' + escapeHtml(name) + "</span>" +
      '<span class="auth-menu-email">' + escapeHtml(profile.email || "") + "</span>" +
      '<span class="role-badge ' + roleCls + '">' + role + "</span>" +
      "</div></div>" +
      '<div class="auth-menu-sep" role="separator"></div>' +
      '<a class="auth-menu-item" href="dashboard.html" role="menuitem">Dashboard</a>' +
      '<a class="auth-menu-item" href="dashboard.html#profile" role="menuitem">Profile &amp; avatar</a>' +
      (profile.role === "student" ? '<a class="auth-menu-item" href="dashboard.html#teams" role="menuitem">My teams</a>' : "") +
      (profile.role === "admin" || profile.role === "coding_club_member"
        ? '<a class="auth-menu-item" href="dashboard.html#staff" role="menuitem">Registrations</a>'
        : "") +
      '<div class="auth-menu-sep" role="separator"></div>' +
      '<button class="auth-menu-item auth-menu-danger" type="button" data-logout role="menuitem">Log out</button>' +
      "</div></div>";
    wireDropdown(slot, profile);
  });
}

async function refreshNav() {
  if (!supabase) {
    updateNavAuth(null);
    return null;
  }
  const profile = await getProfile();
  updateNavAuth(profile);
  return profile;
}

function wireLogin() {
  const form = $("#login-form");
  if (!form || !supabase) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const err = $("#login-error", form);
    btn.disabled = true;
    err.hidden = true;
    const email = $("#login-email", form).value.trim();
    const password = $("#login-password", form).value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    if (error) {
      err.textContent = errText(error);
      err.hidden = false;
      return;
    }
    showBanner("Welcome back! Redirecting…", "ok");
    setTimeout(() => { window.location.href = "dashboard.html"; }, 600);
  });

  const forgot = document.getElementById("forgot-link");
  if (forgot) {
    forgot.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = $("#login-email", form).value.trim();
      if (!email) { showBanner("Enter your email first, then click forgot password.", "warn"); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/dashboard.html",
      });
      showBanner(error ? errText(error) : "Password reset email sent (check inbox).", error ? "err" : "ok");
    });
  }
}

function wireRegister() {
  const form = $("#register-form");
  if (!form || !supabase) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const err = $("#register-error", form);
    btn.disabled = true;
    err.hidden = true;
    const full_name = $("#reg-name", form).value.trim();
    const email = $("#reg-email", form).value.trim();
    const password = $("#reg-password", form).value;
    const confirm = $("#reg-confirm", form).value;
    if (password !== confirm) {
      err.textContent = "Passwords do not match.";
      err.hidden = false;
      btn.disabled = false;
      return;
    }
    if (password.length < 8) {
      err.textContent = "Password must be at least 8 characters.";
      err.hidden = false;
      btn.disabled = false;
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });
    btn.disabled = false;
    if (error) {
      err.textContent = errText(error);
      err.hidden = false;
      return;
    }
    if (data && data.session) {
      showBanner("Account created! Redirecting…", "ok");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 600);
    } else {
      showBanner("Almost there — check your email to confirm your account, then log in.", "ok");
      setTimeout(() => { window.location.href = "login.html"; }, 2200);
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function wireAvatar(profile, root) {
  const fileInput = $("#avatar-file", root);
  const saveBtn = $("#avatar-save", root);
  const resetBtn = $("#avatar-reset", root);
  const preview = $("#avatar-preview", root);
  const errEl = $("#avatar-error", root);
  if (!fileInput || !saveBtn || !preview) return;

  let pendingFile = null;

  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
      errEl.textContent = "Use a PNG, JPEG or WebP image.";
      errEl.hidden = false;
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      errEl.textContent = "Image must be under 2 MB.";
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    pendingFile = f;
    saveBtn.disabled = false;
    const reader = new FileReader();
    reader.onload = () => { preview.src = reader.result; };
    reader.readAsDataURL(f);
  });

  saveBtn.addEventListener("click", async () => {
    if (!pendingFile) return;
    saveBtn.disabled = true;
    errEl.hidden = true;
    const path = profile.id + "/avatar-" + Date.now() + ".png";
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, pendingFile, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      errEl.textContent = "Upload failed: " + errText(upErr) + " — is the avatars bucket created?";
      errEl.hidden = false;
      saveBtn.disabled = false;
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub && pub.publicUrl;
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
    if (dbErr) {
      errEl.textContent = "Saved to storage but profile update failed: " + errText(dbErr);
      errEl.hidden = false;
      saveBtn.disabled = false;
      return;
    }
    profile.avatar_url = publicUrl;
    showBanner("Avatar updated!", "ok");
    // refresh nav faces
    refreshNav();
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
      if (error) {
        errEl.textContent = errText(error);
        errEl.hidden = false;
        return;
      }
      profile.avatar_url = null;
      const def = minecraftFace(profile.id || profile.email, 96);
      preview.src = def;
      pendingFile = null;
      saveBtn.disabled = true;
      fileInput.value = "";
      showBanner("Reset to default Minecraft face.", "ok");
      refreshNav();
    });
  }
}

async function initDashboard(profile) {
  const root = $("#dashboard-root");
  if (!root || !supabase) return;
  if (!profile) {
    root.innerHTML =
      '<div class="auth-card auth-guard">' +
      '<p class="auth-guard-title">Not logged in</p>' +
      '<p class="auth-guard-sub">Log in or create an account to see your dashboard, teams and event registrations.</p>' +
      '<div class="auth-actions"><a class="btn btn-primary" href="login.html">Log in</a><a class="btn" href="register.html">Sign up</a></div>' +
      "</div>";
    return;
  }

  const role = profile.role || "student";
  const roleCls = role === "admin" ? "role-admin" : role === "coding_club_member" ? "role-club" : "role-student";
  const face = avatarSrc(profile, 96);
  let html =
    '<div class="auth-card dash-head" id="profile">' +
    '<div class="dash-id">' +
    '<img class="dash-avatar-img" src="' + face + '" alt="" width="96" height="96" />' +
    '<div><h2>' + escapeHtml(profile.full_name || "Member") + "</h2>" +
    '<p class="dash-email">' + escapeHtml(profile.email || "") + "</p></div></div>" +
    '<span class="role-badge ' + roleCls + '">' + (ROLE_LABEL[role] || role) + "</span>" +
    "</div>";

  html +=
    '<section class="auth-card">' +
    "<h3>Profile &amp; avatar</h3>" +
    '<p class="dash-note">Your face is auto-generated from your account. Upload a picture to replace it.</p>' +
    '<div class="avatar-row">' +
    '<img class="avatar-preview" id="avatar-preview" src="' + face + '" alt="Current avatar" width="96" height="96" />' +
    '<div class="avatar-controls">' +
    '<label class="btn" for="avatar-file">Choose image…</label>' +
    '<input id="avatar-file" type="file" accept="image/png,image/jpeg,image/webp" hidden />' +
    '<button class="btn btn-primary" type="button" id="avatar-save" disabled>Upload avatar</button>' +
    '<button class="btn" type="button" id="avatar-reset">Use default face</button>' +
    "</div></div>" +
    '<p class="form-error" id="avatar-error" hidden></p>' +
    '<dl class="dash-meta" style="margin-top:1rem"><dt>Role</dt><dd>' + escapeHtml(ROLE_LABEL[role] || role) + "</dd>" +
    "<dt>Member since</dt><dd>" + escapeHtml((profile.created_at || "").slice(0, 10)) + "</dd></dl>" +
    '<button class="btn" type="button" data-logout-dash>Log out</button>' +
    "</section>";

  html +=
    '<section class="auth-card">' +
    "<h3>Send feedback</h3>" +
    '<form id="feedback-form" class="auth-form">' +
    '<label for="fb-msg">Message</label>' +
    '<textarea id="fb-msg" rows="4" required maxlength="2000" placeholder="What should we improve?"></textarea>' +
    '<p class="form-error" id="feedback-error" hidden></p>' +
    '<button class="btn btn-primary" type="submit">Submit feedback</button>' +
    "</form></section>";

  if (role === "student") {
    html +=
      '<section class="auth-card" id="teams">' +
      "<h3>Create a team</h3>" +
      '<p class="dash-note">Max <b>4 members</b> per team. Pick an event, name your squad.</p>' +
      '<form id="team-form" class="auth-form">' +
      '<label for="team-event">Event</label>' +
      '<select id="team-event" required></select>' +
      '<label for="team-name">Team name</label>' +
      '<input id="team-name" type="text" required maxlength="60" placeholder="e.g. Segfault Survivors" />' +
      '<p class="form-error" id="team-error" hidden></p>' +
      '<button class="btn btn-primary" type="submit">Create team</button>' +
      "</form>" +
      '<div id="my-teams" class="dash-list" aria-live="polite"></div>' +
      "</section>";
  }

  if (role === "admin" || role === "coding_club_member") {
    html +=
      '<section class="auth-card" id="staff">' +
      "<h3>All registrations</h3>" +
      '<p class="dash-note">Every team registration across events.</p>' +
      '<div id="all-regs" class="dash-list" aria-live="polite"><p class="dash-empty">Loading…</p></div>' +
      "</section>" +
      '<section class="auth-card">' +
      "<h3>Registered users</h3>" +
      '<div id="all-users" class="dash-list" aria-live="polite"><p class="dash-empty">Loading…</p></div>' +
      "</section>";
  }

  root.innerHTML = html;

  const outBtn = root.querySelector("[data-logout-dash]");
  if (outBtn) outBtn.addEventListener("click", () => signOut());

  // avatar upload
  wireAvatar(profile, root);

  // feedback
  const fb = $("#feedback-form", root);
  if (fb) {
    fb.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = $("#feedback-error", fb);
      const msg = $("#fb-msg", fb).value.trim();
      if (!msg) return;
      const { error } = await supabase.from("feedback").insert({ user_id: profile.id, message: msg });
      if (error) {
        errEl.textContent = errText(error);
        errEl.hidden = false;
        return;
      }
      errEl.hidden = true;
      fb.reset();
      showBanner("Feedback sent — thanks!", "ok");
    });
  }

  // team form (students)
  const teamForm = $("#team-form", root);
  if (teamForm) {
    const sel = $("#team-event", teamForm);
    const { data: events } = await supabase.from("events").select("id, title").order("created_at");
    sel.innerHTML = (events || []).map((ev) => '<option value="' + escapeHtml(ev.id) + '">' + escapeHtml(ev.title) + "</option>").join("") || '<option value="">No events yet</option>';

    teamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = $("#team-error", teamForm);
      const name = $("#team-name", teamForm).value.trim();
      const eventId = sel.value;
      if (!name || !eventId) return;
      const { data: team, error } = await supabase
        .from("teams")
        .insert({ event_id: eventId, team_name: name, leader_id: profile.id })
        .select()
        .single();
      if (error) {
        errEl.textContent = errText(error);
        errEl.hidden = false;
        return;
      }
      await supabase.from("team_members").insert({ team_id: team.id, user_id: profile.id, role_in_team: "leader" });
      errEl.hidden = true;
      teamForm.reset();
      showBanner("Team “" + name + "” created!", "ok");
      loadMyTeams(profile);
    });
    loadMyTeams(profile);
  }

  // staff views
  if (role === "admin" || role === "coding_club_member") {
    loadAllRegs();
    loadAllUsers();
  }
}

async function loadMyTeams(profile) {
  const box = $("#my-teams");
  if (!box || !supabase) return;
  const { data } = await supabase
    .from("teams")
    .select("id, team_name, events(title)")
    .eq("leader_id", profile.id)
    .order("created_at", { ascending: false });
  if (!data || !data.length) {
    box.innerHTML = '<p class="dash-empty">No teams yet — create one above.</p>';
    return;
  }
  box.innerHTML = data
    .map(
      (t) =>
        '<div class="dash-row"><b>' + escapeHtml(t.team_name) + "</b>" +
        '<span class="dash-sub">' + escapeHtml((t.events && t.events.title) || "—") + "</span></div>"
    )
    .join("");
}

async function loadAllRegs() {
  const box = $("#all-regs");
  if (!box || !supabase) return;
  const { data } = await supabase
    .from("registrations")
    .select("id, status, registered_at, teams(team_name, events(title), leader_id)")
    .order("registered_at", { ascending: false });
  if (!data || !data.length) {
    box.innerHTML = '<p class="dash-empty">No registrations yet.</p>';
    return;
  }
  box.innerHTML = data
    .map(
      (r) =>
        '<div class="dash-row"><b>' + escapeHtml(r.teams && r.teams.team_name) + "</b>" +
        '<span class="dash-sub">' + escapeHtml((r.teams && r.teams.events && r.teams.events.title) || "—") + " · " + escapeHtml(r.status) + "</span></div>"
    )
    .join("");
}

async function loadAllUsers() {
  const box = $("#all-users");
  if (!box || !supabase) return;
  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role, avatar_url, created_at").order("created_at", { ascending: false });
  if (error || !data || !data.length) {
    box.innerHTML = '<p class="dash-empty">' + (error ? "No access (check RLS)." : "No users yet.") + "</p>";
    return;
  }
  box.innerHTML = data
    .map(
      (u) =>
        '<div class="dash-row dash-user-row">' +
        '<img class="dash-user-face" src="' + avatarSrc(u, 32) + '" alt="" width="28" height="28" />' +
        "<b>" + escapeHtml(u.full_name || u.email) + "</b>" +
        '<span class="dash-sub">' + escapeHtml(u.email) + " · " + escapeHtml(u.role) + "</span></div>"
    )
    .join("");
}

async function init() {
  if (!hasConfig) {
    updateNavAuth(null);
    const form = $("#login-form") || $("#register-form");
    if (form) {
      const err = $("#login-error", form) || $("#register-error", form);
      if (err) {
        err.textContent = "Supabase is not configured yet. Fill assets/js/supabase-config.js (see supabase/schema.sql and README).";
        err.hidden = false;
      }
      form.querySelectorAll("input, button").forEach((el) => { el.disabled = true; });
    }
    const dash = $("#dashboard-root");
    if (dash) {
      dash.innerHTML = '<div class="auth-card auth-guard"><p class="auth-guard-title">Supabase not configured</p><p class="auth-guard-sub">Set window.SUPABASE_CONFIG in assets/js/supabase-config.js, then reload.</p></div>';
    }
    return;
  }

  const profile = await refreshNav();
  wireLogin();
  wireRegister();
  if ($("#dashboard-root")) await initDashboard(profile);

  supabase.auth.onAuthStateChange(() => { refreshNav(); });
}

init();
