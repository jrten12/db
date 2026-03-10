import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { useGlobalClickSound } from "@/hooks/useClickSound";
import { MusicProvider, useMusic } from "@/hooks/useMusicPlayer";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Game from "@/pages/Game";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

import Learn from "@/pages/Learn";
import LearnArticle from "@/pages/LearnArticle";

import Methodology from "@/pages/Methodology";
import AppStoreScreenshots from "@/pages/AppStoreScreenshots";
import Tools from "@/pages/Tools";
import FlipOrRentTool from "@/pages/FlipOrRentTool";
import DealScorecardTool from "@/pages/DealScorecardTool";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/game" component={Game} />
      <Route path="/learn" component={Learn} />
      <Route path="/learn/:slug" component={LearnArticle} />
      <Route path="/tools" component={Tools} />
      <Route path="/tools/flip-or-rent" component={FlipOrRentTool} />
      <Route path="/tools/deal-scorecard" component={DealScorecardTool} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/methodology" component={Methodology} />
      <Route path="/screenshots" component={AppStoreScreenshots} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { triggerInteraction } = useMusic();

  return (
    <TutorialProvider>
      <div onClick={() => triggerInteraction()}>
        <Toaster />
        <Router />
      </div>
    </TutorialProvider>
  );
}

function App() {
  useGlobalClickSound();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MusicProvider>
          <AppContent />
        </MusicProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
