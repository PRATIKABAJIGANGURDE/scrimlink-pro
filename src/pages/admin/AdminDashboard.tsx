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
    getAllReportsForAdmin,
    getAllTransferActivitiesForAdmin,
    fixUsernameSpaces
} from "@/lib/storage";
import { Scrim, Match, Team, Player } from "@/types";
import { Shield, LogOut, Plus, Target, Calendar, Trophy, BarChart, Users, User, AlertTriangle } from "lucide-react";
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

import { adminCreatePlayer, adminCreateTeam } from "@/lib/adminAuth";
import { Copy, UserPlus } from "lucide-react";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scrims, setScrims] = useState<Scrim[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [transfers, setTransfers] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isCreateScrimOpen, setIsCreateScrimOpen] = useState(false);
    const [creatingScrim, setCreatingScrim] = useState(false);

    // User Management State
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);
    const [newTeam, setNewTeam] = useState({ name: "", email: "", password: "", joinCode: "" });
    const [newPlayer, setNewPlayer] = useState({ username: "", email: "", password: "", phoneNumber: "", joinCode: "" });

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
            const [allScrims, allTeams, allPlayers, allReports, allTransfers] = await Promise.all([
                getScrims(),
                getTeams(),
                getPlayers(),
                getAllReportsForAdmin(1, 100),
                getAllTransferActivitiesForAdmin(100)
            ]);
            setScrims(allScrims);
            setTeams(allTeams);
            setPlayers(allPlayers);
            setReports(allReports.data);
            setTransfers(allTransfers);
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

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        try {
            await adminCreateTeam(newTeam.email, newTeam.password, newTeam.name, newTeam.joinCode);
            setCreatedCredentials({ email: newTeam.email, password: newTeam.password });
            setNewTeam({ name: "", email: "", password: "", joinCode: "" }); // Reset form
            toast({ title: "Success", description: "Team created successfully" });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleCreatePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        try {
            await adminCreatePlayer(newPlayer.email, newPlayer.password, newPlayer.username, newPlayer.joinCode || undefined, undefined, newPlayer.phoneNumber);
            setCreatedCredentials({ email: newPlayer.email, password: newPlayer.password });
            setNewPlayer({ username: "", email: "", password: "", phoneNumber: "", joinCode: "" }); // Reset form
            toast({ title: "Success", description: "Player created successfully" });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleFixUsernames = async () => {
        setLoading(true);
        try {
            const count = await fixUsernameSpaces();
            toast({
                title: "Usernames Fixed",
                description: `Updated ${count} usernames by removing spaces.`,
            });
            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to fix usernames",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
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
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="players">Players</TabsTrigger>
                        <TabsTrigger value="reports" className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Reports
                        </TabsTrigger>
                        <TabsTrigger value="transfers">Transfers</TabsTrigger>
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
                                                    <TableCell className="font-medium">
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto font-medium flex items-center gap-2 text-foreground hover:text-primary"
                                                            onClick={() => navigate(`/player/${player.username}`)}
                                                        >
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {player.inGameName || player.username}
                                                        </Button>
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
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Registered Players</CardTitle>
                                    <CardDescription>List of all registered players</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleFixUsernames}>
                                    <User className="h-4 w-4 mr-2" />
                                    Fix Usernames
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Username</TableHead>
                                            <TableHead>In-Game Name</TableHead>
                                            <TableHead>Game UID</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {players.map((player) => (
                                            <TableRow key={player.id}>
                                                <TableCell className="font-medium">
                                                    <Button
                                                        variant="link"
                                                        className="p-0 h-auto font-medium flex items-center gap-2 text-foreground hover:text-primary"
                                                        onClick={() => navigate(`/player/${player.username}`)}
                                                    >
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {player.inGameName || player.username}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{player.inGameName || "-"}</TableCell>
                                                <TableCell className="font-mono text-xs">{player.gameUid || "-"}</TableCell>
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
                                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                    No players registered
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reports">
                        <Card>
                            <CardHeader>
                                <CardTitle>Player Reports</CardTitle>
                                <CardDescription>View and manage reports filed against players.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Reporter</TableHead>
                                            <TableHead>Reported Player</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Scrim</TableHead>
                                            <TableHead>Votes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{report.reporter?.username}</span>
                                                        <span className="text-xs text-muted-foreground">{report.reporter?.inGameName}</span>
                                                        {report.reporter?.phoneNumber && (
                                                            <span className="text-xs text-muted-foreground">{report.reporter.phoneNumber}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-destructive">{report.reportedPlayer?.username}</span>
                                                        <span className="text-xs text-muted-foreground">{report.reportedPlayer?.inGameName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={report.reason}>
                                                    {report.reason}
                                                </TableCell>
                                                <TableCell>{report.scrimName || report.scrimId}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className="text-green-500 border-green-200">
                                                            {report.likes} Likes
                                                        </Badge>
                                                        <Badge variant="outline" className="text-red-500 border-red-200">
                                                            {report.dislikes} Dislikes
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {reports.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No reports found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transfers">
                        <Card>
                            <CardHeader>
                                <CardTitle>Transfer Activity Log</CardTitle>
                                <CardDescription>Monitor all recruitment applications and transfer offers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actor</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transfers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center">No activity found</TableCell>
                                            </TableRow>
                                        ) : (
                                            transfers.map((t) => (
                                                <TableRow key={`${t.type}-${t.id}`}>
                                                    <TableCell>
                                                        <Badge variant={t.type === 'application' ? 'default' : 'secondary'}>
                                                            {t.type.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{t.date.toLocaleString()}</TableCell>
                                                    <TableCell className="font-medium">{t.actor}</TableCell>
                                                    <TableCell>{t.target}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={t.status === 'accepted' ? 'outline' : t.status === 'rejected' ? 'destructive' : t.status === 'pending_exit_approval' ? 'secondary' : 'default'}>
                                                            {t.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate" title={t.details}>
                                                        {t.details}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Create Team Form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create Team</CardTitle>
                                    <CardDescription>Manually register a new team.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateTeam} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="teamName">Team Name</Label>
                                            <Input
                                                id="teamName"
                                                value={newTeam.name}
                                                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="teamEmail">Email</Label>
                                            <Input
                                                id="teamEmail"
                                                type="email"
                                                value={newTeam.email}
                                                onChange={(e) => setNewTeam({ ...newTeam, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="teamPassword">Password</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="teamPassword"
                                                    value={newTeam.password}
                                                    onChange={(e) => setNewTeam({ ...newTeam, password: e.target.value })}
                                                    required
                                                />
                                                <Button type="button" variant="outline" onClick={() => setNewTeam({ ...newTeam, password: Math.random().toString(36).slice(-8) })}>
                                                    Generate
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="teamJoinCode">Join Code</Label>
                                            <Input
                                                id="teamJoinCode"
                                                value={newTeam.joinCode}
                                                onChange={(e) => setNewTeam({ ...newTeam, joinCode: e.target.value.toUpperCase() })}
                                                required
                                                maxLength={6}
                                            />
                                        </div>
                                        <Button type="submit" disabled={isCreatingUser} className="w-full">
                                            {isCreatingUser ? "Creating..." : "Create Team"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Create Player Form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create Player</CardTitle>
                                    <CardDescription>Manually register a player.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreatePlayer} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="playerUsername">Username</Label>
                                            <Input
                                                id="playerUsername"
                                                value={newPlayer.username}
                                                onChange={(e) => setNewPlayer({ ...newPlayer, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="playerEmail">Email</Label>
                                            <Input
                                                id="playerEmail"
                                                type="email"
                                                value={newPlayer.email}
                                                onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="playerPassword">Password</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="playerPassword"
                                                    value={newPlayer.password}
                                                    onChange={(e) => setNewPlayer({ ...newPlayer, password: e.target.value })}
                                                    required
                                                />
                                                <Button type="button" variant="outline" onClick={() => setNewPlayer({ ...newPlayer, password: Math.random().toString(36).slice(-8) })}>
                                                    Generate
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="playerPhone">Phone Number</Label>
                                            <Input
                                                id="playerPhone"
                                                value={newPlayer.phoneNumber}
                                                onChange={(e) => setNewPlayer({ ...newPlayer, phoneNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="playerJoinCode">Join Team Code (Optional)</Label>
                                            <Input
                                                id="playerJoinCode"
                                                value={newPlayer.joinCode}
                                                onChange={(e) => setNewPlayer({ ...newPlayer, joinCode: e.target.value.toUpperCase() })}
                                                placeholder="Leave empty for Free Agent"
                                            />
                                        </div>
                                        <Button type="submit" disabled={isCreatingUser} className="w-full">
                                            {isCreatingUser ? "Creating..." : "Create Player"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                </Tabs>

                {/* Credentials Dialog */}
                <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Account Created Successfully</DialogTitle>
                            <DialogDescription>
                                Copy these credentials and send them to the user.
                            </DialogDescription>
                        </DialogHeader>
                        {createdCredentials && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="flex items-center gap-2">
                                        <Input readOnly value={createdCredentials.email} />
                                        <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(createdCredentials.email)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <div className="flex items-center gap-2">
                                        <Input readOnly value={createdCredentials.password} />
                                        <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(createdCredentials.password)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-muted p-3 rounded-md text-sm text-yellow-600 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Make sure to copy these now. You won't see the password again.
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setCreatedCredentials(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>            </main>
        </div>
    );
};

export default AdminDashboard;
