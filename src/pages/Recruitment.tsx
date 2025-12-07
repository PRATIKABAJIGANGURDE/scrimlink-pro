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
import { getCurrentUser, getCurrentPlayer, createRecruitmentPost, getRecruitmentPosts, deleteRecruitmentPost, applyToTeam } from "@/lib/storage";
import { RecruitmentPost, Player } from "@/types";
import { Users, User, ArrowRight, Trash2, MessageCircle, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const ROLES = ["Rusher", "Sniper", "IGL", "Supporter", "Flanker", "Any"];

const Recruitment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("LFP"); // LFP = Teams finding Players
    const [posts, setPosts] = useState<RecruitmentPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [player, setPlayer] = useState<Player | null>(null);

    // Create Post Form
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [postType, setPostType] = useState<"LFT" | "LFP">("LFT");
    const [role, setRole] = useState("");
    const [description, setDescription] = useState("");
    const [minKd, setMinKd] = useState("0");

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        loadPosts();
    }, [activeTab]);

    const checkUser = async () => {
        const u = await getCurrentUser();
        setUser(u);
        if (u) {
            const p = await getCurrentPlayer();
            setPlayer(p);
            // Default to LFT if user has no team, LFP if they do
            if (p?.teamId) {
                setActiveTab("LFP");
                setPostType("LFP");
            } else {
                setActiveTab("LFT");
                setPostType("LFT");
            }
        }
    };

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await getRecruitmentPosts(activeTab === "LFP" ? "LFP" : "LFT");
            setPosts(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load posts", variant: "destructive" });
        } finally {
            setLoading(false);
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
                postType === 'LFP' ? player?.teamId : undefined
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

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
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
                                    Create Post
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Recruitment Post</DialogTitle>
                                    <DialogDescription>
                                        Describe what you are looking for.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>I am Looking For...</Label>
                                        <Tabs value={postType} onValueChange={(v: any) => setPostType(v)} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="LFT" disabled={!!player?.teamId}>Team (LFT)</TabsTrigger>
                                                <TabsTrigger value="LFP" disabled={!player?.teamId}>Player (LFP)</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        {postType === 'LFT' && !!player?.teamId && <p className="text-xs text-destructive">Leave your current team to search for a new one.</p>}
                                        {postType === 'LFP' && !player?.teamId && <p className="text-xs text-destructive">You must join/create a team to recruit players.</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Minimum K/D (Optional)</Label>
                                        <Input type="number" step="0.1" value={minKd} onChange={e => setMinKd(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder={postType === 'LFT' ? "e.g. 3KD, Active every evening, can IGL..." : "e.g. Looking for aggressive rusher for Tier 2 tournaments..."}
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="LFP" className="gap-2">
                            <Users className="h-4 w-4" />
                            Teams Recruiting
                        </TabsTrigger>
                        <TabsTrigger value="LFT" className="gap-2">
                            <User className="h-4 w-4" />
                            Players Looking
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="LFP" className="mt-6 space-y-4">
                        {loading ? (
                            <div className="text-center py-12">Loading...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">No teams are recruiting right now. Be the first!</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {posts.map(post => (
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
                                                {user && user.id !== post.authorId && postType === 'LFP' ? (
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
                                                ) : (
                                                    <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate(`/player/${post.author?.username}`)}>
                                                        Contact <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="LFT" className="mt-6 space-y-4">
                        {loading ? (
                            <div className="text-center py-12">Loading...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">No players are looking right now.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {posts.map(post => (
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
                                            <div className="mt-4 flex gap-2">
                                                {post.minKd > 0 && (
                                                    <div className="bg-background/50 px-2 py-1 rounded text-xs font-medium border">
                                                        {post.minKd} K/D
                                                    </div>
                                                )}
                                            </div>
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
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Recruitment;
