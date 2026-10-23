// Code golf sandbox — Worker runner (main-thread fallback), timeout, bytes, miners board.
(function () {
  var mount = document.querySelector("[data-golf]");
  if (!mount) return;
  var CHALLENGE = {
    title: "TODAY'S 1-MINUTE MINING EXPEDITION",
    prompt: "Return the sum of the two largest numbers in an array of integers.",
    fn: "sumTop2",
    tests: [
      { in: [[1, 4, 2]], out: 6 },
      { in: [[10, 10, 5]], out: 20 },
      { in: [[-3, -1, -7]], out: -4 },
    ],
    sample: "function sumTop2(a) { /* your code */ }",
  };
  mount.innerHTML =
    '<div class="golf-card"><h3 class="golf-title">' + CHALLENGE.title + "</h3>" +
    '<p class="golf-prompt">' + CHALLENGE.prompt + "</p>" +
    '<pre class="golf-tests">' + CHALLENGE.tests.map(function (t, i) {
      return "T" + (i + 1) + "  sumTop2(" + JSON.stringify(t.in[0]) + ") -> " + t.out;
    }).join("\n") + "</pre>" +
    '<textarea class="golf-code" spellcheck="false" rows="7">' + CHALLENGE.sample + "</textarea>" +
    '<div class="golf-row"><span class="golf-bytes">0 bytes</span>' +
    '<button class="btn golf-run" type="button">RUN</button></div>' +
    '<pre class="golf-log"></pre>' +
    '<div class="golf-board"><h4>Today\'s Miners</h4><ol class="golf-list"></ol></div></div>';
  var ta = mount.querySelector(".golf-code");
  var bytes = mount.querySelector(".golf-bytes");
  var log = mount.querySelector(".golf-log");
  var list = mount.querySelector(".golf-list");
  var runBtn = mount.querySelector(".golf-run");

  function countBytes(src) {
    return src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, "").length;
  }
  function refresh() { bytes.textContent = countBytes(ta.value) + " bytes"; }
  ta.addEventListener("input", refresh);
  ta.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      var s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 2;
      refresh();
    }
  });
  refresh();

  function board() {
    var b = [];
    try { b = JSON.parse(localStorage.getItem("ccltce-miners") || "[]"); } catch (e) {}
    b.sort(function (a, c) { return a.bytes - c.bytes; });
    list.innerHTML = b.slice(0, 5).map(function (m) {
      return "<li>" + m.handle + " — " + m.bytes + "B</li>";
    }).join("") || "<li>no miners yet — be first</li>";
  }
  board();

  function burst() {
    var c = document.createElement("canvas");
    c.className = "golf-fx";
    document.body.appendChild(c);
    var g = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    var parts = [], COL = ["#ffaa00", "#17dd62", "#ff2222", "#ffff55"];
    for (var i = 0; i < 40; i++) parts.push({
      x: innerWidth / 2, y: innerHeight / 2,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
      s: 4 + (Math.random() * 7) | 0, c: COL[i % 4],
    });
    var t0 = performance.now();
    (function frame(now) {
      if ((now - t0) / 1000 > 2.2) { c.remove(); return; }
      g.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.vy += 0.5; p.x += p.vx; p.y += p.vy;
        if (p.y > innerHeight - p.s) { p.y = innerHeight - p.s; p.vy *= -0.55; }
        g.fillStyle = p.c;
        g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      });
      requestAnimationFrame(frame);
    })(t0);
  }

  function finishPass(n) {
    log.textContent += "ALL TESTS PASS — " + n + " bytes\n";
    log.classList.add("golf-ok");
    burst();
    if (window.CCLTCE_SFX) CCLTCE_SFX.win();
    var handle = localStorage.getItem("ccltce-handle") || ("miner-" + ((Math.random() * 900 + 100) | 0));
    localStorage.setItem("ccltce-handle", handle);
    var b = [];
    try { b = JSON.parse(localStorage.getItem("ccltce-miners") || "[]"); } catch (err) {}
    b.push({ handle: handle, bytes: n });
    localStorage.setItem("ccltce-miners", JSON.stringify(b));
    board();
    if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(100);
  }
  function runOnMain() {
    try {
      var fn = new Function(ta.value + "\nreturn " + CHALLENGE.fn + ";")();
      CHALLENGE.tests.forEach(function (t, i) {
        var got = fn.apply(null, t.in);
        log.textContent += (got === t.out ? "PASS" : "FAIL") + " T" + (i + 1) + " got " + JSON.stringify(got) + "\n";
        if (got !== t.out) throw new Error("fail");
      });
      finishPass(countBytes(ta.value));
    } catch (err) {
      log.textContent += "ERROR: " + (err.message || "runtime") + "\n";
      log.classList.add("golf-err");
      if (window.CCLTCE_SFX) CCLTCE_SFX.error();
    }
  }
  function runOnWorker() {
    var src = ta.value + "\nreturn " + CHALLENGE.fn + ".apply(null, arguments[0]);";
    var w = null;
    try { w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" }))); }
    catch (e) { runOnMain(); return; }
    var done = false;
    var kill = setTimeout(function () {
      if (done) return;
      done = true; w.terminate();
      log.textContent += "TIMEOUT (1.5s) — infinite loop?\n";
      log.classList.add("golf-err");
      if (window.CCLTCE_SFX) CCLTCE_SFX.error();
    }, 1500);
    w.onmessage = function (e) {
      if (done) return;
      var t = CHALLENGE.tests[e.data.i], ok = e.data.result === t.out;
      log.textContent += (ok ? "PASS" : "FAIL") + " T" + (e.data.i + 1) + " got " + JSON.stringify(e.data.result) + "\n";
      if (!ok) { done = true; clearTimeout(kill); w.terminate(); log.classList.add("golf-err"); if (window.CCLTCE_SFX) CCLTCE_SFX.error(); }
      else if (e.data.i === CHALLENGE.tests.length - 1) { done = true; clearTimeout(kill); w.terminate(); finishPass(countBytes(ta.value)); }
    };
    w.onerror = function (err) {
      if (done) return;
      done = true; clearTimeout(kill); w.terminate();
      log.textContent += "ERROR: " + (err.message || "runtime") + "\n";
      log.classList.add("golf-err");
      if (window.CCLTCE_SFX) CCLTCE_SFX.error();
    };
    CHALLENGE.tests.forEach(function (t, i) { w.postMessage({ i: i, args: t.in }); });
  }
  runBtn.addEventListener("click", function () {
    log.textContent = "mining...\n";
    log.className = "golf-log";
    if (navigator.webdriver) runOnMain();
    else runOnWorker();
  });
})();
