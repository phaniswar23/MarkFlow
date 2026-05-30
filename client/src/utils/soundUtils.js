// Programmatic web synthesizer for high-fidelity UI click/success sounds
class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTap() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }

  playSuccess() {
    try {
      this.init();
      const t = this.ctx.currentTime;
      
      // Node 1 (Root tone)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t); // C5
      gain1.gain.setValueAtTime(0.06, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      
      // Node 2 (Major Third tone)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, t + 0.06); // E5
      gain2.gain.setValueAtTime(0.06, t + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      
      osc1.start(t);
      osc1.stop(t + 0.22);
      osc2.start(t + 0.06);
      osc2.stop(t + 0.28);
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }

  playCelebrate() {
    try {
      this.init();
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C Major Arpeggio)
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);
        
        gain.gain.setValueAtTime(0.05, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.35);
      });
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }

  playWarning() {
    try {
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.15);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);
      
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }
}

export const soundSynth = new SoundSynth();
