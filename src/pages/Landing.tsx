import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Users, Target, BarChart3, Shield, Zap, Crosshair, Crown, ArrowRight, Gamepad2, Swords, Flame } from "lucide-react";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
import { getCurrentUser, getCurrentPlayer, getCurrentTeam, getAdmin } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const player = await getCurrentPlayer();
        if (player) {
          toast({
            title: "Welcome back!",
            description: `Logged in as ${player.username}`,
          });
          navigate("/player/dashboard");
          return;
        }

        const team = await getCurrentTeam();
        if (team) {
          toast({
            title: "Welcome back!",
            description: `Logged in as ${team.name}`,
          });
          navigate("/team/dashboard");
          return;
        }

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
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-hero-pattern pointer-events-none" />
      
      {/* Floating Orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-float pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-float-slow pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <ResponsiveNavbar
        title="ScrimHub"
        icon={
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center box-glow">
            <Gamepad2 className="h-4 w-4 text-primary" />
          </div>
        }
      >
        <Link to="/rankings" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:text-glow">
          Rankings
        </Link>
        <Link to="/match-results" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:text-glow">
          Results
        </Link>
      </ResponsiveNavbar>

      <main className="flex-1 pt-24 relative z-10">
        {/* Hero Section */}
        <section className="py-12 md:py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className={`text-center mb-16 max-w-4xl mx-auto ${isLoaded ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-pulse-glow">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Season 1 Now Live</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight font-display">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent">
                  SCRIMHUB
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The ultimate <span className="text-primary font-semibold">esports platform</span> for competitive gamers. 
                Dominate scrims. Track stats. Rise to glory.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <Link to="/player/register">
                  <Button size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-bold shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105 group">
                    <Crosshair className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                    Join as Player
                  </Button>
                </Link>
                <Link to="/team/register">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-secondary/50 hover:border-secondary hover:bg-secondary/10 font-bold transition-all duration-300 hover:scale-105 group">
                    <Shield className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Register Team
                  </Button>
                </Link>
              </div>
            </div>

            {/* Cards Section */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Player Card */}
              <div className={`${isLoaded ? 'animate-slide-right' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/60 transition-all duration-500 group hover:box-glow">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500" />
                  
                  <CardHeader className="text-center pb-2 relative">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Crosshair className="h-10 w-10 text-primary group-hover:animate-pulse" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-display tracking-wide">
                      <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">PLAYERS</span>
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">Prove your skills & join top teams</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 text-center pt-4 relative">
                    <ul className="space-y-4 text-sm text-left max-w-xs mx-auto">
                      {[
                        { icon: Zap, text: "Track your personal stats & K/D" },
                        { icon: Trophy, text: "Climb the global player rankings" },
                        { icon: Users, text: "Find and join competitive teams" }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 group/item">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                            <item.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex flex-col gap-3 pt-4">
                      <Link to="/player/register" className="w-full">
                        <Button className="w-full text-lg h-12 bg-primary hover:bg-primary/90 font-bold group/btn">
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/player/login" className="w-full">
                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5">
                          Already have an account? Login
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Card */}
              <div className={`${isLoaded ? 'animate-slide-left' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-secondary/20 hover:border-secondary/60 transition-all duration-500 group hover:box-glow-secondary">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl group-hover:bg-secondary/30 transition-colors duration-500" />
                  
                  <CardHeader className="text-center pb-2 relative">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                      <Shield className="h-10 w-10 text-secondary group-hover:animate-pulse" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-display tracking-wide">
                      <span className="bg-gradient-to-r from-secondary to-purple-300 bg-clip-text text-transparent">TEAMS</span>
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">Manage rosters & dominate scrims</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 text-center pt-4 relative">
                    <ul className="space-y-4 text-sm text-left max-w-xs mx-auto">
                      {[
                        { icon: Users, text: "Manage roster & recruit players" },
                        { icon: Swords, text: "Participate in scrims" },
                        { icon: BarChart3, text: "Analyze team performance" }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 group/item">
                          <div className="h-8 w-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center group-hover/item:bg-secondary/20 transition-colors">
                            <item.icon className="h-4 w-4 text-secondary" />
                          </div>
                          <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex flex-col gap-3 pt-4">
                      <Link to="/team/register" className="w-full">
                        <Button className="w-full text-lg h-12 bg-secondary hover:bg-secondary/90 font-bold group/btn">
                          Register Team
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/team/login" className="w-full">
                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-secondary hover:bg-secondary/5">
                          Already registered? Login
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
          
          <div className="container mx-auto px-4 relative">
            <div className={`text-center mb-16 ${isLoaded ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
                <span className="bg-gradient-to-r from-accent via-secondary to-primary bg-clip-text text-transparent">
                  WHY SCRIMHUB?
                </span>
              </h2>
              <p className="text-muted-foreground text-lg">Built for the competitive Free Fire community</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { icon: Crown, title: "Global Rankings", desc: "Compete against teams and players worldwide. Climb the leaderboards.", color: "primary", delay: "0.7s" },
                { icon: Zap, title: "Instant Scoring", desc: "Automated point calculations and Booyah detection for all matches.", color: "secondary", delay: "0.8s" },
                { icon: BarChart3, title: "Deep Analytics", desc: "In-depth statistics for every match, player, and team performance.", color: "accent", delay: "0.9s" }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className={`${isLoaded ? 'animate-scale-in' : 'opacity-0'}`} 
                  style={{ animationDelay: feature.delay }}
                >
                  <Card className={`group bg-card/30 backdrop-blur-sm border-${feature.color}/20 hover:border-${feature.color}/50 transition-all duration-500 h-full hover:transform hover:-translate-y-2`}>
                    <CardContent className="p-8 text-center">
                      <div className={`mx-auto h-16 w-16 rounded-2xl bg-${feature.color}/10 border border-${feature.color}/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                        <feature.icon className={`h-8 w-8 text-${feature.color}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 font-display">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className={`text-center max-w-3xl mx-auto ${isLoaded ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '1s' }}>
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent blur-3xl opacity-30 animate-pulse" />
                <h2 className="relative text-4xl md:text-6xl font-black font-display mb-6">
                  READY TO <span className="text-primary text-glow">DOMINATE</span>?
                </h2>
              </div>
              <p className="text-xl text-muted-foreground mb-10">
                Join thousands of competitive players and teams already on ScrimHub.
              </p>
              <Link to="/player/register">
                <Button size="lg" className="text-xl px-12 h-16 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 font-bold shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 animate-pulse-glow">
                  Get Started Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border/50 relative z-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ScrimHub. Built for champions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
