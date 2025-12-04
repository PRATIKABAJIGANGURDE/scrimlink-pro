import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentTeam,
  signOut,
  getJoinRequestsByTeamId,
  getPlayersByTeamId,
  updateJoinRequest,
  updatePlayer,
  getScrims,
  saveScrim,
  saveMatch,
  generateId,
  getTeamStats
} from "@/lib/storage";
import { Team, JoinRequest, Player, Scrim, Match, MatchTeamStats } from "@/types";
import { Trophy, Users, Copy, Check, LogOut, UserPlus, UserCheck, UserX, Target, Calendar, Plus, BarChart, Crown } from "lucide-react";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
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

const TeamDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [roster, setRoster] = useState<Player[]>([]);
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [copied, setCopied] = useState(false);
  const [isCreateScrimOpen, setIsCreateScrimOpen] = useState(false);
  const [creatingScrim, setCreatingScrim] = useState(false);

  const [newScrim, setNewScrim] = useState({
    name: "",
    matchCount: 4,
    startTime: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const currentTeam = await getCurrentTeam();
        if (!currentTeam) {
          navigate("/team/login");
          return;
        }
        setTeam(currentTeam);
        loadData(currentTeam.id);
      } catch (error) {
        console.error("Failed to load team:", error);
        navigate("/team/login");
      }
    };
    init();
  }, [navigate]);

  const [stats, setStats] = useState<MatchTeamStats[]>([]);

  const loadData = async (teamId: string) => {
    try {
      const [reqs, players, allScrims, teamStats] = await Promise.all([
        getJoinRequestsByTeamId(teamId),
        getPlayersByTeamId(teamId),
        getScrims(),
        getTeamStats(teamId)
      ]);

      setRequests(reqs);
      setRoster(players);
      setScrims(allScrims);
      setStats(teamStats);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const handleCreateScrim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setCreatingScrim(true);

    try {
      const scrimId = generateId();
      const scrim: Scrim = {
        id: scrimId,
        name: newScrim.name,
        hostTeamId: team.id,
        matchCount: newScrim.matchCount,
        status: 'upcoming',
        startTime: newScrim.startTime,
        createdAt: new Date().toISOString(),
      };

      await saveScrim(scrim);

      const matchPromises = [];
      for (let i = 1; i <= newScrim.matchCount; i++) {
        const match: Match = {
          id: generateId(),
          scrimId: scrimId,
          matchNumber: i,
          mapName: "TBD",
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        matchPromises.push(saveMatch(match));
      }

      await Promise.all(matchPromises);

      toast({
        title: "Success",
        description: "Scrim created successfully",
      });
      setIsCreateScrimOpen(false);
      loadData(team.id);
    } catch (error) {
      console.error("Failed to create scrim:", error);
      toast({
        title: "Error",
        description: "Failed to create scrim",
        variant: "destructive"
      });
    } finally {
      setCreatingScrim(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const copyJoinCode = () => {
    if (team?.joinCode) {
      navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard",
      });
    }
  };

  const handleApprove = async (request: JoinRequest) => {
    try {
      await updateJoinRequest(request.id, 'approved');
      toast({
        title: "Success",
        description: "Player approved successfully",
      });
      if (team) loadData(team.id);
    } catch (error) {
      console.error("Failed to approve request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (request: JoinRequest) => {
    try {
      await updateJoinRequest(request.id, 'rejected');
      toast({
        title: "Rejected",
        description: "Player request rejected",
      });
      if (team) loadData(team.id);
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    }
  };

  if (!team) return null;

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveNavbar
        title={team.name}
        subtitle="Team Dashboard"
        variant="dashboard"
        icon={<Trophy className="h-8 w-8 text-primary" />}
      >
        <Button variant="outline" size="sm" onClick={() => navigate("/rankings")}>
          <Crown className="h-4 w-4 mr-2" />
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
        {/* Join Code Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Team Join Code</h3>
                <p className="text-sm text-muted-foreground">Share this code with players to join your team</p>
              </div>
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
                <span className="text-2xl font-mono font-bold tracking-widest">{team.joinCode}</span>
                <Button variant="ghost" size="icon" onClick={copyJoinCode}>
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roster.length}</p>
                  <p className="text-sm text-muted-foreground">Roster Players</p>
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
                  <p className="text-2xl font-bold">{stats.reduce((acc, s) => acc + s.teamKills, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Kills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.reduce((acc, s) => acc + s.totalPoints, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.filter(s => s.isBooyah).length}</p>
                  <p className="text-sm text-muted-foreground">Booyahs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {requests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{requests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scrims">Scrims</TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <Card>
              <CardHeader>
                <CardTitle>Team Roster</CardTitle>
                <CardDescription>All approved players in your team</CardDescription>
              </CardHeader>
              <CardContent>
                {roster.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No players in roster yet</p>
                    <p className="text-sm">Share your join code to invite players</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roster.map((player) => (
                      <div key={player.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="font-semibold">{player.username[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{player.username}</p>
                              {player.role === 'IGL' && <Badge variant="default" className="text-xs">IGL</Badge>}
                              {player.role && player.role !== 'IGL' && <Badge variant="outline" className="text-xs">{player.role}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground break-all">{player.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-auto sm:ml-0">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Join Requests</CardTitle>
                <CardDescription>Players waiting for approval</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="font-semibold">{request.playerUsername[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{request.playerUsername}</p>
                            <p className="text-sm text-muted-foreground">{request.playerEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(request)}>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(request)}>
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scrims">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Scrims</CardTitle>
                  <CardDescription>View upcoming scrims</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {scrims.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No scrims yet</p>
                    <p className="text-sm mb-4">Create a scrim to start competing</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scrims.map((scrim) => (
                      <div key={scrim.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Target className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{scrim.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(scrim.startTime || "").toLocaleString()}
                              </span>
                              <span>{scrim.matchCount} Matches</span>
                              <Badge variant={scrim.status === 'upcoming' ? 'secondary' : 'default'} className="whitespace-nowrap">
                                {scrim.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeamDashboard;
