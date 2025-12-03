import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPlayerStats, getCurrentPlayer } from "@/lib/storage";
import { ArrowLeft, Trophy, Target, Crosshair, TrendingUp } from "lucide-react";

const PlayerStats = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aggregates, setAggregates] = useState({
        totalMatches: 0,
        totalKills: 0,
        avgKills: 0
    });

    useEffect(() => {
        const init = async () => {
            try {
                const player = await getCurrentPlayer();
                if (!player) {
                    navigate("/player/login");
                    return;
                }
                loadStats(player.id);
            } catch (error) {
                console.error("Failed to load player:", error);
                navigate("/player/login");
            }
        };
        init();
    }, []);

    const loadStats = async (playerId: string) => {
        try {
            const data = await getPlayerStats(playerId);
            setStats(data);

            // Calculate aggregates
            const totalMatches = data.length;
            const totalKills = data.reduce((acc: number, curr: any) => acc + curr.kills, 0);

            setAggregates({
                totalMatches,
                totalKills,
                avgKills: totalMatches > 0 ? Math.round((totalKills / totalMatches) * 10) / 10 : 0
            });
        } catch (error) {
            console.error("Failed to load stats:", error);
            toast({
                title: "Error",
                description: "Failed to load player stats",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading stats...</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/player/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold">Player Statistics</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{aggregates.totalMatches}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Kills</CardTitle>
                            <Crosshair className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{aggregates.totalKills}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Kills / Match</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{aggregates.avgKills}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Matches</CardTitle>
                        <CardDescription>Your performance history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No matches played yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.map((stat) => (
                                    <div key={stat.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{stat.match.scrimName}</span>
                                                <span className="text-muted-foreground text-sm">- Match {stat.match.matchNumber}</span>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PlayerStats;
