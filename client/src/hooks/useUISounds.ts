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

let lastKeystrokeTime = 0;

export function playKeystrokeSound() {
  try {
    const now = performance.now();
    if (now - lastKeystrokeTime < 30) return;
    lastKeystrokeTime = now;

    const ctx = getSharedAudioContext();
    const t = ctx.currentTime;
    const duration = 0.035;

    const freq = 1800 + Math.random() * 800;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.02);
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
