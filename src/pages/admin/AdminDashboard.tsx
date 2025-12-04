import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    getCurrentUser,
    getAdmin,
    signOut,
    getScrims,
    saveScrim,
    saveMatch,
    generateId
} from "@/lib/storage";
import { Scrim, Match } from "@/types";
import { Shield, LogOut, Plus, Target, Calendar, Trophy, BarChart } from "lucide-react";
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
            const allScrims = await getScrims();
            setScrims(allScrims);
        } catch (error) {
            console.error("Failed to load scrims:", error);
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

    const handleLogout = async () => {
        await signOut();
        navigate("/");
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
                            <div className="space-y-4">
                                {scrims.map((scrim) => (
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
                                                    <Badge variant={scrim.status === 'upcoming' ? 'secondary' : 'default'}>
                                                        {scrim.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => navigate(`/scrim/${scrim.id}`)}>
                                            Manage
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminDashboard;
