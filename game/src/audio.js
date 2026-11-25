// Lantern Ramen — SoundEngine.
// Every sound is synthesised with WebAudio: no audio files, no network.
// A quiet pentatonic pluck loop keeps the night-market mood; short
// effects answer every action at once (chop, pour, boil, ding, serve).

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = 0;
    this.musicOn = false;
    this.boilGain = null;
    this.boilSrc = null;
    // Pentatonic scale (A minor pentatonic, warm and a little wistful).
    this.scale = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    this.startBoilLoop();
    this.musicOn = true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  }

  // --- helpers -----------------------------------------------------------
  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, filterFreq, when = 0, type = 'bandpass') {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
  }

  // --- game effects ------------------------------------------------------
  chop() { this.noise(0.09, 0.5, 1800); this.tone(190, 0.07, 'triangle', 0.25, 0, 90); }
  pour() { this.tone(520, 0.35, 'sine', 0.22, 0, 180); this.noise(0.3, 0.12, 900, 0, 'lowpass'); }
  plop() { this.tone(300, 0.12, 'sine', 0.3, 0, 120); }
  ding() { this.tone(1318, 0.5, 'sine', 0.3); this.tone(1976, 0.6, 'sine', 0.16, 0.02); }
  serve() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.22, i * 0.07));
  }
  wrong() { this.tone(160, 0.3, 'sawtooth', 0.18, 0, 90); this.tone(110, 0.35, 'sawtooth', 0.14, 0.05, 70); }
  walkout() { this.tone(392, 0.25, 'triangle', 0.2, 0, 330); this.tone(311, 0.4, 'triangle', 0.18, 0.18, 262); }
  click() { this.tone(660, 0.05, 'square', 0.08); }
  star() { [880, 1174.66, 1567.98].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.18, i * 0.08)); }
  rush() { this.tone(523.25, 0.15, 'square', 0.12); this.tone(783.99, 0.2, 'square', 0.12, 0.12); }

  // A soft looping bubble bed under the noodle boiler.
  startBoilLoop() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
    this.boilSrc = this.ctx.createBufferSource();
    this.boilSrc.buffer = buf;
    this.boilSrc.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    this.boilGain = this.ctx.createGain();
    this.boilGain.gain.value = 0.0;
    this.boilSrc.connect(f).connect(this.boilGain).connect(this.master);
    this.boilSrc.start();
  }

  setBoiling(active) {
    if (!this.boilGain || !this.ctx) return;
    this.boilGain.gain.setTargetAtTime(active ? 0.10 : 0.0, this.ctx.currentTime, 0.3);
  }

  // One soft pluck every couple of seconds — the stall's background music.
  update(dt) {
    if (!this.ctx || !this.musicOn || this.muted) return;
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      this.musicTimer = 1.8 + Math.random() * 1.6;
      const f = this.scale[Math.floor(Math.random() * this.scale.length)];
      this.tone(f, 1.4, 'triangle', 0.05);
      if (Math.random() < 0.3) this.tone(f / 2, 1.8, 'sine', 0.04, 0.05);
    }
  }
}
