// Code golf — multi-language (JS, Python), easy daily puzzles, workers + Pyodide.
(function () {
  var mount = document.querySelector("[data-golf]");
  if (!mount) return;
  var PUZZLES = [
    { prompt: "Return the sum of two numbers.", tests: [[2, 3, 5], [10, -4, 6], [0, 0, 0]] },
    { prompt: "Return true if n is even, else false.", tests: [[4, true], [7, false], [0, true]] },
    { prompt: "Return the larger of two numbers.", tests: [[3, 8, 8], [9, 2, 9], [-1, -5, -1]] },
    { prompt: "Return the first letter of a string.", tests: [["hello", "h"], ["Mine", "M"], ["x", "x"]] },
    { prompt: "Return n multiplied by 2.", tests: [[5, 10], [-3, -6], [0, 0]] },
    { prompt: "Return the length of an array.", tests: [[[1, 2, 3], 3], [[], 0], [["a"], 1]] },
    { prompt: "Return true if string contains 'a' (case-insensitive).", tests: [["cat", true], ["dog", false], ["A", true]] },
    { prompt: "Return the last item of an array.", tests: [[[7, 8, 9], 9], [[1], 1], [["x", "y"], "y"]] },
    { prompt: "Return true if a > b, else false.", tests: [[5, 3, true], [2, 2, false], [-1, -2, true]] },
    { prompt: "Return a string reversed.", tests: [["abc", "cba"], ["hi", "ih"], ["a", "a"]] },
    { prompt: "Return the sum of an array of numbers.", tests: [[[1, 2, 3], 6], [[], 0], [[-1, 1], 0]] },
    { prompt: "Return true if number is positive (or zero).", tests: [[3, true], [-2, false], [0, true]] },
  ];
  var P = PUZZLES[Math.floor(Date.now() / 86400000) % PUZZLES.length];
  var LANG = "js", pyReady = null;

  mount.innerHTML =
    '<div class="golf-card"><h3 class="golf-title">TODAY\'S 1-MINUTE MINING EXPEDITION</h3>' +
    '<p class="golf-prompt">' + P.prompt + "</p>" +
    '<pre class="golf-tests">' + P.tests.map(function (t, i) {
      return "T" + (i + 1) + "  " + JSON.stringify(t.slice(0, -1)) + " -> " + JSON.stringify(t[t.length - 1]);
    }).join("\n") + "</pre>" +
    '<div class="golf-lang-row"><label class="golf-lang-lbl">LANGUAGE</label><div class="golf-lang">' +
    '<button type="button" class="golf-lang-btn active" data-lang="js">JS</button>' +
    '<button type="button" class="golf-lang-btn" data-lang="py">PY</button></div></div>' +
    '<textarea class="golf-code" spellcheck="false" rows="6"></textarea>' +
    '<div class="golf-row"><span class="golf-bytes">0 bytes</span><button class="btn golf-run" type="button">RUN</button></div>' +
    '<pre class="golf-log"></pre>' +
    '<div class="golf-board"><h4>Today\'s Miners</h4><ol class="golf-list"></ol></div></div>';

  var ta = mount.querySelector(".golf-code"), bytes = mount.querySelector(".golf-bytes"),
    log = mount.querySelector(".golf-log"), list = mount.querySelector(".golf-list"),
    runBtn = mount.querySelector(".golf-run");
  var SAMPLES = { js: "function solve() {\n  // your code\n}", py: "def solve():\n    # your code\n    pass" };

  // mount code editor overlay
  var wrap = document.createElement("div");
  wrap.className = "ce-wrap";
  ta.parentNode.insertBefore(wrap, ta);
  ta.classList.add("ce-input");
  wrap.appendChild(ta);
  var gut = document.createElement("div"); gut.className = "ce-gut"; wrap.appendChild(gut);
  var hl = document.createElement("pre"); hl.className = "ce-hl"; hl.setAttribute("aria-hidden", "true"); wrap.appendChild(hl);
  function re() { if (window.CCLTCE_CE) CCLTCE_CE.render(hl, gut, ta, LANG); }
  function onChange() { re(); refresh(); }

  function setLang(l) {
    LANG = l;
    mount.querySelectorAll(".golf-lang-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.lang === l); });
    ta.value = SAMPLES[l]; re(); refresh();
  }
  mount.querySelectorAll(".golf-lang-btn").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); if (window.CCLTCE_SFX) CCLTCE_SFX.click(); });
  });

  function countBytes(s) { return s.replace(/\/\/[^\n]*/g, "").replace(/#[^\n]*/g, "").replace(/\s+/g, "").length; }
  function refresh() { bytes.textContent = countBytes(ta.value) + " bytes"; }
  ta.addEventListener("input", onChange);
  ta.addEventListener("scroll", function () { hl.scrollTop = ta.scrollTop; gut.scrollTop = ta.scrollTop; });
  if (window.CCLTCE_CE_KEYS) CCLTCE_CE_KEYS.attach(ta, onChange);
  setLang("js");

  function board() {
    var b = []; try { b = JSON.parse(localStorage.getItem("ccltce-miners") || "[]"); } catch (e) {}
    b.sort(function (a, c) { return a.bytes - c.bytes; });
    list.innerHTML = b.slice(0, 5).map(function (m) { return "<li>" + m.handle + " — " + m.bytes + "B</li>"; }).join("") || "<li>no miners yet — be first</li>";
  }
  board();

  function burst() {
    var c = document.createElement("canvas"); c.className = "golf-fx"; document.body.appendChild(c);
    var g = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    var parts = [], COL = ["#ffaa00", "#17dd62", "#ff2222", "#ffff55"];
    for (var i = 0; i < 40; i++) parts.push({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, s: 4 + (Math.random() * 7) | 0, c: COL[i % 4] });
    var t0 = performance.now();
    (function frame(now) {
      if ((now - t0) / 1000 > 2.2) { c.remove(); return; }
      g.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) { p.vy += 0.5; p.x += p.vx; p.y += p.vy; if (p.y > innerHeight - p.s) { p.y = innerHeight - p.s; p.vy *= -0.55; } g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
      requestAnimationFrame(frame);
    })(t0);
  }

  function finishPass(n) {
    log.textContent += "ALL TESTS PASS — " + n + " bytes\n"; log.classList.add("golf-ok"); burst();
    if (window.CCLTCE_SFX) CCLTCE_SFX.win();
    var handle = localStorage.getItem("ccltce-handle") || ("miner-" + ((Math.random() * 900 + 100) | 0));
    localStorage.setItem("ccltce-handle", handle);
    var b = []; try { b = JSON.parse(localStorage.getItem("ccltce-miners") || "[]"); } catch (e) {}
    b.push({ handle: handle, bytes: n }); localStorage.setItem("ccltce-miners", JSON.stringify(b)); board();
    if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(100);
  }
  function report(got, i) {
    var exp = P.tests[i][P.tests[i].length - 1];
    var ok = got === exp;
    log.textContent += (ok ? "PASS" : "FAIL") + " T" + (i + 1) + " got " + JSON.stringify(got) + " want " + JSON.stringify(exp) + "\n";
    if (!ok) { log.classList.add("golf-err"); if (window.CCLTCE_SFX) CCLTCE_SFX.error(); throw new Error("fail"); }
  }
  function runJS() {
    try {
      var fn = new Function(ta.value + "\nreturn solve;")();
      P.tests.forEach(function (t, i) { report(fn.apply(null, t.slice(0, -1)), i); });
      finishPass(countBytes(ta.value));
    } catch (err) {
      if (log.textContent.indexOf("PASS") === -1) { log.textContent += "ERROR: " + (err.message || "runtime") + "\n"; log.classList.add("golf-err"); if (window.CCLTCE_SFX) CCLTCE_SFX.error(); }
    }
  }
  function loadPy() {
    if (pyReady) return pyReady;
    pyReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      s.onload = function () { window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" }).then(resolve).catch(reject); };
      s.onerror = reject; document.head.appendChild(s);
    });
    return pyReady;
  }
  async function runPY() {
    log.textContent = "loading python runtime...\n";
    try {
      var py = await loadPy();
      var calls = P.tests.map(function (t) {
        var args = t.slice(0, -1).map(function (a) { return JSON.stringify(a); }).join(", ");
        return "__results.append(solve(" + args + "))";
      }).join("\n");
      var out = py.runPython(ta.value + "\nimport json\n__results = []\n" + calls + "\njson.dumps(__results)");
      var got = JSON.parse(out);
      log.textContent = "";
      got.forEach(function (v, i) { report(v, i); });
      finishPass(countBytes(ta.value));
    } catch (err) {
      log.textContent += "ERROR: " + (err.message || err.toString()) + "\n"; log.classList.add("golf-err");
      if (window.CCLTCE_SFX) CCLTCE_SFX.error();
    }
  }
  runBtn.addEventListener("click", function () {
    log.textContent = "mining...\n"; log.className = "golf-log";
    if (LANG === "py") runPY(); else runJS();
  });
})();
