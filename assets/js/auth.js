// Supabase email/password auth + role-aware UI helpers.
// Loaded on every page via chrome.js. Uses window.SUPABASE_CONFIG from supabase-config.js.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { minecraftFace, navFace, pixelMatrixToSvg, parsePixelMatrix, faceMatrix16 } from "./avatar.js";
import { openPixelEditor } from "./pixeledit.js";

// auth.css is only linked on auth pages — inject it everywhere so the nav menu styles work
if (!document.querySelector('link[href*="auth.css"]')) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "assets/css/auth.css";
  document.head.appendChild(link);
}

// Ensure config is loaded even when another module (community.js) imports us first
if (!window.SUPABASE_CONFIG) {
  await new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "assets/js/supabase-config.js";
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

const cfg = window.SUPABASE_CONFIG || {};
const hasConfig = Boolean(cfg.url && cfg.anonKey && !String(cfg.url).includes("YOUR_PROJECT"));
export const supabase = hasConfig ? createClient(cfg.url, cfg.anonKey) : null;

const ROLE_LABEL = { student: "Student", coding_club_member: "Club Member", admin: "Admin" };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
let _sessionUser = null;

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

// ── shared level system (DB xp on profiles) ──
const RANKS = [
  [1, "Guest Explorer"], [5, "Script Kiddie"], [10, "Bug Hunter"],
  [25, "Kernel Crafter"], [50, "Redstone Sage"], [100, "Diamond Dev"],
];
export function levelOf(xp) { return 1 + Math.floor((Number(xp) || 0) / 100); }
export function rankOf(xp) {
  const lv = levelOf(xp);
  let r = RANKS[0][1];
  RANKS.forEach((p) => { if (lv >= p[0]) r = p[1]; });
  return r;
}
function paintLevelChips() {
  const xp = (_sessionUser && Number(_sessionUser.xp)) || 0;
  $$("[data-level-chip]").forEach((el) => {
    el.textContent = "Lv " + levelOf(xp) + " · " + rankOf(xp);
    el.title = xp + " XP";
  });
}
// award DB XP (+ celebrate on the HUD rail). Returns new xp or null.
export async function awardXp(n, reason) {
  if (!supabase || !n) return null;
  const { data, error } = await supabase.rpc("add_xp", { amount: n });
  if (error || typeof data !== "number") return null;
  if (_sessionUser) _sessionUser.xp = data;
  if (window.CCLTCE_HUD && window.CCLTCE_HUD.xp() < data) {
    window.CCLTCE_HUD.addXP(data - window.CCLTCE_HUD.xp());
  }
  paintLevelChips();
  if (reason) showBanner("★ +" + n + " XP — " + reason, "ok");
  return data;
}
function syncHudToProfile(profile) {
  if (!window.CCLTCE_HUD || !profile || profile.xp == null) return;
  const db = Number(profile.xp) || 0;
  const local = window.CCLTCE_HUD.xp();
  if (db > local) window.CCLTCE_HUD.addXP(db - local);
}

// passively push earned local HUD xp into the shared leaderboard (capped per call by the RPC)
async function pushLocalXpToDb(profile) {
  if (!supabase || !profile || profile.xp == null || !window.CCLTCE_HUD) return;
  const diff = window.CCLTCE_HUD.xp() - (Number(profile.xp) || 0);
  if (diff <= 0) return;
  const got = await awardXp(Math.min(diff, 100), null);
  if (got == null && !pushLocalXpToDb._warned) {
    pushLocalXpToDb._warned = true;
    console.info("Leaderboard sync inactive — run supabase/migration-fun.sql.");
  }
}

// ── signup celebration ──
function showCongrats(name) {
  if (document.querySelector(".pe-overlay.welcome-overlay")) return;
  try { sessionStorage.setItem("ccltce-congrats", "1"); } catch {}
  const first = String(name || "").trim().split(/\s+/)[0] || "friend";
  const overlay = document.createElement("div");
  overlay.className = "pe-overlay welcome-overlay";
  overlay.innerHTML =
    '<div class="pe-modal welcome-modal" role="dialog" aria-modal="true" aria-label="Welcome to the community">' +
    '<div class="welcome-confetti" aria-hidden="true"></div>' +
    '<div class="welcome-body">' +
    '<span class="welcome-flag">ACCOUNT CREATED</span>' +
    '<h3 class="welcome-title">Congratulations,<br />' + escapeHtml(first) + '!</h3>' +
    '<p class="welcome-sub">You&rsquo;re officially <b>in the community</b> — 100 XP banked, Lv 1 started.<br />' +
    'Meet the other members, open chats and team up before the next event.</p>' +
    '<div class="welcome-actions">' +
    '<a class="btn btn-primary" href="community.html" data-welcome-go>👥 Meet the community</a>' +
    '<a class="btn" href="dashboard.html" data-welcome-go>Go to dashboard</a>' +
    "</div>" +
    '<button class="pe-close" type="button" aria-label="Close">✕</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".pe-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  overlay.querySelectorAll("[data-welcome-go]").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });
  spawnConfetti(overlay.querySelector(".welcome-confetti"));
}

function spawnConfetti(host) {
  if (!host || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#eab308", "#17dd62", "#ff004d", "#29adff", "#ff77a8", "#ffec27"];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 1.4 + "s";
    p.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    host.appendChild(p);
  }
}

// first login after an email-confirm signup → celebrate too
function maybeWelcomeBack(profile) {
  if (!profile || !profile.created_at) return;
  let seen = null;
  try { seen = sessionStorage.getItem("ccltce-congrats"); } catch {}
  if (seen) return;
  const age = Date.now() - new Date(profile.created_at).getTime();
  if (age >= 0 && age < 15 * 60 * 1000) showCongrats(profile.full_name);
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
  const px = parsePixelMatrix(profile && profile.pixel_art);
  if (px) return pixelMatrixToSvg(px, size === "nav" ? 40 : size || 128);
  const seed = (profile && (profile.id || profile.email)) || "guest";
  return size === "nav" ? navFace(seed) : minecraftFace(seed, size || 80);
}
export { avatarSrc };

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
      '<span class="auth-menu-badges">' +
      '<span class="role-badge ' + roleCls + '">' + role + "</span>" +
      '<span class="lv-chip" data-level-chip title="' + (Number(profile.xp) || 0) + ' XP">Lv ' + levelOf(profile.xp) + " · " + rankOf(profile.xp) + "</span>" +
      "</span>" +
      "</div></div>" +
      '<div class="auth-menu-sep" role="separator"></div>' +
      '<a class="auth-menu-item" href="dashboard.html" role="menuitem">Dashboard</a>' +
      '<a class="auth-menu-item" href="dashboard.html#profile" role="menuitem">Profile &amp; avatar</a>' +
      (profile.role === "student" ? '<a class="auth-menu-item" href="dashboard.html#teams" role="menuitem">My teams</a>' : "") +
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
  _sessionUser = profile;
  updateNavAuth(profile);
  if (profile) {
    syncHudToProfile(profile);
    pushLocalXpToDb(profile);
    paintLevelChips();
  }
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
      showCongrats(full_name);
      setTimeout(() => {
        if (!document.querySelector(".welcome-overlay")) window.location.href = "dashboard.html";
      }, 12000);
    } else {
      showBanner("Almost there — check your email to confirm your account, then log in.", "ok");
      setTimeout(() => { window.location.href = "login.html"; }, 2200);
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ── dashboard tabs ──
function wireTabs(root) {
  const tabs = root.querySelectorAll("[data-tab]");
  const panels = root.querySelectorAll("[data-panel]");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      tabs.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
      panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === id));
      history.replaceState(null, "", "#" + id);
    });
  });
}

// ── dashboard stats ──
async function loadStats(profile, isStaff) {
  const set = (id, v) => { const el = $("#" + id); if (el) el.textContent = v; };
  const [teams, regs, events, users] = await Promise.all([
    supabase.from("teams").select("id", { count: "exact", head: true }).eq("leader_id", profile.id),
    supabase.from("registrations").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    isStaff ? supabase.from("profiles").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
  ]);
  set("stat-teams", teams.count != null ? teams.count : "–");
  set("stat-regs", regs.count != null ? regs.count : "–");
  set("stat-events", events.count != null ? events.count : "–");
  if (isStaff) set("stat-users", users.count != null ? users.count : "–");
}

// ── feedback form (event suggestions, stored with user identity) ──
function wireFeedback(profile, root) {
  const fb = $("#feedback-form", root);
  if (!fb) return;
  // related-event dropdown
  const evSel = $("#fb-event", fb);
  supabase.from("events").select("id, title").order("created_at").then(({ data }) => {
    if (evSel && data && data.length) {
      evSel.innerHTML =
        '<option value="">— none / general —</option>' +
        data.map((ev) => '<option value="' + escapeHtml(ev.id) + '">' + escapeHtml(ev.title) + "</option>").join("");
    }
  });
  fb.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = $("#feedback-error", fb);
    const msg = $("#fb-msg", fb).value.trim();
    if (!msg) return;
    const event_id = evSel && evSel.value ? evSel.value : null;
    const kind = $("#fb-kind", fb).value;
    const insert = { user_id: profile.id, message: msg, event_id, category: "event" };
    let { error } = await supabase.from("feedback").insert(insert);
    if (error && /column|schema/i.test(error.message || "")) {
      // migration not run yet — fall back to base columns so feedback still lands
      ({ error } = await supabase.from("feedback").insert({ user_id: profile.id, message: "[" + kind + "] " + msg }));
    }
    if (error) {
      errEl.textContent = errText(error);
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    fb.reset();
    showBanner("Suggestion recorded as " + (profile.full_name || "you") + " — thanks!", "ok");
    awardXp(15, "event suggestion");
  });
}

// ── team form ──
function wireTeamForm(profile, root) {
  const teamForm = $("#team-form", root);
  if (!teamForm) return;
  const sel = $("#team-event", teamForm);
  supabase.from("events").select("id, title").order("created_at").then(({ data }) => {
    sel.innerHTML = (data || []).map((ev) => '<option value="' + escapeHtml(ev.id) + '">' + escapeHtml(ev.title) + "</option>").join("") || '<option value="">No events yet</option>';
  });
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
    loadStats(profile, false);
    awardXp(20, "team created");
  });
  loadMyTeams(profile);
}

async function wireAvatar(profile, root) {
  const openBtn = $("#pixel-open", root);
  const resetBtn = $("#avatar-reset", root);
  const errEl = $("#avatar-error", root);
  if (!openBtn) return;

  const heroFace = root.querySelector(".dash-hero-face");

  openBtn.addEventListener("click", () => {
    const initial = parsePixelMatrix(profile.pixel_art) ||
      faceMatrix16(profile.id || profile.email);
    openPixelEditor(initial, async (matrix) => {
      const json = JSON.stringify(matrix);
      const { error } = await supabase.from("profiles").update({ pixel_art: json }).eq("id", profile.id);
      if (error) {
        errEl.textContent = errText(error);
        errEl.hidden = false;
        return;
      }
      profile.pixel_art = json;
      profile.avatar_url = null;
      if (heroFace) heroFace.src = pixelMatrixToSvg(matrix, 128);
      showBanner("Pixel avatar saved!", "ok");
      refreshNav();
      awardXp(10, "pixel avatar crafted");
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const { error } = await supabase.from("profiles").update({ avatar_url: null, pixel_art: null }).eq("id", profile.id);
      if (error) {
        errEl.textContent = errText(error);
        errEl.hidden = false;
        return;
      }
      profile.avatar_url = null;
      profile.pixel_art = null;
      if (heroFace) heroFace.src = minecraftFace(profile.id || profile.email, 128);
      showBanner("Reset to default Minecraft face.", "ok");
      refreshNav();
    });
  }
}

function wirePublicProfile(profile, root) {
  const form = $("#public-profile-form", root);
  if (!form || !supabase) return;
  wireLinkEditor(root);

  const previewBtn = $("#open-full-profile", root);
  if (previewBtn) {
    previewBtn.addEventListener("click", () => openProfileModal(profile, profile));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = $("#pp-error", form);
    errEl.hidden = true;
    const full_name = $("#pp-name", form).value.trim();
    const email = $("#pp-email", form).value.trim();
    const bio = $("#pp-bio", form).value.trim();
    const links = collectLinks(root);
    if (!full_name) { errEl.textContent = "Display name is required."; errEl.hidden = false; return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = "Enter a valid email.";
      errEl.hidden = false;
      return;
    }
    const patch = { full_name, bio: bio || null, links };
    if (email) patch.email = email;
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (error) {
      errEl.textContent = errText(error);
      errEl.hidden = false;
      return;
    }
    Object.assign(profile, patch);
    const heroName = root.querySelector(".dash-hero-name");
    const heroEmail = root.querySelector(".dash-hero-email");
    if (heroName) heroName.textContent = full_name;
    if (heroEmail && email) heroEmail.textContent = email;
    refreshNav();
    showBanner("Public profile saved!", "ok");
    awardXp(10, "profile completed");
  });
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
  const face = avatarSrc(profile, 128);
  const name = profile.full_name || (profile.email || "Member").split("@")[0];
  const memberSince = (profile.created_at || "").slice(0, 10);
  const isStaff = role === "admin" || role === "coding_club_member";

  let html =
    // ── hero card ──
    '<div class="dash-hero" id="profile">' +
    '<div class="dash-hero-glow" aria-hidden="true"></div>' +
    '<img class="dash-hero-face" src="' + face + '" alt="" width="112" height="112" />' +
    '<div class="dash-hero-info">' +
    '<h2 class="dash-hero-name">' + escapeHtml(name) + "</h2>" +
    '<p class="dash-hero-email">' + escapeHtml(profile.email || "") + "</p>" +
    '<div class="dash-hero-tags">' +
    '<span class="role-badge ' + roleCls + '">' + (ROLE_LABEL[role] || role) + "</span>" +
    '<span class="lv-chip" data-level-chip title="' + (Number(profile.xp) || 0) + ' XP">Lv ' + levelOf(profile.xp) + " · " + rankOf(profile.xp) + "</span>" +
    '<span class="dash-since">Joined ' + escapeHtml(memberSince) + "</span>" +
    "</div></div>" +
    '<div class="dash-hero-actions">' +
    '<a class="btn" href="events.html">Events</a>' +
    '<button class="btn" type="button" data-logout-dash>Log out</button>' +
    "</div>" +
    "</div>";

  // ── quick stats row ──
  html +=
    '<div class="dash-stats">' +
    '<div class="dash-stat"><span class="dash-stat-val" id="stat-teams">–</span><span class="dash-stat-lbl">My teams</span></div>' +
    '<div class="dash-stat"><span class="dash-stat-val" id="stat-regs">–</span><span class="dash-stat-lbl">Registrations</span></div>' +
    '<div class="dash-stat"><span class="dash-stat-val" id="stat-events">–</span><span class="dash-stat-lbl">Events</span></div>' +
    (isStaff
      ? '<div class="dash-stat dash-stat-staff"><span class="dash-stat-val" id="stat-users">–</span><span class="dash-stat-lbl">Total users</span></div>'
      : "") +
    "</div>";

  // ── tab nav ──
  const tabs = [
    ["avatar", "Profile"],
    ["public-profile", "Public profile"],
    ["members", "Members"],
    role === "student" ? ["teams", "Teams"] : null,
    ["feedback", "Feedback"],
  ].filter(Boolean);

  html += '<div class="dash-tabs" role="tablist">' +
    tabs.map(([id, label], i) =>
      '<button class="dash-tab' + (i === 0 ? " active" : "") + '" role="tab" data-tab="' + id + '" aria-selected="' + (i === 0) + '">' + label + "</button>"
    ).join("") +
    "</div>";

  // ── tab panels ──

  // Profile & avatar
  html +=
    '<section class="auth-card dash-panel active" data-panel="avatar" role="tabpanel">' +
    "<h3>Edit your avatar</h3>" +
    '<p class="dash-note">Draw a 16×16 pixel face with any color. Saved to your profile — shows in the nav and everywhere.</p>' +
    '<div class="avatar-row">' +
    '<div class="avatar-controls">' +
    '<button class="btn btn-primary" type="button" id="pixel-open">Open pixel editor</button>' +
    '<button class="btn" type="button" id="avatar-reset">Use default face</button>' +
    "</div></div>" +
    '<p class="form-error" id="avatar-error" hidden></p>' +
    '<dl class="dash-meta"><dt>Role</dt><dd>' + escapeHtml(ROLE_LABEL[role] || role) + "</dd>" +
    "<dt>Email</dt><dd>" + escapeHtml(profile.email || "") + "</dd>" +
    "<dt>Member since</dt><dd>" + escapeHtml(memberSince) + "</dd></dl>" +
    "</section>";

  // Public profile (name, bio, links)
  const dashLinks = normLinks(profile.links);
  html +=
    '<section class="auth-card dash-panel" data-panel="public-profile" role="tabpanel" id="public-profile">' +
    "<h3>Public profile</h3>" +
    '<p class="dash-note">What teammates see when they open your card — name, bio and links (Instagram, LinkedIn, LeetCode…).</p>' +
    '<button class="btn" type="button" id="open-full-profile">Preview my profile</button>' +
    '<form id="public-profile-form" class="auth-form" style="margin-top:1rem">' +
    '<label for="pp-name">Display name</label>' +
    '<input id="pp-name" type="text" maxlength="80" value="' + escapeHtml(profile.full_name || "") + '" />' +
    '<label for="pp-email">Email</label>' +
    '<input id="pp-email" type="email" maxlength="200" value="' + escapeHtml(profile.email || "") + '" />' +
    '<label for="pp-bio">Bio</label>' +
    '<textarea id="pp-bio" rows="3" maxlength="500" placeholder="One or two lines about you…">' + escapeHtml(profile.bio || "") + "</textarea>" +
    "<label>Links</label>" +
    renderLinkEditor(dashLinks) +
    '<p class="form-error" id="pp-error" hidden></p>' +
    '<button class="btn btn-primary" type="submit">Save public profile</button>' +
    "</form></section>";

  // Members directory (everyone can view)
  html +=
    '<section class="auth-card dash-panel" data-panel="members" role="tabpanel" id="members">' +
    "<h3>Club members</h3>" +
    '<p class="dash-note">Core team &amp; club members. Click anyone to view their profile.</p>' +
    '<div id="members-grid" class="members-grid" aria-live="polite"><p class="dash-empty">Loading…</p></div>' +
    "</section>";

  // Teams (students)
  if (role === "student") {
    html +=
      '<section class="auth-card dash-panel" data-panel="teams" role="tabpanel" id="teams">' +
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
      '<div class="dash-subhead"><h4>My teams</h4></div>' +
      '<div id="my-teams" class="dash-list" aria-live="polite"></div>' +
      "</section>";
  }

  // Feedback & GitHub (always last)
  html +=
    '<section class="auth-card dash-panel" data-panel="feedback" role="tabpanel" id="feedback">' +
    "<h3>Feedback</h3>" +
    '<p class="dash-note">Bugs &amp; feature requests go to GitHub — event suggestions stay here, stored with your name (not anonymous).</p>' +
    '<div class="fb-github">' +
    '<a class="btn btn-primary" target="_blank" rel="noopener" href="https://github.com/SachinyadavAug20/ccltce-site/issues/new?labels=bug&title=%5BBug%5D%20">Report a bug</a>' +
    '<a class="btn btn-primary" target="_blank" rel="noopener" href="https://github.com/SachinyadavAug20/ccltce-site/issues/new?labels=enhancement&title=%5BFeature%5D%20">Request a feature</a>' +
    '<a class="btn" target="_blank" rel="noopener" href="https://github.com/SachinyadavAug20/ccltce-site/issues">All issues</a>' +
    "</div>" +
    '<div class="dash-subhead"><h4>Event suggestions</h4></div>' +
    '<p class="dash-note">Submitting as <b>' + escapeHtml(profile.full_name || profile.email || "you") + "</b> — organizers see who sent it.</p>" +
    '<form id="feedback-form" class="auth-form">' +
    '<label for="fb-kind">Type</label>' +
    '<select id="fb-kind"><option value="idea">Event idea</option><option value="improvement">Improvement suggestion</option><option value="other">Other (event-related)</option></select>' +
    '<label for="fb-event">Related event (optional)</label>' +
    '<select id="fb-event"><option value="">— none / general —</option></select>' +
    '<label for="fb-msg">Message</label>' +
    '<textarea id="fb-msg" rows="5" required maxlength="2000" placeholder="What event should we run next? What should improve?"></textarea>' +
    '<p class="form-error" id="feedback-error" hidden></p>' +
    '<button class="btn btn-primary" type="submit">Submit suggestion</button>' +
    "</form></section>";

  root.innerHTML = html;

  // ── wire tabs ──
  wireTabs(root);

  // ── wire logout ──
  const outBtn = root.querySelector("[data-logout-dash]");
  if (outBtn) outBtn.addEventListener("click", () => signOut());

  // ── avatar ──
  wireAvatar(profile, root);
  wirePublicProfile(profile, root);

  // ── stats + data ──
  loadStats(profile, isStaff);
  wireFeedback(profile, root);

  if (role === "student") wireTeamForm(profile, root);
  loadMembers();

  // deep-link support (#teams, #profile, #feedback)
  const hash = (location.hash || "").replace("#", "");
  if (hash) {
    const btn = root.querySelector('[data-tab="' + hash + '"]');
    if (btn) btn.click();
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

// ── Members directory (public profiles) ──
async function loadMembers() {
  const grid = $("#members-grid");
  if (!grid || !supabase) return;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["coding_club_member", "admin"])
    .order("created_at");
  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="dash-empty">' + (error ? "No access." : "No club members yet.") + "</p>";
    return;
  }
  grid.innerHTML = data
    .map((u) => {
      const roleCls = u.role === "admin" ? "role-admin" : "role-club";
      return (
        '<button class="member-card" type="button" data-member-id="' + escapeHtml(u.id) + '">' +
        '<img class="member-face" src="' + avatarSrc(u, 80) + '" alt="" width="64" height="64" />' +
        '<span class="member-name">' + escapeHtml(u.full_name || u.email) + "</span>" +
        '<span class="role-badge ' + roleCls + '">' + (ROLE_LABEL[u.role] || u.role) + "</span>" +
        "</button>"
      );
    })
    .join("");

  grid.querySelectorAll("[data-member-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const u = data.find((x) => x.id === btn.dataset.memberId);
      if (u) openProfileModal(u);
    });
  });
}

// ── link presets (label → base URL builder; empty base = paste full URL) ──
const LINK_PRESETS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "linkedin",  label: "LinkedIn",  placeholder: "https://linkedin.com/in/username" },
  { key: "x",         label: "X / Twitter", placeholder: "https://x.com/username" },
  { key: "discord",   label: "Discord",   placeholder: "discord.gg/invite or username" },
  { key: "leetcode",  label: "LeetCode",  placeholder: "https://leetcode.com/username" },
  { key: "codeforces",label: "Codeforces",placeholder: "https://codeforces.com/profile/username" },
  { key: "gfg",       label: "GeeksforGeeks", placeholder: "https://geeksforgeeks.org/user/username" },
  { key: "github",    label: "GitHub",    placeholder: "https://github.com/username" },
  { key: "youtube",   label: "YouTube",   placeholder: "https://youtube.com/@username" },
  { key: "website",   label: "Website",   placeholder: "https://yoursite.com" },
  { key: "email",     label: "Email",     placeholder: "you@example.com" },
  { key: "custom",    label: "Custom…",   placeholder: "Label + full URL" },
];

function normLinks(raw) {
  if (!raw) return [];
  let v = raw;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (!Array.isArray(v)) return [];
  return v
    .filter((l) => l && (l.url || l.handle) && l.label)
    .map((l) => ({ label: String(l.label).slice(0, 40), url: String(l.url || l.handle).trim().slice(0, 300) }))
    .slice(0, 24);
}

function linkChipHtml(l) {
  const safe = escapeHtml(l.url);
  const isMail = /^mailto:/i.test(l.url) || (!/^https?:\/\//i.test(l.url) && l.url.includes("@") && !l.url.includes(" "));
  const href = isMail && !/^mailto:/i.test(l.url) ? "mailto:" + safe : safe;
  const external = /^https?:\/\//i.test(href);
  return (
    '<a class="pf-chip" href="' + href + '"' +
    (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
    ' title="' + escapeHtml(l.url) + '">' +
    '<span class="pf-chip-label">' + escapeHtml(l.label) + "</span>" +
    "</a>"
  );
}

function renderLinkEditor(links) {
  const rows = links.map((l, i) => linkRowHtml(l.label, l.url, i)).join("");
  return (
    '<div class="pf-links-ed" id="pf-links">' +
    (rows || "") +
    "</div>" +
    '<div class="pf-link-add">' +
    '<select id="pf-link-preset" aria-label="Link type">' +
    LINK_PRESETS.map((p) => '<option value="' + p.key + '">' + escapeHtml(p.label) + "</option>").join("") +
    "</select>" +
    '<input id="pf-link-custom-label" type="text" maxlength="40" placeholder="Custom label" hidden />' +
    '<input id="pf-link-url" type="text" maxlength="300" placeholder="' + escapeHtml(LINK_PRESETS[0].placeholder) + '" />' +
    '<button class="btn" type="button" id="pf-link-add">Add link</button>' +
    "</div>"
  );
}

function linkRowHtml(label, url, i) {
  return (
    '<div class="pf-link-row" data-i="' + i + '">' +
    '<input class="pf-link-label" type="text" maxlength="40" value="' + escapeHtml(label || "") + '" placeholder="Label" />' +
    '<input class="pf-link-url" type="text" maxlength="300" value="' + escapeHtml(url || "") + '" placeholder="https://…" />' +
    '<button class="pf-link-rm" type="button" aria-label="Remove link">✕</button>' +
    "</div>"
  );
}

function collectLinks(root) {
  const rows = $$("#pf-links .pf-link-row", root);
  const out = [];
  rows.forEach((row) => {
    const label = $(".pf-link-label", row).value.trim();
    const url = $(".pf-link-url", row).value.trim();
    if (label && url) out.push({ label: label.slice(0, 40), url: url.slice(0, 300) });
  });
  return out.slice(0, 24);
}

function wireLinkEditor(root) {
  const preset = $("#pf-link-preset", root);
  const customLbl = $("#pf-link-custom-label", root);
  const urlIn = $("#pf-link-url", root);
  const addBtn = $("#pf-link-add", root);
  const box = $("#pf-links", root);
  if (!preset || !addBtn) return;

  const syncPreset = () => {
    const p = LINK_PRESETS.find((x) => x.key === preset.value);
    const isCustom = preset.value === "custom";
    if (customLbl) customLbl.hidden = !isCustom;
    if (urlIn && p) urlIn.placeholder = p.placeholder;
  };
  preset.addEventListener("change", syncPreset);
  syncPreset();

  addBtn.addEventListener("click", () => {
    let label = preset.options[preset.selectedIndex].text;
    if (preset.value === "custom") label = (customLbl && customLbl.value.trim()) || "";
    const url = urlIn.value.trim();
    if (!label || !url) { showBanner("Add a label and URL for the link.", "warn"); return; }
    const i = box.children.length;
    box.insertAdjacentHTML("beforeend", linkRowHtml(label, url, i));
    urlIn.value = "";
    if (customLbl) customLbl.value = "";
  });

  box.addEventListener("click", (e) => {
    const rm = e.target.closest(".pf-link-rm");
    if (rm) rm.closest(".pf-link-row").remove();
  });
}

export async function openProfileModal(u, me) {
  if (!u) return;
  const who = me || _sessionUser;
  const isSelf = Boolean(who && u.id && who.id === u.id);
  const roleCls = u.role === "admin" ? "role-admin" : u.role === "coding_club_member" ? "role-club" : "role-student";
  const links = normLinks(u.links);
  const bio = u.bio || "";
  const name = u.full_name || (u.email || "Member").split("@")[0];
  const memberSince = (u.created_at || "").slice(0, 10);

  const overlay = document.createElement("div");
  overlay.className = "pe-overlay";
  overlay.innerHTML =
    '<div class="pe-modal profile-modal" role="dialog" aria-modal="true" aria-label="Profile">' +
    '<div class="pe-head"><h3>' + (isSelf ? "Your profile" : "Profile") + "</h3>" +
    '<button class="pe-close" type="button" aria-label="Close">✕</button></div>' +
    '<div class="profile-body">' +
    '<img class="profile-face" src="' + avatarSrc(u, 128) + '" alt="" width="112" height="112" />' +
    '<h2 class="profile-name">' + escapeHtml(name) + "</h2>" +
    '<span class="role-badge ' + roleCls + '">' + (ROLE_LABEL[u.role] || u.role) + "</span>" +
    (bio ? '<p class="pf-bio">' + escapeHtml(bio) + "</p>" : isSelf ? '<p class="pf-bio pf-bio-empty">No bio yet — add one so teammates know you.</p>' : "") +
    (links.length
      ? '<div class="pf-chips">' + links.map(linkChipHtml).join("") + "</div>"
      : isSelf
        ? '<div class="pf-chips pf-chips-empty"><span class="pf-muted">No links yet — Instagram, LinkedIn, LeetCode…</span></div>'
        : "") +
    '<dl class="dash-meta pf-meta">' +
    "<dt>Email</dt><dd>" + escapeHtml(u.email || "—") + "</dd>" +
    "<dt>Member since</dt><dd>" + escapeHtml(memberSince) + "</dd>" +
    "</dl>" +
    (isSelf
      ? '<div class="pf-actions">' +
        '<button class="btn btn-primary" type="button" id="pf-edit-toggle">Edit profile</button>' +
        '<a class="btn" href="dashboard.html#profile">Pixel avatar</a>' +
        "</div>" +
        '<form class="auth-form pf-edit" id="pf-edit" hidden>' +
        '<label for="pf-name">Display name</label>' +
        '<input id="pf-name" type="text" maxlength="80" value="' + escapeHtml(u.full_name || "") + '" />' +
        '<label for="pf-email">Email</label>' +
        '<input id="pf-email" type="email" maxlength="200" value="' + escapeHtml(u.email || "") + '" />' +
        '<label for="pf-bio-in">Bio</label>' +
        '<textarea id="pf-bio-in" rows="3" maxlength="500" placeholder="One or two lines about you…">' + escapeHtml(bio) + "</textarea>" +
        "<label>Links</label>" +
        renderLinkEditor(links) +
        '<p class="form-error" id="pf-error" hidden></p>' +
        '<div class="pf-edit-actions">' +
        '<button class="btn btn-primary" type="submit">Save profile</button>' +
        '<button class="btn" type="button" id="pf-edit-cancel">Cancel</button>' +
        "</div></form>"
      : "") +
    "</div></div>";

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".pe-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });

  if (!isSelf || !supabase) return;

  const editBtn = overlay.querySelector("#pf-edit-toggle");
  const form = overlay.querySelector("#pf-edit");
  const cancel = overlay.querySelector("#pf-edit-cancel");
  const errEl = overlay.querySelector("#pf-error");

  wireLinkEditor(overlay);

  editBtn.addEventListener("click", () => {
    form.hidden = false;
    editBtn.hidden = true;
    overlay.querySelector("#pf-name").focus();
  });
  cancel.addEventListener("click", () => { form.hidden = true; editBtn.hidden = false; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const full_name = overlay.querySelector("#pf-name").value.trim();
    const email = overlay.querySelector("#pf-email").value.trim();
    const bioNew = overlay.querySelector("#pf-bio-in").value.trim();
    const linksNew = collectLinks(overlay);
    if (!full_name) { errEl.textContent = "Display name is required."; errEl.hidden = false; return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = "Enter a valid email or leave it blank.";
      errEl.hidden = false;
      return;
    }
    const patch = { full_name, bio: bioNew || null, links: linksNew };
    if (email) patch.email = email;
    const { error } = await supabase.from("profiles").update(patch).eq("id", u.id);
    if (error) {
      errEl.textContent = errText(error);
      errEl.hidden = false;
      return;
    }
    Object.assign(u, patch);
    if (who && who.id === u.id) {
      who.full_name = full_name;
      who.bio = bioNew || null;
      who.links = linksNew;
      if (email) who.email = email;
      refreshNav();
    }
    showBanner("Profile saved!", "ok");
    close();
    openProfileModal(u, who);
  });
}

// ── team page: live avatars + openable profiles ──
async function enhanceTeamPage() {
  if (!supabase) return;
  const onTeam = document.getElementById("team-tree") || document.querySelector(".grid.team");
  if (!onTeam) return;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["coding_club_member", "admin"]);
  if (!data || !data.length) return;

  const byName = new Map();
  data.forEach((p) => {
    if (p.full_name) byName.set(p.full_name.trim().toLowerCase(), p);
  });
  window.__CCLTCE_PROFILES_BY_NAME = byName;

  // replace static SVG faces with live pixel/seed faces
  const applyFaces = () => {
    document.querySelectorAll(".tree-node[data-name], .t-card[data-name]").forEach((el) => {
      const key = (el.dataset.name || "").trim().toLowerCase();
      const p = byName.get(key);
      if (!p) return;
      const img = el.querySelector(".tn-avatar img, .t-head img");
      if (img) {
        img.src = avatarSrc(p, 64);
        img.removeAttribute("srcset");
      }
      el.classList.add("has-live-profile");
      el.dataset.liveId = p.id;
    });
  };

  applyFaces();
  let tries = 0;
  const t = setInterval(() => {
    applyFaces();
    if (++tries > 20) clearInterval(t);
  }, 250);

  // capture-phase: open the rich live modal BEFORE teamFx's bubble handler
  const openLive = (el) => {
    const key = (el.dataset.name || "").trim().toLowerCase();
    const p = byName.get(key);
    if (!p) return false;
    openProfileModal(p, _sessionUser);
    return true;
  };
  if (!enhanceTeamPage._wired) {
    enhanceTeamPage._wired = true;
    document.addEventListener("click", (e) => {
      const node = e.target.closest(".tree-node[data-name], .t-card[data-name]");
      if (!node || e.target.closest("a, button.t-btn, .tf-btn")) return;
      if (openLive(node)) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const node = e.target.closest && e.target.closest(".tree-node[data-name], .t-card[data-name]");
      if (!node || e.target.closest("a")) return;
      if (openLive(node)) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }
}

window.CCLTCE_OPEN_PROFILE = openProfileModal;

// ── global chat notify: toast whenever ANY message drops in ANY channel ──
let _chatNotifyWired = false;
const _chanNameCache = new Map();
const _userNameCache = new Map();
async function chatNotifyLabel(table, id) {
  const cache = table === "channels" ? _chanNameCache : _userNameCache;
  if (cache.has(id)) return cache.get(id);
  const col = table === "channels" ? "name" : "full_name,email";
  const { data } = await supabase.from(table).select(col).eq("id", id).single();
  const label = table === "channels"
    ? "#" + ((data && data.name) || "chat").toLowerCase()
    : ((data && (data.full_name || data.email)) || "Someone");
  cache.set(id, label);
  return label;
}
function wireChatNotify() {
  if (!supabase || _chatNotifyWired) return;
  _chatNotifyWired = true;
  supabase
    .channel("global-chat-notify")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      async (payload) => {
        const m = payload.new;
        if (!m || !m.body) return;
        if (_sessionUser && m.user_id === _sessionUser.id) return;
        try {
          const [who, ch] = await Promise.all([
            chatNotifyLabel("profiles", m.user_id),
            chatNotifyLabel("channels", m.channel_id),
          ]);
          const snippet = String(m.body).length > 70 ? String(m.body).slice(0, 70) + "…" : m.body;
          showBanner("💬 " + who + " in " + ch + ": " + snippet, "chat");
          const b = $(".auth-banner[data-kind=chat]");
          if (b && !b.dataset.wired) {
            b.dataset.wired = "1";
            b.title = "Click to open chats";
            b.addEventListener("click", () => { location.href = "community.html#inbox"; });
          }
        } catch {
          showBanner("💬 New message in chat", "chat");
        }
      }
    )
    .subscribe();
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
  wireChatNotify();
  if ($("#dashboard-root")) await initDashboard(profile);
  maybeWelcomeBack(profile);
  enhanceTeamPage();

  supabase.auth.onAuthStateChange(async () => {
    const p = await refreshNav();
    if ($("#dashboard-root")) await initDashboard(p);
  });
}

init();
