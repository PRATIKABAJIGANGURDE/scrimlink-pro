export interface Team {
  id: string;
  name: string;
  email: string;
  logoUrl?: string;
  joinCode: string;
  country?: string;
  isVerified?: boolean;
  createdAt: string;
}

export interface Player {
  id: string;
  username: string;
  email: string;
  teamId?: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'IGL' | 'Rusher' | 'Sniper' | 'Supporter' | 'Flanker';
  profileUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  discordUsername?: string;
  isVerified?: boolean;
  gameUid?: string;
  inGameName?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  scrimId: string;
  matchId?: string;
  reporterId: string;
  reportedPlayerId: string;
  reason: string;
  createdAt: string;
  // Joins
  reporter?: {
    username: string;
    inGameName?: string;
    phoneNumber?: string;
  };
  reportedPlayer?: {
    username: string;
    inGameName?: string;
  };
  likes?: number;
  dislikes?: number;
  userVote?: 'like' | 'dislike' | null;
}

export interface ReportVote {
  id: string;
  reportId: string;
  voterId: string;
  voteType: 'like' | 'dislike';
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
  roomId?: string;
  roomPassword?: string;
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
  slot?: number;
}

export interface TeamLineup {
  matchId: string;
  teamId: string;
  playerIds: string[];
}

export interface RecruitmentPost {
  id: string;
  type: 'LFT' | 'LFP';
  authorId: string;
  teamId?: string;
  role?: string;
  description?: string;
  minKd?: number;
  status: 'active' | 'closed';
  createdAt: string;
  // Joins
  author?: {
    username: string;
    inGameName?: string;
    profileUrl?: string;
    role?: string;
  };
  team?: {
    name: string;
    logoUrl?: string;
  };
}

export interface TeamApplication {
  id: string;
  postId: string;
  playerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  // Joins
  player?: {
    username: string;
    inGameName?: string;
    profileUrl?: string;
    role?: string;
    kd?: number; // Calculated or stored
  };
  post?: Partial<RecruitmentPost>;
}

export interface TransferOffer {
  id: string;
  teamId: string;
  playerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'pending_exit_approval';
  message?: string;
  createdAt: string;
  // Joins
  team?: {
    name: string;
    logoUrl?: string;
  };
  player?: {
    username: string;
    inGameName?: string;
  };
}

export interface TeamHistory {
  id: string;
  playerId: string;
  teamId: string;
  joinedAt: string;
  leftAt: string;
  createdAt: string;
  // Joins
  team?: {
    name: string;
    logoUrl?: string;
  };
}

export interface Feedback {
  id: string;
  playerId: string;
  content: string;
  tag: string;
  createdAt: string;
  // Joins
  player?: {
    username: string;
    inGameName?: string;
    profileUrl?: string;
  };
}

export interface Tournament {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  maxTeams: number;
  currentTeams: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface TournamentRound {
  id: string;
  tournamentId: string;
  name: string; // e.g. "Qualifiers", "Semi-Finals", "Grand Final"
  roundOrder: number; // 1, 2, 3...
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
}

export interface TournamentGroup {
  id: string;
  roundId: string;
  name: string; // e.g. "Group A"
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
}

export interface TournamentTeam {
  id: string; // unique ID for this tournament entry
  tournamentId: string;
  roundId: string;
  groupId: string;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  totalPoints: number;
  wins: number; // or Booyahs
  kills: number;
  joinedAt: string;
}
