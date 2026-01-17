import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPlayer, updatePlayer } from "@/lib/storage";
import { Target, User, ShieldAlert } from "lucide-react";

const PlayerOnboarding = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        gameUid: "",
        inGameName: "",
        phoneNumber: ""
    });
    const [hasExistingPhone, setHasExistingPhone] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const player = await getCurrentPlayer();
                if (!player) {
                    navigate("/player/login");
                    return;
                }

                // If already completed, redirect to dashboard
                if (player.gameUid && player.inGameName && player.phoneNumber) {
                    navigate("/player/dashboard");
                    return;
                }

                if (player.phoneNumber) {
                    setFormData(prev => ({ ...prev, phoneNumber: player.phoneNumber! }));
                    setHasExistingPhone(true);
                }

                setLoading(false);
            } catch (error) {
                console.error("Failed to check status:", error);
                navigate("/player/login");
            }
        };
        checkStatus();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        if (!formData.gameUid.trim() || !formData.inGameName.trim()) {
            toast({
                title: "Error",
                description: "Please fill in Game UID and IGN",
                variant: "destructive"
            });
            setSaving(false);
            return;
        }

        try {
            const player = await getCurrentPlayer();
            if (!player) return;

            await updatePlayer(player.id, {
                gameUid: formData.gameUid,
                inGameName: formData.inGameName,
                phoneNumber: formData.phoneNumber
            });

            toast({
                title: "All Set!",
                description: "Your game details have been saved.",
            });

            navigate("/player/dashboard");
        } catch (error) {
            console.error("Failed to save details:", error);
            toast({
                title: "Error",
                description: "Failed to save details. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">One Last Step!</CardTitle>
                    <CardDescription>
                        To ensure fair play and easy identification, we need your Free Fire details before you proceed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="gameUid">Free Fire UID</Label>
                            <div className="relative">
                                <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="gameUid"
                                    placeholder="e.g. 123456789"
                                    className="pl-9"
                                    value={formData.gameUid}
                                    onChange={(e) => setFormData({ ...formData, gameUid: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">This is your unique ID number in Free Fire.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inGameName">In-Game Name (IGN)</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="inGameName"
                                    placeholder="Your exact in-game name"
                                    className="pl-9"
                                    value={formData.inGameName}
                                    onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {!hasExistingPhone && (
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <div className="relative">
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        placeholder="+91 1234567890"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Optional: Used for tournament verification.</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? "Saving..." : "Start Journey"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlayerOnboarding;
