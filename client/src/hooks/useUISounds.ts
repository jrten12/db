import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'click' | 'success' | 'error' | 'whoosh' | 'coin' | 'levelUp' | 'tick' | 'achievement' | 'epicAchievement';

const SOUND_CONFIG: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; gain: number }[]> = {
  click: [
    { frequency: 800, duration: 0.05, type: 'sine', gain: 0.1 },
  ],
  success: [
    { frequency: 523.25, duration: 0.1, type: 'sine', gain: 0.15 },
    { frequency: 659.25, duration: 0.1, type: 'sine', gain: 0.15 },
    { frequency: 783.99, duration: 0.15, type: 'sine', gain: 0.15 },
  ],
  error: [
    { frequency: 200, duration: 0.15, type: 'sawtooth', gain: 0.08 },
    { frequency: 150, duration: 0.2, type: 'sawtooth', gain: 0.06 },
  ],
  whoosh: [
    { frequency: 400, duration: 0.15, type: 'sine', gain: 0.08 },
  ],
  coin: [
    { frequency: 1200, duration: 0.08, type: 'sine', gain: 0.12 },
    { frequency: 1600, duration: 0.1, type: 'sine', gain: 0.1 },
  ],
  levelUp: [
    { frequency: 392, duration: 0.1, type: 'sine', gain: 0.15 },
    { frequency: 523.25, duration: 0.1, type: 'sine', gain: 0.15 },
    { frequency: 659.25, duration: 0.1, type: 'sine', gain: 0.15 },
    { frequency: 783.99, duration: 0.2, type: 'sine', gain: 0.18 },
  ],
  tick: [
    { frequency: 600, duration: 0.03, type: 'sine', gain: 0.06 },
  ],
  achievement: [
    { frequency: 587.33, duration: 0.08, type: 'sine', gain: 0.18 },
    { frequency: 739.99, duration: 0.08, type: 'sine', gain: 0.18 },
    { frequency: 880, duration: 0.12, type: 'sine', gain: 0.2 },
    { frequency: 1174.66, duration: 0.25, type: 'sine', gain: 0.22 },
  ],
  epicAchievement: [
    { frequency: 392, duration: 0.1, type: 'sine', gain: 0.2 },
    { frequency: 493.88, duration: 0.1, type: 'sine', gain: 0.2 },
    { frequency: 587.33, duration: 0.1, type: 'sine', gain: 0.22 },
    { frequency: 783.99, duration: 0.15, type: 'sine', gain: 0.25 },
    { frequency: 987.77, duration: 0.15, type: 'sine', gain: 0.25 },
    { frequency: 1174.66, duration: 0.3, type: 'sine', gain: 0.28 },
  ],
};

let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

export function playSwooshSound() {
  try {
    const ctx = getSharedAudioContext();
    const now = ctx.currentTime;
    const duration = 0.12;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2000, now);
    bandpass.frequency.exponentialRampToValueAtTime(600, now + duration);
    bandpass.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration + 0.05);
  } catch (e) {}
}

export function playCommitChunkSound() {
  try {
    const ctx = getSharedAudioContext();
    const now = ctx.currentTime;
    const duration = 0.32;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.28, now + 0.012);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);

    const noiseDur = 0.06;
    const bufferSize = Math.floor(ctx.sampleRate * noiseDur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, now);
    lp.Q.setValueAtTime(0.6, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + noiseDur + 0.02);
  } catch (e) {}
}

export function playRentDayPing() {
  try {
    const ctx = getSharedAudioContext();
    const now = ctx.currentTime;
    const notes = [
      { freq: 1318.51, start: 0, dur: 0.09, gain: 0.12 },
      { freq: 1760.00, start: 0.05, dur: 0.10, gain: 0.10 },
      { freq: 2093.00, start: 0.10, dur: 0.14, gain: 0.08 },
    ];
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + n.start);
      g.gain.linearRampToValueAtTime(n.gain, now + n.start + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.02);
    });
  } catch (e) {}
}

export function playBankruptcyDrone() {
  try {
    const ctx = getSharedAudioContext();
    const now = ctx.currentTime;
    const duration = 2.0;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82.5, now);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, now);
    lp.frequency.exponentialRampToValueAtTime(180, now + duration);
    lp.Q.setValueAtTime(2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.18);
    gain.gain.setValueAtTime(0.14, now + duration - 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  } catch (e) {}
}

export function playCloseSound() {
  try {
    const ctx = getSharedAudioContext();
    const now = ctx.currentTime;
    const duration = 0.15;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + duration * 0.8);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.03, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
    osc2.start(now);
    osc2.stop(now + duration + 0.05);
  } catch (e) {}
}

let lastKeystrokeTime = 0;

export function playKeystrokeSound() {
  try {
    const now = performance.now();
    if (now - lastKeystrokeTime < 35) return;
    lastKeystrokeTime = now;

    const ctx = getSharedAudioContext();
    const t = ctx.currentTime;

    const variation = Math.random();
    const tapDuration = 0.025 + variation * 0.015;

    const bufferSize = Math.ceil(ctx.sampleRate * (tapDuration + 0.02));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const hipass = ctx.createBiquadFilter();
    hipass.type = 'highpass';
    hipass.frequency.setValueAtTime(3000 + variation * 2000, t);
    hipass.Q.setValueAtTime(0.7, t);

    const lopass = ctx.createBiquadFilter();
    lopass.type = 'lowpass';
    lopass.frequency.setValueAtTime(8000 + variation * 3000, t);
    lopass.frequency.exponentialRampToValueAtTime(2000, t + tapDuration);
    lopass.Q.setValueAtTime(1.2, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.035 + variation * 0.015, t + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + tapDuration);

    noise.connect(hipass);
    hipass.connect(lopass);
    lopass.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    const thumpFreq = 180 + variation * 80;
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(thumpFreq, t);
    thump.frequency.exponentialRampToValueAtTime(thumpFreq * 0.3, t + tapDuration * 0.8);

    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0, t);
    thumpGain.gain.linearRampToValueAtTime(0.02 + variation * 0.008, t + 0.001);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + tapDuration * 0.7);

    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + tapDuration + 0.02);
    thump.start(t);
    thump.stop(t + tapDuration + 0.02);
  } catch (e) {}
}

export function useUISounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const notes = SOUND_CONFIG[type];
      let startTime = ctx.currentTime;

      notes.forEach((note) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(note.gain, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration + 0.05);

        startTime += note.duration * 0.8;
      });
    } catch (error) {
      // Silent fail - audio is non-critical
      console.debug('Audio playback failed:', error);
    }
  }, [getAudioContext]);

  return {
    playClick: useCallback(() => playSound('click'), [playSound]),
    playSuccess: useCallback(() => playSound('success'), [playSound]),
    playError: useCallback(() => playSound('error'), [playSound]),
    playWhoosh: useCallback(() => playSound('whoosh'), [playSound]),
    playCoin: useCallback(() => playSound('coin'), [playSound]),
    playLevelUp: useCallback(() => playSound('levelUp'), [playSound]),
    playTick: useCallback(() => playSound('tick'), [playSound]),
    playAchievement: useCallback(() => playSound('achievement'), [playSound]),
    playEpicAchievement: useCallback(() => playSound('epicAchievement'), [playSound]),
  };
}
