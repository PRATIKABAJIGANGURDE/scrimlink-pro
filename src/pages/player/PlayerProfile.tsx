import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, signOut, getTeamById, leaveTeam, updatePlayerSocials, updatePlayer } from "@/lib/storage";
import { Player, Team } from "@/types";
import { Users, LogOut, Trophy, UserMinus, Mail, Calendar as CalendarIcon, Shield, ArrowLeft, Crown, BarChart, Instagram, Youtube, Save, Target, User, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PlayerProfile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [player, setPlayer] = useState<Player | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [socials, setSocials] = useState({ instagram: "", youtube: "", discord: "" });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const currentPlayer = await getCurrentPlayer();
                if (!currentPlayer) {
                    navigate("/player/login");
                    return;
                }
                setPlayer(currentPlayer);
                setSocials({
                    instagram: currentPlayer.instagramUrl || "",
                    youtube: currentPlayer.youtubeUrl || "",
                    discord: currentPlayer.discordUsername || ""
                });

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
        if (!player || !player.teamId) return;
        try {
            await leaveTeam(player.id, player.teamId);
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

    const handleSaveSocials = async () => {
        if (!player) return;
        setIsSaving(true);
        try {
            await updatePlayerSocials(player.id, socials.instagram, socials.youtube, socials.discord);
            toast({
                title: "Profile Updated",
                description: "Social links saved successfully"
            });
        } catch (error) {
            console.error("Failed to save socials:", error);
            toast({
                title: "Error",
                description: "Failed to save social links",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!player) return null;

    const isApproved = player.status === 'approved';

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNavbar
                title={player.inGameName || player.username}
                subtitle="Player Profile"
                variant="dashboard"
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

            <main className="container mx-auto px-4 pt-24 md:pt-8 pb-8">
                {/* Profile Header Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            {/* Profile Picture */}
                            <Avatar className="h-32 w-32 border-4 border-primary/20">
                                <AvatarImage src={player.profileUrl} alt={player.username} />
                                <AvatarFallback className="text-4xl font-bold bg-primary/10">
                                    {(player.inGameName || player.username).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            {/* Player Details & Socials */}
                            <div className="flex-1 space-y-6 w-full">
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">{player.inGameName || player.username}</h2>
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

                                    <div className="flex gap-2">
                                        {player.role && (
                                            <Badge variant="outline" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                {player.role}
                                            </Badge>
                                        )}
                                        <Badge
                                            variant={player.status === 'approved' ? 'default' : player.status === 'pending' ? 'secondary' : 'destructive'}
                                        >
                                            {player.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid gap-4 max-w-md border-t pt-4">
                                    <h3 className="font-semibold mb-2">Social Links</h3>
                                    <div className="grid gap-2">
                                        <Label htmlFor="instagram">Instagram URL</Label>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="instagram"
                                                placeholder="https://instagram.com/..."
                                                className="pl-9"
                                                value={socials.instagram}
                                                onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="youtube">YouTube URL</Label>
                                        <div className="relative">
                                            <Youtube className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="youtube"
                                                placeholder="https://youtube.com/..."
                                                className="pl-9"
                                                value={socials.youtube}
                                                onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="discord">Discord User ID</Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="discord"
                                                placeholder="Enter Discord User ID (e.g. 123456789...)"
                                                className="pl-9"
                                                value={socials.discord}
                                                onChange={(e) => setSocials({ ...socials, discord: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Required for the profile button to work. Enable Developer Mode in Discord to copy your ID.
                                        </p>
                                    </div>
                                    <Button onClick={handleSaveSocials} disabled={isSaving} className="w-fit">
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSaving ? "Saving..." : "Save Social Links"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Game Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 max-w-md">
                            <div className="grid gap-2">
                                <Label htmlFor="gameUid">Free Fire UID</Label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="gameUid"
                                        placeholder="12345678"
                                        className="pl-9"
                                        value={player.gameUid || ""}
                                        onChange={(e) => setPlayer({ ...player, gameUid: e.target.value })}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="inGameName">In-Game Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="inGameName"
                                        placeholder="Your IGN"
                                        className="pl-9"
                                        value={player.inGameName || ""}
                                        onChange={(e) => setPlayer({ ...player, inGameName: e.target.value })}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                            <Button onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await updatePlayer(player.id, {
                                        gameUid: player.gameUid,
                                        inGameName: player.inGameName
                                    });
                                    toast({
                                        title: "Profile Updated",
                                        description: "Game details saved successfully"
                                    });
                                } catch (error) {
                                    console.error("Failed to save game details:", error);
                                    toast({
                                        title: "Error",
                                        description: "Failed to save game details",
                                        variant: "destructive"
                                    });
                                } finally {
                                    setIsSaving(false);
                                }
                            }} disabled={isSaving} className="w-fit">
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Game Details"}
                            </Button>
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
