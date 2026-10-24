// CLI terminal overlay — Ctrl+`, Ctrl+~, Ctrl+\ toggles; VFS from term-vfs.js.
(function () {
  var gsap = window.gsap, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hud, out, input, cwd, hist, hIdx, sessionHash, open = false;
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function print(text, cls) {
    out.appendChild(el("div", "term-line" + (cls ? " " + cls : ""), text));
    out.scrollTop = out.scrollHeight;
  }
  function hash() {
    var s = "";
    for (var i = 0; i < 8; i++) s += "0123456789abcdef"[(Math.random() * 16) | 0];
    return s;
  }
  function xp(n) { if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(n); }
  function need(c, u) { print("usage: " + c + " " + u, "term-err"); }
  var HELP = ("COMMANDS\n  help              this table\n  ls                list directory\n  cd [dir]          change directory\n" +
    "  cat [file]        print file\n  pwd               print cwd\n  clear             clear screen\n  whoami            your session\n" +
    "  whois [name]      member stats\n  sudo join         registration\n  decode [hex]      xor-0x15 decode\n" +
    "  matrix            rune rain (6s)\n  spawn [thing]     drop a voxel\n  sfx [on|off]      sound effects\n  unlock [phrase]   secret dungeon").split("\n");
  var CMDS = {
    help: function () { HELP.forEach(print); },
    ls: function () {
      var n = CCLTCE_VFS.get(cwd);
      if (n && n.type === "dir") print(n.kids.join("   "));
      else print("not a directory", "term-err");
    },
    cd: function (arg) {
      if (!arg || arg === "~" || arg === "/home/ccltce") { cwd = "/home/ccltce"; return; }
      var t = cwd === "/" ? "/" + arg : cwd + "/" + arg;
      var n = CCLTCE_VFS.get(t.replace(/\/$/, ""));
      if (n && n.type === "dir") cwd = t.replace(/\/$/, "");
      else print("no such dir: " + arg, "term-err");
    },
    cat: function (arg) {
      if (!arg) return need("cat", "[file]");
      var n = CCLTCE_VFS.get(cwd === "/home/ccltce" ? arg : cwd + "/" + arg);
      if (n && n.type === "file") print(n.body);
      else print("no such file: " + arg, "term-err");
    },
    pwd: function () { print(cwd); },
    clear: function () { out.innerHTML = ""; },
    whoami: function () { print("guest-" + sessionHash + "  Guest Explorer [Lvl " + (window.CCLTCE_HUD ? CCLTCE_HUD.level() : 1) + "]"); },
    whois: function (arg) {
      if (!arg) return need("whois", "[name]");
      var m = CCLTCE_VFS.members().filter(function (x) {
        return x.name.toLowerCase().indexOf(arg.toLowerCase()) > -1;
      })[0];
      if (!m) return print("no member: " + arg, "term-err");
      ["— " + m.name + " —", "  role    " + m.role, "  track   " + m.track,
       "  stack   " + m.stack.join(", "), m.github ? "  github  github.com/" + m.github : "",
       "  lore    " + m.bio].filter(Boolean).forEach(print);
    },
    sudo: function (arg) {
      if (arg !== "join") return print("sudo: unknown op", "term-err");
      print("[ADMIN] opening registration channels...", "term-gold");
      print("  -> https://discord.gg/ccltce");
      print("  -> https://forms.gle/ccltce-week");
      if (window.CCLTCE_SFX) CCLTCE_SFX.levelUp();
      xp(25);
    },
    decode: function (arg) {
      if (!arg) return need("decode", "[hex]");
      try { print(CCLTCE_VFS.decode(arg.replace(/\s+/g, ""))); } catch (e) { print("bad hex", "term-err"); }
    },
    matrix: function () {
      if (window.CCLTCE_EGG) CCLTCE_EGG.matrix(6);
      print("R0xNEF runic cascade engaged...", "term-green");
      xp(25);
    },
    spawn: function (arg) {
      if (!arg) return need("spawn", "[ore|apple|book|pickaxe]");
      if (window.CCLTCE_VOXEL) CCLTCE_VOXEL.spawn(arg);
      print("spawned " + arg, "term-green");
      xp(25);
    },
    sfx: function (arg) {
      if (!window.CCLTCE_SFX) return print("no sfx engine", "term-err");
      if (arg === "on" || arg === "off") {
        if (CCLTCE_SFX.enabled() !== (arg === "on")) CCLTCE_SFX.toggle();
        print("sfx " + arg, "term-green");
      } else print("sfx is " + (CCLTCE_SFX.enabled() ? "on" : "off"));
    },
    unlock: function (arg) {
      if (arg !== "secret_dungeon") return print("ACCESS DENIED", "term-err");
      print("ACCESS GRANTED — welcome to the dungeon.", "term-gold");
      xp(200);
      if (window.CCLTCE_HUD) CCLTCE_HUD.relic("Void Feather");
    },
  };
  function run(raw) {
    var line = raw.trim();
    print("> " + line, "term-in");
    if (!line) return;
    hist.push(line); hIdx = hist.length;
    var sp = line.split(/\s+/), cmd = sp[0].toLowerCase(), arg = sp.slice(1).join(" ");
    if (CMDS[cmd]) CMDS[cmd](arg);
    else print(cmd + ": command not found (try help)", "term-err");
    if (window.CCLTCE_SFX) CCLTCE_SFX.type();
    if (cmd !== "clear") xp(5);
  }
  function toggle() {
    open = !open;
    hud.hidden = !open;
    if (open) {
      input.focus();
      if (gsap && !reduce) gsap.fromTo(hud, { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "steps(8)" });
    } else if (gsap && !reduce) {
      gsap.to(hud, { yPercent: -100, opacity: 0, duration: 0.25, ease: "steps(6)", onComplete: function () { hud.hidden = true; } });
    }
  }
  function mount() {
    hud = el("div", "term-hud");
    hud.id = "terminal-hud";
    hud.hidden = true;
    hud.setAttribute("aria-label", "CLI terminal");
    var bar = el("div", "term-bar");
    bar.appendChild(el("span", null, "CCLTCE SHELL — /bin/bash"));
    var x = el("button", "term-x", "✕");
    x.type = "button";
    x.addEventListener("click", toggle);
    bar.appendChild(x);
    out = el("div", "term-out");
    print("CCLTCE SHELL v1.0 — type help for commands");
    var row = el("div", "term-row");
    row.appendChild(el("span", "term-prompt", "$"));
    input = el("input", "term-in-line");
    input.spellcheck = false;
    input.autocomplete = "off";
    row.appendChild(input);
    hud.append(bar, out, row);
    document.body.appendChild(hud);
    cwd = CCLTCE_VFS.root; hist = []; hIdx = 0; sessionHash = hash();
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { run(input.value); input.value = ""; }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hIdx > 0) input.value = hist[--hIdx]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); input.value = hIdx < hist.length - 1 ? hist[++hIdx] : (hIdx = hist.length, ""); }
    });
  }
  document.addEventListener("keydown", function (e) {
    var bare = e.key === "`" && !e.ctrlKey && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "");
    if ((e.ctrlKey && (e.key === "`" || e.key === "~" || e.key === "\\")) || bare) { e.preventDefault(); if (hud) toggle(); }
  });
  window.CCLTCE_TERM = { mount: mount, print: print, toggle: toggle };
})();
