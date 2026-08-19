import { Download, Share, X, PlusSquare } from 'lucide-react';
import { useAppInstall } from '@/hooks/useAppInstall';
import { useLocation } from 'wouter';

/**
 * Prompts players to put Dealbreak on their home screen.
 * Copy never says "PWA" — just install / home screen language.
 */
export function InstallAppBanner({ compact = false }: { compact?: boolean }) {
  const [location] = useLocation();
  const { canInstall, isIos, hasNativePrompt, promptInstall, dismiss } = useAppInstall();

  // Prefer game + landing; skip legal pages
  const onRelevantRoute = location === '/' || location === '/game' || location.startsWith('/game');
  if (!canInstall || !onRelevantRoute) return null;

  return (
    <div
      className={`install-banner z-[60] ${compact ? 'install-banner--compact' : ''}`}
      role="dialog"
      aria-label="Install Dealbreak"
      data-testid="install-app-banner"
    >
      <div className="install-banner__glow" aria-hidden />
      <div className="flex items-start gap-3 relative">
        <div className="install-banner__icon shrink-0">
          <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm leading-tight">
            {isIos && !hasNativePrompt ? 'Add Dealbreak to your Home Screen' : 'Install Dealbreak'}
          </p>
          <p className="text-white/55 text-xs mt-1 leading-snug">
            {isIos && !hasNativePrompt
              ? 'Play full-screen like a native app — tap Share, then Add to Home Screen.'
              : 'Get the full-screen app experience with one tap. Your progress stays on this device.'}
          </p>

          {isIos && !hasNativePrompt ? (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-300/90 font-medium">
              <Share className="w-3.5 h-3.5" />
              <span>Share</span>
              <span className="text-white/30">→</span>
              <PlusSquare className="w-3.5 h-3.5" />
              <span>Add to Home Screen</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => promptInstall()}
              className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-colors"
              data-testid="button-install-app"
            >
              <Download className="w-3.5 h-3.5" />
              Install Dealbreak
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
          aria-label="Dismiss"
          data-testid="button-dismiss-install"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
