import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    getCurrentUser,
    getAdmin,
    signOut,
    getScrims,
    saveScrim,
    saveMatch,
    generateId,
    getTeams,
    getPlayers,
    getMatchResults
} from "@/lib/storage";
import { Scrim, Match, Team, Player } from "@/types";
import { Shield, LogOut, Plus, Target, Calendar, Trophy, BarChart, Users, User } from "lucide-react";
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

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scrims, setScrims] = useState<Scrim[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isCreateScrimOpen, setIsCreateScrimOpen] = useState(false);
    const [creatingScrim, setCreatingScrim] = useState(false);
    const [selectedScrimResults, setSelectedScrimResults] = useState<any[] | null>(null);
    const [isResultsOpen, setIsResultsOpen] = useState(false);

    const [newScrim, setNewScrim] = useState({
        name: "",
        matchCount: 4,
        startTime: "",
    });

    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    navigate("/admin/login");
                    return;
                }

                const admin = await getAdmin(user.id);
                if (!admin) {
                    toast({
                        title: "Access Denied",
                        description: "You are not an admin. Please login with an admin account.",
                        variant: "destructive"
                    });
                    navigate("/admin/login");
                    return;
                }

                setIsAdmin(true);
                loadData();
            } catch (error) {
                console.error("Admin check failed:", error);
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [allScrims, allTeams, allPlayers] = await Promise.all([
                getScrims(),
                getTeams(),
                getPlayers()
            ]);
            setScrims(allScrims);
            setTeams(allTeams);
            setPlayers(allPlayers);
        } catch (error) {
            console.error("Failed to load data:", error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data",
                variant: "destructive"
            });
        }
    };

    const handleCreateScrim = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingScrim(true);

        try {
            const user = await getCurrentUser();
            if (!user) return;

            const scrimId = generateId();
            const scrim: Scrim = {
                id: scrimId,
                name: newScrim.name,
                hostTeamId: user.id, // Admin is the host
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
            loadData();
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

    const handleViewResults = async (scrimId: string) => {
        // This is a placeholder. In a real app, you'd fetch results for all matches in the scrim
        // and aggregate them. For now, we'll just navigate to the scrim page or show a simple message.
        // Or better, we can fetch the results if we have an API for it.
        // Since getMatchResults takes a matchId, we'd need to get matches first.
        // For simplicity in this view, let's just redirect to the scrim page where results are managed.
        navigate(`/scrim/${scrimId}`);
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    const getTeamName = (teamId: string | undefined) => {
        if (!teamId) return "No Team";
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : "Unknown Team";
    };

    if (loading) return null;
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNavbar
                title="Admin Dashboard"
                variant="dashboard"
                icon={<Shield className="h-8 w-8 text-primary" />}
            >
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

            <main className="container mx-auto px-4 pt-24 pb-8">
                <Tabs defaultValue="scrims" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="scrims">Scrims</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="players">Players</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scrims" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Scrims</CardTitle>
                                    <CardDescription>Manage all scrims</CardDescription>
                                </div>
                                <Dialog open={isCreateScrimOpen} onOpenChange={setIsCreateScrimOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Scrim
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Scrim</DialogTitle>
                                            <DialogDescription>Set up a new scrim session</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateScrim} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="scrimName">Scrim Name</Label>
                                                <Input
                                                    id="scrimName"
                                                    placeholder="e.g. Daily Scrim #1"
                                                    value={newScrim.name}
                                                    onChange={(e) => setNewScrim({ ...newScrim, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="matchCount">Number of Matches</Label>
                                                <Input
                                                    id="matchCount"
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={newScrim.matchCount}
                                                    onChange={(e) => setNewScrim({ ...newScrim, matchCount: parseInt(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="startTime">Start Time</Label>
                                                <Input
                                                    id="startTime"
                                                    type="datetime-local"
                                                    value={newScrim.startTime}
                                                    onChange={(e) => setNewScrim({ ...newScrim, startTime: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={creatingScrim}>
                                                    {creatingScrim ? "Creating..." : "Create Scrim"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {scrims.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No scrims found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {['ongoing', 'upcoming', 'completed'].map((status) => {
                                            // Cast status to match Scrim['status'] to avoid type errors
                                            const currentStatus = status as Scrim['status'];
                                            const statusScrims = scrims.filter(s => s.status === currentStatus);
                                            if (statusScrims.length === 0) return null;

                                            return (
                                                <div key={status} className="space-y-4">
                                                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                                                        {status === 'ongoing' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                                        {status === 'ongoing' ? 'Live' : status} Scrims
                                                    </h3>
                                                    <div className="grid gap-4">
                                                        {statusScrims.map((scrim) => (
                                                            <div key={scrim.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                        <Target className="h-6 w-6 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-semibold text-lg">{scrim.name}</h4>
                                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar className="h-3 w-3" />
                                                                                {new Date(scrim.startTime || "").toLocaleString()}
                                                                            </span>
                                                                            <span>{scrim.matchCount} Matches</span>
                                                                            <Badge variant={scrim.status === 'upcoming' ? 'secondary' : scrim.status === 'ongoing' ? 'destructive' : 'default'}>
                                                                                {scrim.status === 'ongoing' ? 'LIVE' : scrim.status.toUpperCase()}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {scrim.status === 'completed' && (
                                                                        <Button variant="secondary" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                                                                            View Results
                                                                        </Button>
                                                                    )}
                                                                    <Button variant="outline" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                                                                        Manage
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>



                    <TabsContent value="teams">
                        <Card>
                            <CardHeader>
                                <CardTitle>Registered Teams</CardTitle>
                                <CardDescription>List of all registered teams</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Team Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Country</TableHead>
                                            <TableHead>Joined At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teams.map((team) => (
                                            <TableRow key={team.id}>
                                                <TableCell className="font-medium">
                                                    <Button
                                                        variant="link"
                                                        className="p-0 h-auto font-medium flex items-center gap-2 text-foreground hover:text-primary"
                                                        onClick={() => setSelectedTeam(team)}
                                                    >
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {team.name}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{team.email}</TableCell>
                                                <TableCell>{team.country || "N/A"}</TableCell>
                                                <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {teams.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    No teams registered
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        {selectedTeam?.name} - Roster
                                    </DialogTitle>
                                    <DialogDescription>
                                        Players currently in this team
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Username</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Joined At</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {players.filter(p => p.teamId === selectedTeam?.id).map((player) => (
                                                <TableRow key={player.id}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {player.username}
                                                    </TableCell>
                                                    <TableCell>{player.email}</TableCell>
                                                    <TableCell>
                                                        {player.role ? <Badge variant="outline">{player.role}</Badge> : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={player.status === 'approved' ? 'default' : 'secondary'}>
                                                            {player.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{new Date(player.createdAt).toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            ))}
                                            {players.filter(p => p.teamId === selectedTeam?.id).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                        No players found in this team
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="players">
                        <Card>
                            <CardHeader>
                                <CardTitle>Registered Players</CardTitle>
                                <CardDescription>List of all registered players</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {players.map((player) => (
                                            <TableRow key={player.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {player.username}
                                                </TableCell>
                                                <TableCell>{player.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {getTeamName(player.teamId)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={player.status === 'approved' ? 'default' : 'secondary'}>
                                                        {player.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(player.createdAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {players.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                    No players registered
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default AdminDashboard;
