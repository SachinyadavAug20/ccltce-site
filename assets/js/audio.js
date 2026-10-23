// Audio analyser for the ASCII background visualizer — real frequency data.
var AUDIO_BINS = 24;

function initAudio() {
  var analyser = null, data = null, ready = false;

  function unlock() {
    if (ready) return;
    try {
      var sfx = window.CCLTCE_SFX;
      if (sfx && sfx.getAnalyser) {
        analyser = sfx.getAnalyser();
        data = new Uint8Array(analyser.frequencyBinCount);
        ready = true;
      }
    } catch (e) { /* ignore */ }
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
