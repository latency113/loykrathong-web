"use client";

/**
 * Lightweight Web Audio API soundscape: soft flowing river + gentle pentatonic
 * Thai chimes, requiring zero external audio files.
 */
class RiverAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private chimeTimer: number | null = null;
  private running = false;

  start() {
    if (this.running || typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    // Soft filtered pink-ish noise for flowing river water
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;

    const waterGain = ctx.createGain();
    waterGain.gain.value = 0.22;

    noise.connect(filter);
    filter.connect(waterGain);
    waterGain.connect(master);
    noise.start();

    this.ctx = ctx;
    this.master = master;
    this.running = true;

    // Gentle Thai pentatonic chimes (D4, E4, G4, A4, B4, D5)
    const notes = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33];
    const playChime = () => {
      if (!this.running || !this.ctx || !this.master) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 2.3);
    };

    playChime();
    this.chimeTimer = window.setInterval(playChime, 2600);
  }

  stop() {
    this.running = false;
    if (this.chimeTimer !== null) {
      window.clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
    }
  }
}

export const riverAudio = new RiverAudioEngine();
