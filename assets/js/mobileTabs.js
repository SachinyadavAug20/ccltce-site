// Mobile app shell — fixed bottom tab bar (< 900px). Injected once, hides on desktop.
(function () {
  var TABS = [
    ["index.html", "Home", "M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z"],
    ["events.html", "Events", "M7 2v2H4v16h16V4h-3V2h-2v2H9V2H7zm11 6H6v10h12V8z"],
    ["challenges.html", "Play", "M8 5v14l11-7L8 5z"],
    ["community.html", "Community", "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"],
    ["team.html", "Team", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"],
  ];
  function svg(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  function mount() {
    if (document.querySelector(".tabbar")) return;
    var raw = location.pathname.split("/").pop() || "index";
    var here = (raw.toLowerCase().replace(/\.html$/, "") || "index");
    if (here === "" || here === "/") here = "index";
    var bar = document.createElement("nav");
    bar.className = "tabbar";
    bar.setAttribute("aria-label", "App tabs");
    bar.innerHTML = TABS.map(function (t) {
      var slug = t[0].toLowerCase().replace(/\.html$/, "");
      var active = slug === here;
      return '<a class="tab' + (active ? " active" : "") + '" href="' + t[0] + '"' +
        (active ? ' aria-current="page"' : "") + ">" + svg(t[2]) + "<span>" + t[1] + "</span></a>";
    }).join("");
    document.body.appendChild(bar);
    // reveal after first paint so it slides up like an app shell
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.classList.add("on"); });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
