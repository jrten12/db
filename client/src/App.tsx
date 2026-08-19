import { lazy, Suspense, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { useGlobalClickSound } from "@/hooks/useClickSound";
import { MusicProvider, useMusic } from "@/hooks/useMusicPlayer";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import Landing from "@/pages/Landing";

const Game = lazy(() => import("@/pages/Game"));
const Learn = lazy(() => import("@/pages/Learn"));
const LearnArticle = lazy(() => import("@/pages/LearnArticle"));
const Tools = lazy(() => import("@/pages/Tools"));
const FlipOrRentTool = lazy(() => import("@/pages/FlipOrRentTool"));
const DealScorecardTool = lazy(() => import("@/pages/DealScorecardTool"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Methodology = lazy(() => import("@/pages/Methodology"));
const AppStoreScreenshots = lazy(() => import("@/pages/AppStoreScreenshots"));
const WhatIsDealbreak = lazy(() => import("@/pages/WhatIsDealbreak"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0f0f12' }} />}>
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
        <Route path="/what-is-dealbreak-simulator" component={WhatIsDealbreak} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { triggerInteraction } = useMusic();

  useEffect(() => {
    const syncStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      document.documentElement.classList.toggle('is-standalone', standalone);
      document.body.classList.toggle('is-standalone', standalone);
    };
    syncStandalone();
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', syncStandalone);
    return () => mq.removeEventListener?.('change', syncStandalone);
  }, []);

  return (
    <TutorialProvider>
      <div className="app-root" onClick={() => triggerInteraction()}>
        <Toaster />
        <InstallAppBanner />
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
