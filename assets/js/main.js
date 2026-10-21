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
    </article>`,

  achievements: (a) => `
    <article class="ach">
      <span class="year">${a.year}</span>
      <h3>${a.title}</h3>
      <p style="color:var(--muted);font-size:.92rem">${a.detail}</p>
    </article>`,
};

async function init() {
  document.querySelectorAll(".nav-links a:not(.cta)").forEach((a) => {
    const page = location.pathname.split("/").pop() || "index.html";
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
    if (TEMPLATES[key] && data[key]) {
      el.innerHTML = data[key].map(TEMPLATES[key]).join("");
    }
  }
}

init();
