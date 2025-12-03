export interface Team {
  id: string;
  name: string;
  email: string;
  password: string;
  logoUrl?: string;
  joinCode: string;
  country?: string;
  createdAt: string;
}

export interface Player {
  id: string;
  username: string;
  email: string;
  password: string;
  teamId?: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'IGL' | 'Rusher' | 'Sniper' | 'Supporter' | 'Flanker';
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  playerId: string;
  playerUsername: string;
  playerEmail: string;
  teamId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Scrim {
  id: string;
  name: string;
  hostTeamId: string;
  matchCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  startTime?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  scrimId: string;
  matchNumber: number;
  mapName?: string;
  status: 'pending' | 'ongoing' | 'completed';
  createdAt: string;
}

export interface MatchTeamStats {
  id: string;
  matchId: string;
  teamId: string;
  placement: number;
  placementPoints: number;
  teamKills: number;
  totalPoints: number;
  isBooyah: boolean;
}

export interface MatchPlayerStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  kills: number;
}

export interface ScrimTeam {
  id: string;
  scrimId: string;
  teamId: string;
  teamName: string;
  joinedAt: string;
}

export interface TeamLineup {
  matchId: string;
  teamId: string;
  playerIds: string[];
}
