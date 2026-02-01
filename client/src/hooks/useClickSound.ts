import { useEffect } from 'react';

const CLICK_SOUND_URL = '/click.wav';
const PROFORMA_CHIME_URL = '/proforma-chime.wav';

let globalClickAudio: HTMLAudioElement | null = null;
let globalProformaAudio: HTMLAudioElement | null = null;

function getClickAudio(): HTMLAudioElement {
  if (!globalClickAudio) {
    globalClickAudio = new Audio(CLICK_SOUND_URL);
    globalClickAudio.volume = 0.3;
  }
  return globalClickAudio;
}

function getProformaAudio(): HTMLAudioElement {
  if (!globalProformaAudio) {
    globalProformaAudio = new Audio(PROFORMA_CHIME_URL);
    globalProformaAudio.volume = 0.5;
  }
  return globalProformaAudio;
}

export function playClickSound() {
  try {
    const audio = getClickAudio();
    // Stop any currently playing sound to prevent layering
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

export function playProformaChime() {
  try {
    const audio = getProformaAudio();
    // Stop any currently playing sound to prevent layering
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

export function useGlobalClickSound() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if element or any parent has opted out of click sounds
      if (target.closest('[data-no-click-sound]')) {
        return;
      }
      
      // Exclude sliders and range inputs from click sounds
      if (target.closest('input[type="range"]') || target.closest('[role="slider"]')) {
        return;
      }
      
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
