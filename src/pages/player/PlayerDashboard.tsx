import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, signOut, getTeamById, getPlayerStats, getTeamStats, joinTeam } from "@/lib/storage";
import { Player, Team } from "@/types";
import { Users, LogOut, Target, Trophy, Clock, BarChart3, Crosshair, TrendingUp, User as UserIcon, BarChart, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const currentPlayer = await getCurrentPlayer();
        if (!currentPlayer) {
          navigate("/player/login");
          return;
        }
        setPlayer(currentPlayer);

        // Fetch stats
        const playerStats = await getPlayerStats(currentPlayer.id);
        setStats(playerStats);

        if (currentPlayer.teamId) {
          try {
            const [playerTeam, tStats] = await Promise.all([
              getTeamById(currentPlayer.teamId),
              getTeamStats(currentPlayer.teamId)
            ]);
            setTeam(playerTeam || null);
            setTeamStats(tStats);
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

  const handleJoinTeam = async () => {
    if (!player || !joinCode) return;
    setIsJoining(true);
    try {
      const joinedTeam = await joinTeam(player.id, joinCode);
      toast({
        title: "Request Sent",
        description: `Successfully requested to join ${joinedTeam.name}`
      });
      // Refresh player data
      const updatedPlayer = await getCurrentPlayer();
      setPlayer(updatedPlayer);
      if (updatedPlayer?.teamId) {
        const t = await getTeamById(updatedPlayer.teamId);
        setTeam(t);
      }
      setJoinCode("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!player) return null;

  const isPending = player.status === 'pending';
  const isApproved = player.status === 'approved';

  const totalKills = stats.reduce((acc, s) => acc + s.kills, 0);
  const totalMatches = stats.length;
  const avgKills = totalMatches > 0 ? (totalKills / totalMatches).toFixed(1) : "0.0";

  // Calculate Booyahs: matches where player played AND team won
  const booyahs = teamStats.filter(ts =>
    ts.isBooyah && stats.some(ps => ps.matchId === ts.matchId)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveNavbar
        title={player.username}
        subtitle="Player Dashboard"
        variant="dashboard"
        icon={<Users className="h-8 w-8 text-primary" />}
      >
        <Button variant="outline" size="sm" onClick={() => navigate("/player/profile")}>
          <UserIcon className="h-4 w-4 mr-2" />
          Profile
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/rankings")}>
          <Trophy className="h-4 w-4 mr-2" />
          Rankings
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/match-results")}>
          <BarChart className="h-4 w-4 mr-2" />
          Results
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out of your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ResponsiveNavbar>

      <main className="container mx-auto px-4 pt-24 md:pt-8 pb-8">
        {/* Status Cards */}
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

        {!player.teamId && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>Join a Team</CardTitle>
              <CardDescription>Enter a team's 6-digit join code to send a request.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 max-w-md">
                <div className="flex-1">
                  <Label htmlFor="joinCode" className="sr-only">Join Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter 6-digit code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleJoinTeam} disabled={isJoining || joinCode.length !== 6}>
                  {isJoining ? "Joining..." : "Join Team"}
                  {!isJoining && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crosshair className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalKills}</p>
                  <p className="text-sm text-muted-foreground">Total Kills</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMatches}</p>
                  <p className="text-sm text-muted-foreground">Matches Played</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgKills}</p>
                  <p className="text-sm text-muted-foreground">Avg Kills</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{booyahs}</p>
                  <p className="text-sm text-muted-foreground">Booyahs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Info */}
        {
          isApproved && team && (
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
          )
        }



        {/* Kills Graph */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Kills per match over time</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No matches played yet</p>
                <p className="text-sm">Play matches to see your performance graph</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.map(s => ({
                      name: `M${s.match.matchNumber}`,
                      kills: s.kills,
                      fullDate: new Date(s.match.createdAt).toLocaleDateString()
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="kills" stroke="#8884d8" fillOpacity={1} fill="url(#colorKills)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </main >
    </div >
  );
};

export default PlayerDashboard;
