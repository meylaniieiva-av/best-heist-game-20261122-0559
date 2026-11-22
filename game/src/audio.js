// The Velvet Vault — every sound is synthesized with WebAudio, so the
// game ships no audio files and makes no network request. One clear job:
// small honest sounds for the heist.
export function makeAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  // A short tone: frequency slides from `from` to `to` over `dur` seconds.
  function blip(from, to, dur, type = 'sine', when = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    gain.gain.setValueAtTime(0.9, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    // A soft footstep tick, pitched by whether the thief sneaks.
    step(sneaking) {
      blip(sneaking ? 180 : 240, 120, 0.05, 'triangle');
    },
    // Two-note chime when loot is pocketed.
    pickup() {
      blip(660, 660, 0.09, 'sine');
      blip(990, 990, 0.14, 'sine', 0.08);
    },
    // The vault's tumblers falling into place.
    crackTick() {
      blip(1400, 900, 0.05, 'square');
    },
    // The diamond lifts out of its case: a bright little arpeggio.
    diamond() {
      blip(523, 523, 0.12, 'sine');
      blip(659, 659, 0.12, 'sine', 0.1);
      blip(784, 784, 0.12, 'sine', 0.2);
      blip(1046, 1046, 0.3, 'sine', 0.3);
    },
    // A rising alarm sting when a cone first catches the thief.
    spotted() {
      blip(440, 880, 0.28, 'sawtooth');
    },
    // A dull thump when a smoke bomb pops.
    smoke() {
      blip(300, 60, 0.35, 'triangle');
    },
    // A dry click when the EMP kills the cameras.
    emp() {
      blip(1800, 200, 0.2, 'square');
    },
    // The getaway door swings open: low to high, out of here.
    escape() {
      blip(392, 392, 0.12, 'sine');
      blip(523, 523, 0.12, 'sine', 0.11);
      blip(659, 659, 0.12, 'sine', 0.22);
      blip(880, 880, 0.4, 'sine', 0.33);
    },
    // Caught: a short descending buzz.
    caught() {
      blip(220, 55, 0.7, 'sawtooth');
    },
  };
}
