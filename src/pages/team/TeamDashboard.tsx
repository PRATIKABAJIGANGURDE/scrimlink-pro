import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  getCurrentTeam, 
  setCurrentTeam, 
  getJoinRequestsByTeamId, 
  getPlayersByTeamId,
  updateJoinRequest,
  updatePlayer,
  getPlayerById
} from "@/lib/storage";
import { Team, JoinRequest, Player } from "@/types";
import { Trophy, Users, Copy, Check, LogOut, UserPlus, UserCheck, UserX, Target } from "lucide-react";

const TeamDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [roster, setRoster] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentTeam = getCurrentTeam();
    if (!currentTeam) {
      navigate("/team/login");
      return;
    }
    setTeam(currentTeam);
    loadData(currentTeam.id);
  }, [navigate]);

  const loadData = (teamId: string) => {
    setRequests(getJoinRequestsByTeamId(teamId));
    setRoster(getPlayersByTeamId(teamId));
  };

  const copyJoinCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Join code copied to clipboard" });
    }
  };

  const handleLogout = () => {
    setCurrentTeam(null);
    navigate("/");
  };

  const handleApprove = (request: JoinRequest) => {
    updateJoinRequest(request.id, 'approved');
    updatePlayer(request.playerId, { status: 'approved' });
    toast({ title: "Approved", description: `${request.playerUsername} has been added to the roster` });
    if (team) loadData(team.id);
  };

  const handleReject = (request: JoinRequest) => {
    updateJoinRequest(request.id, 'rejected');
    updatePlayer(request.playerId, { status: 'rejected' });
    toast({ title: "Rejected", description: `${request.playerUsername}'s request has been rejected` });
    if (team) loadData(team.id);
  };

  if (!team) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{team.name}</h1>
              <p className="text-sm text-muted-foreground">Team Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  <UserPlus className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
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
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Scrims Played</p>
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
                      <div key={player.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-semibold">{player.username[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{player.username}</p>
                            <p className="text-sm text-muted-foreground">{player.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
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
              <CardHeader>
                <CardTitle>Scrims</CardTitle>
                <CardDescription>Manage your scrims and matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scrims yet</p>
                  <p className="text-sm mb-4">Create a scrim to start competing</p>
                  <Button>Create Scrim</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeamDashboard;
