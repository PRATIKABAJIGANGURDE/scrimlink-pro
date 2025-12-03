import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, signOut, getTeamById } from "@/lib/storage";
import { Player, Team } from "@/types";
import { Users, LogOut, Target, Trophy, Clock, BarChart3 } from "lucide-react";

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentPlayer = await getCurrentPlayer();
        if (!currentPlayer) {
          navigate("/player/login");
          return;
        }
        setPlayer(currentPlayer);

        if (currentPlayer.teamId) {
          try {
            const playerTeam = await getTeamById(currentPlayer.teamId);
            setTeam(playerTeam || null);
          } catch (error) {
            console.error("Failed to load team data:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load player:", error);
        navigate("/player/login");
      }
    };
    init();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!player) return null;

  const isPending = player.status === 'pending';
  const isApproved = player.status === 'approved';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{player.username}</h1>
              <p className="text-sm text-muted-foreground">Player Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/player/stats")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Stats
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status Card */}
        {isPending && (
          <Card className="mb-8 border-accent/50 bg-accent/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Pending Approval</h3>
                  <p className="text-sm text-muted-foreground">
                    Your request to join <span className="font-medium text-foreground">{team?.name || "the team"}</span> is pending.
                    The team captain will review your request soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Info */}
        {isApproved && team && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">Team Member</Badge>
                  <h2 className="text-2xl font-bold">{team.name}</h2>
                  {team.country && <p className="text-sm text-muted-foreground">{team.country}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Total Kills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Matches Played</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0.0</p>
                  <p className="text-sm text-muted-foreground">Avg Kills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Booyahs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match History */}
        <Card>
          <CardHeader>
            <CardTitle>Match History</CardTitle>
            <CardDescription>Your recent match performances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matches played yet</p>
              <p className="text-sm">Your match history will appear here</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlayerDashboard;
