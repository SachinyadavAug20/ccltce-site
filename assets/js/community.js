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

function skelRows(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += '<div class="skel-row" aria-hidden="true"></div>';
  return s;
}

// ── Seed Data & Fallbacks ──
const SEED_MEMBERS = [
  {
    id: "seed-sachin",
    full_name: "Sachin Yadav",
    email: "sachin@ccltce.in",
    role: "president",
    bio: "CCLTCE President & Full-stack engineer. Building campus dev culture & organizing hackathons.",
    avatar_url: null,
    xp: 1420
  },
  {
    id: "seed-nitesh",
    full_name: "Nitesh Kumar",
    email: "nitesh@ccltce.in",
    role: "admin",
    bio: "Systems & DevOps admin. Docker, Linux kernels, cloud infra & distributed systems.",
    avatar_url: null,
    xp: 1180
  },
  {
    id: "seed-aakash",
    full_name: "Aakash Sharma",
    email: "aakash@ccltce.in",
    role: "coding_club_member",
    bio: "Algorithms lead & competitive programmer. Rust, C++ & WebAssembly explorer.",
    avatar_url: null,
    xp: 940
  },
  {
    id: "seed-rashi",
    full_name: "Rashi Gupta",
    email: "rashi@ccltce.in",
    role: "coding_club_member",
    bio: "Frontend dev & UI/UX designer. Pixel art, CSS animations & design systems.",
    avatar_url: null,
    xp: 760
  },
  {
    id: "seed-rohan",
    full_name: "Rohan Patel",
    email: "rohan@student.ltce.in",
    role: "student",
    bio: "2nd year CS student exploring Web3, smart contracts, TypeScript & React.",
    avatar_url: null,
    xp: 410
  },
  {
    id: "seed-priya",
    full_name: "Priya Singh",
    email: "priya@student.ltce.in",
    role: "student",
    bio: "Data science enthusiast. Python, PyTorch, pandas & exploratory data visualization.",
    avatar_url: null,
    xp: 320
  }
];

const DEFAULT_CHANNELS = [
  {
    id: "3063e856-7821-4731-91f0-3a120620559e",
    slug: "general",
    name: "general",
    purpose: "Everyday club chatter, announcements & banter",
    icon: "gen",
    unread: 0,
    online: 8,
    lastTime: "10:41 AM",
    lastMsg: "Everyday club chatter — say hi!"
  },
  {
    id: "ef1a065c-d552-4bff-a7bb-72ad0f31a745",
    slug: "events",
    name: "events",
    purpose: "Hackathons, workshops, dates & deadlines",
    icon: "ev",
    unread: 0,
    online: 5,
    lastTime: "09:15 AM",
    lastMsg: "Aakash: hopefully"
  },
  {
    id: "9f02cb47-928c-4305-8537-ad27da8359d1",
    slug: "help",
    name: "help",
    purpose: "Debug code, DSA roadblocks & project blockers",
    icon: "help",
    unread: 0,
    online: 4,
    lastTime: "Yesterday",
    lastMsg: "Stuck on code, homework or setup?"
  },
  {
    id: "f550da64-61e5-4186-be25-5d299ac57f91",
    slug: "showcase",
    name: "showcase",
    purpose: "Show off what you built this weekend",
    icon: "show",
    unread: 0,
    online: 5,
    lastTime: "2 days ago",
    lastMsg: "Aakash: See my github..."
  },
  {
    id: "f347a1da-6d6a-48f2-9c39-3dae22eee6c3",
    slug: "random",
    name: "random",
    purpose: "Memes, battle stations & tech hot takes",
    icon: "rand",
    unread: 0,
    online: 7,
    lastTime: "Yesterday",
    lastMsg: "Off-topic, memes, music, life"
  }
];


let me = null;
let members = [];
let allEvents = [];
let channels = [];
let activeChannel = null; // { id, slug, name, purpose }
let chanSub = null;
let chanSeen = {}; // slug -> ISO ts of last read
let lastMsgAt = null; // newest rendered message ts (incremental polling)
const msgIds = new Set(); // rendered message ids — dedupe realtime vs own send

function loadSeen() {
  try { chanSeen = JSON.parse(localStorage.getItem("ccltce_chat_seen") || "{}"); } catch { chanSeen = {}; }
}
function markSeen(slug) {
  chanSeen[slug] = new Date().toISOString();
  try { localStorage.setItem("ccltce_chat_seen", JSON.stringify(chanSeen)); } catch {}
}

function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function playWhatsAppChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.07);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {}
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
      if (id === "inbox") loadChannelsPanel();
      if (id === "directory") loadDirectory();
      if (id === "board") loadBoard();
    });
  });
}

// ── directory state ──
let memberHay = null; // id -> lowercase search haystack
let currentRoleFilter = "all";
let currentSearchQuery = "";

function memberById(id) {
  return members.find((x) => x.id === id);
}

function buildMemberHay(list) {
  memberHay = new Map();
  list.forEach((u) => {
    let linkText = "";
    if (Array.isArray(u.links)) {
      linkText = u.links.map((l) => (l.label || "") + " " + (l.url || "")).join(" ");
    } else if (typeof u.links === "string") {
      linkText = u.links;
    }
    const roleName = ROLE_LABEL[u.role] || u.role || "";
    const hay = [u.full_name, u.email, u.role, roleName, u.bio, linkText]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    memberHay.set(u.id, hay);
  });
}

function updateFilterChipCounts(list) {
  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  const total = list.length;
  const club = list.filter((x) => x.role === "coding_club_member" || x.role === "president").length;
  const admin = list.filter((x) => x.role === "admin").length;
  const student = list.filter((x) => x.role === "student").length;

  setTxt("chip-cnt-all", total);
  setTxt("chip-cnt-club", club);
  setTxt("chip-cnt-admin", admin);
  setTxt("chip-cnt-student", student);
}

function applyDirectoryFilters() {
  const grid = $("#comm-grid");
  const countBadge = $("#comm-search-count");
  const clearBtn = $("#comm-search-clear");
  const searchInput = $("#comm-search");

  const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
  currentSearchQuery = q;

  if (clearBtn) clearBtn.hidden = !q;
  if (!grid || !memberHay) return;

  let shown = 0;
  grid.querySelectorAll(".wa-contact-card").forEach((card) => {
    const u = memberById(card.dataset.id);
    if (!u) {
      card.hidden = true;
      return;
    }
    const matchSearch = !q || (memberHay.get(card.dataset.id) || "").includes(q);
    const matchRole =
      currentRoleFilter === "all" ||
      u.role === currentRoleFilter ||
      (currentRoleFilter === "admin" && u.role === "admin") ||
      (currentRoleFilter === "coding_club_member" && (u.role === "coding_club_member" || u.role === "president"));

    const isVisible = matchSearch && matchRole;
    card.hidden = !isVisible;
    if (isVisible) shown++;
  });

  if (countBadge) {
    if (q) {
      countBadge.textContent = `${shown} ${shown === 1 ? "match" : "matches"}`;
    } else if (currentRoleFilter !== "all") {
      countBadge.textContent = `${shown} filtered`;
    } else {
      countBadge.textContent = `${shown} members`;
    }
  }

  let noneEl = grid.querySelector(".comm-no-match");
  if (shown === 0) {
    if (!noneEl) {
      noneEl = document.createElement("div");
      noneEl.className = "comm-no-match";
      grid.appendChild(noneEl);
    }
    noneEl.innerHTML = `
      <div class="comm-no-match-icon">🔍</div>
      <p class="comm-no-match-title">NO MATCHES FOUND</p>
      <p class="comm-no-match-sub">No members match your search criteria.</p>
      <button class="comm-btn-reset-filter" type="button">Reset Search &amp; Filters</button>
    `;
    const resetBtn = noneEl.querySelector(".comm-btn-reset-filter");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => resetFilters());
    }
    noneEl.hidden = false;
  } else if (noneEl) {
    noneEl.hidden = true;
  }
}

function resetFilters() {
  const searchInput = $("#comm-search");
  if (searchInput) searchInput.value = "";
  currentRoleFilter = "all";
  currentSearchQuery = "";

  $$(".comm-filter-chips .comm-chip").forEach((btn) => {
    const isAll = btn.dataset.role === "all";
    btn.classList.toggle("active", isAll);
    btn.setAttribute("aria-checked", isAll ? "true" : "false");
  });

  applyDirectoryFilters();
  if (searchInput) searchInput.focus();
}

function wireFilterChips() {
  const chips = $$(".comm-filter-chips .comm-chip");
  chips.forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", () => {
      chips.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-checked", b === btn ? "true" : "false");
      });
      currentRoleFilter = btn.dataset.role || "all";
      applyDirectoryFilters();
      if (window.CCLTCE_SFX) window.CCLTCE_SFX.click();
    });
  });
}

function wireSearch() {
  const search = $("#comm-search");
  const clearBtn = $("#comm-search-clear");

  if (search && !search.dataset.wired) {
    search.dataset.wired = "1";
    let t = 0;
    search.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => applyDirectoryFilters(), 100);
    });
    search.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        search.value = "";
        applyDirectoryFilters();
      }
    });
  }

  if (clearBtn && !clearBtn.dataset.wired) {
    clearBtn.dataset.wired = "1";
    clearBtn.addEventListener("click", () => {
      if (search) {
        search.value = "";
        search.focus();
      }
      applyDirectoryFilters();
      if (window.CCLTCE_SFX) window.CCLTCE_SFX.click();
    });
  }

  wireFilterChips();
}

async function loadDirectory() {
  const grid = $("#comm-grid");
  if (!grid) return;
  if (!members.length) {
    members = SEED_MEMBERS;
    buildMemberHay(members);
    updateFilterChipCounts(members);
    renderDirectory(members);
    wireDirectory();
    wireSearch();
  }
  if (supabase) {
    try {
      const res = await supabase
        .from("profiles")
        .select("*")
        .order("role", { ascending: true })
        .order("created_at", { ascending: true });
      if (!res.error && res.data && res.data.length) {
        members = res.data;
        buildMemberHay(members);
        updateFilterChipCounts(members);
        renderDirectory(members);
        wireDirectory();
        wireSearch();
      }
    } catch (e) {}
  }
}

// one delegated listener pair for the whole grid
function wireDirectory() {
  const grid = $("#comm-grid");
  if (!grid || grid.dataset.wired) return;
  grid.dataset.wired = "1";
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".wa-contact-card");
    if (!card) return;
    const u = memberById(card.dataset.id);
    if (!u) return;
    const act = e.target.closest("[data-act]");
    if (act) {
      e.stopPropagation();
      if (act.dataset.act === "view") return openProfileModal(u, me);
      if (act.dataset.act === "teamup") {
        if (!me) { flash("Log in to send team-up invites.", "warn"); return void (location.href = "login.html"); }
        return openInviteModal(u);
      }
    }
    openProfileModal(u, me);
  });
}

function renderDirectory(list) {
  const grid = $("#comm-grid");
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = '<p class="dash-empty">No accounts yet.</p>';
    return;
  }
  grid.innerHTML = list
    .map((u) => {
      const roleCls = u.role === "admin" ? "role-admin" : u.role === "coding_club_member" ? "role-club" : "role-student";
      const isSelf = me && u.id === me.id;
      const name = esc(u.full_name || u.email || "Member");
      return (
        '<div class="wa-contact-card" data-id="' + esc(u.id) + '">' +
        '<div class="wa-contact-top">' +
        '<div class="wa-contact-avatar">' +
        '<img src="' + esc(avatarSrc(u, 80)) + '" alt="" width="48" height="48" loading="lazy" decoding="async" />' +
        '</div>' +
        '<div class="wa-contact-info">' +
        '<span class="wa-contact-name">' + name + '</span>' +
        '<span class="wa-contact-role"><span class="role-badge ' + roleCls + '">' + esc(ROLE_LABEL[u.role] || u.role) + '</span></span>' +
        '</div>' +
        '</div>' +
        (u.bio ? '<p class="wa-contact-bio">' + esc(u.bio) + '</p>' : '<p class="wa-contact-bio" style="color:var(--wa-text-sub);font-style:italic">Active campus developer</p>') +
        '<div class="wa-contact-actions">' +
        '<button class="wa-contact-btn primary" type="button" data-act="view">👤 Profile</button>' +
        (isSelf ? "" : '<button class="wa-contact-btn" type="button" data-act="teamup">⚔️ Team Up</button>') +
        '</div>' +
        '</div>'
      );
    })
    .join("");
}

function switchTab(id) {
  const btn = $('#comm-tabs [data-ctab="' + id + '"]');
  if (btn) btn.click();
}

// ── open chat channels (WhatsApp Web & Native Mobile) ──
function setupUserAvatar() {
  const avatarImg = $("#wa-my-avatar");
  const wrap = $("#wa-user-avatar-wrap");
  if (avatarImg) {
    avatarImg.src = avatarSrc(me || { id: "guest", email: "guest@ccltce.in" }, 80);
  }
  if (wrap && !wrap.dataset.wired) {
    wrap.dataset.wired = "1";
    wrap.addEventListener("click", () => {
      if (me) openProfileModal(me, me);
      else location.href = "login.html";
    });
  }
}

function setupMobileChatNav() {
  const inbox = $("#comm-inbox");
  const backBtn = $("#wa-back-btn");
  if (backBtn && inbox && !backBtn.dataset.wired) {
    backBtn.dataset.wired = "1";
    backBtn.addEventListener("click", () => {
      inbox.classList.remove("thread-active");
    });
  }
}

function wireSidebarFilters() {
  const searchInput = $("#wa-channel-search");
  const chips = $$(".wa-filter-chips .wa-chip");
  let currentFilter = "all";

  function applyFilter() {
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const items = $$("#inbox-list .wa-chat-item");
    items.forEach((item) => {
      const chSlug = item.dataset.ch;
      const ch = channels.find((c) => (c.slug || c.id) === chSlug);
      if (!ch) return;

      let matchesSearch = true;
      if (query) {
        matchesSearch = ch.name.toLowerCase().includes(query) || (ch.purpose || "").toLowerCase().includes(query);
      }

      let matchesChip = true;
      if (currentFilter === "channels") {
        matchesChip = !ch.isSquad;
      } else if (currentFilter === "unread") {
        matchesChip = Boolean(ch.unread && ch.unread > 0);
      } else if (currentFilter === "squads") {
        matchesChip = Boolean(ch.isSquad);
      }

      item.style.display = (matchesSearch && matchesChip) ? "flex" : "none";
    });
  }

  if (searchInput && !searchInput.dataset.wired) {
    searchInput.dataset.wired = "1";
    searchInput.addEventListener("input", applyFilter);
  }

  chips.forEach((chip) => {
    if (chip.dataset.wired) return;
    chip.dataset.wired = "1";
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("active", c === chip));
      currentFilter = chip.dataset.filter || "all";
      applyFilter();
    });
  });
}

function updateSidebarPreview(chSlug, text) {
  const item = $(`#inbox-list .wa-chat-item[data-ch="${chSlug}"]`);
  if (!item) return;
  const prev = item.querySelector(".wa-item-preview");
  const time = item.querySelector(".wa-item-time");
  if (prev) prev.textContent = `You: ${text}`;
  if (time) time.textContent = formatTime(new Date().toISOString());
}

async function loadChannelsPanel() {
  setupUserAvatar();
  if (!channels.length) {
    channels = DEFAULT_CHANNELS;
    renderChannelList([]);
    if (!activeChannel && channels.length) {
      await openChannel(channels[0]);
    }
  }
  wireSidebarFilters();
  setupMobileChatNav();
  wireReactions();
  wireEmojiTray();

  if (supabase) {
    try {
      const [chansRes, recentRes] = await Promise.all([
        supabase.from("channels").select("*").order("created_at"),
        supabase.from("messages").select("channel_id,created_at,body").order("created_at", { ascending: false }).limit(300),
      ]);
      if (!chansRes.error && chansRes.data && chansRes.data.length) {
        channels = chansRes.data;
        renderChannelList(recentRes.data || []);
      }
    } catch (e) {}
  }
}

function renderChannelList(recent) {
  const list = $("#inbox-list");
  if (!list) return;
  const unread = {};
  const lastMessages = {};
  (recent || []).forEach((m) => {
    const c = channels.find((x) => x.id === m.channel_id);
    if (!c) return;
    const chKey = c.slug || c.id;
    if (!lastMessages[chKey]) {
      lastMessages[chKey] = m.body;
    }
    const seenAt = chanSeen[chKey];
    if (!seenAt || m.created_at > seenAt) unread[chKey] = (unread[chKey] || 0) + 1;
  });

  list.innerHTML = channels
    .map((c) => {
      const isActive = activeChannel && (activeChannel.id === c.id || activeChannel.slug === c.slug);
      const chKey = c.slug || c.id;
      const n = unread[chKey] != null ? unread[chKey] : (c.unread || 0);
      const iconCls = c.icon || "gen";
      const iconChar = "#";
      const timeStr = c.lastTime || "";
      const previewText = lastMessages[chKey] || c.lastMsg || c.purpose || "Tap to open chat";
      return (
        `<button class="wa-chat-item${isActive ? " active" : ""}" type="button" data-ch="${esc(chKey)}">` +
        `<div class="wa-item-avatar">` +
        `<span class="wa-chan-icon ${iconCls}">${iconChar}</span>` +
        `</div>` +
        `<div class="wa-item-body">` +
        `<div class="wa-item-row-top">` +
        `<span class="wa-item-name">#${esc(c.name)}</span>` +
        (timeStr ? `<span class="wa-item-time">${esc(timeStr)}</span>` : "") +
        `</div>` +
        `<div class="wa-item-row-bot">` +
        `<span class="wa-item-preview">${esc(previewText)}</span>` +
        (n ? `<span class="wa-item-unread-badge">${n > 99 ? "99+" : n}</span>` : "") +
        `</div>` +
        `</div>` +
        `</button>`
      );
    })
    .join("");

  list.querySelectorAll("[data-ch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const c = channels.find((x) => (x.slug || x.id) === btn.dataset.ch);
      if (c) openChannel(c, true);
    });
  });
}

async function openChannel(c, isUserClick = false) {
  activeChannel = c;
  const chKey = c.slug || c.id;
  markSeen(chKey);
  c.unread = 0;

  const title = $("#thread-title");
  const avatar = $("#thread-avatar");
  const status = $("#thread-status");
  const form = $("#thread-form");
  const inbox = $("#comm-inbox");
  const input = $("#thread-input");

  if (title) title.textContent = "#" + c.name;
  if (avatar) {
    avatar.textContent = "#";
    avatar.className = `wa-thread-avatar wa-chan-icon ${c.icon || "gen"}`;
  }
  const onlineCount = c.online || 5;
  if (status) {
    status.textContent = `🟢 ${onlineCount} online • ${c.purpose || "Everyday club chatter"}`;
  }
  if (input) input.placeholder = `Message #${c.name}...`;
  if (form) form.hidden = false;

  // On mobile (< 900px): slide to thread if explicitly tapped by user; on desktop keep side-by-side
  if (inbox && (isUserClick || window.innerWidth >= 900)) {
    inbox.classList.add("thread-active");
    if (isUserClick && window.innerWidth < 900) {
      setTimeout(() => {
        inbox.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  const body = $("#thread-body");
  if (body) {
    body.innerHTML = skelRows(3);
  }

  // Update active chat styling in sidebar
  const items = $$("#inbox-list .wa-chat-item");
  items.forEach((item) => {
    item.classList.toggle("active", item.dataset.ch === chKey);
    if (item.dataset.ch === chKey) {
      const badge = item.querySelector(".wa-item-unread-badge");
      if (badge) badge.remove();
    }
  });

  await loadMessages();
  if (supabase) subscribeChannel();
}

async function loadMessages() {
  if (!activeChannel) return;
  const body = $("#thread-body");
  if (!body) return;

  let msgs = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, channel_id, user_id, body, created_at, profiles(id, full_name, email, role, avatar_url, pixel_art)")
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!error && data) {
        msgs = data;
      }
    } catch (e) {
      console.error("loadMessages error:", e);
    }
  }

  renderThread(msgs);
}

function chatRowHtml(m) {
  const isMine = me ? m.user_id === me.id : Boolean(m.isMine);
  const p = m.profiles || members.find((x) => x.id === m.user_id) || {};
  const name = esc(p.full_name || (isMine && me ? (me.full_name || me.email) : (m.author_name || "Member")));
  const role = p.role || (isMine && me ? (me.role || "student") : (m.author_role || "student"));
  const roleCls = role === "president" ? "role-president" : role === "admin" ? "role-admin" : role === "coding_club_member" ? "role-member" : "role-student";
  const roleName = role === "president" ? "President" : role === "admin" ? "Admin" : role === "coding_club_member" ? "Club Member" : "Student";
  const timeStr = formatTime(m.created_at);
  const avatar = avatarSrc(p.id ? p : { id: m.user_id, role, pixel_art: p.pixel_art, avatar_url: p.avatar_url }, 32);

  // reactions
  const rx = m.reactions || {};
  let rxHtml = "";
  const keys = Object.keys(rx);
  if (keys.length) {
    rxHtml = keys.map((emo) => {
      const cnt = rx[emo];
      return `<button type="button" class="wa-reaction-chip" data-mid="${esc(m.id)}" data-emo="${esc(emo)}">${esc(emo)} ${cnt}</button>`;
    }).join("");
  }
  rxHtml += `<button type="button" class="wa-add-reaction-btn" data-mid="${esc(m.id)}" title="React with emoji">+</button>`;

  if (isMine) {
    return (
      `<div class="wa-msg-row wa-out" data-mid="${esc(m.id)}">` +
      `<div class="wa-msg-wrapper">` +
      `<div class="wa-msg-bubble">` +
      `<div class="wa-msg-text">${linkify(m.body)}</div>` +
      `<div class="wa-msg-meta">` +
      `<span>${esc(timeStr)}</span>` +
      `<span class="wa-ticks" title="Sent to channel">✓✓</span>` +
      `</div>` +
      `</div>` +
      (rxHtml ? `<div class="wa-reactions-bar">${rxHtml}</div>` : "") +
      `</div></div>`
    );
  }

  return (
    `<div class="wa-msg-row wa-in" data-mid="${esc(m.id)}">` +
    `<img class="wa-msg-avatar" src="${esc(avatar)}" alt="" width="28" height="28" loading="lazy" decoding="async" />` +
    `<div class="wa-msg-wrapper">` +
    `<div class="wa-msg-bubble">` +
    `<div class="wa-sender-header">` +
    `<span class="wa-sender-name ${roleCls}">${name}</span>` +
    `<span class="wa-role-tag">${roleName}</span>` +
    `</div>` +
    `<div class="wa-msg-text">${linkify(m.body)}</div>` +
    `<div class="wa-msg-meta">` +
    `<span>${esc(timeStr)}</span>` +
    `</div>` +
    `</div>` +
    `<div class="wa-reactions-bar">${rxHtml}</div>` +
    `</div></div>`
  );
}

function renderThread(msgs) {
  const body = $("#thread-body");
  if (!body) return;
  msgIds.clear();
  lastMsgAt = null;

  const chName = activeChannel ? activeChannel.name : "general";
  const chPurpose = activeChannel && activeChannel.purpose ? activeChannel.purpose : "Everyday club chatter, announcements & banter";
  const headerHtml = `
    <div class="channel-start-banner" id="channel-start-banner">
      <div class="channel-start-hash">#</div>
      <h2 class="channel-start-title">Welcome to #${esc(chName)}!</h2>
      <p class="channel-start-desc">This is the start of the #${esc(chName)} channel. ${esc(chPurpose)}.</p>
    </div>
  `;

  if (!msgs || !msgs.length) {
    body.innerHTML = headerHtml + '<p class="dash-empty" style="text-align:center;padding:1.5rem 0;color:var(--wa-text-sub)">No messages in this channel yet. Send the first message to kick off the conversation!</p>';
    return;
  }

  body.innerHTML = headerHtml + msgs.map(chatRowHtml).join("");
  msgs.forEach((m) => msgIds.add(m.id));
  lastMsgAt = msgs[msgs.length - 1].created_at || null;
  body.scrollTop = body.scrollHeight;
}

function appendMsg(m) {
  const body = $("#thread-body");
  if (!body || !m || !m.id || msgIds.has(m.id)) return;
  msgIds.add(m.id);
  if (m.created_at && (!lastMsgAt || m.created_at > lastMsgAt)) lastMsgAt = m.created_at;
  const ph = body.querySelector(".dash-empty");
  if (ph) ph.remove();
  const near = body.scrollHeight - body.scrollTop - body.clientHeight < 160;
  body.insertAdjacentHTML("beforeend", chatRowHtml(m));
  if (near || (me && m.user_id === me.id) || m.isMine) body.scrollTop = body.scrollHeight;
}

function subscribeChannel() {
  if (chanSub) { supabase.removeChannel(chanSub); chanSub = null; }
  if (!activeChannel || !supabase) return;
  const chId = activeChannel.id;
  chanSub = supabase
    .channel("chat-" + chId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: "channel_id=eq." + chId },
      async (payload) => {
        if (!activeChannel || activeChannel.id !== chId) return;
        markSeen(activeChannel.slug || activeChannel.id);
        const m = payload.new;
        if (!m.profiles) {
          const found = members.find((x) => x.id === m.user_id);
          if (found) {
            m.profiles = found;
          } else {
            try {
              const { data: p } = await supabase
                .from("profiles")
                .select("id, full_name, email, role, avatar_url, pixel_art")
                .eq("id", m.user_id)
                .single();
              if (p) m.profiles = p;
            } catch (e) {}
          }
        }
        appendMsg(m);
        updateSidebarPreview(activeChannel.slug || activeChannel.id, m.body);
      }
    )
    .subscribe();
}

function wireReactions() {
  const body = $("#thread-body");
  if (!body || body.dataset.rxWired) return;
  body.dataset.rxWired = "1";

  body.addEventListener("click", (e) => {
    const chip = e.target.closest(".wa-reaction-chip");
    if (chip) {
      const isReacted = chip.classList.contains("reacted");
      chip.classList.toggle("reacted");
      const parts = chip.textContent.trim().split(" ");
      const emo = parts[0];
      let count = parseInt(parts[1] || "1", 10);
      count = isReacted ? Math.max(0, count - 1) : count + 1;
      if (count === 0) {
        chip.remove();
      } else {
        chip.textContent = `${emo} ${count}`;
      }
      if (window.CCLTCE_SFX) window.CCLTCE_SFX.click();
      return;
    }

    const addBtn = e.target.closest(".wa-add-reaction-btn");
    if (addBtn) {
      const bar = addBtn.closest(".wa-reactions-bar");
      if (!bar) return;
      let existing = bar.querySelector('[data-emo="🔥"]');
      if (existing) {
        existing.click();
      } else {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "wa-reaction-chip reacted";
        chip.dataset.emo = "🔥";
        chip.textContent = "🔥 1";
        bar.insertBefore(chip, addBtn);
      }
      if (window.CCLTCE_SFX) window.CCLTCE_SFX.click();
      return;
    }
  });
}

function wireEmojiTray() {
  const toggleBtn = $("#wa-toggle-emoji");
  const tray = $("#wa-emoji-tray");
  const input = $("#thread-input");
  if (!toggleBtn || !tray || toggleBtn.dataset.wired) return;
  toggleBtn.dataset.wired = "1";

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    tray.hidden = !tray.hidden;
    toggleBtn.classList.toggle("active", !tray.hidden);
  });

  tray.querySelectorAll(".wa-emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const emo = btn.dataset.emo || btn.textContent.trim();
      if (input) {
        input.value += emo;
        input.focus();
      }
      if (window.CCLTCE_SFX) window.CCLTCE_SFX.type();
    });
  });
}

function wireThreadForm() {
  const form = $("#thread-form");
  if (!form || form.dataset.wired) return;
  form.dataset.wired = "1";

  // Channel header actions
  const refreshBtn = $("#wa-btn-refresh-chats");
  if (refreshBtn && !refreshBtn.dataset.wired) {
    refreshBtn.dataset.wired = "1";
    refreshBtn.addEventListener("click", () => {
      loadChannelsPanel();
      flash("Chats refreshed", "info");
      if (window.CCLTCE_SFX) window.CCLTCE_SFX.click();
    });
  }

  const infoBtn = $("#btn-channel-info");
  if (infoBtn && !infoBtn.dataset.wired) {
    infoBtn.dataset.wired = "1";
    infoBtn.addEventListener("click", () => {
      if (!activeChannel) return;
      flash(`Channel #${activeChannel.name}: ${activeChannel.purpose || "Club chatter"}. Rules: Text & code links only, be respectful.`, "info");
    });
  }

  const searchMsgsBtn = $("#btn-search-msgs");
  if (searchMsgsBtn && !searchMsgsBtn.dataset.wired) {
    searchMsgsBtn.dataset.wired = "1";
    searchMsgsBtn.addEventListener("click", () => {
      const q = prompt("Search in this chat:");
      if (!q) return;
      const msgs = $$("#thread-body .wa-msg-row");
      let found = 0;
      msgs.forEach((row) => {
        const text = row.querySelector(".wa-msg-text")?.textContent || "";
        const match = text.toLowerCase().includes(q.toLowerCase());
        row.style.opacity = match ? "1" : "0.3";
        if (match) found++;
      });
      flash(`Found ${found} matching messages. Click chat to reset view.`, "info");
      $("#thread-body").addEventListener("click", () => {
        msgs.forEach((r) => (r.style.opacity = "1"));
      }, { once: true });
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeChannel) return;
    const input = $("#thread-input");
    let body = input.value.trim();
    if (!body) return;

    if (!me) {
      flash(`Log in to send messages in #${activeChannel.name}`, "warn");
      setTimeout(() => { location.href = "login.html"; }, 800);
      return;
    }

    body = body.replace(/[\u0000-\u0008\u000B-\u001F]/g, "");
    if (body.length > 2000) body = body.slice(0, 2000);

    input.value = "";
    playWhatsAppChime();

    const submitBtn = $("#thread-submit");
    if (submitBtn) submitBtn.disabled = true;

    if (supabase) {
      try {
        const { data: row, error } = await supabase
          .from("messages")
          .insert({
            channel_id: activeChannel.id,
            user_id: me.id,
            body,
          })
          .select("id, channel_id, user_id, body, created_at, profiles(id, full_name, email, role, avatar_url, pixel_art)")
          .single();

        if (error) {
          flash("Message failed to send: " + (error.message || "database error"), "warn");
          input.value = body;
          return;
        }

        if (row) {
          appendMsg(row);
          updateSidebarPreview(activeChannel.slug || activeChannel.id, body);
          awardXp(5, "chat message");
        }
      } catch (err) {
        flash("Failed to send message: " + (err.message || "Network error"), "warn");
        input.value = body;
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    }
  });
}

// ── leaderboard ──
const CROWN_SVG =
  '<svg class="pod-crown" viewBox="0 0 16 12" width="30" height="23" aria-hidden="true" shape-rendering="crispEdges">' +
  '<polygon points="0,12 0,4 3,7 5,2 8,6 11,2 13,7 16,4 16,12" fill="#eab308" stroke="#000" stroke-width="0.7" />' +
  '<rect x="1" y="9" width="14" height="2.4" fill="#b45309" stroke="#000" stroke-width="0.5" />' +
  '<rect x="7" y="6.4" width="2" height="2" fill="#ff004d" stroke="#000" stroke-width="0.4" />' +
  "</svg>";

const POD_RANK_WORD = { 1: "1ST", 2: "2ND", 3: "3RD" };

function podiumSlotHtml(u, rank) {
  const xp = Number(u.xp) || 0;
  const isMe = me && u.id === me.id;
  const name = esc(u.full_name || u.email || "Member");
  const delay = rank === 2 ? "0s" : rank === 1 ? "0.1s" : "0.2s";
  const size = rank === 1 ? 96 : 72;
  const px = rank === 1 ? 88 : 68;
  return (
    '<div class="pod-slot pod-' + rank + (isMe ? " pod-you" : "") + '" style="--d:' + delay + '"' +
    ' role="button" tabindex="0" data-open="' + esc(u.id) + '"' +
    ' aria-label="Rank ' + rank + ", " + name + " — view profile" + '">' +
    (rank === 1 ? CROWN_SVG : "") +
    '<div class="pod-avatar">' +
    '<img src="' + esc(avatarSrc(u, size)) + '" alt="" width="' + px + '" height="' + px + '" decoding="async" />' +
    (isMe ? '<span class="pod-you-tag">YOU</span>' : "") +
    "</div>" +
    '<span class="pod-name">' + name + "</span>" +
    '<span class="pod-meta">' +
    '<span class="lv-chip">Lv ' + levelOf(xp) + "</span>" +
    '<span class="pod-xp" data-xp="' + xp + '">0 XP</span>' +
    "</span>" +
    '<div class="pod-base"><span>' + POD_RANK_WORD[rank] + "</span></div>" +
    "</div>"
  );
}

function countUpXp(el, to) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = to + " XP";
    return;
  }
  const t0 = performance.now();
  const dur = 750;
  (function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased) + " XP";
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

function wirePodium() {
  const podium = $("#board-podium");
  if (!podium || podium.dataset.wired) return;
  podium.dataset.wired = "1";
  const byId = (id) => (podium._byId && podium._byId.get(id)) || memberById(id);
  podium.addEventListener("click", (e) => {
    const slot = e.target.closest("[data-open]");
    const u = slot && byId(slot.dataset.open);
    if (u) openProfileModal(u, me);
  });
  podium.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const slot = e.target.closest("[data-open]");
    const u = slot && byId(slot.dataset.open);
    if (u) { e.preventDefault(); openProfileModal(u, me); }
  });
}

async function loadBoard() {
  const list = $("#board-list");
  const self = $("#board-self");
  const podium = $("#board-podium");
  if (!list) return;
  list.innerHTML = skelRows(6);
  if (podium) { podium.hidden = true; podium.innerHTML = ""; }
  let rows = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, pixel_art, xp")
        .order("xp", { ascending: false })
        .order("created_at", { ascending: true });
      if (!error && data && data.length) {
        rows = data.slice(0, 100);
      }
    } catch (e) {}
  }
  if (!rows.length) {
    rows = SEED_MEMBERS.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0));
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
        '<img src="' + esc(avatarSrc(u, 40)) + '" alt="" width="36" height="36" loading="lazy" decoding="async" />' +
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

  // top-3 podium (semantic DOM order 1,2,3 — CSS reorders to 2·1·3)
  if (podium) {
    wirePodium();
    podium._byId = new Map(rows.map((u) => [u.id, u]));
    podium.classList.toggle("partial", rows.length < 3);
    podium.innerHTML = rows.slice(0, 3).map((u, i) => podiumSlotHtml(u, i + 1)).join("");
    podium.hidden = false;
    podium.querySelectorAll(".pod-xp[data-xp]").forEach((el) => countUpXp(el, Number(el.dataset.xp) || 0));
  }

  const rest = rows.slice(3);
  if (!rest.length) { list.innerHTML = ""; list.hidden = true; return; }
  list.hidden = false;
  list.innerHTML = rest
    .map((u, i) => {
      const rank = i + 4;
      const xp = Number(u.xp) || 0;
      const isMe = me && u.id === me.id;
      const roleCls = u.role === "admin" ? "role-admin" : u.role === "coding_club_member" ? "role-club" : "role-student";
      return (
        '<div class="board-row' + (isMe ? " board-me" : "") + '" style="--i:' + Math.min(i, 12) + '">' +
        '<span class="board-rank">' + rank + "</span>" +
        '<img class="board-face" src="' + esc(avatarSrc(u, 40)) + '" alt="" width="36" height="36" loading="lazy" decoding="async" />' +
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
        '<img src="' + esc(avatarSrc(u || { id: otherId }, 32)) + '" alt="" width="36" height="36" loading="lazy" decoding="async" />' +
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
    flash("Team-up invite sent to " + (toUser.full_name || "member") + "! Check your dashboard to view squads.", "ok");
    awardXp(5, "team-up invite sent");
  });
}

// poll the open channel lightly when visible (realtime is primary) — incremental only
setInterval(async () => {
  if (document.hidden || !activeChannel || !supabase) return;
  const inbox = $('[data-cpanel="inbox"]');
  if (!inbox || !inbox.classList.contains("active")) return;
  if (!lastMsgAt) return loadMessages();
  try {
    const { data } = await supabase
      .from("messages")
      .select("id, channel_id, user_id, body, created_at, profiles(id, full_name, email, role, avatar_url, pixel_art)")
      .eq("channel_id", activeChannel.id)
      .gt("created_at", lastMsgAt)
      .order("created_at", { ascending: true })
      .limit(50);
    (data || []).forEach(appendMsg);
  } catch (e) {}
}, 10000);

async function init() {
  loadSeen();
  wireTabs();
  wireThreadForm();

  if (supabase) {
    try {
      me = await getProfile();
    } catch (e) {}
    try {
      const { data: events } = await supabase.from("events").select("id, title").order("created_at");
      allEvents = events || [];
    } catch (e) {}
  }

  // Pre-load channels & directory
  await loadChannelsPanel();
  await loadDirectory();

  const hash = (location.hash || "").replace("#", "");
  if (hash === "board") switchTab("board");
  else if (hash === "directory") switchTab("directory");
  else {
    switchTab("inbox");
    loadBoard(); // warm up leaderboard in background
  }
}

init();
