import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTeamStats, getCurrentTeam } from "@/lib/storage";
import { ArrowLeft, Trophy, Target, Crosshair, TrendingUp } from "lucide-react";

const TeamStats = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aggregates, setAggregates] = useState({
        totalMatches: 0,
        totalKills: 0,
        totalPoints: 0,
        avgPlacement: 0,
        booyahs: 0
    });

    useEffect(() => {
        const init = async () => {
            try {
                const team = await getCurrentTeam();
                if (!team) {
                    navigate("/team/login");
                    return;
                }
                loadStats(team.id);
            } catch (error) {
                console.error("Failed to load team:", error);
                navigate("/team/login");
            }
        };
        init();
    }, []);

    const loadStats = async (teamId: string) => {
        try {
            const data = await getTeamStats(teamId);
            setStats(data);

            // Calculate aggregates
            const totalMatches = data.length;
            const totalKills = data.reduce((acc: number, curr: any) => acc + curr.teamKills, 0);
            const totalPoints = data.reduce((acc: number, curr: any) => acc + curr.totalPoints, 0);
            const totalPlacement = data.reduce((acc: number, curr: any) => acc + curr.placement, 0);
            const booyahs = data.filter((s: any) => s.isBooyah).length;

            setAggregates({
                totalMatches,
                totalKills,
                totalPoints,
                avgPlacement: totalMatches > 0 ? Math.round((totalPlacement / totalMatches) * 10) / 10 : 0,
                booyahs
            });
        } catch (error) {
            console.error("Failed to load stats:", error);
            toast({
                title: "Error",
                description: "Failed to load team stats",
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
                    <Button variant="ghost" onClick={() => navigate("/team/dashboard")} className="pl-0 md:pl-4">
                        <ArrowLeft className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Back to Dashboard</span>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold">Team Statistics</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{aggregates.totalPoints}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Placement</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">#{aggregates.avgPlacement}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Matches</CardTitle>
                        <CardDescription>Performance history from recent scrims</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No matches played yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.map((stat) => (
                                    <div key={stat.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted rounded-lg border border-border gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{stat.match.scrimName}</span>
                                                <span className="text-muted-foreground text-sm whitespace-nowrap">- Match {stat.match.matchNumber}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {new Date(stat.match.createdAt).toLocaleDateString()} • {stat.match.mapName || "Unknown Map"}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 w-full md:w-auto md:flex md:gap-6 border-t md:border-t-0 border-border/50 pt-4 md:pt-0">
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase">Placement</div>
                                                <div className="font-bold text-lg">#{stat.placement}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase">Kills</div>
                                                <div className="font-bold text-lg">{stat.teamKills}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase">Points</div>
                                                <div className="font-bold text-lg text-primary">{stat.totalPoints}</div>
                                            </div>
                                            {stat.isBooyah && (
                                                <div className="col-span-3 md:col-span-1 flex justify-center md:block">
                                                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                                        BOOYAH!
                                                    </Badge>
                                                </div>
                                            )}
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

export default TeamStats;
