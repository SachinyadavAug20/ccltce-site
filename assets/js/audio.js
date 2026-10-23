// Cyberpunk / Synthwave procedural music engine + spectrum source for the ASCII visualiser.
// Synthesizes a driving 116 BPM track with 808 sub-kick, snappy snare, 16th-note hi-hats,
// rolling analog bassline, lush cyberpunk chord pads, and cascading arpeggio melodies.
// Because the track spans full spectrum (sub-bass to air brilliance), all 32 visualiser
// bands dance with rhythmic energy and punch!

const BINS = 32;
const BPM = 116;
const BEAT = 60 / BPM;
const SIXTEENTH = BEAT / 4;

let ctx = null;
let master = null;
let analyser = null;
let rawBins = null;
let playing = false;
let started = false;
let timerId = null;
let step = 0;
let nextNoteTime = 0;

// Chord progression: Dm9 -> Bbmaj9 -> Gm9 -> Asus4/C
// Frequencies in Hz
const CHORDS = [
  [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9: D3, F3, A3, C4, E4
  [116.54, 146.83, 174.61, 220.00, 261.63], // Bbmaj9: Bb2, D3, F3, A3, C4
  [98.00,  116.54, 146.83, 174.61, 220.00], // Gm9: G2, Bb2, D3, F3, A3
  [110.00, 146.83, 164.81, 196.00, 220.00], // Asus4: A2, D3, E3, G3, A3
];

// Rolling Bassline pitches (D minor root notes across bars)
const BASS_PITCHES = [
  73.42, 73.42, 146.83, 73.42, 87.31, 98.00, 73.42, 110.00, // Bar 1 (D)
  58.27, 58.27, 116.54, 58.27, 65.41, 73.42, 58.27, 87.31,  // Bar 2 (Bb)
  49.00, 49.00, 98.00,  49.00, 58.27, 65.41, 49.00, 73.42,  // Bar 3 (G)
  55.00, 55.00, 110.00, 55.00, 65.41, 73.42, 82.41, 98.00,  // Bar 4 (A)
];

// Arpeggio Lead Notes (D Minor Pentatonic / Dorian)
const ARP_NOTES = [
  293.66, 440.00, 349.23, 523.25, 587.33, 440.00, 349.23, 392.00,
  329.63, 440.00, 392.00, 523.25, 659.25, 523.25, 440.00, 349.23,
  293.66, 392.00, 349.23, 440.00, 523.25, 392.00, 349.23, 293.66,
  329.63, 440.00, 392.00, 523.25, 587.33, 659.25, 783.99, 880.00,
];

// Shared noise buffer for drums
let noiseBuffer = null;
function getNoiseBuffer() {
  if (!ctx || noiseBuffer) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 1.5);
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const out = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) out[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// 808 Kick Drum: Punchy sine sweep (145Hz -> 36Hz)
function playKick(time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(145, time);
  osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);
  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
  osc.connect(gain).connect(master);
  osc.start(time);
  osc.stop(time + 0.30);
}

// Snare Drum: Filtered noise snap + transient body
function playSnare(time) {
  const buf = getNoiseBuffer();
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bpf = ctx.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.setValueAtTime(1400, time);
  bpf.Q.setValueAtTime(1.8, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.65, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

  // Transient body tone
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.frequency.setValueAtTime(190, time);
  tone.frequency.exponentialRampToValueAtTime(80, time + 0.08);
  toneGain.gain.setValueAtTime(0.4, time);
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  src.connect(bpf).connect(gain).connect(master);
  tone.connect(toneGain).connect(master);

  src.start(time);
  src.stop(time + 0.20);
  tone.start(time);
  tone.stop(time + 0.09);
}

// Hi-Hat: Crisp metallic high frequency tick
function playHiHat(time, accent) {
  const buf = getNoiseBuffer();
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;

  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.setValueAtTime(7500, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(accent ? 0.35 : 0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (accent ? 0.08 : 0.04));

  src.connect(hpf).connect(gain).connect(master);
  src.start(time);
  src.stop(time + 0.09);
}

// Rolling Analog Bassline: Saw wave through resonant low-pass filter
function playBass(pitch, time, dur) {
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  osc.type = "sawtooth";
  sub.type = "sine";
  osc.frequency.setValueAtTime(pitch, time);
  sub.frequency.setValueAtTime(pitch / 2, time);

  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(950, time);
  filt.frequency.exponentialRampToValueAtTime(280, time + dur * 0.9);
  filt.Q.setValueAtTime(3.5, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.55, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(filt);
  sub.connect(filt);
  filt.connect(gain).connect(master);

  osc.start(time);
  sub.start(time);
  osc.stop(time + dur);
  sub.stop(time + dur);
}

// Sparkling Arpeggio Lead: High melodic sequence with envelope pluck
function playArp(freq, time, dur) {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, time);

  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(3500, time);
  filt.frequency.exponentialRampToValueAtTime(800, time + dur);
  filt.Q.setValueAtTime(2.2, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.28, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.95);

  osc.connect(filt).connect(gain).connect(master);
  osc.start(time);
  osc.stop(time + dur);
}

// Lush Cyberpunk Chord Pad: Polyphonic detuned saw waves
function playChord(chordNotes, time, dur) {
  chordNotes.forEach(function (f, i) {
    [-7, 0, 7].forEach(function (detune) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, time);
      osc.detune.setValueAtTime(detune + (i - 2) * 4, time);

      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(600, time);
      filt.frequency.linearRampToValueAtTime(1400, time + dur * 0.5);
      filt.frequency.linearRampToValueAtTime(500, time + dur);
      filt.Q.setValueAtTime(1.2, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.09 / (chordNotes.length * 1.5), time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(filt).connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + dur);
    });
  });
}

// Step Sequencer: Schedules events ahead of time with Web Audio clock
function scheduleMusic() {
  while (nextNoteTime < ctx.currentTime + 0.18) {
    const s16 = step % 16;
    const s32 = step % 32;
    const s64 = step % 64;
    const beatIndex = Math.floor(s16 / 4);

    // 1. Kick Drum on beats 1, 2, 3, 4 (Driving 4-on-the-floor)
    if (step % 4 === 0) {
      playKick(nextNoteTime);
    }

    // 2. Snare / Clap on beats 2 and 4 (standard backbeat)
    if (s16 === 4 || s16 === 12) {
      playSnare(nextNoteTime);
    }

    // 3. Hi-Hats every 16th note, accented on off-beats
    const hatAccent = s16 % 4 === 2;
    playHiHat(nextNoteTime, hatAccent);

    // 4. Bassline: 16th note rolling bass
    const bassIdx = Math.floor(s32 / 2) % BASS_PITCHES.length;
    if (step % 2 === 0) {
      playBass(BASS_PITCHES[bassIdx], nextNoteTime, SIXTEENTH * 1.8);
    }

    // 5. Chord Pads: Trigger at the start of each bar (every 16 steps)
    if (s16 === 0) {
      const chordIdx = Math.floor(s64 / 16) % CHORDS.length;
      playChord(CHORDS[chordIdx], nextNoteTime, BEAT * 4);
    }

    // 6. Arpeggio Lead: 16th-note dancing melody
    const arpIdx = step % ARP_NOTES.length;
    playArp(ARP_NOTES[arpIdx], nextNoteTime, SIXTEENTH * 0.95);

    nextNoteTime += SIXTEENTH;
    step++;
  }
}

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = 0.0001;

  // Analyser node configured for 32 clean spectrum bands
  analyser = ctx.createAnalyser();
  analyser.fftSize = 256; // 128 frequency bins
  analyser.smoothingTimeConstant = 0.78; // responsive attack and smooth decay

  master.connect(analyser);
  analyser.connect(ctx.destination);

  rawBins = new Uint8Array(analyser.frequencyBinCount);
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

  if (playing) {
    nextNoteTime = ctx.currentTime + 0.05;
    step = 0;
    timerId = setInterval(scheduleMusic, 25);
    fade(0.24, 0.8);
  } else {
    fade(0.0001, 0.5);
    setTimeout(function () {
      if (!playing && timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }, 550);
  }

  return playing;
}

// Output 32 frequency bands (0..1) with balanced logarithmic distribution
// and responsive musical dynamics
const smoothedBars = new Float32Array(BINS);

function bars(out) {
  const arr = out || new Float32Array(BINS);

  if (playing && analyser) {
    analyser.getByteFrequencyData(rawBins);
    const totalBins = rawBins.length; // 128

    for (let i = 0; i < BINS; i++) {
      // Logarithmic bin grouping: sub-bass, mid-bass, low-mids, mids, highs, brilliance
      const t0 = Math.pow(i / BINS, 2.0);
      const t1 = Math.pow((i + 1) / BINS, 2.0);
      const lo = Math.max(0, Math.floor(t0 * (totalBins - 1)));
      const hi = Math.min(totalBins, Math.max(lo + 1, Math.ceil(t1 * totalBins)));

      let sum = 0;
      let count = 0;
      for (let j = lo; j < hi; j++) {
        sum += rawBins[j];
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      // High-frequency perceptual boost curve
      const eqBoost = 1.0 + (i / BINS) * 1.6;
      const target = Math.min(1.0, (avg / 255) * eqBoost * 1.35);

      // Smooth attack & decay
      if (target > smoothedBars[i]) {
        smoothedBars[i] = smoothedBars[i] * 0.2 + target * 0.8;
      } else {
        smoothedBars[i] = smoothedBars[i] * 0.88 + target * 0.12;
      }
      arr[i] = smoothedBars[i];
    }
  } else {
    // Idle ambient state: active, dancing multi-octave equalizer wave
    const t = (typeof performance !== "undefined" ? performance.now() : 0) / 1000;
    for (let i = 0; i < BINS; i++) {
      const beat = 0.5 + 0.5 * Math.sin(t * 3.8); // 116 BPM tempo pulse
      const wave1 = 0.5 + 0.5 * Math.sin(t * 1.8 - i * 0.25);
      const wave2 = 0.5 + 0.5 * Math.sin(t * 0.7 + i * 0.18);
      const shimmer = 0.5 + 0.5 * Math.sin(t * 5.2 + i * 0.6);
      const curve = Math.exp(-Math.pow((i - 6) / 12, 2.0)); // peak around low-mids

      const val = 0.10 + 0.35 * curve * (0.6 + 0.4 * beat) + 0.16 * wave1 * wave2 + 0.08 * shimmer;
      arr[i] = Math.min(0.85, val);
    }
  }

  return arr;
}

function bindButton(btn) {
  if (!btn) return;
  const sync = () => {
    btn.setAttribute("aria-pressed", String(playing));
    btn.classList.toggle("is-on", playing);
    btn.title = playing ? "Mute music" : "Play music";
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

