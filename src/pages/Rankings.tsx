import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ... inside component ...


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllTeamStats, getAllPlayerStats } from "@/lib/storage";
import { Trophy, Medal, Crown, ArrowLeft, Swords, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Rankings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("teams");
    const [teamRankings, setTeamRankings] = useState<any[]>([]);
    const [playerRankings, setPlayerRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teamStats, playerStats] = await Promise.all([
                    getAllTeamStats(),
                    getAllPlayerStats()
                ]);

                // Process Team Rankings
                const teamMap = new Map();
                teamStats.forEach((stat: any) => {
                    if (!stat.team) return;
                    const teamId = stat.team.id;
                    if (!teamMap.has(teamId)) {
                        teamMap.set(teamId, {
                            id: teamId,
                            name: stat.team.name,
                            matches: 0,
                            kills: 0,
                            points: 0,
                            booyahs: 0,
                            recentPlacement: null, // lower is better
                            latestMatchCreatedAt: null
                        });
                    }
                    const team = teamMap.get(teamId);
                    team.matches += 1;
                    team.kills += stat.team_kills || 0;
                    team.points += stat.total_points || 0;
                    if (stat.is_booyah) team.booyahs += 1;
                    // Update recent placement based on most recent match
                    if (stat.created_at) {
                        const matchCreated = new Date(stat.created_at);
                        if (!team.latestMatchCreatedAt || matchCreated > new Date(team.latestMatchCreatedAt)) {
                            team.latestMatchCreatedAt = stat.created_at;
                            team.recentPlacement = stat.placement ?? null;
                        }
                    }
                });

                const compareTeams = (a, b) => {
                    // Points descending
                    if (b.points !== a.points) return b.points - a.points;
                    // Booyahs descending
                    if (b.booyahs !== a.booyahs) return b.booyahs - a.booyahs;
                    // Kills descending
                    if (b.kills !== a.kills) return b.kills - a.kills;
                    // Recent placement ascending (lower is better)
                    if (a.recentPlacement != null && b.recentPlacement != null) {
                        if (a.recentPlacement !== b.recentPlacement) return a.recentPlacement - b.recentPlacement;
                    }
                    return 0;
                };
                const sortedTeams = Array.from(teamMap.values()).sort(compareTeams);
                setTeamRankings(sortedTeams);

                // Process Player Rankings
                const playerMap = new Map();
                playerStats.forEach((stat: any) => {
                    if (!stat.player) return;
                    const playerId = stat.player.id;
                    if (!playerMap.has(playerId)) {
                        playerMap.set(playerId, {
                            id: playerId,
                            username: stat.player.username,
                            teamName: stat.team?.name || 'Free Agent',
                            matches: 0,
                            kills: 0
                        });
                    }
                    const player = playerMap.get(playerId);
                    player.matches += 1;
                    player.kills += stat.kills || 0;
                });

                const sortedPlayers = Array.from(playerMap.values()).sort((a, b) => b.kills - a.kills);
                setPlayerRankings(sortedPlayers);

            } catch (error: any) {
                console.error("Failed to fetch rankings:", error);
                setError(error.message || "Failed to load rankings");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
        if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
        return <span className="font-bold text-muted-foreground">#{index + 1}</span>;
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-xl border border-border/40 bg-background/70 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Back</span>
                        </Button>
                        <div className="flex items-center gap-2">
                            <Crown className="h-6 w-6 text-primary" />
                            <h1 className="text-lg font-bold">Global Rankings</h1>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/match-results")}>
                        <Target className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Match Results</span>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-8 max-w-6xl space-y-8">

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md mb-6">
                        {error}
                        <p className="text-sm mt-1 text-muted-foreground">
                            If you see this, please ensure you have run the migration script in Supabase.
                        </p>
                    </div>
                )}

                <Tabs defaultValue="teams" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto md:mx-0">
                        <TabsTrigger value="teams" className="flex items-center gap-2">
                            <Swords className="h-4 w-4" />
                            Team Rankings
                        </TabsTrigger>
                        <TabsTrigger value="players" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Player Rankings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="teams" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Leaderboard</CardTitle>
                                <CardDescription>Ranked by total points (Placement + Kills)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 md:hidden">
                                    {loading ? (
                                        <div className="text-center py-8">Loading rankings...</div>
                                    ) : teamRankings.length === 0 ? (
                                        <div className="text-center py-8">No team data available</div>
                                    ) : (
                                        teamRankings.map((team, index) => (
                                            <div key={team.id} className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8">
                                                            {getRankIcon(index)}
                                                        </div>
                                                        <span className="font-bold text-lg">{team.name}</span>
                                                    </div>
                                                    <span className="font-bold text-xl">{team.points} pts</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground border-t border-border/50 pt-2 mt-1">
                                                    <div className="text-center">
                                                        <span className="block font-semibold text-foreground">{team.matches}</span>
                                                        Matches
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block font-semibold text-yellow-600 dark:text-yellow-400">{team.booyahs}</span>
                                                        Booyahs
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block font-semibold text-foreground">{team.kills}</span>
                                                        Kills
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Rank</TableHead>
                                                <TableHead>Team</TableHead>
                                                <TableHead className="text-center">Matches</TableHead>
                                                <TableHead className="text-center">Booyahs</TableHead>
                                                <TableHead className="text-center">Kills</TableHead>
                                                <TableHead className="text-right">Total Points</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">Loading rankings...</TableCell>
                                                </TableRow>
                                            ) : teamRankings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">No team data available</TableCell>
                                                </TableRow>
                                            ) : (
                                                teamRankings.map((team, index) => (
                                                    <TableRow key={team.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center justify-center w-8 h-8">
                                                                {getRankIcon(index)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-semibold">{team.name}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center">{team.matches}</TableCell>
                                                        <TableCell className="text-center font-bold text-yellow-600 dark:text-yellow-400">{team.booyahs}</TableCell>
                                                        <TableCell className="text-center">{team.kills}</TableCell>
                                                        <TableCell className="text-right font-bold text-lg">{team.points}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="players" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Player Leaderboard</CardTitle>
                                <CardDescription>Ranked by total kills</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 md:hidden">
                                    {loading ? (
                                        <div className="text-center py-8">Loading rankings...</div>
                                    ) : playerRankings.length === 0 ? (
                                        <div className="text-center py-8">No player data available</div>
                                    ) : (
                                        playerRankings.map((player, index) => (
                                            <div key={player.id} className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                                                <div className="flex items-start justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8">
                                                            {getRankIcon(index)}
                                                        </div>
                                                        <Link to={`/player/${player.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                                                                <AvatarImage src={player.profileUrl} alt={player.username} />
                                                                <AvatarFallback className="text-sm font-bold bg-primary/10">
                                                                    {player.username.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-bold text-lg break-all">{player.username}</div>
                                                                <div className="text-xs text-muted-foreground">{player.teamName}</div>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
                                                    <div className="text-center">
                                                        <span className="block font-bold text-xl">{player.kills}</span>
                                                        <span className="text-xs text-muted-foreground">Total Kills</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block font-bold text-xl">{player.matches}</span>
                                                        <span className="text-xs text-muted-foreground">Matches</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block font-bold text-xl">{(player.kills / (player.matches || 1)).toFixed(1)}</span>
                                                        <span className="text-xs text-muted-foreground">Avg Kills</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Rank</TableHead>
                                                <TableHead>Player</TableHead>
                                                <TableHead>Team</TableHead>
                                                <TableHead className="text-center">Matches</TableHead>
                                                <TableHead className="text-center">Avg Kills</TableHead>
                                                <TableHead className="text-right">Total Kills</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">Loading rankings...</TableCell>
                                                </TableRow>
                                            ) : playerRankings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">No player data available</TableCell>
                                                </TableRow>
                                            ) : (
                                                playerRankings.map((player, index) => (
                                                    <TableRow key={player.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center justify-center w-8 h-8">
                                                                {getRankIcon(index)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link to={`/player/${player.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                                                                <Avatar className="h-8 w-8 border-2 border-primary/20">
                                                                    <AvatarImage src={player.profileUrl} alt={player.username} />
                                                                    <AvatarFallback className="text-xs font-bold bg-primary/10">
                                                                        {player.username.substring(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-semibold">{player.username}</span>
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{player.teamName}</TableCell>
                                                        <TableCell className="text-center">{player.matches}</TableCell>
                                                        <TableCell className="text-center">{(player.kills / player.matches).toFixed(1)}</TableCell>
                                                        <TableCell className="text-right font-bold text-lg">{player.kills}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Rankings;
