import { useEffect } from 'react';
import { playSwooshSound, playCloseSound, playKeystrokeSound } from './useUISounds';

const CLICK_SOUND_URL = '/click.wav';
const PROFORMA_CHIME_URL = '/proforma-chime.wav';
const PURCHASE_CONFIRM_URL = '/purchase-confirm.wav';
const ADVANCE_WEEK_URL = '/advance-week.wav';
const BANKRUPT_URL = '/bankrupt.wav';
const SALE_COMPLETE_URL = '/sale-complete.wav';

let globalClickAudio: HTMLAudioElement | null = null;
let globalProformaAudio: HTMLAudioElement | null = null;
let globalPurchaseConfirmAudio: HTMLAudioElement | null = null;
let globalAdvanceWeekAudio: HTMLAudioElement | null = null;
let globalBankruptAudio: HTMLAudioElement | null = null;
let globalSaleCompleteAudio: HTMLAudioElement | null = null;

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
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

export function playProformaChime() {
  try {
    const audio = getProformaAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function getPurchaseConfirmAudio(): HTMLAudioElement {
  if (!globalPurchaseConfirmAudio) {
    globalPurchaseConfirmAudio = new Audio(PURCHASE_CONFIRM_URL);
    globalPurchaseConfirmAudio.volume = 0.5;
  }
  return globalPurchaseConfirmAudio;
}

export function playPurchaseConfirmSound() {
  try {
    const audio = getPurchaseConfirmAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function getAdvanceWeekAudio(): HTMLAudioElement {
  if (!globalAdvanceWeekAudio) {
    globalAdvanceWeekAudio = new Audio(ADVANCE_WEEK_URL);
    globalAdvanceWeekAudio.volume = 0.5;
  }
  return globalAdvanceWeekAudio;
}

export function playAdvanceWeekSound() {
  try {
    const audio = getAdvanceWeekAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function getBankruptAudio(): HTMLAudioElement {
  if (!globalBankruptAudio) {
    globalBankruptAudio = new Audio(BANKRUPT_URL);
    globalBankruptAudio.volume = 0.6;
  }
  return globalBankruptAudio;
}

export function playBankruptSound() {
  try {
    const audio = getBankruptAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function getSaleCompleteAudio(): HTMLAudioElement {
  if (!globalSaleCompleteAudio) {
    globalSaleCompleteAudio = new Audio(SALE_COMPLETE_URL);
    globalSaleCompleteAudio.volume = 0.6;
  }
  return globalSaleCompleteAudio;
}

export function playSaleCompleteSound() {
  try {
    const audio = getSaleCompleteAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function shouldPlayClose(el: HTMLElement): boolean {
  if (el.closest('[data-radix-dialog-overlay]') || el.closest('[data-radix-dialog-close]')) return true;

  const closestBtn = el.closest('button');
  if (el.closest('[role="dialog"]') || el.closest('[data-radix-dialog-content]')) {
    if (closestBtn) {
      const isClose = closestBtn.closest('[data-radix-dialog-close]') ||
        closestBtn.querySelector('.lucide-x, .lucide-arrow-left, .lucide-chevron-left') ||
        closestBtn.getAttribute('aria-label')?.toLowerCase().includes('close');
      if (isClose) return true;
    }
  }

  return false;
}

function shouldPlaySwoosh(el: HTMLElement): boolean {
  if (el.closest('[data-sound="swoosh"]')) return true;

  const closestBtn = el.closest('button');
  if (closestBtn) {
    const ariaHaspopup = closestBtn.getAttribute('aria-haspopup');
    if (ariaHaspopup === 'dialog') return true;
  }

  return false;
}

function isTextInput(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase();
    return type === 'text' || type === 'number' || type === 'email' || type === 'search' || type === 'tel' || type === 'url' || type === 'password';
  }
  if (el instanceof HTMLTextAreaElement) return true;
  if (el.getAttribute('contenteditable') === 'true') return true;
  if (el.closest('[contenteditable="true"]')) return true;
  return false;
}

export function useGlobalClickSound() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('input[type="range"]') || target.closest('[role="slider"]')) return;
      if (isTextInput(target)) return;

      if (target.closest('[data-sound="close"]')) {
        playCloseSound();
        return;
      }

      if (shouldPlayClose(target)) {
        playCloseSound();
        return;
      }

      if (shouldPlaySwoosh(target)) {
        playSwooshSound();
        return;
      }

      if (target.closest('[data-no-click-sound]')) return;

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

    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!isTextInput(target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
      if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') return;

      playKeystrokeSound();
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeydown, true);
    };
  }, []);
}
