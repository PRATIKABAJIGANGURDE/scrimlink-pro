import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getScrims, getMatchesByScrimId, getMatchResults } from "@/lib/storage";
import { ArrowLeft, Trophy, Calendar, Map as MapIcon, Target, Crosshair } from "lucide-react";
import { Scrim, Match } from "@/types";

const MatchResults = () => {
    const navigate = useNavigate();
    const [scrims, setScrims] = useState<Scrim[]>([]);
    const [selectedScrimId, setSelectedScrimId] = useState<string>("");
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<string>("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScrims = async () => {
            try {
                const allScrims = await getScrims();
                // Sort by newest first
                const sortedScrims = allScrims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setScrims(sortedScrims);
                if (sortedScrims.length > 0) {
                    setSelectedScrimId(sortedScrims[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch scrims:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchScrims();
    }, []);

    useEffect(() => {
        if (!selectedScrimId) return;

        const fetchMatches = async () => {
            try {
                const scrimMatches = await getMatchesByScrimId(selectedScrimId);
                setMatches(scrimMatches);
                if (scrimMatches.length > 0) {
                    setSelectedMatchId(scrimMatches[0].id);
                } else {
                    setResults([]);
                    setSelectedMatchId("");
                }
            } catch (error) {
                console.error("Failed to fetch matches:", error);
            }
        };
        fetchMatches();
    }, [selectedScrimId]);

    useEffect(() => {
        if (!selectedMatchId) return;

        const fetchResults = async () => {
            try {
                const matchResults = await getMatchResults(selectedMatchId);
                setResults(matchResults);
            } catch (error) {
                console.error("Failed to fetch results:", error);
            }
        };
        fetchResults();
    }, [selectedMatchId]);

    const selectedScrim = scrims.find(s => s.id === selectedScrimId);
    const selectedMatch = matches.find(m => m.id === selectedMatchId);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Trophy className="h-8 w-8 text-primary" />
                                Match Results
                            </h1>
                            <p className="text-muted-foreground">Detailed scoreboards for every match</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar / Filters */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Select Match</CardTitle>
                            <CardDescription>Choose a scrim and match to view</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Scrim Session</label>
                                <Select value={selectedScrimId} onValueChange={setSelectedScrimId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a scrim" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scrims.map((scrim) => (
                                            <SelectItem key={scrim.id} value={scrim.id}>
                                                {scrim.name} ({new Date(scrim.startTime).toLocaleDateString()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {matches.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Match Number</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {matches.map((match) => (
                                            <Button
                                                key={match.id}
                                                variant={selectedMatchId === match.id ? "default" : "outline"}
                                                className="w-full"
                                                onClick={() => setSelectedMatchId(match.id)}
                                            >
                                                Match {match.matchNumber}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>
                                        {selectedScrim?.name} - Match {selectedMatch?.matchNumber}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {selectedMatch && new Date(selectedMatch.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapIcon className="h-3 w-3" />
                                            {selectedMatch?.mapName || "Unknown Map"}
                                        </span>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Rank</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead className="text-center">Kills</TableHead>
                                        <TableHead className="text-center">Place Pts</TableHead>
                                        <TableHead className="text-right">Total Pts</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No results available for this match yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        results.map((result, index) => (
                                            <TableRow key={result.id} className={result.is_booyah ? "bg-yellow-500/10" : ""}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                                        #{result.placement || index + 1}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold flex items-center gap-2">
                                                        {result.team?.name}
                                                        {result.is_booyah && <Trophy className="h-3 w-3 text-yellow-500" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono">{result.team_kills}</TableCell>
                                                <TableCell className="text-center font-mono text-muted-foreground">{result.placement_points}</TableCell>
                                                <TableCell className="text-right font-bold text-lg">{result.total_points}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MatchResults;
