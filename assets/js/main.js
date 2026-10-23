const escape = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const handle = (h) => String(h || "").replace(/^@/, "");

const ICON = {
  x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.77 7.74L22.8 22h-6.5l-5.1-6.66L5.4 22H2.3l7.25-8.29L1.6 2h6.67l4.6 6.1L18.9 2Zm-1.1 18.1h1.7L6.3 3.8H4.5L17.8 20.1Z"/></svg>',
  li: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-.95 1.83-1.96 3.77-1.96 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.9-3.07-1.9 0-2.2 1.46-2.2 2.97V21h-4V9Z"/></svg>',
  gh: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.89-.01-1.74-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>',
  link: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l1.4-1.4a1 1 0 0 1 1.4 1.4l-1.4 1.4a1 1 0 0 1-1.4 0Zm-.8 2.6a4 4 0 0 1 0-5.7l2.1-2a4 4 0 0 1 5.7 5.7l-1 1-1.4-1.4 1-1a2 2 0 0 0-2.9-2.9l-2.1 2a2 2 0 0 0 0 2.9l-1.4 1.4a4 4 0 0 1 0 .6Zm8.6-8a4 4 0 0 0-5.7 0l-1 1 1.4 1.4 1-1a2 2 0 0 1 2.9 2.9l-2.1 2a2 2 0 0 1-2.9 0 1 1 0 0 0-1.4 1.4 4 4 0 0 0 5.7 0l2.1-2.1a4 4 0 0 0 0-5.6Z"/></svg>',
};

const TEMPLATES = {
  resources: (r) => `
    <article class="res-card">
      <div class="icon-ring" style="color:${escape(r.iconColor)}">${escape(r.icon)}</div>
      <h2>${escape(r.title)}</h2>
      <p class="author"><strong>Author:</strong> ${escape(r.author)}</p>
      <ul class="bullets">${r.bullets.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>
      <div class="tags">${r.tags.map((t) => `<span class="tag">${escape(t)}</span>`).join("")}</div>
      <a class="btn btn-primary" href="${escape(r.link)}">Start Exploring</a>
    </article>`,

  team: (m) => `
    <article class="t-card" style="--accent:${escape(m.accent || "#2dd4bf")}">
      <span class="t-badge"><i></i>${escape(m.role)}</span>
      <div class="t-photo"><img src="assets/img/${escape(m.image)}.svg" alt="${escape(m.name)}" loading="lazy" /></div>
      <div class="t-info">
        <h3>${escape(m.name)}</h3>
        <p class="t-spec">${escape(m.area)}</p>
        <p class="t-bio">${escape(m.bio || "")}</p>
        <div class="t-links">
          <a class="t-port" href="${escape(m.portfolio)}" target="_blank" rel="noopener">Portfolio ↗</a>
          <a href="https://github.com/${escape(handle(m.github))}" target="_blank" rel="noopener" aria-label="GitHub">${ICON.gh}</a>
          <a href="https://x.com/${escape(handle(m.twitter))}" target="_blank" rel="noopener" aria-label="X / Twitter">${ICON.x}</a>
          <a href="https://linkedin.com/in/${escape(handle(m.linkedin))}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.li}</a>
        </div>
      </div>
    </article>`,

  achievements: (a) => `
    <article class="ach">
      <span class="year">${escape(a.year)}</span>
      <h3>${escape(a.title)}</h3>
      <p>${escape(a.detail)}</p>
    </article>`,

  events: (e) => `
    <details class="event">
      <summary>
        <img src="assets/img/${escape(e.image)}.svg" alt="${escape(e.title)} poster" width="56" height="38" />
        <span class="ev-title">${escape(e.title)}<span class="ev-date">${escape(e.date)}</span></span>
        <span class="ev-toggle" aria-hidden="true">+</span>
      </summary>
      <p class="ev-body">${escape(e.desc)}</p>
    </details>`,

  notices: (n) => `
    <div class="notice-item">
      <span class="tag">${escape(n.tag)}</span>
      <div><strong>${escape(n.title)}</strong> <span class="n-body">${escape(n.body)}</span></div>
    </div>`,

  challenges: (c) => `
    <article class="challenge">
      <div class="ch-top">
        <h3>${escape(c.prompt)}</h3>
        <span class="badge ${escape((c.badge || "").toLowerCase())}">${escape(c.badge)}</span>
      </div>
      <p>Due ${escape(c.due)}</p>
    </article>`,
};

const STATS = [
  ["core team", "team"],
  ["learning tracks", "resources"],
  ["milestones", "achievements"],
  ["events hosted", "events"],
];

async function loadData() {
  const res = await fetch("data/content.json");
  if (!res.ok) throw new Error("content unavailable");
  return res.json();
}

function renderStats(data) {
  return STATS.map(([label, key]) => {
    const v = data[key];
    const n = Array.isArray(v) ? v.length : v ? 1 : 0;
    return `<div class="stat"><strong>${n}</strong><span>${label}</span></div>`;
  }).join("");
}

async function init() {
  if (window.CCLTCE) window.CCLTCE.mount();

  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });

  let data;
  try {
    data = await loadData();
  } catch {
    return;
  }

  for (const el of document.querySelectorAll("[data-render]")) {
    const key = el.dataset.render;
    if (key === "stats") {
      el.innerHTML = renderStats(data);
      continue;
    }
    if (TEMPLATES[key] && data[key]) {
      const items = Array.isArray(data[key]) ? data[key] : [data[key]];
      el.innerHTML = items.map(TEMPLATES[key]).join("");
    }
  }
}

init();
