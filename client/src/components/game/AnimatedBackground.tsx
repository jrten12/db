/** Minimal backdrop — no floating particles or gradient orbs. */
export function AnimatedBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
      style={{ background: 'hsl(var(--workstation-ink))' }}
    />
  );
}
