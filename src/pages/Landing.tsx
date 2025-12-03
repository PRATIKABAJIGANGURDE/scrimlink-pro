import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Trophy, Users, Target, BarChart3, Shield, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">ScrimHub</span>
          </div>
          <div className="flex gap-3">
            <Link to="/rankings">
              <Button variant="ghost" size="sm">Rankings</Button>
            </Link>
            <Link to="/team/login">
              <Button variant="ghost" size="sm">Team Login</Button>
            </Link>
            <Link to="/player/login">
              <Button size="sm">Player Login</Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 md:py-32 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Professional Esports Management
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-foreground">
            Manage Your Free Fire
            <span className="block text-primary">Scrims Like a Pro</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The complete platform for competitive teams. Track matches, manage rosters, and climb the leaderboards with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/team/register">
              <Button size="lg" className="px-8 h-12 text-base">
                Register Your Team
              </Button>
            </Link>
            <Link to="/player/register">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                Join as Player
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built specifically for Free Fire Max competitive teams
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Team Management</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Create teams, manage rosters, and approve players with secure join codes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Scrim Hosting</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Create and manage scrims with multiple matches and invite teams easily.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Live Leaderboards</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Real-time rankings with official tie-breaker rules and detailed stats.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Player Stats</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Track individual performance with kill history and career statistics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Team join codes and player approval system for full control.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Auto Calculations</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatic point calculation and Booyah detection saves time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join teams already using ScrimHub for their competitive matches
          </p>
          <Link to="/team/register">
            <Button size="lg" className="px-10 h-12">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ScrimHub. Built for competitive Free Fire Max.</p>
        </div>
      </footer>
    </div >
  );
};

export default Landing;
