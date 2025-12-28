import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, getFeedback, submitFeedback } from "@/lib/storage";
import { Feedback as FeedbackType } from "@/types";
import { MessageSquare, Send, User, Tag, Clock, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";

const Feedback = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [newFeedback, setNewFeedback] = useState({ content: "", tag: "General" });

    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentPlayer();
                setCurrentUser(user);
                await loadFeedback();
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const loadFeedback = async () => {
        try {
            const data = await getFeedback();
            setFeedbacks(data);
        } catch (error) {
            console.error("Failed to load feedback:", error);
            toast({
                title: "Error",
                description: "Failed to load feedback",
                variant: "destructive"
            });
        }
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            toast({
                title: "Login Required",
                description: "You must be logged in to submit feedback.",
                variant: "destructive"
            });
            navigate("/player/login");
            return;
        }

        if (!newFeedback.content.trim()) {
            toast({
                title: "Error",
                description: "Please enter some feedback content.",
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);
        try {
            await submitFeedback(currentUser.id, newFeedback.content, newFeedback.tag);
            toast({
                title: "Success",
                description: "Thank you for your feedback!",
            });
            setNewFeedback({ content: "", tag: "General" });
            await loadFeedback();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit feedback",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getTagColor = (tag: string) => {
        switch (tag) {
            case 'Bug': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Feature': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Scrims': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Recruitment': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNavbar
                title="Community Feedback"
                subtitle="Help us improve the platform"
                variant="dashboard"
                icon={<MessageSquare className="h-8 w-8 text-primary" />}
            >
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </ResponsiveNavbar>

            <main className="container mx-auto px-4 pt-24 md:pt-8 pb-8 space-y-8">
                {/* Submit Feedback Section */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Submit Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={newFeedback.tag}
                                    onValueChange={(val) => setNewFeedback({ ...newFeedback, tag: val })}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="Feature">Feature Request</SelectItem>
                                        <SelectItem value="Bug">Bug Report</SelectItem>
                                        <SelectItem value="Scrims">Scrims</SelectItem>
                                        <SelectItem value="Recruitment">Recruitment</SelectItem>
                                        <SelectItem value="Profile">Profile</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Your Feedback</Label>
                                <Textarea
                                    placeholder="Tell us what you think or what features you'd like to see..."
                                    value={newFeedback.content}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                                    className="min-h-[100px]"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? "Submitting..." : "Submit Feedback"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Feedback List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-6 w-6" />
                        Recent Feedback
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">Loading feedback...</div>
                    ) : feedbacks.length > 0 ? (
                        <div className="grid gap-4">
                            {feedbacks.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={item.player?.profileUrl} />
                                                        <AvatarFallback><User /></AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-semibold">
                                                            {item.player?.inGameName || item.player?.username || "Unknown User"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={getTagColor(item.tag)}>
                                                    {item.tag}
                                                </Badge>
                                            </div>
                                            <p className="text-foreground/90 whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                            No feedback yet. Be the first to share your thoughts!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Feedback;
