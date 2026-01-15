import { useTutorial } from '@/contexts/TutorialContext';
import { GraduationCap, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TutorialPrompt() {
  const { showTutorialPrompt, startTutorial, dismissPrompt, hasCompletedTutorial } = useTutorial();

  if (!showTutorialPrompt || hasCompletedTutorial) return null;

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="tutorial-prompt"
    >
      <div className="w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <button
            onClick={dismissPrompt}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            data-testid="button-dismiss-prompt"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            New to Real Estate Investing?
          </h2>
          <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
            Take our interactive tutorial to learn the game mechanics and key financial concepts. 
            It only takes a few minutes and will help you make smarter investment decisions.
          </p>

          <div className="space-y-3">
            <Button
              onClick={startTutorial}
              className="w-full py-6 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 hover:from-purple-400 hover:via-purple-500 hover:to-pink-400 text-white font-semibold shadow-lg shadow-purple-500/30 text-base"
              data-testid="button-start-tutorial"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Tutorial
            </Button>
            <Button
              variant="ghost"
              onClick={dismissPrompt}
              className="w-full text-gray-400 hover:text-white hover:bg-slate-700/50"
              data-testid="button-skip-prompt"
            >
              I'll figure it out myself
            </Button>
          </div>

          <p className="text-gray-500 text-xs text-center mt-4">
            You can restart the tutorial anytime from the menu
          </p>
        </div>
      </div>
    </div>
  );
}
