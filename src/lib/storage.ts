import { Team, Player, JoinRequest, Scrim, Match, MatchTeamStats, MatchPlayerStats, TeamLineup } from '@/types';

const KEYS = {
  TEAMS: 'ff_teams',
  PLAYERS: 'ff_players',
  JOIN_REQUESTS: 'ff_join_requests',
  SCRIMS: 'ff_scrims',
  MATCHES: 'ff_matches',
  MATCH_TEAM_STATS: 'ff_match_team_stats',
  MATCH_PLAYER_STATS: 'ff_match_player_stats',
  TEAM_LINEUPS: 'ff_team_lineups',
  CURRENT_TEAM: 'ff_current_team',
  CURRENT_PLAYER: 'ff_current_player',
};

function getItem<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Teams
export const getTeams = (): Team[] => getItem<Team>(KEYS.TEAMS);
export const saveTeam = (team: Team): void => {
  const teams = getTeams();
  teams.push(team);
  setItem(KEYS.TEAMS, teams);
};
export const getTeamByEmail = (email: string): Team | undefined => 
  getTeams().find(t => t.email === email);
export const getTeamById = (id: string): Team | undefined => 
  getTeams().find(t => t.id === id);
export const getTeamByJoinCode = (code: string): Team | undefined => 
  getTeams().find(t => t.joinCode === code);

// Players
export const getPlayers = (): Player[] => getItem<Player>(KEYS.PLAYERS);
export const savePlayer = (player: Player): void => {
  const players = getPlayers();
  players.push(player);
  setItem(KEYS.PLAYERS, players);
};
export const getPlayerByEmail = (email: string): Player | undefined => 
  getPlayers().find(p => p.email === email);
export const getPlayerById = (id: string): Player | undefined => 
  getPlayers().find(p => p.id === id);
export const getPlayersByTeamId = (teamId: string): Player[] => 
  getPlayers().filter(p => p.teamId === teamId && p.status === 'approved');
export const updatePlayer = (playerId: string, updates: Partial<Player>): void => {
  const players = getPlayers();
  const index = players.findIndex(p => p.id === playerId);
  if (index !== -1) {
    players[index] = { ...players[index], ...updates };
    setItem(KEYS.PLAYERS, players);
  }
};

// Join Requests
export const getJoinRequests = (): JoinRequest[] => getItem<JoinRequest>(KEYS.JOIN_REQUESTS);
export const saveJoinRequest = (request: JoinRequest): void => {
  const requests = getJoinRequests();
  requests.push(request);
  setItem(KEYS.JOIN_REQUESTS, requests);
};
export const getJoinRequestsByTeamId = (teamId: string): JoinRequest[] => 
  getJoinRequests().filter(r => r.teamId === teamId && r.status === 'pending');
export const updateJoinRequest = (requestId: string, status: 'approved' | 'rejected'): void => {
  const requests = getJoinRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index !== -1) {
    requests[index].status = status;
    setItem(KEYS.JOIN_REQUESTS, requests);
  }
};

// Scrims
export const getScrims = (): Scrim[] => getItem<Scrim>(KEYS.SCRIMS);
export const saveScrim = (scrim: Scrim): void => {
  const scrims = getScrims();
  scrims.push(scrim);
  setItem(KEYS.SCRIMS, scrims);
};
export const getScrimById = (id: string): Scrim | undefined => 
  getScrims().find(s => s.id === id);

// Matches
export const getMatches = (): Match[] => getItem<Match>(KEYS.MATCHES);
export const saveMatch = (match: Match): void => {
  const matches = getMatches();
  matches.push(match);
  setItem(KEYS.MATCHES, matches);
};
export const getMatchesByScrimId = (scrimId: string): Match[] => 
  getMatches().filter(m => m.scrimId === scrimId);

// Match Stats
export const getMatchTeamStats = (): MatchTeamStats[] => getItem<MatchTeamStats>(KEYS.MATCH_TEAM_STATS);
export const saveMatchTeamStats = (stats: MatchTeamStats): void => {
  const allStats = getMatchTeamStats();
  allStats.push(stats);
  setItem(KEYS.MATCH_TEAM_STATS, allStats);
};

export const getMatchPlayerStats = (): MatchPlayerStats[] => getItem<MatchPlayerStats>(KEYS.MATCH_PLAYER_STATS);
export const saveMatchPlayerStats = (stats: MatchPlayerStats): void => {
  const allStats = getMatchPlayerStats();
  allStats.push(stats);
  setItem(KEYS.MATCH_PLAYER_STATS, allStats);
};

// Session
export const setCurrentTeam = (team: Team | null): void => {
  if (team) {
    localStorage.setItem(KEYS.CURRENT_TEAM, JSON.stringify(team));
  } else {
    localStorage.removeItem(KEYS.CURRENT_TEAM);
  }
};
export const getCurrentTeam = (): Team | null => {
  const data = localStorage.getItem(KEYS.CURRENT_TEAM);
  return data ? JSON.parse(data) : null;
};

export const setCurrentPlayer = (player: Player | null): void => {
  if (player) {
    localStorage.setItem(KEYS.CURRENT_PLAYER, JSON.stringify(player));
  } else {
    localStorage.removeItem(KEYS.CURRENT_PLAYER);
  }
};
export const getCurrentPlayer = (): Player | null => {
  const data = localStorage.getItem(KEYS.CURRENT_PLAYER);
  return data ? JSON.parse(data) : null;
};

// Utility
export const generateId = (): string => Math.random().toString(36).substring(2, 15);
export const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
