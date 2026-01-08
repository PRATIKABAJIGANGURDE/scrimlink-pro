import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Users, Target, BarChart3, Shield, Zap, Crosshair, Crown, ArrowRight } from "lucide-react";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
import { getCurrentUser, getCurrentPlayer, getCurrentTeam, getAdmin } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        // Check if Player
        const player = await getCurrentPlayer();
        if (player) {
          toast({
            title: "Welcome back!",
            description: `Logged in as ${player.username}`,
          });
          navigate("/player/dashboard");
          return;
        }

        // Check if Team
        const team = await getCurrentTeam();
        if (team) {
          toast({
            title: "Welcome back!",
            description: `Logged in as ${team.name}`,
          });
          navigate("/team/dashboard");
          return;
        }

        // Check if Admin
        const admin = await getAdmin(user.id);
        if (admin) {
          toast({
            title: "Welcome back!",
            description: "Logged in as Admin",
          });
          navigate("/admin");
          return;
        }

      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkSession();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <ResponsiveNavbar
        title="ScrimHub"
        icon={
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
        }
      >
        <Link to="/rankings" className="text-sm font-medium hover:text-primary transition-colors">
          Rankings
        </Link>
        <Link to="/match-results" className="text-sm font-medium hover:text-primary transition-colors">
          Results
        </Link>
      </ResponsiveNavbar>

      <main className="flex-1 pt-32">
        {/* Hero Section - Split View */}
        <section className="py-12 md:py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                The Ultimate <span className="text-primary">Esports Platform</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Whether you're a player looking to prove yourself or a team manager building a legacy, ScrimHub has the tools you need.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Player Card */}
              <Card className="relative overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Crosshair className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-bold">For Players</CardTitle>
                  <CardDescription className="text-lg">Prove your skills & join top teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center pt-6">
                  <ul className="space-y-3 text-sm text-muted-foreground text-left max-w-xs mx-auto">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Track your personal stats & K/D
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Climb the global player rankings
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Find and join competitive teams
                    </li>
                  </ul>
                  <div className="flex flex-col gap-3 pt-4">
                    <Link to="/player/register" className="w-full">
                      <Button className="w-full text-lg h-12 group-hover:bg-primary/90">
                        Create Player Account
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/player/login" className="w-full">
                      <Button variant="outline" className="w-full">
                        Player Login
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Team Card */}
              <Card className="relative overflow-hidden border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-violet-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">For Teams</CardTitle>
                  <CardDescription className="text-lg">Manage rosters & dominate scrims</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center pt-6">
                  <ul className="space-y-3 text-sm text-muted-foreground text-left max-w-xs mx-auto">
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-violet-500" />
                      Manage roster & recruit players
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-violet-500" />
                      Participate in scrims
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-violet-500" />
                      Analyze team performance
                    </li>
                  </ul>
                  <div className="flex flex-col gap-3 pt-4">
                    <Link to="/team/register" className="w-full">
                      <Button className="w-full text-lg h-12 bg-violet-500 hover:bg-violet-600 text-white">
                        Register New Team
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/team/login" className="w-full">
                      <Button variant="outline" className="w-full border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-500">
                        Team Login
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose ScrimHub?</h2>
              <p className="text-muted-foreground">Built for the competitive Free Fire community</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-background border border-border/50 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Rankings</h3>
                <p className="text-muted-foreground">Compete against other teams and players to climb the official leaderboards.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-background border border-border/50 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Automated Scoring</h3>
                <p className="text-muted-foreground">Instant point calculations and Booyah detection for all your matches.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-background border border-border/50 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
                <p className="text-muted-foreground">In-depth statistics for every match, player, and team to help you improve.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ScrimHub. The professional choice for esports management.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
