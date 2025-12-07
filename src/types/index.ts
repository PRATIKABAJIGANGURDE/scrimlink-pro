export interface Team {
  id: string;
  name: string;
  email: string;
  password: string;
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
  password: string;
  teamId?: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'IGL' | 'Rusher' | 'Sniper' | 'Supporter' | 'Flanker';
  profileUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
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
  post?: RecruitmentPost;
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
