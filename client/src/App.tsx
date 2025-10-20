import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { LandingPage } from "@/components/LandingPage";
import { ParentsReport } from "@/components/ParentsReport";
import { RankTab } from "./components/RankTab";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import EnglishDictation from "@/pages/EnglishDictation";
import WordWizard from "@/pages/WordWizard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Handle token from URL parameter (TheChildrenAI integration)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store token in cookie
      document.cookie = `child_token=${token}; path=/; max-age=${4 * 60 * 60}`; // 4 hours

      // Remove token from URL for cleaner appearance
      urlParams.delete('token');
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', newUrl);

      // Reload to trigger auth check with the new cookie
      window.location.reload();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 flex items-center justify-center">
        <div className="text-center">
          <div className="font-pixel text-white text-xl mb-4">LOADING...</div>
          <div className="animate-pulse text-4xl">⚡</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={LandingPage} />
          {/* Auth route removed - users access via TheChildrenAI token only */}
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/english-dictation" component={EnglishDictation} />
          <Route path="/word-wizard" component={WordWizard} />
          <Route path="/parents-report" component={ParentsReport} />
          <Route path="/rank" component={RankTab} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;