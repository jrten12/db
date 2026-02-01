import { useCallback, useRef } from 'react';

type SoundType = 'click' | 'success' | 'error' | 'whoosh' | 'coin' | 'levelUp' | 'tick';

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
};

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
  };
}
