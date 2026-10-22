// Ambient sound engine + spectrum source for the ASCII visualiser.
// A soft four-note pad through a slowly sweeping low-pass filter.
// The visualiser reads `bars()` every frame; with sound off it returns a
// gentle idle curve so the background never looks frozen.

const BINS = 32;
const CHORD = [110, 164.81, 220, 329.63];

let ctx = null;
let master = null;
let analyser = null;
let bins = null;
let playing = false;
let started = false;

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.0001;

  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 700;
  filt.Q.value = 0.6;

  const analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 128;
  analyserNode.smoothingTimeConstant = 0.85;

  CHORD.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i === CHORD.length - 1 ? "triangle" : "sawtooth";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 8;
    const g = ctx.createGain();
    g.gain.value = 0.5 / (i + 1.4);
    o.connect(g).connect(filt);
    o.start();
  });

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 320;
  lfo.connect(lfoGain).connect(filt.frequency);
  lfo.start();

  filt.connect(master).connect(analyserNode).connect(ctx.destination);
  analyser = analyserNode;
  bins = new Uint8Array(analyser.frequencyBinCount);
  return true;
}

function fade(to, seconds) {
  if (!master || !ctx) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
  master.gain.linearRampToValueAtTime(to, now + seconds);
}

function toggle() {
  if (!started) {
    if (!build()) return false;
    started = true;
  }
  if (ctx.state === "suspended") ctx.resume();
  playing = !playing;
  fade(playing ? 0.16 : 0.0001, playing ? 1.4 : 0.6);
  return playing;
}

// 32 normalised bands, low -> high.
function bars(out) {
  const arr = out || new Float32Array(BINS);
  if (playing && analyser) {
    analyser.getByteFrequencyData(bins);
    for (let i = 0; i < BINS; i++) {
      const lo = Math.floor(Math.pow(i / BINS, 1.6) * bins.length);
      const hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / BINS, 1.6) * bins.length));
      let m = 0;
      for (let j = lo; j < hi; j++) if (bins[j] > m) m = bins[j];
      arr[i] = Math.min(1, (m / 255) * 1.7);
    }
  } else {
    const t = (typeof performance !== "undefined" ? performance.now() : 0) / 1000;
    for (let i = 0; i < BINS; i++) {
      const wave = 0.5 + 0.5 * Math.sin(t * 0.6 - i * 0.3);
      const swell = 0.5 + 0.5 * Math.sin(t * 0.21 + i * 0.11);
      arr[i] = 0.16 + 0.24 * wave * (0.45 + 0.55 * swell);
    }
  }
  return arr;
}

function bindButton(btn) {
  if (!btn) return;
  const sync = () => {
    btn.setAttribute("aria-pressed", String(playing));
    btn.classList.toggle("is-on", playing);
    btn.title = playing ? "Mute ambience" : "Play ambience";
  };
  btn.addEventListener("click", () => {
    toggle();
    sync();
  });
  sync();
}

export function initAudio() {
  const api = { toggle, bars, isPlaying: () => playing };
  window.CCLTCE_AUDIO = api;
  document.addEventListener("DOMContentLoaded", () => {
    bindButton(document.querySelector(".sound-toggle"));
  });
  if (document.readyState !== "loading") bindButton(document.querySelector(".sound-toggle"));
  return api;
}

export const AUDIO_BINS = BINS;
