import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import TeamRegister from "./pages/team/TeamRegister";
import TeamLogin from "./pages/team/TeamLogin";
import TeamDashboard from "./pages/team/TeamDashboard";
import PlayerRegister from "./pages/player/PlayerRegister";
import PlayerLogin from "./pages/player/PlayerLogin";
import PlayerOnboarding from "./pages/player/PlayerOnboarding";
import PlayerDashboard from "./pages/player/PlayerDashboard";
import PlayerProfile from "./pages/player/PlayerProfile";
import PublicPlayerProfile from "./pages/player/PublicPlayerProfile";
import NotFound from "./pages/NotFound";

import ScrimManagement from "./pages/scrim/ScrimManagement";
import TeamStats from "./pages/team/TeamStats";
import PlayerStats from "./pages/player/PlayerStats";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import Rankings from "./pages/Rankings";
import MatchResults from "./pages/MatchResults";
import Recruitment from "./pages/Recruitment";
import Feedback from "./pages/Feedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/match-results" element={<MatchResults />} />
          <Route path="/team/register" element={<TeamRegister />} />
          <Route path="/team/login" element={<TeamLogin />} />
          <Route path="/team/dashboard" element={<TeamDashboard />} />
          <Route path="/team/stats" element={<TeamStats />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/player/register" element={<PlayerRegister />} />
          <Route path="/player/login" element={<PlayerLogin />} />
          <Route path="/player/onboarding" element={<PlayerOnboarding />} />
          <Route path="/player/dashboard" element={<PlayerDashboard />} />
          <Route path="/player/profile" element={<PlayerProfile />} />
          <Route path="/player/:username" element={<PublicPlayerProfile />} />
          <Route path="/player/stats" element={<PlayerStats />} />
          <Route path="/scrim/:id" element={<ScrimManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
