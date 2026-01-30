import { useCallback, useEffect, useRef } from 'react';

const CLICK_SOUND_URL = '/click.wav';

let globalAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio(CLICK_SOUND_URL);
    globalAudio.volume = 0.3;
  }
  return globalAudio;
}

export function playClickSound() {
  try {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

export function useGlobalClickSound() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[data-clickable]') ||
        target.closest('input[type="checkbox"]') ||
        target.closest('input[type="radio"]') ||
        target.closest('[role="tab"]') ||
        target.closest('[role="menuitem"]') ||
        target.closest('[role="option"]') ||
        target.closest('.cursor-pointer');
      
      if (isInteractive) {
        playClickSound();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}
