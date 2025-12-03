import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Trophy, Users, Target, BarChart3, Shield, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FF Scrim Manager</span>
          </div>
          <div className="flex gap-4">
            <Link to="/team/login">
              <Button variant="outline">Team Login</Button>
            </Link>
            <Link to="/player/login">
              <Button>Player Login</Button>
            </Link>
          </div>
        </nav>
        
        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dominate the Arena
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional scrim management for Free Fire Max esports teams. Track matches, manage rosters, and climb the leaderboards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/team/register">
              <Button size="lg" className="text-lg px-8">
                <Shield className="mr-2 h-5 w-5" />
                Register Team
              </Button>
            </Link>
            <Link to="/player/register">
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Users className="mr-2 h-5 w-5" />
                Join as Player
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Everything You Need to Compete
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Team Management</h3>
                <p className="text-muted-foreground">
                  Create teams, manage rosters, approve players, and set lineups for each match.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Target className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Scrim Hosting</h3>
                <p className="text-muted-foreground">
                  Create and manage scrims with multiple matches, invite teams, and track results.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Live Leaderboards</h3>
                <p className="text-muted-foreground">
                  Real-time rankings with official tie-breaker rules. Track placements, kills, and Booyahs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Trophy className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Player Stats</h3>
                <p className="text-muted-foreground">
                  Individual performance tracking with kill history, averages, and career statistics.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
                <p className="text-muted-foreground">
                  Team join codes, player approval system, and role-based permissions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Zap className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Auto Calculations</h3>
                <p className="text-muted-foreground">
                  Automatic point calculation, Booyah detection, and team kill aggregation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Competing?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of teams already using FF Scrim Manager
          </p>
          <Link to="/team/register">
            <Button size="lg" className="text-lg px-12">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 FF Scrim Manager. Built for competitive Free Fire Max.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
