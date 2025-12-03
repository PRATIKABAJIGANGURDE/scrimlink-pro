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
import PlayerDashboard from "./pages/player/PlayerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/team/register" element={<TeamRegister />} />
          <Route path="/team/login" element={<TeamLogin />} />
          <Route path="/team/dashboard" element={<TeamDashboard />} />
          <Route path="/player/register" element={<PlayerRegister />} />
          <Route path="/player/login" element={<PlayerLogin />} />
          <Route path="/player/dashboard" element={<PlayerDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
