import { MusicGenre } from './types';

class BandaAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private radioTimer: number | null = null;
  private stepIdx = 0;
  private currentGenre: MusicGenre = 'kuduro';
  private radioActive = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopRadio();
    }
  }

  public isMuted() {
    return this.muted;
  }

  public playCashChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.24);
    });
  }

  public playHorn() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.16].forEach((offset) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(340, now + offset);
      osc2.frequency.setValueAtTime(425, now + offset);
      gain.gain.setValueAtTime(0.06, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now + offset);
      osc2.start(now + offset);
      osc1.stop(now + offset + 0.12);
      osc2.stop(now + offset + 0.12);
    });
  }

  public playThunder() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.9);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.05);
  }

  public startRadio(genre: MusicGenre) {
    this.currentGenre = genre;
    this.radioActive = true;
    if (this.radioTimer !== null) {
      window.clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
    if (this.muted) return;

    const bpmMap: Record<MusicGenre, number> = {
      kuduro: 132,
      afrohouse: 122,
      semba: 108,
      kizomba: 92,
    };
    const stepMs = Math.round((60 / bpmMap[genre] / 2) * 1000);
    this.stepIdx = 0;

    this.radioTimer = window.setInterval(() => {
      if (!this.radioActive || this.muted) return;
      this.playBeatStep(this.currentGenre, this.stepIdx);
      this.stepIdx = (this.stepIdx + 1) % 8;
    }, stepMs);
  }

  public stopRadio() {
    this.radioActive = false;
    if (this.radioTimer !== null) {
      window.clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  private playBeatStep(genre: MusicGenre, step: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Kick on pulse
    const kickSteps =
      genre === 'kuduro'
        ? [0, 3, 4, 6]
        : genre === 'kizomba'
          ? [0, 3, 6]
          : genre === 'afrohouse'
            ? [0, 2, 4, 6]
            : [0, 4];

    if (kickSteps.includes(step)) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(genre === 'kizomba' ? 110 : 135, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }

    // Melodic riff
    const scale =
      genre === 'kuduro'
        ? [220, 261.63, 293.66, 329.63, 220, 392, 329.63, 293.66]
        : genre === 'semba'
          ? [261.63, 329.63, 392, 440, 392, 329.63, 293.66, 329.63]
          : genre === 'afrohouse'
            ? [196, 246.94, 293.66, 196, 329.63, 293.66, 246.94, 220]
            : [174.61, 220, 261.63, 220, 196, 246.94, 293.66, 246.94];

    if (step % 2 === 0 || genre === 'semba') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = genre === 'kuduro' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(scale[step % scale.length], now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  }
}

export const bandaAudio = new BandaAudioEngine();
