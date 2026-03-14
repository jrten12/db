import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

(function preventSliderScroll() {
  let activeSlider: HTMLElement | null = null;
  
  function clearScrollLock() {
    if (activeSlider) {
      document.querySelectorAll('.slider-active-no-scroll').forEach(el => {
        el.classList.remove('slider-active-no-scroll');
      });
      activeSlider = null;
    }
  }
  
  document.addEventListener('touchstart', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range') {
      activeSlider = target;
      let parent = target.parentElement;
      while (parent) {
        if (parent.scrollHeight > parent.clientHeight) {
          parent.classList.add('slider-active-no-scroll');
        }
        parent = parent.parentElement;
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', clearScrollLock, { passive: true });
  document.addEventListener('touchcancel', clearScrollLock, { passive: true });
  document.addEventListener('visibilitychange', clearScrollLock);
  document.addEventListener('pagehide', clearScrollLock);
})();

createRoot(document.getElementById("root")!).render(<App />);
