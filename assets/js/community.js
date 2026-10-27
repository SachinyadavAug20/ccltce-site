// Community — directory, open chat channels (text + links only) and pre-event team-ups.
// ES module; depends on auth.js (loaded by chrome.js) exports.
import { supabase, getProfile, openProfileModal, avatarSrc, awardXp, levelOf, rankOf } from "./auth.js";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const ROLE_LABEL = { student: "Student", coding_club_member: "Club Member", admin: "Admin" };

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// text + links only: escape everything, then turn bare URLs into anchors
function linkify(body) {
  const safe = esc(body);
  return safe.replace(/(https?:\/\/[^\s<>"']+)/g, (m) =>
    '<a href="' + m + '" target="_blank" rel="noopener noreferrer">' + m + "</a>"
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
let channels = [];
let activeChannel = null; // { id, slug, name, purpose }
let chanSub = null;
let chanSeen = {}; // slug -> ISO ts of last read

function loadSeen() {
  try { chanSeen = JSON.parse(localStorage.getItem("ccltce_chat_seen") || "{}"); } catch { chanSeen = {}; }
}
function markSeen(slug) {
  chanSeen[slug] = new Date().toISOString();
  try { localStorage.setItem("ccltce_chat_seen", JSON.stringify(chanSeen)); } catch {}
}

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
      if (id === "inbox" && me) loadChannelsPanel();
      if (id === "teams" && me) loadTeamUps();
      if (id === "board") loadBoard();
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
          : '<button class="btn btn-primary" type="button" data-act="teamup">Team up</button>') +
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
        if (act.dataset.act === "view") return openProfileModal(u, me);
        if (act.dataset.act === "teamup") {
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

// ── open chat channels ──
async function loadChannelsPanel() {
  const guard = $("#comm-inbox-guard");
  const box = $("#comm-inbox");
  if (!me) {
    if (guard) guard.hidden = false;
    if (box) box.hidden = true;
    return;
  }
  if (guard) guard.hidden = true;
  if (box) box.hidden = false;

  const [{ data: chans, error }, { data: recent }] = await Promise.all([
    supabase.from("channels").select("*").order("created_at"),
    supabase.from("messages").select("channel_id,created_at").order("created_at", { ascending: false }).limit(300),
  ]);
  if (error) {
    $("#inbox-list").innerHTML = '<p class="dash-empty">Run supabase/migration-community.sql first.</p>';
    return;
  }
  channels = chans || [];
  renderChannelList(recent || []);
  if (!activeChannel && channels.length) await openChannel(channels[0]);
  else if (activeChannel) loadMessages();
}

function renderChannelList(recent) {
  const list = $("#inbox-list");
  if (!list) return;
  if (!channels.length) {
    list.innerHTML = '<p class="dash-empty">No channels yet — run migration-community.sql.</p>';
    return;
  }
  const unread = {};
  recent.forEach((m) => {
    const c = channels.find((x) => x.id === m.channel_id);
    if (!c) return;
    const seenAt = chanSeen[c.slug];
    if (!seenAt || m.created_at > seenAt) unread[c.slug] = (unread[c.slug] || 0) + 1;
  });
  list.innerHTML = channels
    .map((c) => {
      const n = unread[c.slug] || 0;
      return (
        '<button class="inbox-item' + (activeChannel && activeChannel.id === c.id ? " active" : "") +
        '" type="button" data-ch="' + esc(c.id) + '">' +
        '<span class="chan-hash">#</span>' +
        '<span class="inbox-item-meta">' +
        '<span class="inbox-item-name">' + esc(c.name) + "</span>" +
        '<span class="inbox-item-sub">' + esc(c.purpose || "") + "</span>" +
        "</span>" +
        (n ? '<span class="chan-unread">' + (n > 99 ? "99+" : n) + "</span>" : "") +
        "</button>"
      );
    })
    .join("");
  list.querySelectorAll("[data-ch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = channels.find((x) => x.id === btn.dataset.ch);
      if (c) openChannel(c);
    });
  });
}

async function openChannel(c) {
  activeChannel = c;
  markSeen(c.slug);
  const title = $("#thread-title");
  const form = $("#thread-form");
  if (title) title.textContent = "# " + c.name;
  if (title && c.purpose) title.title = c.purpose;
  if (form) form.hidden = false;
  const body = $("#thread-body");
  if (body) body.innerHTML = '<p class="dash-empty">Loading…</p>';
  renderChannelList([]);
  await loadMessages();
  subscribeChannel();
}

async function loadMessages() {
  if (!activeChannel) return;
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", activeChannel.id)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    $("#thread-body").innerHTML = '<p class="dash-empty">Run supabase/migration-community.sql first.</p>';
    return;
  }
  renderThread(data || []);
}

function renderThread(msgs) {
  const body = $("#thread-body");
  if (!body) return;
  if (!msgs.length) {
    body.innerHTML = '<p class="dash-empty">No messages yet — break the ice. Text &amp; links only.</p>';
    return;
  }
  body.innerHTML = msgs
    .map((m) => {
      const u = members.find((x) => x.id === m.user_id);
      const mine = me && m.user_id === me.id;
      const who = u ? (u.full_name || u.email) : "Member";
      const t = (m.created_at || "").slice(0, 16).replace("T", " ");
      return (
        '<div class="chat-row' + (mine ? " chat-mine" : "") + '">' +
        '<img class="chat-face" src="' + esc(avatarSrc(u || { id: m.user_id }, 32)) + '" alt="" width="28" height="28" />' +
        '<div class="chat-msg">' +
        '<div class="chat-meta"><b>' + esc(who) + '</b><span class="chat-time">' + esc(t) + "</span></div>" +
        '<div class="chat-body">' + linkify(m.body) + "</div>" +
        "</div></div>"
      );
    })
    .join("");
  body.scrollTop = body.scrollHeight;
}

function subscribeChannel() {
  if (chanSub) { supabase.removeChannel(chanSub); chanSub = null; }
  if (!activeChannel) return;
  const chId = activeChannel.id;
  chanSub = supabase
    .channel("chat-" + chId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: "channel_id=eq." + chId },
      (payload) => {
        if (!activeChannel || activeChannel.id !== chId) return;
        markSeen(activeChannel.slug);
        loadMessages();
      }
    )
    .subscribe();
}

function wireThreadForm() {
  const form = $("#thread-form");
  if (!form || !supabase) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!me || !activeChannel) return;
    const input = $("#thread-input");
    let body = input.value.trim();
    if (!body) return;
    // text + links only — strip control chars and any raw HTML-looking markup
    body = body.replace(/[\u0000-\u0008\u000B-\u001F]/g, "");
    if (body.length > 2000) body = body.slice(0, 2000);
    const { error } = await supabase.from("messages").insert({
      channel_id: activeChannel.id,
      user_id: me.id,
      body,
    });
    if (error) {
      flash("Send failed — is migration-community.sql running?", "err");
      return;
    }
    input.value = "";
    markSeen(activeChannel.slug);
    await loadMessages();
    awardXp(5, "chat message");
  });
}

// ── leaderboard ──
async function loadBoard() {
  const list = $("#board-list");
  const self = $("#board-self");
  if (!list || !supabase) return;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, pixel_art, xp")
    .order("xp", { ascending: false })
    .order("created_at", { ascending: true });
  if (error || !data) {
    list.innerHTML = '<p class="dash-empty">Leaderboard unavailable — run supabase/migration-fun.sql.</p>';
    if (self) self.hidden = true;
    return;
  }
  const rows = data.slice(0, 100);
  if (!rows.length) {
    list.innerHTML = '<p class="dash-empty">No members yet.</p>';
    return;
  }

  // your standing card
  const myIdx = me ? rows.findIndex((u) => u.id === me.id) : -1;
  if (self) {
    if (myIdx >= 0) {
      const u = rows[myIdx];
      const xp = Number(u.xp) || 0;
      const into = xp % 100;
      self.innerHTML =
        '<span class="board-rank board-rank-you">#' + (myIdx + 1) + "</span>" +
        '<img src="' + esc(avatarSrc(u, 40)) + '" alt="" width="36" height="36" />' +
        '<span class="board-you-name">' + esc(u.full_name || "You") + "</span>" +
        '<span class="lv-chip">Lv ' + levelOf(xp) + " · " + rankOf(xp) + "</span>" +
        '<span class="board-xp">' + xp + " XP</span>" +
        '<span class="board-bar"><span style="width:' + into + '%"></span></span>';
      self.hidden = false;
    } else if (me) {
      self.innerHTML = '<span class="board-you-name">You&rsquo;re not ranked yet — send a chat to start climbing.</span>';
      self.hidden = false;
    } else {
      self.hidden = true;
    }
  }

  list.innerHTML = rows
    .map((u, i) => {
      const xp = Number(u.xp) || 0;
      const medal = i === 0 ? "g1" : i === 1 ? "g2" : i === 2 ? "g3" : "";
      const isMe = me && u.id === me.id;
      const roleCls = u.role === "admin" ? "role-admin" : u.role === "coding_club_member" ? "role-club" : "role-student";
      return (
        '<div class="board-row ' + medal + (isMe ? " board-me" : "") + '">' +
        '<span class="board-rank">' + (i + 1) + "</span>" +
        '<img class="board-face" src="' + esc(avatarSrc(u, 40)) + '" alt="" width="36" height="36" />' +
        '<span class="board-id">' +
        '<b>' + esc(u.full_name || u.email || "Member") + "</b>" +
        '<span class="role-badge ' + roleCls + '">' + esc(ROLE_LABEL[u.role] || u.role) + "</span>" +
        "</span>" +
        '<span class="lv-chip">Lv ' + levelOf(xp) + "</span>" +
        '<span class="board-title">' + esc(rankOf(xp)) + "</span>" +
        '<span class="board-xp">' + xp + " XP</span>" +
        "</div>"
      );
    })
    .join("");
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
      if (btn.dataset.st === "accepted") awardXp(25, "team-up accepted");
      else awardXp(5, "invite handled");
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
    awardXp(5, "team-up invite sent");
    switchTab("teams");
    loadTeamUps();
  });
}

// poll the open channel lightly when visible (realtime is primary)
setInterval(() => {
  if (!me || document.hidden || !activeChannel) return;
  const inbox = $('[data-cpanel="inbox"]');
  if (inbox && inbox.classList.contains("active")) loadMessages();
}, 10000);

async function init() {
  if (!supabase) {
    $("#comm-grid").innerHTML = '<p class="dash-empty">Supabase not configured.</p>';
    return;
  }
  loadSeen();
  wireTabs();
  wireThreadForm();
  me = await getProfile();
  const { data: events } = await supabase.from("events").select("id, title").order("created_at");
  allEvents = events || [];
  await loadDirectory();

  const hash = (location.hash || "").replace("#", "");
  if (hash === "inbox" && me) switchTab("inbox");
  else if (hash === "teams" && me) switchTab("teams");
  else if (hash === "board") switchTab("board");
  else loadBoard(); // default: warm the leaderboard so switching is instant
}

init();
