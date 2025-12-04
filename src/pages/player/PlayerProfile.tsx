import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, signOut, getTeamById, updatePlayer } from "@/lib/storage";
import { Player, Team } from "@/types";
import { Users, LogOut, Trophy, UserMinus, Mail, Calendar as CalendarIcon, Shield, ArrowLeft, Crown, BarChart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";

const PlayerProfile = () => {
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

    const handleLeaveTeam = async () => {
        if (!player) return;
        try {
            await updatePlayer(player.id, {
                teamId: null,
                status: 'pending',
                role: null
            });
            toast({
                title: "Left Team",
                description: "You have successfully left the team"
            });
            // Reload player data
            const currentPlayer = await getCurrentPlayer();
            setPlayer(currentPlayer);
            setTeam(null);
        } catch (error) {
            console.error("Failed to leave team:", error);
            toast({
                title: "Error",
                description: "Failed to leave team",
                variant: "destructive"
            });
        }
    };

    if (!player) return null;

    const isApproved = player.status === 'approved';

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNavbar
                title={player.username}
                subtitle="Player Profile"
                icon={<Users className="h-8 w-8 text-primary" />}
            >
                <Button variant="outline" size="sm" onClick={() => navigate("/player/dashboard")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/rankings")}>
                    <Crown className="h-4 w-4 mr-2" />
                    Rankings
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/match-results")}>
                    <BarChart className="h-4 w-4 mr-2" />
                    Results
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </ResponsiveNavbar>

            <main className="container mx-auto px-4 py-4 md:py-8">
                {/* Profile Header Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Profile Picture */}
                            <Avatar className="h-32 w-32 border-4 border-primary/20">
                                <AvatarImage src={player.profileUrl} alt={player.username} />
                                <AvatarFallback className="text-4xl font-bold bg-primary/10">
                                    {player.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            {/* Player Details */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">{player.username}</h2>
                                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            {player.email}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Joined {new Date(player.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                {player.role && (
                                    <div>
                                        <Badge variant="outline" className="flex items-center gap-2 w-fit">
                                            <Shield className="h-4 w-4" />
                                            {player.role}
                                        </Badge>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div>
                                    <Badge
                                        variant={player.status === 'approved' ? 'default' : player.status === 'pending' ? 'secondary' : 'destructive'}
                                        className="w-fit"
                                    >
                                        {player.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Information Card */}
                {team && isApproved && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Team Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Trophy className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">{team.name}</h3>
                                        {team.country && <p className="text-muted-foreground">{team.country}</p>}
                                    </div>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <UserMinus className="h-4 w-4 mr-2" />
                                            Leave Team
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Leave Team?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to leave {team.name}? You will need to request to join again if you change your mind.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Leave Team
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pending Status Card */}
                {player.status === 'pending' && team && (
                    <Card className="border-accent/50 bg-accent/5">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Shield className="h-6 w-6 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Pending Approval</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your request to join <span className="font-medium text-foreground">{team.name}</span> is pending.
                                        The team captain will review your request soon.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default PlayerProfile;
