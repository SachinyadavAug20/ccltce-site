// Procedural Web Audio chiptune SFX — no external files, zero blue.
(function () {
  var ctx = null;
  var on = localStorage.getItem("ccltce-sfx") !== "off";

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function env(g, t, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f0, f1, dur, peak, when) {
    if (!on) return;
    var c = ac(), t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak || 0.08, dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, peak) {
    if (!on) return;
    var c = ac(), t = c.currentTime, n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf;
    f.type = "lowpass";
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(320, t + dur);
    g.gain.value = peak || 0.1;
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  }

  window.CCLTCE_SFX = {
    enabled: function () { return on; },
    toggle: function () {
      on = !on;
      localStorage.setItem("ccltce-sfx", on ? "on" : "off");
      if (on) this.click();
      return on;
    },
    click: function () { tone("square", 800, 200, 0.05, 0.05); },
    type: function () { tone("square", 1400, 1100, 0.025, 0.02); },
    levelUp: function () {
      // C5 E5 G5 C6 triangle arpeggio
      tone("triangle", 523.25, 0, 0.14, 0.09, 0);
      tone("triangle", 659.25, 0, 0.14, 0.09, 0.15);
      tone("triangle", 783.99, 0, 0.14, 0.09, 0.3);
      tone("triangle", 1046.5, 0, 0.28, 0.1, 0.45);
    },
    mine: function () { noise(0.12, 0.12); },
    error: function () {
      tone("sawtooth", 120, 90, 0.2, 0.07);
      tone("sawtooth", 126, 96, 0.2, 0.05, 0.02);
    },
    win: function () {
      this.levelUp();
      noise(0.2, 0.06);
    },
  };
})();
