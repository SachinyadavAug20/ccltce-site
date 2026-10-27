// Community — directory, DMs and pre-event team-ups.
// ES module; depends on auth.js (loaded by chrome.js) exports.
import { supabase, getProfile, openProfileModal, avatarSrc } from "./auth.js";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const ROLE_LABEL = { student: "Student", coding_club_member: "Club Member", admin: "Admin" };

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function flash(msg, kind) {
  let el = $(".comm-flash");
  if (!el) {
    el = document.createElement("div");
    el.className = "auth-banner comm-flash";
    el.setAttribute("role", "status");
    const main = $("main") || document.body;
    main.prepend(el);
  }
  el.textContent = msg;
  el.dataset.kind = kind || "info";
  el.hidden = false;
  clearTimeout(flash._t);
  flash._t = setTimeout(() => { el.hidden = true; }, 5000);
}

let me = null;
let members = [];
let allEvents = [];
let activeThread = null; // other user's profile

// ── tabs ──
function wireTabs() {
  const tabs = $$("#comm-tabs [data-ctab]");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.ctab;
      tabs.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
      $$(".comm-panel").forEach((p) => p.classList.toggle("active", p.dataset.cpanel === id));
      history.replaceState(null, "", "#" + id);
      if (id === "inbox" && me) loadInbox();
      if (id === "teams" && me) loadTeamUps();
    });
  });
}

// ── directory ──
async function loadDirectory() {
  const grid = $("#comm-grid");
  if (!grid || !supabase) return;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="dash-empty">' + (error ? "Directory unavailable — run supabase/migration-community.sql." : "No accounts yet.") + "</p>";
    return;
  }
  members = data;
  renderDirectory(members);

  const search = $("#comm-search");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      if (!q) return renderDirectory(members);
      renderDirectory(members.filter((u) => {
        const hay = [u.full_name, u.email, u.role, u.bio].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      }));
    });
  }
}

function renderDirectory(list) {
  const grid = $("#comm-grid");
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = '<p class="dash-empty">No matches.</p>';
    return;
  }
  grid.innerHTML = list
    .map((u) => {
      const roleCls = u.role === "admin" ? "role-admin" : u.role === "coding_club_member" ? "role-club" : "role-student";
      const isSelf = me && u.id === me.id;
      return (
        '<div class="member-card" data-id="' + esc(u.id) + '" role="button" tabindex="0">' +
        '<img class="member-face" src="' + esc(avatarSrc(u, 80)) + '" alt="" width="64" height="64" />' +
        '<span class="member-name">' + esc(u.full_name || u.email || "Member") + "</span>" +
        '<span class="role-badge ' + roleCls + '">' + esc(ROLE_LABEL[u.role] || u.role) + "</span>" +
        (u.bio ? '<span class="comm-bio-hint">' + esc(String(u.bio).slice(0, 60)) + (String(u.bio).length > 60 ? "…" : "") + "</span>" : "") +
        '<div class="comm-card-actions">' +
        '<button class="btn" type="button" data-act="view">Profile</button>' +
        (isSelf
          ? ""
          : '<button class="btn" type="button" data-act="msg">Message</button>' +
            '<button class="btn btn-primary" type="button" data-act="teamup">Team up</button>') +
        "</div></div>"
      );
    })
    .join("");

  grid.querySelectorAll(".member-card").forEach((card) => {
    const u = members.find((x) => x.id === card.dataset.id);
    if (!u) return;
    card.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-act]");
      if (act) {
        e.stopPropagation();
        const a = act.dataset.act;
        if (a === "view") return openProfileModal(u, me);
        if (a === "msg") {
          if (!me) { flash("Log in to send messages.", "warn"); return location.href = "login.html"; }
          await openThread(u);
          switchTab("inbox");
          return;
        }
        if (a === "teamup") {
          if (!me) { flash("Log in to send team-up invites.", "warn"); return location.href = "login.html"; }
          return openInviteModal(u);
        }
      }
      openProfileModal(u, me);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProfileModal(u, me);
      }
    });
  });
}

function switchTab(id) {
  const btn = $('#comm-tabs [data-ctab="' + id + '"]');
  if (btn) btn.click();
}

// ── inbox / DMs ──
async function loadInbox() {
  const guard = $("#comm-inbox-guard");
  const box = $("#comm-inbox");
  if (!me) {
    if (guard) guard.hidden = false;
    if (box) box.hidden = true;
    return;
  }
  if (guard) guard.hidden = true;
  if (box) box.hidden = false;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`from_id.eq.${me.id},to_id.eq.${me.id}`)
    .order("created_at", { ascending: true });
  if (error) {
    $("#inbox-list").innerHTML = '<p class="dash-empty">Run supabase/migration-community.sql first.</p>';
    return;
  }
  renderInboxList(data || []);
  if (activeThread) renderThread(data || [], activeThread);
}

function renderInboxList(messages) {
  const list = $("#inbox-list");
  if (!list) return;
  const byPartner = new Map();
  messages.forEach((m) => {
    const pid = m.from_id === me.id ? m.to_id : m.from_id;
    const prev = byPartner.get(pid);
    if (!prev || m.created_at > prev.created_at) byPartner.set(pid, m);
  });
  if (!byPartner.size) {
    list.innerHTML = '<p class="dash-empty">No messages yet — say hi from the directory.</p>';
    return;
  }
  const parts = [];
  byPartner.forEach((last, pid) => {
    const u = members.find((x) => x.id === pid);
    const name = u ? (u.full_name || u.email) : "Member";
    const unread = last.from_id !== me.id && !last.read_at;
    parts.push(
      '<button class="inbox-item' + (unread ? " inbox-item-unread" : "") +
      (activeThread && activeThread.id === pid ? " active" : "") +
      '" type="button" data-pid="' + esc(pid) + '">' +
      '<img src="' + esc(avatarSrc(u || { id: pid }, 32)) + '" alt="" width="32" height="32" />' +
      '<span class="inbox-item-meta">' +
      '<span class="inbox-item-name">' + esc(name) + "</span>" +
      '<span class="inbox-item-sub">' + esc(String(last.body || "").slice(0, 42)) + "</span>" +
      "</span></button>"
    );
  });
  list.innerHTML = parts.join("");
  list.querySelectorAll("[data-pid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const u = members.find((x) => x.id === btn.dataset.pid) || { id: btn.dataset.pid, full_name: "Member" };
      await openThread(u);
    });
  });
}

async function openThread(u) {
  activeThread = u;
  const title = $("#thread-title");
  const body = $("#thread-body");
  const form = $("#thread-form");
  if (title) title.textContent = u.full_name || u.email || "Conversation";
  if (form) form.hidden = false;
  await loadInbox();
}

function renderThread(messages, other) {
  const body = $("#thread-body");
  if (!body) return;
  const thread = messages
    .filter((m) =>
      (m.from_id === me.id && m.to_id === other.id) ||
      (m.from_id === other.id && m.to_id === me.id)
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (!thread.length) {
    body.innerHTML = '<p class="dash-empty">No messages yet — break the ice.</p>';
    return;
  }
  body.innerHTML = thread
    .map((m) => {
      const mine = m.from_id === me.id;
      const t = (m.created_at || "").slice(0, 16).replace("T", " ");
      return (
        '<div class="bubble ' + (mine ? "bubble-mine" : "bubble-theirs") + '">' +
        esc(m.body) + '<span class="bubble-time">' + esc(t) + "</span></div>"
      );
    })
    .join("");
  body.scrollTop = body.scrollHeight;

  // mark incoming as read
  const unreadIds = thread.filter((m) => m.from_id === other.id && !m.read_at).map((m) => m.id);
  if (unreadIds.length) {
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds).then(() => {});
  }
}

function wireThreadForm() {
  const form = $("#thread-form");
  if (!form || !supabase) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!me || !activeThread) return;
    const input = $("#thread-input");
    const body = input.value.trim();
    if (!body) return;
    const { error } = await supabase.from("messages").insert({
      from_id: me.id,
      to_id: activeThread.id,
      body: body.slice(0, 2000),
    });
    if (error) {
      flash("Send failed — is migration-community.sql running?", "err");
      return;
    }
    input.value = "";
    await loadInbox();
  });
}

// ── team-ups ──
async function loadTeamUps() {
  const guard = $("#comm-teams-guard");
  const box = $("#comm-teams");
  if (!me) {
    if (guard) guard.hidden = false;
    if (box) box.hidden = true;
    return;
  }
  if (guard) guard.hidden = true;
  if (box) box.hidden = false;

  const [{ data: invites, error }, { data: events }] = await Promise.all([
    supabase.from("team_invites").select("*").or(`from_id.eq.${me.id},to_id.eq.${me.id}`).order("created_at", { ascending: false }),
    supabase.from("events").select("id, title").order("created_at"),
  ]);
  if (error) {
    $("#invites-in").innerHTML = '<p class="dash-empty">Run supabase/migration-community.sql first.</p>';
    return;
  }
  allEvents = events || [];
  const incoming = (invites || []).filter((i) => i.to_id === me.id);
  const outgoing = (invites || []).filter((i) => i.from_id === me.id);
  const accepted = (invites || []).filter((i) => i.status === "accepted");

  renderInvites("#invites-in", incoming, true);
  renderInvites("#invites-out", outgoing, false);

  const squads = $("#squads-list");
  if (!accepted.length) {
    squads.innerHTML = '<p class="dash-empty">No accepted team-ups yet — send one from the directory.</p>';
  } else {
    squads.innerHTML = accepted
      .map((i) => {
        const otherId = i.from_id === me.id ? i.to_id : i.from_id;
        const u = members.find((x) => x.id === otherId);
        const ev = i.event_id ? (allEvents.find((e) => e.id === i.event_id) || {}).title : "General / future event";
        return (
          '<div class="dash-row"><b>' + esc(u ? (u.full_name || u.email) : "Member") + "</b>" +
          '<span class="dash-sub">' + esc(ev || "Future event") + (i.note ? " · " + esc(i.note) : "") + "</span></div>"
        );
      })
      .join("");
  }
}

function renderInvites(sel, list, isIncoming) {
  const box = $(sel);
  if (!box) return;
  if (!list.length) {
    box.innerHTML = '<p class="dash-empty">None yet.</p>';
    return;
  }
  box.innerHTML = list
    .map((i) => {
      const otherId = isIncoming ? i.from_id : i.to_id;
      const u = members.find((x) => x.id === otherId);
      const ev = i.event_id ? (allEvents.find((e) => e.id === i.event_id) || {}).title : "General / future event";
      const acts =
        isIncoming && i.status === "pending"
          ? '<div class="acts">' +
            '<button class="btn btn-primary" type="button" data-inv="' + esc(i.id) + '" data-st="accepted">Accept</button>' +
            '<button class="btn" type="button" data-inv="' + esc(i.id) + '" data-st="declined">Decline</button>' +
            "</div>"
          : '<span class="invite-status">' + esc(i.status) + "</span>";
      return (
        '<div class="invite-row">' +
        '<img src="' + esc(avatarSrc(u || { id: otherId }, 32)) + '" alt="" width="36" height="36" />' +
        "<div>" +
        '<div class="who">' + esc(u ? (u.full_name || u.email) : "Member") + "</div>" +
        '<div class="meta">' + esc(ev || "Future event") + (i.note ? " — " + esc(i.note) : "") + "</div>" +
        "</div>" + acts +
        "</div>"
      );
    })
    .join("");

  box.querySelectorAll("[data-inv][data-st]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: btn.dataset.st, responded_at: new Date().toISOString() })
        .eq("id", btn.dataset.inv);
      if (error) return flash("Update failed — run migration-community.sql.", "err");
      flash(btn.dataset.st === "accepted" ? "Team-up accepted!" : "Invite declined.", "ok");
      loadTeamUps();
    });
  });
}

async function openInviteModal(toUser) {
  if (!me) return;
  const evOpts =
    '<option value="">Future event (not announced yet)</option>' +
    allEvents.map((e) => '<option value="' + esc(e.id) + '">' + esc(e.title) + "</option>").join("");

  const overlay = document.createElement("div");
  overlay.className = "pe-overlay";
  overlay.innerHTML =
    '<div class="pe-modal profile-modal" role="dialog" aria-modal="true" aria-label="Team-up invite">' +
    '<div class="pe-head"><h3>Team up with ' + esc(toUser.full_name || "member") + "</h3>" +
    '<button class="pe-close" type="button" aria-label="Close">✕</button></div>' +
    '<div class="profile-body" style="text-align:left;align-items:stretch">' +
    '<p class="dash-note">Send an invite so you&rsquo;re paired before the next CCLTCE event opens registration.</p>' +
    '<form class="auth-form" id="invite-form">' +
    '<label for="inv-event">Event</label>' +
    '<select id="inv-event">' + evOpts + "</select>" +
    '<label for="inv-note">Note (optional)</label>' +
    '<textarea id="inv-note" rows="3" maxlength="500" placeholder="I\'m thinking a 4-person team for the hackathon…"></textarea>' +
    '<p class="form-error" id="inv-error" hidden></p>' +
    '<button class="btn btn-primary" type="submit">Send invite</button>' +
    "</form></div></div>";
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".pe-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  overlay.querySelector("#invite-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = overlay.querySelector("#inv-error");
    err.hidden = true;
    const event_id = overlay.querySelector("#inv-event").value || null;
    const note = overlay.querySelector("#inv-note").value.trim();
    const { error } = await supabase.from("team_invites").insert({
      from_id: me.id,
      to_id: toUser.id,
      event_id,
      note: note || null,
    });
    if (error) {
      const dup = String(error.message || "").includes("duplicate");
      err.textContent = dup ? "You already invited them for this." : "Send failed — run migration-community.sql.";
      err.hidden = false;
      return;
    }
    close();
    flash("Team-up invite sent to " + (toUser.full_name || "member") + "!", "ok");
    switchTab("teams");
    loadTeamUps();
  });
}

// poll inbox lightly when visible
setInterval(() => {
  if (!me || document.hidden) return;
  const inbox = $('[data-cpanel="inbox"]');
  if (inbox && inbox.classList.contains("active")) loadInbox();
}, 8000);

async function init() {
  if (!supabase) {
    $("#comm-grid").innerHTML = '<p class="dash-empty">Supabase not configured.</p>';
    return;
  }
  wireTabs();
  wireThreadForm();
  me = await getProfile();
  // pull events early for invite modal
  const { data: events } = await supabase.from("events").select("id, title").order("created_at");
  allEvents = events || [];
  await loadDirectory();

  const hash = (location.hash || "").replace("#", "");
  if (hash === "inbox" && me) switchTab("inbox");
  else if (hash === "teams" && me) switchTab("teams");
}

init();
