async function loadData() {
  const res = await fetch("data/content.json");
  if (!res.ok) throw new Error("content unavailable");
  return res.json();
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function eventCard(e) {
  return `
    <article class="card" data-tag="${e.tag}">
      <span class="badge accent">${e.tag}</span>
      <h3 style="margin:.6rem 0 .3rem">${e.title}</h3>
      <p class="moment">${fmtDate(e.date)} · ${e.time} · ${e.venue}</p>
      <p style="color:var(--muted);font-size:.9rem;margin:.5rem 0">${e.desc}</p>
      <p class="meta">${e.slots} slots</p>
      <div style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn primary rsvp" data-id="${e.id}">RSVP</button>
        <button class="btn cal-btn" data-id="${e.id}">Add to calendar</button>
      </div>
    </article>`;
}

function blogCard(b) {
  return `
    <article class="card" data-tag="${b.tag}">
      <a href="#" style="color:inherit">
        <span class="badge">${b.tag}</span>
        <h3 style="margin:.6rem 0 .3rem">${b.title}</h3>
        <p style="color:var(--muted);font-size:.9rem">${b.excerpt}</p>
        <p class="meta">${b.author} · ${fmtDate(b.date)} · ${b.minutes} min read</p>
      </a>
    </article>`;
}

function memberCard(m) {
  return `
    <article class="card">
      <span class="badge accent">${m.domain}</span>
      <h3 style="margin:.6rem 0 .2rem">${m.name}</h3>
      <p style="color:var(--muted)">${m.role}</p>
      <p class="meta" style="margin-top:.5rem">${m.handle}</p>
    </article>`;
}

function setTabs(listSel, kw) {
  document.querySelectorAll(`${listSel} > article`).forEach((c) => {
    c.hidden = kw !== "all" && c.dataset.tag !== kw;
  });
}

async function init() {
  const [btn, menu] = ["#menu-btn", ".nav-links"].map((s) => document.querySelector(s));
  btn?.addEventListener("click", () => menu.classList.toggle("open"));

  const dialog = document.getElementById("rsvp");
  document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t.matches(".rsvp")) {
      const title = t.closest(".card").querySelector("h3").textContent;
      dialog.querySelector("p").textContent = `You're signing up for “${title}”.`;
      dialog.showModal();
    }
    if (t.matches(".tab")) {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      document.querySelectorAll("[data-tabs]").forEach((l) => setTabs("." + l.className.split(" ")[0], t.dataset.filter));
    }
  });
  document.getElementById("rsvp-close")?.addEventListener("click", () => dialog?.close());

  let data;
  try {
    data = await loadData();
  } catch {
    return;
  }
  if (document.querySelector("[data-render=stats]")) renderHome(data);
  const el = document.querySelector("[data-events]"); if (el) el.innerHTML = data.events.map(eventCard).join("");
  const eb = document.querySelector("[data-blogs]"); if (eb) eb.innerHTML = data.blogs.map(blogCard).join("");
  const et = document.querySelector("[data-team]"); if (et) et.innerHTML = data.team.map(memberCard).join("");
}

function renderHome(d) {
  document.querySelector("[data-render=next-event]").innerHTML =
    d.events[0] ? `<h3>${d.events[0].title}</h3><p class="meta">${fmtDate(d.events[0].date)} · ${d.events[0].venue}</p>` : "TBA";
  const stats = {
    members: d.team.length + 27, events: d.events.length, blogs: d.blogs.length,
  };
  Object.entries(stats).forEach(([k, v]) => {
    document.querySelector(`[data-stat="${k}"]`).textContent = v;
  });
}

document.addEventListener("DOMContentLoaded", init);
