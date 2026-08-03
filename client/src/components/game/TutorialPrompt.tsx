import { useTutorial } from '@/contexts/TutorialContext';
import { GraduationCap, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TutorialPrompt() {
  const { showTutorialPrompt, startTutorial, dismissPrompt, hasCompletedTutorial } = useTutorial();

  if (!showTutorialPrompt || hasCompletedTutorial) return null;

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm safe-area-all"
      data-testid="tutorial-prompt"
    >
      <div className="w-full max-w-md mx-4 desk-surface rounded-xl overflow-hidden">
        <div className="relative h-28 flex items-center justify-center bg-gradient-to-b from-[hsl(28_28%_18%)] to-[hsl(25_32%_12%)] border-b border-[rgba(180,140,70,0.28)]">
          <div className="w-16 h-16 rounded-xl desk-panel flex items-center justify-center border border-[rgba(212,175,55,0.35)]">
            <GraduationCap className="w-8 h-8 text-[hsl(43_72%_58%)]" />
          </div>
          <button
            onClick={dismissPrompt}
            className="absolute top-3 right-3 w-10 h-10 rounded-full desk-panel hover:border-[rgba(212,175,55,0.4)] flex items-center justify-center transition-colors touch-target"
            data-testid="button-dismiss-prompt"
          >
            <X className="w-4 h-4 text-[hsl(35_15%_70%)]" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-display font-semibold text-[hsl(43_55%_72%)] mb-2 text-center">
            New to Real Estate Investing?
          </h2>
          <p className="text-[hsl(30_12%_62%)] text-sm text-center mb-6 leading-relaxed">
            Take a short interactive tutorial on underwriting and game mechanics.
            A few minutes here pays off on your first deal.
          </p>

          <div className="space-y-3">
            <Button
              onClick={startTutorial}
              className="w-full py-6 menu-row-primary text-base font-semibold"
              data-testid="button-start-tutorial"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Tutorial
            </Button>
            <Button
              variant="ghost"
              onClick={dismissPrompt}
              className="w-full text-[hsl(30_12%_58%)] hover:text-[hsl(38_30%_88%)] hover:bg-white/5"
              data-testid="button-skip-prompt"
            >
              I'll figure it out myself
            </Button>
          </div>

          <p className="text-[hsl(30_10%_45%)] text-xs text-center mt-4">
            You can restart the tutorial anytime from the menu
          </p>
        </div>
      </div>
    </div>
  );
}
