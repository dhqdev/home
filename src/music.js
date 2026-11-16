// Música ambiente calma, gerada em tempo real (Web Audio) — sem arquivos e sem direitos autorais.
// Piano suave + pad + baixo sobre uma progressão lenta, com reverb.

const CHORDS = [
  // [baixo, notas do acorde] em MIDI
  [48, [60, 64, 67, 71, 74]], // Cmaj9
  [45, [57, 60, 64, 67, 71]], // Am9
  [41, [57, 60, 64, 65, 69]], // Fmaj7
  [43, [55, 59, 62, 64, 67]], // G6
  [40, [55, 59, 62, 64, 67]], // Em7
  [45, [57, 60, 64, 67, 72]], // Am7
  [41, [57, 60, 65, 67, 69]], // Fadd9
  [43, [55, 62, 65, 67, 71]], // G7sus
];
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79]; // pentatônica de dó
const BAR = 7.5; // segundos por acorde

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AmbientMusic {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.volume = 0.5;
    this.timer = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    // reverb com resposta ao impulso gerada
    const len = ctx.sampleRate * 4.5;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.verb = ctx.createConvolver();
    this.verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.verb.connect(wet).connect(this.master);
    this.dry = ctx.createGain();
    this.dry.gain.value = 0.6;
    this.dry.connect(this.master);
    // filtro suave geral
    this.bus = ctx.createBiquadFilter();
    this.bus.type = 'lowpass';
    this.bus.frequency.value = 3200;
    this.bus.connect(this.dry);
    this.bus.connect(this.verb);
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.2;
  }

  // nota de "piano" (seno + harmônicos com decaimento)
  piano(m, t, vel = 0.12) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    g.connect(this.bus);
    [[1, 1], [2, 0.28], [3, 0.08], [4, 0.04]].forEach(([k, a]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz(m) * k * (1 + (k - 1) * 0.0008);
      const og = ctx.createGain();
      og.gain.value = a;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 4.6);
    });
  }

  pad(notes, t, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 2.2);
    g.gain.setValueAtTime(0.035, t + dur - 1.5);
    g.gain.linearRampToValueAtTime(0, t + dur + 1.5);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    f.connect(g).connect(this.bus);
    for (const m of notes.slice(0, 4)) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = hz(m - 12);
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 1.6);
      }
    }
  }

  bass(m, t, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(m - 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + 2) {
      const t = this.nextTime;
      const [root, notes] = CHORDS[this.step % CHORDS.length];
      this.pad(notes, t, BAR);
      this.bass(root, t, BAR);
      // arpejo lento + melodia esparsa
      const beats = 8;
      for (let i = 0; i < beats; i++) {
        const bt = t + (i * BAR) / beats + (Math.random() - 0.5) * 0.04;
        if (i % 2 === 0 || Math.random() < 0.35) {
          const n = i % 2 === 0 ? notes[(i / 2 + this.step) % notes.length] : SCALE[Math.floor(Math.random() * SCALE.length)] + (Math.random() < 0.3 ? 12 : 0);
          this.piano(n, bt, 0.06 + Math.random() * 0.05);
        }
      }
      this.nextTime += BAR;
      this.step++;
    }
  }

  start() {
    this.init();
    if (!this.ctx) return;
    this.ctx.resume();
    this.on = true;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 2.5);
    if (!this.timer) {
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.1);
      this.schedule();
      this.timer = setInterval(() => this.schedule(), 500);
    }
  }

  stop() {
    this.on = false;
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    clearInterval(this.timer);
    this.timer = null;
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.on) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2);
  }
}
