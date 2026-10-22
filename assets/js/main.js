async function loadData() {
  const res = await fetch("data/content.json");
  if (!res.ok) throw new Error("content unavailable");
  return res.json();
}

function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

const TEMPLATES = {
  resources: (r) => `
    <article class="res-card">
      <div class="icon-ring" style="color:${r.iconColor}">${r.icon}</div>
      <h2>${r.title}</h2>
      <p class="author"><strong>Author:</strong> ${r.author}</p>
      <ul class="bullets">${r.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
      <div class="tags">${r.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <a class="btn" href="${r.link}">Start Exploring</a>
    </article>`,

  team: (m) => `
    <article class="person">
      <div class="avatar">${initials(m.name)}</div>
      <h3>${m.name}</h3>
      <p style="color:var(--muted)">${m.role}</p>
      <p class="meta">${m.area}</p>
      <div class="socials">
        <a href="https://x.com/${m.twitter}" target="_blank" rel="noopener" class="social social-twitter" aria-label="Twitter"></a>
        <a href="https://linkedin.com/in/${m.linkedin}" target="_blank" rel="noopener" class="social social-linkedin" aria-label="LinkedIn"></a>
        <a href="#" class="social other" aria-label="Other"></a>
      </div>
      <a href="${m.portfolio}" class="btn tiny" target="_blank" rel="noopener">My Portfolio</a>
    </article>`,

  achievements: (a) => `
    <article class="ach">
      <span class="year">${a.year}</span>
      <h3>${a.title}</h3>
      <p style="color:var(--muted);font-size:.92rem">${a.detail}</p>
    </article>`,

  events: (e) => `
    <details class="event">
      <summary>
        <img src="assets/img/event-placeholder.svg" alt="${e.title} poster" width="60" height="40" style="vertical-align:middle; margin-right:8px;">
        ${e.title} – ${e.date}
      </summary>
      <p>${e.desc}</p>
    </details>`,

  notices: (n) => `
    <div class="notice-item">
      <span class="tag">${n.tag}</span>
      <strong>${n.title}</strong>: ${n.body}
    </div>`,

  challenges: (c) => `
    <article class="challenge">
      <h3>${c.prompt}</h3>
      <p>Due: ${c.due} <span class="badge">${c.badge}</span></p>
    </article>`,
};

async function init() {
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
      el.innerHTML = [
        ["core team", data.team.length],
        ["learning tracks", data.resources.length],
        ["milestones", data.achievements.length],
      ]
        .map(([label, n]) => `<div class="stat"><strong>${n}</strong><span>${label}</span></div>`)
        .join("");
      continue;
    }
    if (TEMPLATES[key] && data[key]) {
      const items = Array.isArray(data[key]) ? data[key] : [data[key]];
      el.innerHTML = items.map(TEMPLATES[key]).join("");
    }
  }
}

init();