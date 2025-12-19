import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    getPlayersByTeamId,
    getScrimPlayers,
    saveScrimPlayer,
    deleteScrimPlayer,
    getCurrentPlayer,
    getMatchTeamStats,
    getMatchPlayerStatsByMatchId,
    createReport,
    getReportsByScrimId,
    voteOnReport,
    getAdmin,
    updateScrim
} from "@/lib/storage";
import { Scrim, Match, Team, ScrimTeam, MatchTeamStats, Player, Report } from "@/types";
import { Trophy, Calendar, Users, ArrowLeft, Plus, Flag, ThumbsUp, ThumbsDown, ShieldAlert, Lock, Unlock, Copy, ExternalLink } from "lucide-react";

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
    const [allPlayers, setAllPlayers] = useState<any[]>([]);

    // Role State
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
    const [isPlayer, setIsPlayer] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Room Details
    const [roomIdInput, setRoomIdInput] = useState("");
    const [roomPasswordInput, setRoomPasswordInput] = useState("");
    const [isRoomVisible, setIsRoomVisible] = useState(false); // Can user see it?
    const [savingRoom, setSavingRoom] = useState(false);

    // Admin: Match Stats
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [selectedMap, setSelectedMap] = useState<string>("");
    const [savingResults, setSavingResults] = useState(false);
    // Structure: { [teamId]: { id?: string, placement: number, players: { [playerId]: { id?: string, kills: number } } } }
    // Structure: { [teamId]: { id?: string, placement: number, totalPoints?: number, players: { [playerId]: { id?: string, kills: number } } } }
    const [matchStats, setMatchStats] = useState<Record<string, { id?: string; placement: number; totalPoints?: number; players: Record<string, { id?: string; kills: number }> }>>({});

    // Team: Roster Selection
    const [rosterOpen, setRosterOpen] = useState(false);
    const [myRoster, setMyRoster] = useState<string[]>([]); // Array of player IDs
    const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);

    // Reporting
    const [reports, setReports] = useState<Report[]>([]);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [reportingPlayer, setReportingPlayer] = useState<{ id: string, name: string } | null>(null);
    const [reportReason, setReportReason] = useState("");
    const [viewRosterId, setViewRosterId] = useState<string | null>(null); // For viewing roster to report

    useEffect(() => {
        if (id) {
            const init = async () => {
                const teamId = await checkUser();
                await loadData(id, teamId);
            };
            init();
        }
    }, [id]);

    const checkUser = async () => {
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (!user) return null;

        const admin = await getAdmin(user.id);
        if (admin) {
            setIsAdmin(true);
        }

        if (user.email === 'admin@scrimlink.pro') {
            setIsAdmin(true); // Fallback for original admin
        }

        const player = await getCurrentPlayer();
        if (player) {
            setIsPlayer(true);
            if (player.teamId) {
                setCurrentTeamId(player.teamId);
                const players = await getPlayersByTeamId(player.teamId);
                setTeamPlayers(players);
                return player.teamId;
            }
        }
        return null;
    };

    const loadData = async (scrimId: string, userTeamId?: string | null) => {
        try {
            const [scrimData, matchesData, teamsData, allTeams, allScrimPlayers, reportsData] = await Promise.all([
                getScrimById(scrimId),
                getMatchesByScrimId(scrimId),
                getScrimTeams(scrimId),
                getTeams(),
                getScrimPlayers(scrimId),
                getReportsByScrimId(scrimId)
            ]);

            setScrim(scrimData);
            setMatches(matchesData);
            setScrimTeams(teamsData);
            setAvailableTeams(allTeams);
            setAllPlayers(allScrimPlayers);
            setReports(reportsData);

            const activeTeamId = userTeamId || currentTeamId;
            if (activeTeamId) {
                const myP = allScrimPlayers.filter((p: any) => p.teamId === activeTeamId).map((p: any) => p.playerId);
                setMyRoster(myP);
            }

            // Room Visibility Logic
            if (scrimData) {
                setRoomIdInput(scrimData.roomId || "");
                setRoomPasswordInput(scrimData.roomPassword || "");

                const startTime = new Date(scrimData.startTime || "").getTime();
                const now = new Date().getTime();
                const diffMinutes = (startTime - now) / (1000 * 60);

                // Visible if admin OR if starts in less than 15 mins (and verified player in verified team)
                // For simplicity: Admin always sees. Players see if < 15 mins.
                if (diffMinutes <= 15) {
                    setIsRoomVisible(true);
                } else {
                    setIsRoomVisible(false);
                }
            }
        } catch (error) {
            console.error("Failed to load scrim data:", error);
        }
    };

    const handleUpdateRoomDetails = async () => {
        if (!id) return;
        setSavingRoom(true);
        try {
            await updateScrim(id, { roomId: roomIdInput, roomPassword: roomPasswordInput });
            toast({ title: "Updated", description: "Room details updated successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSavingRoom(false);
        }
    };

    const handleEndScrim = async () => {
        if (!id) return;
        if (!confirm("Are you sure you want to end this scrim? This will mark it as completed.")) return;

        try {
            await updateScrim(id, { status: 'completed' });
            toast({ title: "Success", description: "Scrim ended successfully" });
            loadData(id);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Copied to clipboard" });
    };

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
        } catch (error: any) {
            toast({
                title: "Error",
                description: `Failed to add team: ${error.message || "Unknown error"}`,
                variant: "destructive"
            });
        }
    };

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

    const handleSaveResults = async () => {
        if (!selectedMatch || !id) return;
        setSavingResults(true);

        try {
            const statsPromises = Object.entries(matchStats).map(async ([teamId, data]) => {
                const teamKills = Object.values(data.players).reduce((a, b) => a + b.kills, 0);
                const { placementPoints, totalPoints } = calculatePoints(data.placement, teamKills);

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
            await updateMatch(selectedMatch.id, {
                status: 'completed',
                mapName: selectedMap
            });

            toast({ title: "Success", description: "Match results saved" });
            setSelectedMatch(null);
            setMatchStats({});
            loadData(id);
        } catch (error: any) {
            toast({
                title: "Error",
                description: `Failed to save results: ${error.message || "Unknown error"}`,
                variant: "destructive"
            });
        } finally {
            setSavingResults(false);
        }
    };

    const handleSaveRoster = async () => {
        if (!id || !currentTeamId) return;
        try {
            const allScrimPlayers = await getScrimPlayers(id);
            const currentIds = allScrimPlayers.filter((p: any) => p.teamId === currentTeamId).map((p: any) => p.playerId);

            const toAdd = myRoster.filter(pid => !currentIds.includes(pid));

            // Filter out players who are already in the scrim (in any team) to avoid duplicate key error
            // We already know they aren't in OUR team (from the filter above), so if they are in allScrimPlayers, they are in ANOTHER team.
            const conflictingPlayers = toAdd.filter(pid => allScrimPlayers.some((p: any) => p.playerId === pid));

            if (conflictingPlayers.length > 0) {
                toast({
                    title: "Warning",
                    description: `${conflictingPlayers.length} player(s) ignored because they are already in another team in this scrim.`,
                    variant: "destructive"
                });
            }

            const validToAdd = toAdd.filter(pid => !allScrimPlayers.some((p: any) => p.playerId === pid));

            for (const pid of validToAdd) {
                await saveScrimPlayer(id, currentTeamId, pid);
            }

            const toRemove = currentIds.filter((pid: any) => !myRoster.includes(pid));
            for (const pid of toRemove) {
                await deleteScrimPlayer(id, pid);
            }

            toast({ title: "Success", description: "Roster updated" });
            setRosterOpen(false);
            loadData(id);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Failed to update roster", variant: "destructive" });
        }
    };

    const openMatchDialog = async (match: Match) => {
        setSelectedMatch(match);
        setSelectedMap(match.mapName || "");

        const [existingTeamStats, existingPlayerStats] = await Promise.all([
            getMatchTeamStats(match.id),
            getMatchPlayerStatsByMatchId(match.id)
        ]);

        const initialStats: Record<string, { id?: string; placement: number; totalPoints?: number; players: Record<string, { id?: string; kills: number }> }> = {};

        scrimTeams.forEach(st => {
            const teamRoster = allPlayers.filter((p: any) => p.teamId === st.teamId);
            const playerStats: Record<string, { id?: string; kills: number }> = {};

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
                totalPoints: existingTeamStat ? existingTeamStat.totalPoints : 0,
                players: playerStats
            };
        });
        setMatchStats(initialStats);
    };

    // --- Reporting Handlers ---

    const handleOpenReport = (playerId: string, playerName: string) => {
        setReportingPlayer({ id: playerId, name: playerName });
        setReportReason("");
        setReportDialogOpen(true);
    };

    const submitReport = async () => {
        if (!id || !reportingPlayer || !reportReason.trim()) return;
        try {
            await createReport(id, reportingPlayer.id, reportReason);
            toast({ title: "Report Submitted", description: "Thank you for making the community safer." });
            setReportDialogOpen(false);
            loadData(id);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleVote = async (reportId: string, type: 'like' | 'dislike') => {
        try {
            await voteOnReport(reportId, type);
            // Optimistic update or reload
            loadData(id!);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (!scrim) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
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
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(scrim.startTime || "").toLocaleString()}</span>
                            <span className="flex items-center"><Trophy className="w-4 h-4 mr-1" /> {scrim.matchCount} Matches</span>
                            <Badge variant={scrim.status === 'upcoming' ? 'secondary' : 'default'}>{scrim.status.toUpperCase()}</Badge>
                        </div>
                    </div>
                </div>
                {isAdmin && scrim.status !== 'completed' && (
                    <Button variant="destructive" onClick={handleEndScrim} className="mt-4 md:mt-0">
                        End Scrim
                    </Button>
                )}
            </div>

            {/* Team Actions: Roster Selection */}
            {
                !isAdmin && currentTeamId && (
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
                                                if (e.target.checked) setMyRoster([...myRoster, player.id]);
                                                else setMyRoster(myRoster.filter(id => id !== player.id));
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
                )
            }


            {/* Room Credentials Section */}
            < Card className="border-primary/20 bg-primary/5" >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Match Room Details</CardTitle>
                        </div>
                        {scrim.status === 'completed' && <Badge variant="secondary">Completed</Badge>}
                    </div>
                    <CardDescription>
                        {isAdmin
                            ? "Share these details with players. They will only see them 15 minutes before start."
                            : "Credentials will be revealed 15 minutes before the match starts."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(isAdmin || isRoomVisible) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Room ID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                        readOnly={!isAdmin}
                                        placeholder={isAdmin ? "Enter Room ID" : "Not set"}
                                        className="font-mono"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(roomIdInput)} disabled={!roomIdInput}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={roomPasswordInput}
                                        onChange={(e) => setRoomPasswordInput(e.target.value)}
                                        readOnly={!isAdmin}
                                        placeholder={isAdmin ? "Enter Password" : "Not set"}
                                        className="font-mono"
                                        type="text"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(roomPasswordInput)} disabled={!roomPasswordInput}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="md:col-span-2 flex justify-end">
                                    <Button onClick={handleUpdateRoomDetails} disabled={savingRoom}>
                                        {savingRoom ? "Saving..." : "Update Credentials"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-muted-foreground">
                            <Lock className="h-8 w-8 mb-2 opacity-50" />
                            <p>Credentials are currently locked.</p>
                            <p className="text-sm">Check back 15 minutes before the scrim starts.</p>
                        </div>
                    )}
                </CardContent>
            </Card >

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Matches */}
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Matches
                    </h2>
                    {matches.map((match) => (
                        <div
                            key={match.id}
                            className="flex flex-col gap-3 p-4 bg-muted rounded-lg border border-border cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => openMatchDialog(match)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold">#{match.matchNumber}</span>
                                </div>
                                <div>
                                    <p className="font-medium">Match {match.matchNumber}</p>
                                    <p className="text-sm text-muted-foreground">{match.mapName || "Map TBD"}</p>
                                </div>
                            </div>

                            <Dialog open={selectedMatch?.id === match.id} onOpenChange={(open) => !open && setSelectedMatch(null)}>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw]" onClick={(e) => e.stopPropagation()}>
                                    <DialogHeader>
                                        <DialogTitle>Match {match.matchNumber} Details</DialogTitle>
                                        <DialogDescription>{match.mapName || "Map TBD"} - {match.status.toUpperCase()}</DialogDescription>
                                    </DialogHeader>

                                    {isAdmin ? (
                                        // Admin View: Editable
                                        <div className="space-y-6 py-4">
                                            <div className="space-y-2">
                                                <Label>Map Selection</Label>
                                                <Select value={selectedMap} onValueChange={setSelectedMap}>
                                                    <SelectTrigger><SelectValue placeholder="Select Map" /></SelectTrigger>
                                                    <SelectContent>
                                                        {MAPS.map(map => <SelectItem key={map} value={map}>{map}</SelectItem>)}
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
                                                                type="number" className="w-20"
                                                                value={matchStats[st.teamId]?.placement || ""}
                                                                onChange={(e) => setMatchStats(prev => ({
                                                                    ...prev, [st.teamId]: { ...prev[st.teamId], placement: parseInt(e.target.value) || 0 }
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
                                                                        type="number" className="w-20" placeholder="Kills"
                                                                        value={pData.kills}
                                                                        onChange={(e) => setMatchStats(prev => ({
                                                                            ...prev,
                                                                            [st.teamId]: {
                                                                                ...prev[st.teamId],
                                                                                players: {
                                                                                    ...prev[st.teamId].players,
                                                                                    [playerId]: { ...prev[st.teamId].players[playerId], kills: parseInt(e.target.value) || 0 }
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
                                            <DialogFooter>
                                                <Button onClick={handleSaveResults} disabled={savingResults}>
                                                    {savingResults ? "Saving..." : "Save Results"}
                                                </Button>
                                            </DialogFooter>
                                        </div>
                                    ) : (
                                        // Player View: Read Only
                                        <div className="space-y-6 py-4">
                                            {match.status === 'completed' ? (
                                                <div className="space-y-4">
                                                    {scrimTeams
                                                        .sort((a, b) => (matchStats[a.teamId]?.placement || 99) - (matchStats[b.teamId]?.placement || 99))
                                                        .map((st) => {
                                                            const stats = matchStats[st.teamId];
                                                            if (!stats) return null;
                                                            return (
                                                                <div key={st.id} className="border p-4 rounded-lg flex justify-between items-center">
                                                                    <div>
                                                                        <span className="font-bold text-lg">#{stats.placement}</span>
                                                                        <span className="ml-2 font-medium">{st.teamName}</span>
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {Object.values(stats.players || {}).reduce((a, b) => a + b.kills, 0)} Kills
                                                                        • {stats.totalPoints || 0} Pts
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    {Object.keys(matchStats).length === 0 && <p className="text-center text-muted-foreground">Results processing...</p>}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    Results will be available after the match is completed.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))}
                </div>

                {/* Right Column: Teams and Reports */}
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
                                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                        <SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger>
                                        <SelectContent>
                                            {availableTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleAddTeam}><Plus className="h-4 w-4" /></Button>
                                </div>
                            )}

                            <div className="space-y-2">
                                {scrimTeams.map((st) => (
                                    <div key={st.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="font-medium">{st.teamName}</span>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" onClick={() => setViewRosterId(st.teamId)}>
                                                    View Roster
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>{st.teamName} Roster</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4 space-y-2">
                                                    {allPlayers.filter(p => p.teamId === st.teamId).length === 0 ? (
                                                        <p className="text-muted-foreground">No players selected.</p>
                                                    ) : (
                                                        allPlayers.filter(p => p.teamId === st.teamId).map(p => (
                                                            <div key={p.playerId} className="flex items-center justify-between p-2 border rounded">
                                                                <div>
                                                                    <div className="font-medium">{p.playerInGameName || p.playerUsername}</div>
                                                                    {p.playerInGameName && <div className="text-xs text-muted-foreground">Username: {p.playerUsername}</div>}
                                                                </div>
                                                                {isPlayer && currentUser?.id !== p.playerId && (
                                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => handleOpenReport(p.playerId, p.playerInGameName || p.playerUsername)}>
                                                                        <Flag className="h-4 w-4 mr-1" />
                                                                        Report
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reports Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-orange-500" />
                                Reports & Fair Play
                            </CardTitle>
                            <CardDescription>
                                Community reports for this scrim. Upvote valid reports.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reports.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No reports yet. Play fair!</p>
                            ) : (
                                reports.map((report) => (
                                    <div key={report.id} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-destructive">Reported: {report.reportedPlayer?.inGameName || report.reportedPlayer?.username}</div>
                                                <div className="text-sm font-medium">Reason: {report.reason}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Reporter: {report.reporter?.inGameName || report.reporter?.username} • {new Date(report.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant={report.userVote === 'like' ? "default" : "ghost"}
                                                    size="sm"
                                                    className="h-8 gap-1"
                                                    onClick={() => handleVote(report.id, 'like')}
                                                >
                                                    <ThumbsUp className="h-4 w-4" /> {report.likes}
                                                </Button>
                                                <Button
                                                    variant={report.userVote === 'dislike' ? "destructive" : "ghost"}
                                                    size="sm"
                                                    className="h-8 gap-1"
                                                    onClick={() => handleVote(report.id, 'dislike')}
                                                >
                                                    <ThumbsDown className="h-4 w-4" /> {report.dislikes}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Report Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report Player</DialogTitle>
                        <DialogDescription>
                            Reporting {reportingPlayer?.name}. Please verify before reporting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                placeholder="Describe the issue (e.g. hacking, toxicity, macros)..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={submitReport} disabled={!reportReason.trim()}>Submit Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ScrimManagement;
