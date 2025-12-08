import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getPublicPlayerProfileByUsername, likePlayer, getCurrentUser, getPlayerDetailedStats, getPlayerStats, sendTransferOffer, getCurrentPlayer, getCurrentTeam } from "@/lib/storage";
import { Users, Trophy, Calendar as CalendarIcon, Shield, ArrowLeft, Heart, Instagram, Youtube, Swords, Target, Medal, Crosshair, Crown, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";

const PublicPlayerProfile = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [recentMatches, setRecentMatches] = useState<any[]>([]);

    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
                if (username) {
                    await loadProfile(username);
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
                toast({
                    title: "Error",
                    description: "Failed to load player profile",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [username]);

    const loadProfile = async (username: string) => {
        const data = await getPublicPlayerProfileByUsername(username);
        if (data && data.player) {
            const stats = await getPlayerDetailedStats(data.player.id);
            const matches = await getPlayerStats(data.player.id);
            setProfile({ ...data, stats });
            setRecentMatches(matches);
        } else {
            setProfile(data);
        }
    };

    const handleLike = async () => {
        if (!currentUser) {
            toast({
                title: "Login Required",
                description: "You must be logged in to like a player.",
                variant: "destructive"
            });
            return;
        }
        if (!profile?.player?.id) return;

        setLiking(true);
        try {
            await likePlayer(profile.player.id);
            toast({
                title: "Liked!",
                description: `You liked ${profile.player.username}'s profile.`
            });
            if (username) await loadProfile(username); // Reload to update count
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to like player",
                variant: "destructive"
            });
        } finally {
            setLiking(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link Copied",
            description: "Profile link copied to clipboard",
        });
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;
    if (!profile) return <div className="p-8 text-center">Player not found</div>;

    const { player, currentTeam, history, likeCount } = profile;

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNavbar
                title={player.inGameName || player.username}
                subtitle="Player Profile"
                variant="dashboard"
                icon={<Users className="h-8 w-8 text-primary" />}
            >
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </ResponsiveNavbar>

            <main className="container mx-auto px-4 pt-24 md:pt-8 pb-8 space-y-8">
                {/* Header Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <Avatar className="h-32 w-32 border-4 border-primary/20">
                                <AvatarImage src={player.profileUrl} alt={player.username} />
                                <AvatarFallback className="text-4xl font-bold bg-primary/10">
                                    {(player.inGameName || player.username).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{player.inGameName || player.username}</h1>
                                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Joined {new Date(player.createdAt).toLocaleDateString()}
                                        </span>
                                        {player.role && (
                                            <Badge variant="outline" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                {player.role}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    {player.instagramUrl && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={player.instagramUrl} target="_blank" rel="noopener noreferrer">
                                                <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                                                Instagram
                                            </a>
                                        </Button>
                                    )}
                                    {player.youtubeUrl && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={player.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                                <Youtube className="h-4 w-4 mr-2 text-red-500" />
                                                YouTube
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleLike}
                                        disabled={liking}
                                        className="group"
                                    >
                                        <Heart className={`h-4 w-4 mr-2 group-hover:text-red-500 transition-colors ${liking ? 'animate-pulse' : ''}`} />
                                        Like ({likeCount})
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleShare}>
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>

                                    {/* Transfer Offer Dialog */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg">
                                                <Crown className="h-4 w-4 mr-2" />
                                                Make Offer
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Recruit {player.inGameName || player.username}</DialogTitle>
                                                <DialogDescription>
                                                    Send an official transfer offer to this player. If accepted, they will join your team.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Message</Label>
                                                    <Textarea id="offer-msg" placeholder="We need a sniper for Tier 1 scrims..." />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={async () => {
                                                    const msg = (document.getElementById('offer-msg') as HTMLTextAreaElement).value;
                                                    try {
                                                        // Check if logged in as team first
                                                        const team = await getCurrentTeam();
                                                        if (team) {
                                                            await sendTransferOffer(team.id, player.id, msg);
                                                            toast({ title: "Success", description: "Offer sent successfully" });
                                                            return;
                                                        }
                                                        // Fall back to player with team
                                                        const me = await getCurrentPlayer();
                                                        if (!me?.teamId) throw new Error("You must be logged in as a team to make offers.");
                                                        await sendTransferOffer(me.teamId, player.id, msg);
                                                        toast({ title: "Success", description: "Offer sent successfully" });
                                                    } catch (e: any) {
                                                        toast({ title: "Error", description: e.message, variant: "destructive" });
                                                    }
                                                }}>Send Offer</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <Target className="h-8 w-8 text-primary mb-2" />
                            <div className="text-2xl font-bold">{profile.stats?.matchesPlayed || 0}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Matches</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <Swords className="h-8 w-8 text-red-500 mb-2" />
                            <div className="text-2xl font-bold">{profile.stats?.totalKills || 0}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Kills</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <Crosshair className="h-8 w-8 text-blue-500 mb-2" />
                            <div className="text-2xl font-bold">{profile.stats?.kd || "0.00"}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">K/D Ratio</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <Crown className="h-8 w-8 text-yellow-500 mb-2" />
                            <div className="text-2xl font-bold">{profile.stats?.booyahs || 0}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Booyahs</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Matches */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Recent Matches
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentMatches.length > 0 ? (
                            <div className="space-y-4">
                                {recentMatches.slice(0, 5).map((stat: any) => (
                                    <div key={stat.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{stat.match.scrimName}</span>
                                                <span className="text-muted-foreground text-sm whitespace-nowrap">- Match {stat.match.matchNumber}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {new Date(stat.match.createdAt).toLocaleDateString()} • {stat.match.mapName || "Unknown Map"}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase">Kills</div>
                                                <div className="font-bold text-lg">{stat.kills}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent matches found
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Current Team */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-primary" />
                                Current Team
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {currentTeam ? (
                                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={currentTeam.logo_url} />
                                        <AvatarFallback><Trophy /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold">{currentTeam.name}</h3>
                                        {currentTeam.country && <p className="text-muted-foreground">{currentTeam.country}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Not currently in a team
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Swords className="h-5 w-5 text-primary" />
                                Team History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((record: any) => (
                                        <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={record.teamLogoUrl} />
                                                    <AvatarFallback><Shield /></AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold">{record.teamName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(record.joined_at).toLocaleDateString()} - {record.left_at ? new Date(record.left_at).toLocaleDateString() : 'Present'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No team history recorded
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default PublicPlayerProfile;
