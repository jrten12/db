import { useState, createContext, useContext } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { SplashScreen } from "@/components/SplashScreen";
import { useGlobalClickSound } from "@/hooks/useClickSound";
import { MusicProvider, useMusic } from "@/hooks/useMusicPlayer";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Game from "@/pages/Game";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

interface SplashContextType {
  showSplashScreen: () => void;
}

const SplashContext = createContext<SplashContextType | null>(null);

export function useSplash() {
  const context = useContext(SplashContext);
  if (!context) {
    throw new Error('useSplash must be used within SplashProvider');
  }
  return context;
}

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

function AppContent() {
  const { triggerInteraction } = useMusic();
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
    triggerInteraction();
  };

  const showSplashScreen = () => {
    setShowSplash(true);
  };

  return (
    <TutorialProvider>
      <SplashContext.Provider value={{ showSplashScreen }}>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <Toaster />
        <Router />
      </SplashContext.Provider>
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
