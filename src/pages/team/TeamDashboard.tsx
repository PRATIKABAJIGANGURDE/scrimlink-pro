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
  getTeamStats,
  joinScrim,
  getScrimTeams,
  getMyScrims,
  getApplicationsForTeam,
  getTeamOffers,
  getTransferRequestsForCaptain,
  updateApplicationStatus,
  approveTransferExit
} from "@/lib/storage";
import { Team, JoinRequest, Player, Scrim, Match, MatchTeamStats, ScrimTeam } from "@/types";
import { Trophy, Users, Copy, Check, LogOut, UserPlus, UserCheck, UserX, Target, Calendar, Plus, BarChart, Crown, Briefcase } from "lucide-react";
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

  const [joiningScrim, setJoiningScrim] = useState<Scrim | null>(null);
  const [takenSlots, setTakenSlots] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [myScrimIds, setMyScrimIds] = useState<string[]>([]);

  // Transfer System
  const [teamApps, setTeamApps] = useState<any[]>([]);
  const [teamOffers, setTeamOffers] = useState<any[]>([]);
  const [exitRequests, setExitRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<MatchTeamStats[]>([]);

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

  const loadData = async (teamId: string) => {
    try {
      const [reqs, players, allScrims, teamStats, myScrims, apps, offers, exits] = await Promise.all([
        getJoinRequestsByTeamId(teamId),
        getPlayersByTeamId(teamId),
        getScrims(),
        getTeamStats(teamId),
        getMyScrims(teamId),
        getApplicationsForTeam(teamId),
        getTeamOffers(teamId),
        getTransferRequestsForCaptain(teamId)
      ]);

      setRequests(reqs);
      setRoster(players);
      setScrims(allScrims);
      setStats(teamStats);
      setMyScrimIds(myScrims.map(s => s.scrimId));
      setTeamApps(apps);
      setTeamOffers(offers);
      setExitRequests(exits);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const handleAppApplication = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateApplicationStatus(appId, status);
      toast({ title: "Success", description: `Application ${status}` });
      if (team) loadData(team.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleApproveExit = async (requestId: string) => {
    try {
      await approveTransferExit(requestId);
      toast({ title: "Success", description: "Transfer approved. Player has left the team." });
      if (team) loadData(team.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      await updatePlayer(request.playerId, { status: 'approved' });

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
  const openJoinDialog = async (scrim: Scrim) => {
    setJoiningScrim(scrim);
    try {
      const teams = await getScrimTeams(scrim.id);
      const taken = teams.map(t => t.slot).filter((s): s is number => s !== undefined);
      setTakenSlots(taken);
      setIsJoinDialogOpen(true);
    } catch (error) {
      console.error("Failed to load slots:", error);
    }
  };

  const handleJoinScrim = async () => {
    if (!team || !joiningScrim || !selectedSlot) return;
    try {
      await joinScrim(joiningScrim.id, team.id, team.name, parseInt(selectedSlot));
      toast({
        title: "Success",
        description: `Joined ${joiningScrim.name} at Slot ${selectedSlot}`,
      });
      setIsJoinDialogOpen(false);
      loadData(team.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join scrim",
        variant: "destructive"
      });
    }
  };

  if (!team) return null;

  // Separate scrims into "My Scrims" and "Open Scrims"
  // This requires checking if the team is in the scrim. 
  // For now, we'll just list all and show "Join" if not host.
  // Ideally we should fetch my scrims properly.
  // Let's assume 'scrims' contains all scrims.
  // We can't easily know if we joined without fetching teams for all scrims.
  // For MVP, let's just show "Join" button. If already joined, backend will error.
  // Or better, we can fetch all my joined scrims separately?
  // getScrims() returns ALL scrims.
  // Let's just add the Join button for now.

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
        <Button variant="outline" size="sm" onClick={() => navigate("/recruitment")}>
          <Briefcase className="h-4 w-4 mr-2" />
          Recruitment
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
            <TabsTrigger value="transfers">
              Transfers
              {(teamApps.length > 0 || exitRequests.length > 0) && (
                <Badge variant="destructive" className="ml-2">{teamApps.length + exitRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfers" className="space-y-6">
            {/* Exit Requests (High Priority) */}
            {exitRequests.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Transfer Exit Requests
                  </CardTitle>
                  <CardDescription>Players requesting to leave your team for another team.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {exitRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div>
                          <div className="font-bold">{req.playerName}</div>
                          <div className="text-sm">Wants to join: <span className="font-semibold">{req.targetTeamName}</span></div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleApproveExit(req.id)}>
                          Approve Exit & Transfer
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incoming Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Applications</CardTitle>
                  <CardDescription>Players applying via your LFP posts</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamApps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No pending applications</div>
                  ) : (
                    <div className="space-y-4">
                      {teamApps.map(app => (
                        <div key={app.id} className="p-4 bg-muted rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold">{app.player.inGameName || app.player.username}</div>
                              <div className="text-xs text-muted-foreground">Checking: {app.postRole}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/player/${app.player.username}`)}>View Profile</Button>
                          </div>
                          <p className="text-sm italic text-muted-foreground mb-4">"{app.message}"</p>
                          <div className="flex gap-2">
                            <Button size="sm" className="w-full" onClick={() => handleAppApplication(app.id, 'accepted')}>Accept</Button>
                            <Button size="sm" variant="outline" className="w-full" onClick={() => handleAppApplication(app.id, 'rejected')}>Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sent Offers */}
              <Card>
                <CardHeader>
                  <CardTitle>Sent Offers</CardTitle>
                  <CardDescription>Status of offers you sent to players</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamOffers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No active offers sent</div>
                  ) : (
                    <div className="space-y-4">
                      {teamOffers.map(offer => (
                        <div key={offer.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                          <div>
                            <div className="font-semibold">{offer.player.inGameName || offer.player.username}</div>
                            <div className="text-xs text-muted-foreground">{new Date(offer.createdAt).toLocaleDateString()}</div>
                          </div>
                          <Badge variant={offer.status === 'accepted' ? 'default' : offer.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {offer.status === 'pending_exit_approval' ? 'Waiting Exit' : offer.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>


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
                            <span className="font-semibold">{(player.inGameName || player.username)[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{player.inGameName || player.username}</p>
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
                    {scrims.map((scrim) => {
                      const isHost = scrim.hostTeamId === team.id;
                      return (
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
                          <div className="flex gap-2 w-full sm:w-auto">
                            {isHost ? (
                              <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                                Manage
                              </Button>
                            ) : myScrimIds.includes(scrim.id) ? (
                              <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                                View Details
                              </Button>
                            ) : (
                              <Button className="w-full sm:w-auto" onClick={() => openJoinDialog(scrim)}>
                                Join Scrim
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join {joiningScrim?.name}</DialogTitle>
                  <DialogDescription>Select a slot to join this scrim</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-2 py-4">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((slot) => {
                    const isTaken = takenSlots.includes(slot);
                    return (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot.toString() ? "default" : "outline"}
                        disabled={isTaken}
                        onClick={() => setSelectedSlot(slot.toString())}
                        className={isTaken ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        Slot {slot}
                      </Button>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button onClick={handleJoinScrim} disabled={!selectedSlot}>
                    Confirm Join
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeamDashboard;
