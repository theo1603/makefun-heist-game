// Synthesised sound effects, WebAudio only — no audio files ship with the
// game. Every sound is a short oscillator envelope. The context is created
// lazily on the first user gesture (browsers block audio before one), and
// every call is guarded so a missing AudioContext never breaks the game.
let context = null;
let alarmOscillator = null;

function ensureContext() {
  if (context) return context;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  } catch {
    context = null;
  }
  return context;
}

/** Call from a keydown/click handler so later sounds are allowed to play. */
export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(frequency, seconds, type, volume, when = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + when);
    gain.gain.setValueAtTime(volume, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(ctx.currentTime + when);
    oscillator.stop(ctx.currentTime + when + seconds + 0.02);
  } catch {
    // Sound is garnish; a failure here must never stop the game.
  }
}

export function playPickup() {
  tone(880, 0.09, 'sine', 0.12);
  tone(1320, 0.14, 'sine', 0.1, 0.07);
}

export function playCoin() {
  tone(1568, 0.06, 'triangle', 0.14);
  tone(2093, 0.1, 'triangle', 0.1, 0.05);
}

export function playSmoke() {
  tone(220, 0.25, 'sine', 0.12);
}

export function playCrack() {
  tone(440, 0.08, 'square', 0.06);
  tone(660, 0.08, 'square', 0.06, 0.1);
  tone(990, 0.16, 'sine', 0.1, 0.2);
}

export function playCaught() {
  tone(392, 0.2, 'sawtooth', 0.12);
  tone(311, 0.2, 'sawtooth', 0.12, 0.18);
  tone(233, 0.4, 'sawtooth', 0.12, 0.36);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((frequency, index) => {
    tone(frequency, 0.18, 'triangle', 0.12, index * 0.11);
  });
}

/** A low pulsing alarm while the meter is high; call with the alarm level. */
export function setAlarmHum(level) {
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    if (level > 70 && !alarmOscillator) {
      alarmOscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      alarmOscillator.type = 'sine';
      alarmOscillator.frequency.value = 110;
      gain.gain.value = 0.05;
      alarmOscillator.connect(gain).connect(ctx.destination);
      alarmOscillator.start();
    } else if (level <= 70 && alarmOscillator) {
      alarmOscillator.stop();
      alarmOscillator = null;
    }
  } catch {
    alarmOscillator = null;
  }
}

export function stopAlarmHum() {
  try {
    if (alarmOscillator) alarmOscillator.stop();
  } catch {
    // Already stopped.
  }
  alarmOscillator = null;
}
