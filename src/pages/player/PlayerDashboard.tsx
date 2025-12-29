import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, getCurrentTeam, signOut, getTeamById, getPlayerStats, getTeamStats, joinTeam, getScrims, joinScrim, getScrimTeams, getMyApplications, getMyOffers, respondToOffer } from "@/lib/storage";
import { Player, Team, Scrim, TeamApplication, TransferOffer } from "@/types";
import { Users, LogOut, Target, Trophy, Clock, BarChart3, Crosshair, TrendingUp, User as UserIcon, BarChart, ArrowRight, Calendar, Briefcase, Handshake, Lock, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Countdown } from "@/components/Countdown";
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
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [hasTeamProfile, setHasTeamProfile] = useState(false);

  // Transfer System
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [offers, setOffers] = useState<TransferOffer[]>([]);

  // Scrim Joining State
  const [joiningScrim, setJoiningScrim] = useState<Scrim | null>(null);
  const [takenSlots, setTakenSlots] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);


  useEffect(() => {
    const init = async () => {
      try {
        const currentPlayer = await getCurrentPlayer();
        if (!currentPlayer) {
          navigate("/player/login");
          return;
        }
        setPlayer(currentPlayer);

        // Check for team profile (owned team) AND that we are still connected to it
        const teamProfile = await getCurrentTeam();
        if (teamProfile && currentPlayer.teamId === teamProfile.id) setHasTeamProfile(true);

        if (!currentPlayer.gameUid || !currentPlayer.inGameName) {
          navigate("/player/onboarding");
          return;
        }

        // Fetch stats & transfers
        const [playerStats, myApps, myOffers] = await Promise.all([
          getPlayerStats(currentPlayer.id),
          getMyApplications(),
          getMyOffers()
        ]);
        setStats(playerStats);
        setApplications(myApps);
        setOffers(myOffers);

        if (currentPlayer.teamId) {
          try {
            const [playerTeam, tStats, allScrims] = await Promise.all([
              getTeamById(currentPlayer.teamId),
              getTeamStats(currentPlayer.teamId),
              getScrims()
            ]);
            setTeam(playerTeam || null);
            setTeamStats(tStats);
            setScrims(allScrims);
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
      // Refresh data? Ideally yes, but for now just close dialog
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join scrim",
        variant: "destructive"
      });
    }
  };

  const handleOfferResponse = async (offerId: string, response: 'accepted' | 'rejected') => {
    try {
      await respondToOffer(offerId, response);
      toast({ title: response === 'accepted' ? "Offer Accepted" : "Offer Rejected", description: response === 'accepted' ? "Action successful." : "You rejected the offer." });
      const updatedOffers = await getMyOffers();
      setOffers(updatedOffers);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        title={player.inGameName || player.username}
        subtitle="Player Dashboard"
        variant="dashboard"
        icon={<Users className="h-8 w-8 text-primary" />}
      >
        {hasTeamProfile ? (
          <Button variant="secondary" size="sm" onClick={() => navigate("/team/dashboard")}>
            <Trophy className="h-4 w-4 mr-2" />
            Switch to Team
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => navigate("/team/register")}>
            <Trophy className="h-4 w-4 mr-2" />
            Create Team Profile
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate("/player/profile")}>
          <UserIcon className="h-4 w-4 mr-2" />
          Profile
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/rankings")}>
          <Trophy className="h-4 w-4 mr-2" />
          Rankings
        </Button>

        <Button variant="outline" size="sm" onClick={() => navigate("/recruitment")}>
          <Briefcase className="h-4 w-4 mr-2" />
          Recruitment
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/match-results")}>
          <BarChart className="h-4 w-4 mr-2" />
          Results
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/feedback")}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scrims">Scrims</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>

          <TabsContent value="transfers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* My Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>Status of your applications to teams</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No active applications</div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map(app => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                          <div>
                            <div className="font-semibold">{app.post?.team?.name || 'Unknown Team'}</div>
                            <div className="text-xs text-muted-foreground">Role: {app.post?.role}</div>
                          </div>
                          <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Incoming Offers */}
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Offers</CardTitle>
                  <CardDescription>Teams that want you!</CardDescription>
                </CardHeader>
                <CardContent>
                  {offers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No pending offers</div>
                  ) : (
                    <div className="space-y-4">
                      {offers.map(offer => (
                        <div key={offer.id} className="p-4 bg-muted rounded-lg border">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={offer.team?.logoUrl} />
                              <AvatarFallback>{offer.team?.name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold">{offer.team?.name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(offer.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <p className="text-sm italic text-muted-foreground mb-4">"{offer.message}"</p>
                          <div className="flex gap-2">
                            {offer.status === 'pending' ? (
                              <>
                                <Button size="sm" className="w-full" onClick={() => handleOfferResponse(offer.id, 'accepted')}>Accept</Button>
                                <Button size="sm" variant="outline" className="w-full" onClick={() => handleOfferResponse(offer.id, 'rejected')}>Reject</Button>
                              </>
                            ) : (
                              <Badge variant="outline" className="w-full justify-center">{offer.status.toUpperCase()}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview">
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
          </TabsContent>

          <TabsContent value="scrims">
            <Card>
              <CardHeader>
                <CardTitle>Scrims</CardTitle>
                <CardDescription>Upcoming scrims and matches</CardDescription>
              </CardHeader>
              <CardContent>
                {scrims.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No scrims available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scrims.map((scrim) => {
                      // Check if my team is in this scrim (we need to fetch this info or assume)
                      // For now, we just show "Join" if IGL and "Manage" if joined (but we don't know if joined easily without fetching)
                      // Let's rely on the user. If they click Join and are joined, it errors.
                      // If they click Manage, they go to details.

                      const isIGL = player.role === 'IGL';

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
                                {scrim.status === 'upcoming' && scrim.startTime ? (
                                  <Countdown targetDate={scrim.startTime} />
                                ) : (
                                  <Badge variant={scrim.status === 'upcoming' ? 'secondary' : 'default'} className="whitespace-nowrap">
                                    {scrim.status.toUpperCase()}
                                  </Badge>
                                )}
                                <span>{scrim.matchCount} Matches</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                              View Details
                            </Button>
                            {isIGL && scrim.status === 'upcoming' && (
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
      </main >
    </div >
  );
};

export default PlayerDashboard;
