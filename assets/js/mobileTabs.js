// Mobile app shell — fixed bottom tab bar (< 900px). Injected once, hides on desktop.
(function () {
  var TABS = [
    ["index.html", "Home", "M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z"],
    ["events.html", "Events", "M7 2v2H4v16h16V4h-3V2h-2v2H9V2H7zm11 6H6v10h12V8z"],
    ["team.html", "Team", "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 13c-3 0-6 1.5-6 4v2h12v-2c0-2.5-3-4-6-4zm8 0c-.5 0-1 0-1.5.1 1.3.9 2.5 2.2 2.5 3.9v2h5v-2c0-2.5-3-4-6-4z"],
    ["challenges.html", "Play", "M8 5v14l11-7L8 5z"],
    ["notices.html", "News", "M4 4h13l3 3v13H4V4zm11 1v3h3l-3-3h-0zM6 8v2h9V8H6zm0 4v2h9v-2H6zm0 4v2h6v-2H6z"],
  ];
  function svg(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  function mount() {
    if (document.querySelector(".tabbar")) return;
    var here = (location.pathname.split("/").pop() || "index").toLowerCase().replace(/\.html$/, "");
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
