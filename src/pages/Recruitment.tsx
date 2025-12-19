import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getCurrentPlayer, getCurrentTeam, createRecruitmentPost, getRecruitmentPosts, deleteRecruitmentPost, applyToTeam } from "@/lib/storage";
import { RecruitmentPost, Player, Team } from "@/types";

import { Users, User, ArrowRight, Trash2, MessageCircle, Plus, LogIn, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const ROLES = ["Rusher", "Sniper", "IGL", "Supporter", "Flanker", "Any"];

const Recruitment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<RecruitmentPost[]>([]);

    // Auth state
    const [user, setUser] = useState<any>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [userType, setUserType] = useState<'player' | 'team' | null>(null);

    // activeTab is determined by userType: players see LFP (teams recruiting), teams see LFT (players looking)
    const activeTab = userType === 'player' ? 'LFP' : userType === 'team' ? 'LFT' : 'LFP';

    // Post type for creation: players can only post LFT, teams can only post LFP
    const postType = userType === 'player' ? 'LFT' : 'LFP';

    // Create Post Form
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [role, setRole] = useState("");
    const [description, setDescription] = useState("");
    const [minKd, setMinKd] = useState("0");



    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (userType) {
            loadPosts();
        }
    }, [userType]);

    const checkUser = async () => {
        setLoading(true);
        try {
            const u = await getCurrentUser();
            if (!u) {
                // Not logged in - will show login prompt
                setLoading(false);
                return;
            }
            setUser(u);

            // Check if user is a player or team
            const p = await getCurrentPlayer();
            const t = await getCurrentTeam();

            if (t) {
                // User is logged in as a team
                setTeam(t);
                setUserType('team');
            } else if (p) {
                // User is logged in as a player
                setPlayer(p);
                setUserType('player');
            } else {
                // Logged in but no profile - edge case
                setUserType(null);
            }
        } catch (error) {
            console.error("Error checking user:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPosts = async () => {
        try {
            // Players see LFP posts (teams recruiting), Teams see LFT posts (players looking)
            const data = await getRecruitmentPosts(activeTab === "LFP" ? "LFP" : "LFT");
            setPosts(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load posts", variant: "destructive" });
        }
    };

    const handleCreatePost = async () => {

        if (!role || !description) {
            toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }

        try {
            await createRecruitmentPost(
                postType,
                role,
                description,
                parseFloat(minKd),
                postType === 'LFP' ? team?.id : undefined
            );
            toast({ title: "Success", description: "Post created successfully" });
            setIsDialogOpen(false);
            loadPosts();
            // Reset form
            setDescription("");
            setRole("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await deleteRecruitmentPost(postId);
            toast({ title: "Success", description: "Post deleted" });
            loadPosts();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleApply = async (postId: string, message: string) => {

        try {
            await applyToTeam(postId, message);
            toast({ title: "Success", description: "Application sent successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    // Show login prompt if not authenticated
    if (!loading && !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Login Required</CardTitle>
                        <CardDescription>
                            You need to be logged in to access the Recruitment Center.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full gap-2" onClick={() => navigate("/player/login")}>
                            <User className="h-4 w-4" />
                            Login as Player
                        </Button>
                        <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/team/login")}>
                            <Users className="h-4 w-4" />
                            Login as Team
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center">
                    <Button variant="ghost" className="gap-2 -ml-4 md:ml-0 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Recruitment Center
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Find your dream team or the perfect player.
                        </p>
                    </div>
                    {user && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    {userType === 'player' ? 'Post Looking for Team' : 'Post Looking for Player'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {userType === 'player' ? 'Looking for Team (LFT)' : 'Looking for Player (LFP)'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {userType === 'player'
                                            ? 'Let teams know you are available to join.'
                                            : 'Let players know your team is recruiting.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>{userType === 'player' ? 'Your Role' : 'Role Needed'}</Label>
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {userType === 'team' && (
                                        <div className="space-y-2">
                                            <Label>Minimum K/D (Optional)</Label>
                                            <Input type="number" step="0.1" value={minKd} onChange={e => setMinKd(e.target.value)} />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder={userType === 'player'
                                                ? "e.g. 3KD, Active every evening, can IGL..."
                                                : "e.g. Looking for aggressive rusher for Tier 2 tournaments..."}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreatePost}>Post Now</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Show appropriate content based on user type */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        {userType === 'player' ? (
                            <>
                                <Users className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Teams Recruiting Players</h2>
                            </>
                        ) : (
                            <>
                                <User className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Players Looking for Teams</h2>
                            </>
                        )}
                    </div>

                    {/* Content: Players see LFP (teams recruiting), Teams see LFT (players looking) */}
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {userType === 'player'
                                ? 'No teams are recruiting right now.'
                                : 'No players are looking for teams right now.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userType === 'player' ? (
                                // Player sees LFP posts (teams recruiting)
                                posts.map(post => (
                                    <Card key={post.id} className="bg-muted/30 border-primary/20 hover:border-primary/50 transition-colors">
                                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                            <Avatar className="h-12 w-12 rounded-lg border">
                                                <AvatarImage src={post.team?.logoUrl} />
                                                <AvatarFallback className="rounded-lg">{post.team?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{post.team?.name}</CardTitle>
                                                <CardDescription>Seeking: <span className="font-semibold text-primary">{post.role}</span></CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-foreground/80 line-clamp-3">{post.description}</p>
                                            {post.minKd > 0 && (
                                                <div className="mt-4 inline-block bg-background/50 px-2 py-1 rounded text-xs font-medium border">
                                                    Min K/D: {post.minKd}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex justify-between border-t pt-4">
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex gap-2">
                                                {user?.id === post.authorId && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePost(post.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {user && user.id !== post.authorId && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" className="gap-2">
                                                                Apply <ArrowRight className="h-3 w-3" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Apply to join {post.team?.name}</DialogTitle>
                                                                <DialogDescription>Send a message to the team captain.</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="space-y-2">
                                                                    <Label>Message</Label>
                                                                    <Textarea id={`msg-${post.id}`} placeholder="Tell them why you are a good fit..." />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button onClick={() => {
                                                                    const msg = (document.getElementById(`msg-${post.id}`) as HTMLTextAreaElement).value;
                                                                    handleApply(post.id, msg);
                                                                }}>Send Application</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                // Team sees LFT posts (players looking)
                                posts.map(post => (
                                    <Card key={post.id} className="bg-muted/30 border-primary/20 hover:border-primary/50 transition-colors">
                                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                            <Avatar className="h-12 w-12 border">
                                                <AvatarImage src={post.author?.profileUrl} />
                                                <AvatarFallback>{post.author?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{post.author?.inGameName || post.author?.username}</CardTitle>
                                                <CardDescription>Role: <span className="font-semibold text-primary">{post.role}</span></CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-foreground/80 line-clamp-3">{post.description}</p>
                                            {post.minKd > 0 && (
                                                <div className="mt-4 inline-block bg-background/50 px-2 py-1 rounded text-xs font-medium border">
                                                    {post.minKd} K/D
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex justify-between border-t pt-4">
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex gap-2">
                                                {user?.id === post.authorId && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePost(post.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/player/${post.author?.username}`)}>
                                                    View Profile <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recruitment;
