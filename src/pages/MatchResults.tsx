import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getScrims, getMatchesByScrimId, getMatchResults } from "@/lib/storage";
import { ArrowLeft, Trophy, Calendar, Map as MapIcon, Target, Crosshair, Crown } from "lucide-react";
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
        <div className="min-h-screen bg-background">
            <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-xl border border-border/40 bg-background/70 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Back</span>
                        </Button>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-primary" />
                            <h1 className="text-lg font-bold">Match Results</h1>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/rankings")}>
                        <Crown className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Rankings</span>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-8 max-w-6xl space-y-8">

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
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
                                        {matches.map((match) => (
                                            <Button
                                                key={match.id}
                                                variant={selectedMatchId === match.id ? "default" : "outline"}
                                                className="w-full"
                                                onClick={() => setSelectedMatchId(match.id)}
                                            >
                                                #{match.matchNumber}
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
                            <div className="space-y-4 md:hidden">
                                {results.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No results available for this match yet.
                                    </div>
                                ) : (
                                    results.map((result, index) => (
                                        <div key={result.id} className={`flex flex-col gap-2 p-4 rounded-lg border border-border ${result.is_booyah ? "bg-yellow-500/10" : "bg-muted/50"}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-bold">
                                                        #{result.placement || index + 1}
                                                    </div>
                                                    <div className="font-semibold flex items-center gap-2">
                                                        {result.team?.name}
                                                        {result.is_booyah && <Trophy className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                                                    </div>
                                                </div>
                                                <span className="font-bold text-lg">{result.total_points} pts</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground border-t border-border/50 pt-2 mt-1">
                                                <div className="text-center">
                                                    <span className="block font-semibold text-foreground">{result.team_kills}</span>
                                                    Kills
                                                </div>
                                                <div className="text-center">
                                                    <span className="block font-semibold text-foreground">{result.placement_points}</span>
                                                    Place Pts
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
                                            <TableHead className="w-[60px]">Rank</TableHead>
                                            <TableHead className="min-w-[120px]">Team</TableHead>
                                            <TableHead className="text-center">Kills</TableHead>
                                            <TableHead className="text-center">Place</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
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
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs">
                                                            #{result.placement || index + 1}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold flex items-center gap-2 text-sm">
                                                            {result.team?.name}
                                                            {result.is_booyah && <Trophy className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default MatchResults;
