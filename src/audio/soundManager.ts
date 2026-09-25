/**
 * Web Audio API synthesizer for realistic excavator sounds:
 * - Low-frequency diesel engine hum with rumble (ONLY plays when levers are actively moved!)
 * - High-pitched hydraulic pump hiss and valve whine when levers are moved
 * - Metallic scoop / scrape contact sound
 * - Dump truck bed impact sound
 * - Ball conveyor & return chute roll sound
 * - Fanfare / success chime
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isGameActive: boolean = true;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private hydraulicGain: GainNode | null = null;
  private hydraulicNoise: AudioBufferSourceNode | null = null;
  private hydraulicFilter: BiquadFilterNode | null = null;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.setupEngine();
      this.setupHydraulics();
      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupEngine() {
    if (!this.ctx) return;

    // Diesel engine low rumble
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(42, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(21, this.ctx.currentTime);

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    // Default gain is strictly 0! Only sounds when lever is moved.
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineOsc.connect(engineFilter);
    this.engineSubOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  private setupHydraulics() {
    if (!this.ctx) return;

    // Continuous filtered noise for hydraulic fluid rushing through valves
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.hydraulicNoise = this.ctx.createBufferSource();
    this.hydraulicNoise.buffer = noiseBuffer;
    this.hydraulicNoise.loop = true;

    this.hydraulicFilter = this.ctx.createBiquadFilter();
    this.hydraulicFilter.type = 'bandpass';
    this.hydraulicFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.hydraulicFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.hydraulicGain = this.ctx.createGain();
    this.hydraulicGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.hydraulicNoise.connect(this.hydraulicFilter);
    this.hydraulicFilter.connect(this.hydraulicGain);
    this.hydraulicGain.connect(this.ctx.destination);

    this.hydraulicNoise.start();
  }

  /**
   * Updates audio load with joystick deflection.
   * If loadRatio is 0, or game is stopped/paused, gain fades immediately to 0!
   */
  public updateHydraulicLoad(loadRatio: number) {
    if (!this.ctx || this.isMuted || !this.isGameActive) {
      this.silenceEngine();
      return;
    }

    this.resume();
    const now = this.ctx.currentTime;

    if (loadRatio < 0.04) {
      // Completely silent when idle! No continuous low engine hum.
      this.silenceEngine();
      return;
    }

    // Smoothly ramp up engine & hydraulic sound only when lever is moved
    const clampedLoad = Math.min(1.0, loadRatio);
    const targetHydraulicGain = clampedLoad * 0.14;
    const targetEngineGain = 0.03 + clampedLoad * 0.07;
    const targetFreq = 750 + clampedLoad * 650;
    const targetEngineRpm = 42 + clampedLoad * 22;

    if (this.hydraulicGain) {
      this.hydraulicGain.gain.setTargetAtTime(targetHydraulicGain, now, 0.05);
    }
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(targetEngineGain, now, 0.05);
    }
    if (this.hydraulicFilter) {
      this.hydraulicFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }
    if (this.engineOsc) {
      this.engineOsc.frequency.setTargetAtTime(targetEngineRpm, now, 0.08);
    }
  }

  public silenceEngine() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.06);
    }
    if (this.hydraulicGain) {
      this.hydraulicGain.gain.setTargetAtTime(0, now, 0.06);
    }
  }

  public setGameActive(active: boolean) {
    this.isGameActive = active;
    if (!active) {
      this.silenceEngine();
    }
  }

  public playBucketClink() {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playDumpImpact() {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.23);
  }

  public playConveyorRoll() {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  public playSuccessChime() {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.3);
    });
  }

  public playGoldenBallFanfare() {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    // Sparkling golden chime arpeggio: G5, B5, D6, G6, B6
    const freqs = [783.99, 987.77, 1174.66, 1567.98, 1975.53];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.46);
    });
  }

  public playRankUpFanfare() {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    // Triumphant trumpet fanfare
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.07, this.ctx.currentTime + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.65);
    });
  }

  public playComboBonus(comboCount: number) {
    if (!this.ctx || this.isMuted || !this.isGameActive) return;
    this.resume();

    const baseFreq = 440 + Math.min(comboCount, 8) * 60;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  public playKeyClick() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    // Metallic key insertion & tumbler click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  public playIgnitionStarter() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Cranking starter motor pulses (ch-ch-ch-ch-vroom!)
    const crankPulses = [0, 0.12, 0.24, 0.36, 0.48];
    crankPulses.forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, t + offset);
      osc.frequency.exponentialRampToValueAtTime(35, t + offset + 0.09);

      gain.gain.setValueAtTime(0.28, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.11);
    });

    // Ignition catch & rev up
    const revOsc = this.ctx.createOscillator();
    const revSub = this.ctx.createOscillator();
    const revGain = this.ctx.createGain();
    const revFilter = this.ctx.createBiquadFilter();

    revOsc.type = 'sawtooth';
    revSub.type = 'square';
    revFilter.type = 'lowpass';
    revFilter.frequency.setValueAtTime(140, t + 0.6);

    revOsc.frequency.setValueAtTime(50, t + 0.6);
    revOsc.frequency.exponentialRampToValueAtTime(95, t + 0.85);
    revOsc.frequency.exponentialRampToValueAtTime(46, t + 1.35);

    revSub.frequency.setValueAtTime(25, t + 0.6);
    revSub.frequency.exponentialRampToValueAtTime(47, t + 0.85);
    revSub.frequency.exponentialRampToValueAtTime(23, t + 1.35);

    revGain.gain.setValueAtTime(0, t + 0.6);
    revGain.gain.linearRampToValueAtTime(0.35, t + 0.85);
    revGain.gain.exponentialRampToValueAtTime(0.02, t + 1.4);

    revOsc.connect(revFilter);
    revSub.connect(revFilter);
    revFilter.connect(revGain);
    revGain.connect(this.ctx.destination);

    revOsc.start(t + 0.6);
    revSub.start(t + 0.6);
    revOsc.stop(t + 1.45);
    revSub.stop(t + 1.45);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.silenceEngine();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
