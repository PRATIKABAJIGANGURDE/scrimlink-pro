import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTournamentById, getTournamentRounds, getTournamentGroups, getTournamentTeamsByTournamentId } from "@/lib/storage";
import { Trophy, ArrowLeft, Target, Medal, Crown, Calendar } from "lucide-react";
import { ResponsiveNavbar } from "@/components/ResponsiveNavbar";

const TournamentStandings = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<any>(null);
    const [rounds, setRounds] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [tData, rData, teData] = await Promise.all([
                    getTournamentById(id),
                    getTournamentRounds(id),
                    getTournamentTeamsByTournamentId(id)
                ]);

                setTournament(tData);
                setRounds(rData);
                setTeams(teData);

                // Fetch groups for all rounds
                const allGroups: any[] = [];
                for (const round of rData) {
                    const gData = await getTournamentGroups(round.id);
                    allGroups.push(...gData);
                }
                setGroups(allGroups);
            } catch (error) {
                console.error("Failed to load tournament standings:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading standings...</div>;
    if (!tournament) return <div className="p-8 text-center">Tournament not found</div>;

    return (
        <div className="min-h-screen bg-background">
            <ResponsiveNavbar
                title={tournament.name}
                subtitle="Tournament Standings"
                variant="dashboard"
                icon={<Medal className="h-8 w-8 text-primary" />}
            >
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </ResponsiveNavbar>

            <main className="container mx-auto px-4 pt-32 pb-8 space-y-8">
                {/* Tournament Header */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-3xl font-bold">{tournament.name}</CardTitle>
                                <div className="flex items-center gap-4 text-muted-foreground mt-2">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "Date TBD"}
                                    </span>
                                    <Badge variant={tournament.status === 'upcoming' ? 'secondary' : tournament.status === 'ongoing' ? 'destructive' : 'default'}>
                                        {tournament.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center px-4 py-2 bg-muted rounded-lg">
                                    <div className="text-xs text-muted-foreground uppercase font-bold">Groups</div>
                                    <div className="text-xl font-bold">{groups.length}</div>
                                </div>
                                <div className="text-center px-4 py-2 bg-muted rounded-lg">
                                    <div className="text-xs text-muted-foreground uppercase font-bold">Teams</div>
                                    <div className="text-xl font-bold">{teams.length}</div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Standings by Round */}
                {rounds.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No rounds have been created for this tournament yet.
                    </div>
                ) : (
                    <Tabs defaultValue={rounds[0]?.id} className="space-y-6">
                        <TabsList className="w-full flex justify-start overflow-x-auto bg-muted/50 p-1 rounded-xl h-auto gap-2">
                            {rounds.map((round) => (
                                <TabsTrigger key={round.id} value={round.id} className="rounded-lg">
                                    {round.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {rounds.map((round) => (
                            <TabsContent key={round.id} value={round.id} className="space-y-8">
                                {groups.filter(g => g.roundId === round.id).map(group => (
                                    <Card key={group.id} className="overflow-hidden border-border/50">
                                        <CardHeader className="bg-muted/30 border-b border-border/50">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Target className="h-5 w-5 text-primary" />
                                                    {group.name} Leaderboard
                                                </CardTitle>
                                                <Badge variant="outline">{group.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/10">
                                                        <TableHead className="w-[80px] text-center">Pos</TableHead>
                                                        <TableHead>Team</TableHead>
                                                        <TableHead className="w-[100px] text-right">Matches</TableHead>
                                                        <TableHead className="w-[100px] text-right font-semibold">Wins</TableHead>
                                                        <TableHead className="w-[100px] text-right">Kills</TableHead>
                                                        <TableHead className="w-[120px] text-right font-bold pr-6">Total Points</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {teams
                                                        .filter(tt => tt.groupId === group.id)
                                                        .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || b.kills - a.kills)
                                                        .map((tt, index) => (
                                                            <TableRow key={tt.id} className={index === 0 ? "bg-yellow-500/5" : ""}>
                                                                <TableCell className="text-center font-bold">
                                                                    {index === 0 ? <Trophy className="h-5 w-5 text-yellow-500 mx-auto" /> :
                                                                        index === 1 ? <Medal className="h-5 w-5 text-gray-400 mx-auto" /> :
                                                                            index === 2 ? <Medal className="h-5 w-5 text-amber-600 mx-auto" /> :
                                                                                index + 1}
                                                                </TableCell>
                                                                <TableCell className="font-semibold">{tt.teamName}</TableCell>
                                                                <TableCell className="text-right">{tt.matchesPlayed}</TableCell>
                                                                <TableCell className="text-right font-bold text-yellow-600 dark:text-yellow-400">{tt.wins}</TableCell>
                                                                <TableCell className="text-right">{tt.kills}</TableCell>
                                                                <TableCell className="text-right font-bold text-lg pr-6 text-primary">{tt.totalPoints}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    {teams.filter(tt => tt.groupId === group.id).length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                                                                No teams have been assigned to this group yet.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                ))}
                                {groups.filter(g => g.roundId === round.id).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground italic">
                                        No groups created for this round.
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </main>
        </div>
    );
};

export default TournamentStandings;
