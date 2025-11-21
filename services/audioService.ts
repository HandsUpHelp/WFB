
// Synthesized Audio Service for "Government Design System" aesthetic
// Sounds are procedural to ensure no external assets are needed.

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, volume: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.init();
    // Sharp mechanical click
    this.createOscillator('square', 800, 0.05, 0.5);
    this.createOscillator('sine', 2000, 0.02, 0.2);
    if (navigator.vibrate) navigator.vibrate(10);
  }

  playThud() {
    this.init();
    // Heavy thud
    this.createOscillator('triangle', 100, 0.2, 0.8);
    this.createOscillator('sawtooth', 50, 0.15, 0.5);
    if (navigator.vibrate) navigator.vibrate(30);
  }

  playLock() {
    this.init();
    // Complex metallic locking sound
    const now = this.ctx?.currentTime || 0;
    this.createOscillator('sawtooth', 400, 0.4, 0.6);
    this.createOscillator('square', 1200, 0.1, 0.4); // Metallic ping
    
    // Delayed clunk
    setTimeout(() => {
      this.createOscillator('square', 100, 0.3, 0.8);
      this.createOscillator('triangle', 50, 0.4, 1.0);
    }, 100);

    if (navigator.vibrate) navigator.vibrate([50, 50, 200]);
  }

  playAlarm() {
    this.init();
    // Dystopian alarm
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }

  playStatic() {
    this.init();
    // White noise burst
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playError() {
    this.init();
    // Dissonant buzz for error
    this.createOscillator('sawtooth', 150, 0.3, 0.6);
    this.createOscillator('square', 140, 0.3, 0.6);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
  }
}

export const audioService = new AudioService();