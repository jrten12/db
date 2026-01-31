import { useCallback, useRef } from 'react';

export function useHapticSlider() {
  const lastValueRef = useRef<number | null>(null);
  const lastHapticTime = useRef<number>(0);
  
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    const now = Date.now();
    if (now - lastHapticTime.current < 30) return;
    lastHapticTime.current = now;
    
    if ('vibrate' in navigator) {
      const duration = intensity === 'light' ? 5 : intensity === 'medium' ? 10 : 15;
      navigator.vibrate(duration);
    }
  }, []);

  const handleSliderChange = useCallback((
    newValue: number,
    step: number,
    onChange: (value: number) => void
  ) => {
    const lastVal = lastValueRef.current;
    
    if (lastVal !== null && newValue !== lastVal) {
      const stepsMoved = Math.abs(newValue - lastVal) / step;
      if (stepsMoved >= 1) {
        triggerHaptic('light');
      }
    }
    
    lastValueRef.current = newValue;
    onChange(newValue);
  }, [triggerHaptic]);

  const resetLastValue = useCallback(() => {
    lastValueRef.current = null;
  }, []);

  return { handleSliderChange, resetLastValue, triggerHaptic };
}
