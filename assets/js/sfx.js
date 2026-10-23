// Procedural Web Audio chiptune SFX + ambient music — no external files.
(function () {
  var ctx = null, master = null, musicGain = null, musicOn = localStorage.getItem("ccltce-music") !== "off";
  var sfxOn = localStorage.getItem("ccltce-sfx") !== "off";
  var musicTimer = null, musicNodes = [];

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.18; musicGain.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function env(g, t, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f0, f1, dur, peak, when) {
    if (!sfxOn) return;
    var c = ac(), t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak || 0.08, dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, peak) {
    if (!sfxOn) return;
    var c = ac(), t = c.currentTime, n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = "lowpass"; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(320, t + dur);
    g.gain.value = peak || 0.1; s.connect(f).connect(g).connect(master); s.start(t);
  }

  // ambient chiptune loop — soft Am pentatonic pad + bass pulse
  var SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
  var BASS = [55, 65.41, 73.42, 82.41];
  var step = 0;
  function musicTick() {
    if (!musicOn || !ctx) return;
    var t = ctx.currentTime + 0.05;
    // pad note
    var freq = SCALE[step % SCALE.length];
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g).connect(musicGain); o.start(t); o.stop(t + 0.6);
    // bass every 4 steps
    if (step % 4 === 0) {
      var bo = ctx.createOscillator(), bg = ctx.createGain();
      bo.type = "sine"; bo.frequency.setValueAtTime(BASS[(step / 4) % BASS.length], t);
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      bo.connect(bg).connect(musicGain); bo.start(t); bo.stop(t + 0.45);
      musicNodes.push(bo);
    }
    musicNodes.push(o);
    step++;
    // clean old nodes
    if (musicNodes.length > 40) {
      musicNodes.splice(0, 20).forEach(function (n) { try { n.disconnect(); } catch (e) {} });
    }
  }
  function startMusic() {
    if (musicTimer) return;
    ac();
    musicTimer = setInterval(musicTick, 480);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    musicNodes.forEach(function (n) { try { n.stop(); n.disconnect(); } catch (e) {} });
    musicNodes = [];
  }

  window.addEventListener("pointerdown", function once() {
    if (musicOn) startMusic();
    window.removeEventListener("pointerdown", once);
  }, { once: true, passive: true });

  window.CCLTCE_SFX = {
    enabled: function () { return sfxOn; },
    musicOn: function () { return musicOn; },
    toggle: function () { sfxOn = !sfxOn; localStorage.setItem("ccltce-sfx", sfxOn ? "on" : "off"); if (sfxOn) this.click(); return sfxOn; },
    toggleMusic: function () {
      musicOn = !musicOn; localStorage.setItem("ccltce-music", musicOn ? "on" : "off");
      if (musicOn) startMusic(); else stopMusic();
      return musicOn;
    },
    click: function () { tone("square", 800, 200, 0.05, 0.05); },
    type: function () { tone("square", 1400, 1100, 0.025, 0.02); },
    levelUp: function () {
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
    win: function () { this.levelUp(); noise(0.2, 0.06); },
    getAnalyser: function () {
      if (!ctx) return null;
      if (!this._an) {
        this._an = ctx.createAnalyser(); this._an.fftSize = 256;
        master.connect(this._an);
      }
      return this._an;
    },
  };
})();
