import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { SplashScreen } from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Game from "@/pages/Game";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/game" component={Game} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TutorialProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Toaster />
          <Router />
        </TutorialProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
