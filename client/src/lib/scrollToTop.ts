/**
 * Reset window/document scroll to the top.
 * Runs immediately and again after paint so layout shifts (screen swaps,
 * wizard step changes) don't leave mobile users stuck at the previous bottom.
 */
export function scrollToTop(): void {
  const apply = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
}

/** Reset an overflow scroll container (e.g. fixed modal body) to the top. */
export function scrollElementToTop(el: HTMLElement | null | undefined): void {
  if (!el) return;
  el.scrollTop = 0;
  el.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
}
