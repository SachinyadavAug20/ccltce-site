// Minimal audio analyser for the ASCII background visualizer.
// Browsers block AudioContext until a user gesture; until then we feed zeros.
var AUDIO_BINS = 24;

function initAudio() {
  var ctx = null;
  var analyser = null;
  var data = null;
  var ready = false;

  function unlock() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      data = new Uint8Array(analyser.frequencyBinCount);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain).connect(analyser);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
      ready = true;
    } catch (e) {
      /* ignore */
    }
  }
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });

  function bars(out) {
    var i;
    if (ready && analyser && data) {
      analyser.getByteFrequencyData(data);
      var step = Math.max(1, Math.floor(data.length / out.length));
      for (i = 0; i < out.length; i++) {
        out[i] = data[i * step] / 255;
      }
    } else {
      for (i = 0; i < out.length; i++) out[i] = 0;
    }
  }

  return { bars: bars };
}

export { initAudio, AUDIO_BINS };
