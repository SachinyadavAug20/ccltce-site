// Shared page chrome — SVG wordmark, nav and a simple footer.
// Classic (non-module) script so the nav paints on first frame, no flash.
//
// Wordmark style guide
//   grid    24x24 mark, 2px stroke, round caps, 9px corner radius
//   type    mono, uppercase, 0.62em tracking
//   colour  currentColor; hover -> --accent, per-letter wave (GSAP)
(function () {
  const ICONS = {
    github: "M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.89-.01-1.74-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2z",
    x: "M18.9 2H22l-6.77 7.74L22.8 22h-6.5l-5.1-6.66L5.4 22H2.3l7.25-8.29L1.6 2h6.67l4.6 6.1L18.9 2Zm-1.1 18.1h1.7L6.3 3.8H4.5L17.8 20.1Z",
    linkedin: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-.95 1.83-1.96 3.77-1.96 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.9-3.07-1.9 0-2.2 1.46-2.2 2.97V21h-4V9Z",
    instagram: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.8 3.8 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9c-.42-.42-.68-.96-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.76 6.76 0 0 0 12 5.25Zm0 11.14A4.39 4.39 0 1 1 16.39 12 4.4 4.4 0 0 1 12 16.39Zm6.99-11.35a1.57 1.57 0 1 1-1.57-1.57 1.57 1.57 0 0 1 1.57 1.57Z",
    mail: "M3 5h18v14H3V5Zm9 7.2L4.6 7.4v.3L12 13.6l7.4-5.9v-.3L12 12.2Z",
    pin: "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
    star: "M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45l-5.81 3.05L7.3 14.03 2.6 9.45l6.5-.95L12 2.6Z",
  };

  const svg = (name, size) =>
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' +
    ICONS[name] + '"/></svg>';

  // --- wordmark -------------------------------------------------------------
  function wordLine(text, x, y, size, cls) {
    const adv = size * 1.14; // >1em glyph advance so Press Start 2P letters never touch
    let out = '<g class="' + cls + '">';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === " ") {
        out += '<text class="wm-c" style="--i:' + i + '" x="' + (x + adv * i) + '" y="' + y + '"> </text>';
        continue;
      }
      out += '<text class="wm-c" style="--i:' + i + '" font-size="' + size + '" x="' + (x + adv * i) + '" y="' + y + '">' + ch + "</text>";
    }
    return out + "</g>";
  }

  // WebP-first logo with PNG fallback (196KB → 28KB for the 99% case)
  const LOGO_PIC =
    '<picture><source type="image/webp" srcset="assets/img/ccltce-logo.webp" />' +
    '<img class="brand-logo" src="assets/img/ccltce-logo.png" alt="" width="400" height="400" /></picture>';
  const LOGO = LOGO_PIC;
  const FOOT_LOGO = LOGO_PIC.replace('class="brand-logo"', 'class="brand-logo foot-logo" loading="lazy" decoding="async"');
  const WORDMARK = '<svg class="wordmark" viewBox="0 0 146 24" role="img" aria-label="Coding Club">' + wordLine("CODING CLUB", 5, 18, 11, "wm-l2") + "</svg>";

  const LINKS = [
    ["events.html", "Events"],
    ["team.html", "Team"],
    ["community.html", "Community"],
    ["notices.html", "Notices"],
  ];

  const NAV =
    '<nav class="nav" aria-label="Primary">' +
    '<a class="brand" href="index.html" aria-label="Coding Club home">' + LOGO + WORDMARK + "</a>" +
    '<ul class="nav-links">' +
    LINKS.map(function (l) { return '<li><a href="' + l[0] + '">' + l[1] + "</a></li>"; }).join("") +
    "</ul>" +
    '<span class="nav-tools">' +
    '<span class="nav-auth" data-auth-slot><a href="login.html">Login</a></span>' +
    '<button class="nav-burger" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu">' +
    "<span></span><span></span><span></span></button></span></nav>";

  const MOBILE =
    '<div class="mobile-menu" id="mobile-menu" hidden>' +
    '<a href="index.html">Home</a>' +
    LINKS.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + "</a>"; }).join("") +
    "</div>";

  const SOCIALS = [
    ["github", "https://github.com/CCLTCE", "GitHub", "ic-gh"],
    ["x", "https://x.com/ccltce", "X", "ic-x"],
    ["linkedin", "https://www.linkedin.com/company/ccltce/", "LinkedIn", "ic-li"],
    ["instagram", "https://instagram.com/ccltce", "Instagram", "ic-ig"],
  ];

  const FOOTER =
    '<div class="foot-row">' +
    '<span class="foot-brand">' + FOOT_LOGO + "Coding Club &middot; LTCE</span>" +
    '<nav class="foot-links" aria-label="Footer">' +
    '<a href="events.html">Events</a><a href="team.html">Team</a>' +
    '<a href="community.html">Community</a>' +
    '<a href="notices.html">Notices</a>' +
    "</nav>" +
    '<span class="foot-social">' +
    SOCIALS.map(function (s) {
      return '<a href="' + s[1] + '" target="_blank" rel="noopener" aria-label="' + s[2] + '" class="' + s[3] + '">' + svg(s[0], 15) + "</a>";
    }).join("") +
    "</span></div>" +
    '<p class="foot-copy">&copy; ' + new Date().getFullYear() + " CCLTCE &middot; Lokmanya Tilak College of Engineering, Koparkhana, Navi Mumbai</p>";

  function markActive() {
    var here = (location.pathname.split("/").pop() || "index").toLowerCase().replace(/\.html$/, "");
    document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop().toLowerCase().replace(/\.html$/, "");
      if (href && href === here) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function injectScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  function loadAuth() {
    // warm the Supabase connection before auth.js even parses (saves a DNS+TLS round trip)
    var pc = document.createElement("link");
    pc.rel = "preconnect";
    pc.href = "https://lzxkzvdnqhipbyrcchge.supabase.co";
    document.head.appendChild(pc);

    // library + config fetch in parallel; auth.js awaits both (self-loads if it wins the race)
    window.__CCLTCE_LIB__ = injectScript("assets/vendor/supabase.min.js");
    window.__CCLTCE_CFG__ = injectScript("assets/js/supabase-config.js");
    var m = document.createElement("script");
    m.type = "module";
    m.src = "assets/js/auth.js";
    document.body.appendChild(m);
  }

  function loadAnalytics() {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    var s1 = document.createElement("script");
    s1.defer = true;
    s1.src = "/_vercel/insights/script.js";
    document.head.appendChild(s1);
    var s2 = document.createElement("script");
    s2.defer = true;
    s2.src = "/_vercel/speed-insights/script.js";
    document.head.appendChild(s2);
  }

  function mount() {
    var head = document.querySelector(".nav-wrap");
    if (head) head.innerHTML = NAV + MOBILE;

    var foot = document.querySelector("footer");
    if (foot) foot.innerHTML = FOOTER;

    markActive();
    loadAuth();
    loadAnalytics();

    var burger = document.querySelector(".nav-burger");
    var menu = document.getElementById("mobile-menu");
    if (!burger || !menu) return;

    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        burger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        burger.focus();
      }
    });
  }

  window.CCLTCE = { mount: mount };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
