import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    getScrimById,
    getMatchesByScrimId,
    getScrimTeams,
    saveScrimTeam,
    getTeams,
    updateMatch,
    saveMatchTeamStats,
    saveMatchPlayerStats,
    generateId,
    getCurrentUser,
    getAdmin,
    getCurrentTeam,
    getPlayersByTeamId,
    getScrimPlayers,
    saveScrimPlayer,
    deleteScrimPlayer,
    getCurrentPlayer,
    getMatchTeamStats,
    getMatchPlayerStatsByMatchId
} from "@/lib/storage";
import { Scrim, Match, Team, ScrimTeam, MatchTeamStats, Player } from "@/types";
import { Trophy, Calendar, Users, Target, ArrowLeft, Plus, Save } from "lucide-react";

const MAPS = [
    "Bermuda",
    "Purgatory",
    "Kalahari",
    "Solara",
    "Alpine",
    "NeXTerra"
];

const ScrimManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [scrim, setScrim] = useState<Scrim | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [scrimTeams, setScrimTeams] = useState<ScrimTeam[]>([]);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");

    // Role State
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
    const [isPlayer, setIsPlayer] = useState(false);

    // Admin: Match Stats
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [selectedMap, setSelectedMap] = useState<string>("");
    const [savingResults, setSavingResults] = useState(false);
    // Structure: { [teamId]: { id?: string, placement: number, players: { [playerId]: { id?: string, kills: number } } } }
    const [matchStats, setMatchStats] = useState<Record<string, { id?: string; placement: number; players: Record<string, { id?: string; kills: number }> }>>({});

    // Team: Roster Selection
    const [rosterOpen, setRosterOpen] = useState(false);
    const [myRoster, setMyRoster] = useState<string[]>([]); // Array of player IDs
    const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);

    useEffect(() => {
        if (id) {
            checkRole();
            loadData(id);
        }
    }, [id]);

    const checkRole = async () => {
        const user = await getCurrentUser();
        if (!user) return;

        // Check if Admin
        const admin = await getAdmin(user.id);
        if (admin) {
            setIsAdmin(true);
        } else {
            // Check if Team
            const team = await getCurrentTeam();
            if (team) {
                setCurrentTeamId(team.id);
                // Load team players for roster selection
                const players = await getPlayersByTeamId(team.id);
                setTeamPlayers(players);
            } else {
                const player = await getCurrentPlayer();
                if (player) {
                    setIsPlayer(true);
                    if (player.teamId) {
                        setCurrentTeamId(player.teamId);
                        const players = await getPlayersByTeamId(player.teamId);
                        setTeamPlayers(players);
                    }
                }
            }
        }
    };

    const loadData = async (scrimId: string) => {
        try {
            const [scrimData, matchesData, teamsData, allTeams] = await Promise.all([
                getScrimById(scrimId),
                getMatchesByScrimId(scrimId),
                getScrimTeams(scrimId),
                getTeams()
            ]);

            setScrim(scrimData || null);
            setMatches(matchesData);
            setScrimTeams(teamsData);
            setAvailableTeams(allTeams);

            // Load my roster if team
            if (currentTeamId) {
                const roster = await getScrimPlayers(scrimId);
                const myPlayers = roster.filter((p: any) => p.teamId === currentTeamId).map((p: any) => p.playerId);
                setMyRoster(myPlayers);
            }
        } catch (error) {
            console.error("Failed to load scrim data:", error);
        }
    };

    // ... (handleAddTeam remains same, but only for Admin) ...
    const handleAddTeam = async () => {
        if (!id || !selectedTeamId) return;
        try {
            if (scrimTeams.some(st => st.teamId === selectedTeamId)) {
                toast({ title: "Error", description: "Team already added", variant: "destructive" });
                return;
            }
            const team = availableTeams.find(t => t.id === selectedTeamId);
            if (!team) return;

            const scrimTeam: ScrimTeam = {
                id: generateId(),
                scrimId: id,
                teamId: selectedTeamId,
                teamName: team.name,
                joinedAt: new Date().toISOString()
            };
            await saveScrimTeam(scrimTeam);
            toast({ title: "Success", description: "Team added to scrim" });
            loadData(id);
            setSelectedTeamId("");
            setSelectedTeamId("");
        } catch (error: any) {
            console.error("Failed to add team:", error);
            console.error("Error details:", error.message, error.details, error.hint);
            toast({
                title: "Error",
                description: `Failed to add team: ${error.message || "Unknown error"}`,
                variant: "destructive"
            });
        }
    };

    // ... (calculatePoints remains same) ...
    const calculatePoints = (placement: number, kills: number) => {
        let placementPoints = 0;
        if (placement === 1) placementPoints = 12;
        else if (placement === 2) placementPoints = 9;
        else if (placement === 3) placementPoints = 8;
        else if (placement === 4) placementPoints = 7;
        else if (placement === 5) placementPoints = 6;
        else if (placement === 6) placementPoints = 5;
        else if (placement === 7) placementPoints = 4;
        else if (placement === 8) placementPoints = 3;
        else if (placement === 9) placementPoints = 2;
        else if (placement === 10) placementPoints = 1;

        return {
            placementPoints,
            totalPoints: placementPoints + kills
        };
    };

    // Admin: Save Results (Updated for Player Stats)
    const handleSaveResults = async () => {
        if (!selectedMatch || !id) return;
        setSavingResults(true);

        try {
            const statsPromises = Object.entries(matchStats).map(async ([teamId, data]) => {
                // 1. Calculate Team Totals
                const teamKills = Object.values(data.players).reduce((a, b) => a + b.kills, 0);
                const { placementPoints, totalPoints } = calculatePoints(data.placement, teamKills);

                // 2. Save Team Stats
                const teamStats: MatchTeamStats = {
                    id: data.id || generateId(),
                    matchId: selectedMatch.id,
                    teamId,
                    placement: data.placement,
                    placementPoints,
                    teamKills,
                    totalPoints,
                    isBooyah: data.placement === 1
                };
                await saveMatchTeamStats(teamStats);

                // 3. Save Player Stats
                const playerPromises = Object.entries(data.players).map(([playerId, pData]) => {
                    return saveMatchPlayerStats({
                        id: pData.id || generateId(),
                        matchId: selectedMatch.id,
                        playerId,
                        teamId,
                        kills: pData.kills
                    });
                });
                await Promise.all(playerPromises);
            });

            await Promise.all(statsPromises);
            await Promise.all(statsPromises);
            await updateMatch(selectedMatch.id, {
                status: 'completed',
                mapName: selectedMap
            });

            toast({ title: "Success", description: "Match results saved" });
            setSelectedMatch(null);
            setMatchStats({});
            loadData(id);
        } catch (error: any) {
            console.error("Failed to save results:", error);
            console.error("Error details:", error.message, error.details, error.hint);
            toast({
                title: "Error",
                description: `Failed to save results: ${error.message || "Unknown error"}`,
                variant: "destructive"
            });
        } finally {
            setSavingResults(false);
        }
    };

    // Team: Save Roster
    const handleSaveRoster = async () => {
        if (!id || !currentTeamId) return;
        try {
            // 1. Get current roster for this scrim to diff
            const currentRoster = await getScrimPlayers(id);
            const currentIds = currentRoster.filter((p: any) => p.teamId === currentTeamId).map((p: any) => p.playerId);

            // 2. Add new players
            const toAdd = myRoster.filter(pid => !currentIds.includes(pid));
            for (const pid of toAdd) {
                await saveScrimPlayer(id, currentTeamId, pid);
            }

            // 3. Remove old players
            const toRemove = currentIds.filter((pid: any) => !myRoster.includes(pid));
            for (const pid of toRemove) {
                await deleteScrimPlayer(id, pid);
            }

            toast({ title: "Success", description: "Roster updated" });
            setRosterOpen(false);
            loadData(id);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update roster", variant: "destructive" });
        }
    };

    const [allPlayers, setAllPlayers] = useState<any[]>([]);

    const openMatchDialog = async (match: Match) => {
        setSelectedMatch(match);
        setSelectedMap(match.mapName || "");
        // Load roster for all teams to populate inputs
        const allScrimPlayers = await getScrimPlayers(id!);
        setAllPlayers(allScrimPlayers);

        // Fetch existing stats
        const [existingTeamStats, existingPlayerStats] = await Promise.all([
            getMatchTeamStats(match.id),
            getMatchPlayerStatsByMatchId(match.id)
        ]);

        const initialStats: Record<string, { id?: string; placement: number; players: Record<string, { id?: string; kills: number }> }> = {};

        scrimTeams.forEach(st => {
            const teamRoster = allScrimPlayers.filter((p: any) => p.teamId === st.teamId);
            const playerStats: Record<string, { id?: string; kills: number }> = {};

            // Initialize with existing stats or 0
            teamRoster.forEach((p: any) => {
                const existingStat = existingPlayerStats.find((s: any) => s.playerId === p.playerId);
                playerStats[p.playerId] = {
                    id: existingStat?.id,
                    kills: existingStat ? existingStat.kills : 0
                };
            });

            const existingTeamStat = existingTeamStats.find((s: any) => s.teamId === st.teamId);

            initialStats[st.teamId] = {
                id: existingTeamStat?.id,
                placement: existingTeamStat ? existingTeamStat.placement : 0,
                players: playerStats
            };
        });
        setMatchStats(initialStats);
    };

    if (!scrim) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button variant="ghost" className="w-fit -ml-2" onClick={() => {
                            if (isAdmin) navigate("/admin");
                            else if (isPlayer) navigate("/player/dashboard");
                            else if (currentTeamId) navigate("/team/dashboard");
                            else navigate(-1);
                        }}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{scrim.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(scrim.startTime || "").toLocaleString()}
                                </span>
                                <Badge variant={scrim.status === 'upcoming' ? 'secondary' : 'default'}>
                                    {scrim.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Team Actions: Roster Selection */}
                    {!isAdmin && currentTeamId && (
                        <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
                            <DialogTrigger asChild>
                                <Button>Select Roster</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Select Roster</DialogTitle>
                                    <DialogDescription>Choose players for this scrim</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                    {teamPlayers.map(player => (
                                        <div key={player.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={myRoster.includes(player.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setMyRoster([...myRoster, player.id]);
                                                    } else {
                                                        setMyRoster(myRoster.filter(id => id !== player.id));
                                                    }
                                                }}
                                            />
                                            <Label>{player.inGameName || player.username}</Label>
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSaveRoster}>Save Roster</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Matches Column */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Matches</CardTitle>
                                <CardDescription>Match schedule and results</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {matches.map((match) => (
                                        <div key={match.id} className="flex flex-col gap-3 p-4 bg-muted rounded-lg border border-border">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="font-bold">#{match.matchNumber}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Match {match.matchNumber}</p>
                                                    <p className="text-sm text-muted-foreground">{match.mapName || "Map TBD"}</p>
                                                </div>
                                            </div>

                                            {/* Admin: Enter Results */}
                                            {isAdmin && (
                                                <Dialog open={selectedMatch?.id === match.id} onOpenChange={(open) => !open && setSelectedMatch(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="w-full" onClick={() => openMatchDialog(match)}>
                                                            Enter Results
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw]">
                                                        <DialogHeader>
                                                            <DialogTitle>Match {match.matchNumber} Results</DialogTitle>
                                                            <DialogDescription>Enter placement and kills for each player</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 py-4">
                                                            <div className="space-y-2">
                                                                <Label>Map Selection</Label>
                                                                <Select value={selectedMap} onValueChange={setSelectedMap}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select Map" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {MAPS.map(map => (
                                                                            <SelectItem key={map} value={map}>{map}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {scrimTeams.map((st) => (
                                                                <div key={st.id} className="border p-4 rounded-lg">
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h3 className="font-bold">{st.teamName}</h3>
                                                                        <div className="flex items-center gap-2">
                                                                            <Label>Placement:</Label>
                                                                            <Input
                                                                                type="number"
                                                                                className="w-20"
                                                                                value={matchStats[st.teamId]?.placement || ""}
                                                                                onChange={(e) => setMatchStats(prev => ({
                                                                                    ...prev,
                                                                                    [st.teamId]: { ...prev[st.teamId], placement: parseInt(e.target.value) || 0 }
                                                                                }))}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        {Object.entries(matchStats[st.teamId]?.players || {}).map(([playerId, pData]) => {
                                                                            const player = allPlayers.find((p: any) => p.playerId === playerId);
                                                                            const displayName = player ? (player.playerInGameName || player.playerUsername) : playerId.slice(0, 8);

                                                                            return (
                                                                                <div key={playerId} className="flex items-center justify-between">
                                                                                    <Label className="text-sm w-32 truncate" title={displayName}>{displayName}</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        className="w-20"
                                                                                        placeholder="Kills"
                                                                                        value={pData.kills}
                                                                                        onChange={(e) => setMatchStats(prev => ({
                                                                                            ...prev,
                                                                                            [st.teamId]: {
                                                                                                ...prev[st.teamId],
                                                                                                players: {
                                                                                                    ...prev[st.teamId].players,
                                                                                                    [playerId]: {
                                                                                                        ...prev[st.teamId].players[playerId],
                                                                                                        kills: parseInt(e.target.value) || 0
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }))}
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {Object.keys(matchStats[st.teamId]?.players || {}).length === 0 && (
                                                                            <p className="text-sm text-muted-foreground col-span-2">No roster selected for this team.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={handleSaveResults} disabled={savingResults}>
                                                                {savingResults ? "Saving..." : "Save Results"}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Teams Column */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Participating Teams</CardTitle>
                                    <CardDescription>{scrimTeams.length} teams joined</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedTeamId}
                                            onChange={(e) => setSelectedTeamId(e.target.value)}
                                        >
                                            <option value="">Select Team</option>
                                            {availableTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <Button onClick={handleAddTeam}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {scrimTeams.map((st) => (
                                        <div key={st.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <span className="font-medium">{st.teamName}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScrimManagement;
