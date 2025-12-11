import { Team, Player, JoinRequest, Scrim, Match, MatchTeamStats, MatchPlayerStats, ScrimTeam } from '@/types';
import { supabase } from './supabase';

// Helper to map Supabase response to our types (handling snake_case to camelCase if needed)
// For now, we'll assume the types match or we handle it manually.
// The schema uses snake_case (team_id, join_code), but types use camelCase.
// We need to handle this mapping.

// Teams
export const getTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase.from('teams').select('*');
  if (error) throw error;
  return data.map((t: any) => ({
    ...t,
    joinCode: t.join_code,
    createdAt: t.created_at,
    logoUrl: t.logo_url
  }));
};

export const saveTeam = async (team: Team): Promise<void> => {
  const { error } = await supabase.from('teams').insert({
    id: team.id,
    name: team.name,
    email: team.email,
    password: team.password,
    join_code: team.joinCode,
    country: team.country,
    logo_url: team.logoUrl,
    created_at: team.createdAt
  });
  if (error) throw error;
};

export const getTeamByEmail = async (email: string): Promise<Team | null> => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  if (!data) return null;

  return {
    ...data,
    joinCode: data.join_code,
    createdAt: data.created_at,
    logoUrl: data.logo_url
  };
};

export const getTeamById = async (id: string): Promise<Team | null> => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    joinCode: data.join_code,
    createdAt: data.created_at,
    logoUrl: data.logo_url
  };
};

export const getTeamByJoinCode = async (code: string): Promise<Team | null> => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('join_code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    joinCode: data.join_code,
    createdAt: data.created_at,
    logoUrl: data.logo_url
  };
};

// Players
export const getPlayers = async (): Promise<Player[]> => {
  const { data, error } = await supabase.from('players').select('*');
  if (error) throw error;
  return data.map((p: any) => ({
    ...p,
    teamId: p.team_id,
    gameUid: p.game_uid,
    inGameName: p.in_game_name,
    createdAt: p.created_at
  }));
};

export const savePlayer = async (player: Player): Promise<void> => {
  const { error } = await supabase.from('players').insert({
    id: player.id,
    username: player.username,
    email: player.email,
    password: player.password,
    team_id: player.teamId,
    status: player.status,
    created_at: player.createdAt
  });
  if (error) throw error;
};

export const getPlayerByEmail = async (email: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    teamId: data.team_id,
    gameUid: data.game_uid,
    inGameName: data.in_game_name,
    createdAt: data.created_at
  };
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    teamId: data.team_id,
    gameUid: data.game_uid,
    inGameName: data.in_game_name,
    createdAt: data.created_at
  };
};

export const getPlayersByTeamId = async (teamId: string): Promise<Player[]> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'approved');

  if (error) throw error;
  return data.map((p: any) => ({
    ...p,
    teamId: p.team_id,
    gameUid: p.game_uid,
    inGameName: p.in_game_name,
    createdAt: p.created_at
  }));
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<void> => {
  // Map camelCase updates to snake_case
  const dbUpdates: any = { ...updates };
  if (updates.teamId) {
    dbUpdates.team_id = updates.teamId;
    delete dbUpdates.teamId;
  }
  if (updates.gameUid) {
    dbUpdates.game_uid = updates.gameUid;
    delete dbUpdates.gameUid;
  }
  if (updates.inGameName) {
    dbUpdates.in_game_name = updates.inGameName;
    delete dbUpdates.inGameName;
  }
  if (updates.phoneNumber) {
    dbUpdates.phone_number = updates.phoneNumber;
    delete dbUpdates.phoneNumber;
  }
  // Remove fields that shouldn't be updated or don't exist in DB if any

  const { error } = await supabase
    .from('players')
    .update(dbUpdates)
    .eq('id', playerId);

  if (error) throw error;
};

// Join Requests
export const getJoinRequests = async (): Promise<JoinRequest[]> => {
  const { data, error } = await supabase.from('join_requests').select('*');
  if (error) throw error;
  return data.map((r: any) => ({
    ...r,
    playerId: r.player_id,
    teamId: r.team_id,
    createdAt: r.created_at
  }));
};

export const saveJoinRequest = async (request: JoinRequest): Promise<void> => {
  const { error } = await supabase.from('join_requests').insert({
    id: request.id,
    player_id: request.playerId,
    team_id: request.teamId,
    status: request.status,
    created_at: request.createdAt
  });
  if (error) throw error;
};

export const getJoinRequestsByTeamId = async (teamId: string): Promise<JoinRequest[]> => {
  // We need to join with players to get username/email if not stored in join_requests
  // But our type JoinRequest has playerUsername/playerEmail.
  // The schema I wrote for join_requests only has IDs.
  // I should update the query to join with players table.

  const { data, error } = await supabase
    .from('join_requests')
    .select(`
      *,
      player:players (
        username,
        email
      )
    `)
    .eq('team_id', teamId)
    .eq('status', 'pending');

  if (error) throw error;

  return data.map((r: any) => ({
    id: r.id,
    playerId: r.player_id,
    teamId: r.team_id,
    status: r.status,
    createdAt: r.created_at,
    playerUsername: r.player.username,
    playerEmail: r.player.email
  }));
};

export const updateJoinRequest = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
  const { error } = await supabase
    .from('join_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;
};

// Scrims
export const getScrims = async (): Promise<Scrim[]> => {
  const { data, error } = await supabase.from('scrims').select('*');
  if (error) throw error;
  return data.map((s: any) => ({
    ...s,
    hostTeamId: s.host_team_id,
    matchCount: s.match_count,
    startTime: s.start_time,
    createdAt: s.created_at
  }));
};

export const saveScrim = async (scrim: Scrim): Promise<void> => {
  const { error } = await supabase.from('scrims').insert({
    id: scrim.id,
    host_team_id: scrim.hostTeamId,
    name: scrim.name,
    match_count: scrim.matchCount,
    start_time: scrim.startTime,
    status: scrim.status,
    created_at: scrim.createdAt
  });
  if (error) throw error;
};

export const getScrimById = async (id: string): Promise<Scrim | null> => {
  const { data, error } = await supabase
    .from('scrims')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    hostTeamId: data.host_team_id,
    matchCount: data.match_count,
    startTime: data.start_time,
    createdAt: data.created_at
  };
};

// Matches
export const getMatches = async (): Promise<Match[]> => {
  const { data, error } = await supabase.from('matches').select('*');
  if (error) throw error;
  return data.map((m: any) => ({
    ...m,
    scrimId: m.scrim_id,
    matchNumber: m.match_number,
    mapName: m.map_name,
    createdAt: m.created_at
  }));
};

export const saveMatch = async (match: Match): Promise<void> => {
  const { error } = await supabase.from('matches').insert({
    id: match.id,
    scrim_id: match.scrimId,
    match_number: match.matchNumber,
    map_name: match.mapName,
    status: match.status,
    created_at: match.createdAt
  });
  if (error) throw error;
};

export const getMatchesByScrimId = async (scrimId: string): Promise<Match[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('scrim_id', scrimId)
    .order('match_number', { ascending: true });

  if (error) throw error;
  return data.map((m: any) => ({
    ...m,
    scrimId: m.scrim_id,
    matchNumber: m.match_number,
    mapName: m.map_name,
    createdAt: m.created_at
  }));
};

export const getMatchResults = async (matchId: string) => {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select(`
      *,
      team:teams (
        id,
        name
      )
    `)
    .eq('match_id', matchId)
    .order('placement', { ascending: true });

  if (error) throw error;
  return data;
};


export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<void> => {
  const dbUpdates: any = { ...updates };
  if (updates.scrimId) { dbUpdates.scrim_id = updates.scrimId; delete dbUpdates.scrimId; }
  if (updates.matchNumber) { dbUpdates.match_number = updates.matchNumber; delete dbUpdates.matchNumber; }
  if (updates.mapName) { dbUpdates.map_name = updates.mapName; delete dbUpdates.mapName; }
  if (updates.createdAt) { dbUpdates.created_at = updates.createdAt; delete dbUpdates.createdAt; }

  const { error } = await supabase
    .from('matches')
    .update(dbUpdates)
    .eq('id', matchId);

  if (error) throw error;
};

// Scrim Teams
export const getScrimTeams = async (scrimId: string): Promise<ScrimTeam[]> => {
  const { data, error } = await supabase
    .from('scrim_teams')
    .select('*')
    .eq('scrim_id', scrimId);

  if (error) throw error;
  return data.map((st: any) => ({
    ...st,
    scrimId: st.scrim_id,
    teamId: st.team_id,
    teamName: st.team_name,
    joinedAt: st.joined_at,
    slot: st.slot
  }));
};

export const saveScrimTeam = async (scrimTeam: ScrimTeam): Promise<void> => {
  const { error } = await supabase.from('scrim_teams').insert({
    id: scrimTeam.id,
    scrim_id: scrimTeam.scrimId,
    team_id: scrimTeam.teamId,
    team_name: scrimTeam.teamName,
    joined_at: scrimTeam.joinedAt,
    slot: scrimTeam.slot
  });
  if (error) throw error;
};

export const joinScrim = async (scrimId: string, teamId: string, teamName: string, slot: number): Promise<void> => {
  // Check if slot is taken
  const { data: existing } = await supabase
    .from('scrim_teams')
    .select('*')
    .eq('scrim_id', scrimId)
    .eq('slot', slot)
    .single();

  if (existing) throw new Error("Slot already taken");

  // Check if team already joined
  const { data: alreadyJoined } = await supabase
    .from('scrim_teams')
    .select('*')
    .eq('scrim_id', scrimId)
    .eq('team_id', teamId)
    .single();

  if (alreadyJoined) throw new Error("Team already joined this scrim");

  const scrimTeam: ScrimTeam = {
    id: generateId(),
    scrimId,
    teamId,
    teamName,
    joinedAt: new Date().toISOString(),
    slot
  };

  await saveScrimTeam(scrimTeam);
};

export const leaveScrim = async (scrimId: string, teamId: string): Promise<void> => {
  const { error } = await supabase
    .from('scrim_teams')
    .delete()
    .eq('scrim_id', scrimId)
    .eq('team_id', teamId);

  if (error) throw error;
};

export const getMyScrims = async (teamId: string): Promise<ScrimTeam[]> => {
  const { data, error } = await supabase
    .from('scrim_teams')
    .select('*')
    .eq('team_id', teamId);

  if (error) throw error;
  return data.map((st: any) => ({
    ...st,
    scrimId: st.scrim_id,
    teamId: st.team_id,
    teamName: st.team_name,
    joinedAt: st.joined_at,
    slot: st.slot
  }));
};

// Match Stats
export const saveMatchTeamStats = async (stats: MatchTeamStats): Promise<void> => {
  const { error } = await supabase.from('match_team_stats').upsert({
    id: stats.id,
    match_id: stats.matchId,
    team_id: stats.teamId,
    placement: stats.placement,
    placement_points: stats.placementPoints,
    team_kills: stats.teamKills,
    total_points: stats.totalPoints,
    is_booyah: stats.isBooyah
  });
  if (error) throw error;
};

export const saveMatchPlayerStats = async (stats: { id: string, matchId: string, playerId: string, teamId: string, kills: number }): Promise<void> => {
  const { error } = await supabase.from('match_player_stats').upsert({
    id: stats.id,
    match_id: stats.matchId,
    player_id: stats.playerId,
    team_id: stats.teamId,
    kills: stats.kills
  });
  if (error) throw error;
};

export const getMatchPlayerStatsByMatchId = async (matchId: string) => {
  const { data, error } = await supabase
    .from('match_player_stats')
    .select('*')
    .eq('match_id', matchId);

  if (error) throw error;
  return data.map((s: any) => ({
    ...s,
    matchId: s.match_id,
    playerId: s.player_id,
    teamId: s.team_id,
    kills: s.kills
  }));
};

export const getMatchTeamStats = async (matchId: string): Promise<MatchTeamStats[]> => {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select('*')
    .eq('match_id', matchId);

  if (error) throw error;
  return data.map((s: any) => ({
    ...s,
    matchId: s.match_id,
    teamId: s.team_id,
    placementPoints: s.placement_points,
    teamKills: s.team_kills,
    totalPoints: s.total_points,
    isBooyah: s.is_booyah
  }));
};

export const getTeamStats = async (teamId: string) => {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select(`
      *,
      match:matches (
        match_number,
        map_name,
        created_at,
        scrim:scrims (
          name
        )
      )
    `)
    .eq('team_id', teamId);

  if (error) throw error;

  return data.map((s: any) => ({
    ...s,
    matchId: s.match_id,
    teamId: s.team_id,
    placementPoints: s.placement_points,
    teamKills: s.team_kills,
    totalPoints: s.total_points,
    isBooyah: s.is_booyah,
    match: {
      matchNumber: s.match.match_number,
      mapName: s.match.map_name,
      createdAt: s.match.created_at,
      scrimName: s.match.scrim.name
    }
  }));
};

export const getPlayerDetailedStats = async (playerId: string) => {
  // 1. Get all match player stats for the player
  const { data: playerStats, error: playerError } = await supabase
    .from('match_player_stats')
    .select('*')
    .eq('player_id', playerId);

  if (playerError) throw playerError;

  const matchesPlayed = playerStats.length;
  const totalKills = playerStats.reduce((sum, stat) => sum + stat.kills, 0);

  // 2. Calculate Booyahs
  // We need to check match_team_stats for each match+team combination
  let booyahs = 0;

  if (matchesPlayed > 0) {
    const matchIds = playerStats.map(s => s.match_id);

    const { data: teamStats, error: teamError } = await supabase
      .from('match_team_stats')
      .select('match_id, team_id, is_booyah')
      .in('match_id', matchIds)
      .eq('is_booyah', true);

    if (!teamError && teamStats) {
      // Check if the player was in the team that got the booyah for that match
      booyahs = teamStats.filter(ts =>
        playerStats.some(ps => ps.match_id === ts.match_id && ps.team_id === ts.team_id)
      ).length;
    }
  }

  // Calculate K/D (Assuming Matches = Deaths for simplicity, or just Kills/Matches)
  // If we want true K/D we need death stats. For now, Kills / Matches is a common proxy in simple trackers
  // or we can just return it as K/M. Let's call it K/D for the user request but mathematically it's K/M.
  const kd = matchesPlayed > 0 ? (totalKills / matchesPlayed).toFixed(2) : "0.00";

  return {
    matchesPlayed,
    totalKills,
    kd,
    booyahs
  };
};

export const getPlayerStats = async (playerId: string) => {
  const { data, error } = await supabase
    .from('match_player_stats')
    .select(`
      *,
      match:matches (
        match_number,
        map_name,
        created_at,
        scrim:scrims (
          name
        )
      )
    `)
    .eq('player_id', playerId);

  if (error) throw error;

  return data.map((s: any) => ({
    ...s,
    matchId: s.match_id,
    playerId: s.player_id,
    teamId: s.team_id,
    match: {
      matchNumber: s.match.match_number,
      mapName: s.match.map_name,
      createdAt: s.match.created_at,
      scrimName: s.match.scrim.name
    }
  }));
};

export const getAllTeamStats = async () => {
  const { data, error } = await supabase
    .from('match_team_stats')
    .select(`
      *,
      team:teams (
        id,
        name
      )
    `);

  if (error) throw error;
  return data;
};

export const getAllPlayerStats = async () => {
  const { data, error } = await supabase
    .from('match_player_stats')
    .select(`
      *,
      player:players (
        id,
        username,
        team_id
      ),
      team:teams (
        name
      )
    `);

  if (error) throw error;
  return data;
};

// Auth Helpers
export const signUpTeam = async (email: string, password: string, name: string, joinCode: string, country?: string) => {
  // 1. Sign up with Supabase Auth and pass metadata for the trigger
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/team/login`,
      data: {
        type: 'team',
        name,
        joinCode,
        country
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("No user returned from signup");

  return authData.user;
};

export const signUpPlayer = async (email: string, password: string, username: string, joinCode?: string, role?: string, phoneNumber?: string) => {
  let teamId = null;

  // 1. Verify Join Code if provided
  if (joinCode) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('join_code', joinCode)
      .single();

    if (teamError || !team) throw new Error("Invalid join code");
    teamId = team.id;
  }

  // 2. Sign up with Supabase Auth and pass metadata for the trigger
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/player/login`,
      data: {
        type: 'player',
        username,
        teamId: teamId,
        role: role || null,
        phone_number: phoneNumber || null
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("No user returned from signup");

  return authData.user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  if (data.user && !data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    throw new Error("Please verify your email address before logging in.");
  }

  return data.user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Data Fetching Helpers (Updated to use Auth ID where applicable)

export const getCurrentTeam = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return {
    ...data,
    joinCode: data.join_code,
    logoUrl: data.logo_url,
    createdAt: data.created_at
  };
};

export const getCurrentPlayer = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return {
    ...data,
    teamId: data.team_id,
    instagramUrl: data.instagram_url,
    youtubeUrl: data.youtube_url,
    gameUid: data.game_uid,
    inGameName: data.in_game_name,
    createdAt: data.created_at
  };
};

// Deprecated: setCurrentTeam and setCurrentPlayer are no longer needed with Supabase Auth
export const setCurrentTeam = (team: Team | null) => { };
export const setCurrentPlayer = (player: Player | null) => { };

// Admins
export const getAdmin = async (id: string) => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    return null;
  }
  return data;
};

export const getScrimPlayers = async (scrimId: string) => {
  const { data, error } = await supabase
    .from('scrim_players')
    .select(`
      *,
      player:players (
        username,
        email,
        in_game_name
      )
    `)
    .eq('scrim_id', scrimId);

  if (error) throw error;

  return data.map((sp: any) => ({
    id: sp.id,
    scrimId: sp.scrim_id,
    teamId: sp.team_id,
    playerId: sp.player_id,
    playerUsername: sp.player.username,
    playerEmail: sp.player.email,
    playerInGameName: sp.player.in_game_name
  }));
};

export const saveScrimPlayer = async (scrimId: string, teamId: string, playerId: string) => {
  const { error } = await supabase.from('scrim_players').insert({
    scrim_id: scrimId,
    team_id: teamId,
    player_id: playerId
  });
  if (error) throw error;
};

export const deleteScrimPlayer = async (scrimId: string, playerId: string) => {
  const { error } = await supabase
    .from('scrim_players')
    .delete()
    .eq('scrim_id', scrimId)
    .eq('player_id', playerId);
  if (error) throw error;
};

// Utility
export const generateId = (): string => {
  // Fallback for environments where crypto.randomUUID is not available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const verifyEmailOTP = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  });

  if (error) throw error;
  return data;
};

// Player Profile Enhancements

export const leaveTeam = async (playerId: string, teamId: string) => {
  // 1. Update player status
  const { error: playerError } = await supabase
    .from('players')
    .update({
      team_id: null,
      status: 'pending',
      role: null
    })
    .eq('id', playerId);

  if (playerError) throw playerError;

  // 2. Record in history (update the latest open record or insert a new closed one if none exists)
  // Since we just started tracking, we might not have an open record.
  // Strategy: Try to update a record with team_id and null left_at. If none, insert one with joined_at=now (approx) and left_at=now.

  const { data: openRecord, error: fetchError } = await supabase
    .from('player_team_history')
    .select('id')
    .eq('player_id', playerId)
    .eq('team_id', teamId)
    .is('left_at', null)
    .single();

  if (openRecord) {
    await supabase
      .from('player_team_history')
      .update({ left_at: new Date().toISOString() })
      .eq('id', openRecord.id);
  } else {
    // No open record found (legacy membership), just record the leave event?
    // Or maybe insert a record with joined_at = created_at of player? No, that's messy.
    // Let's just insert a record indicating they left now.
    await supabase.from('player_team_history').insert({
      player_id: playerId,
      team_id: teamId,
      joined_at: new Date().toISOString(), // Fallback
      left_at: new Date().toISOString()
    });
  }
};

export const approveJoinRequest = async (requestId: string) => {
  // 1. Get request details
  const { data: request, error: reqError } = await supabase
    .from('join_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError || !request) throw new Error("Request not found");

  // 2. Update request status
  const { error: updateReqError } = await supabase
    .from('join_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);

  if (updateReqError) throw updateReqError;

  // 3. Update player status
  const { error: updatePlayerError } = await supabase
    .from('players')
    .update({
      team_id: request.team_id,
      status: 'approved',
      role: 'member' // Default role
    })
    .eq('id', request.player_id);

  if (updatePlayerError) throw updatePlayerError;

  // 4. Record in history
  await supabase.from('player_team_history').insert({
    player_id: request.player_id,
    team_id: request.team_id,
    joined_at: new Date().toISOString()
  });
};

export const likePlayer = async (targetPlayerId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Must be logged in to like");

  // Check if already liked in last 24h
  const { data: existingLike, error: fetchError } = await supabase
    .from('player_likes')
    .select('*')
    .eq('player_id', targetPlayerId)
    .eq('liker_id', user.id)
    .single();

  if (existingLike) {
    const lastLiked = new Date(existingLike.last_liked_at);
    const now = new Date();
    const diffHours = (now.getTime() - lastLiked.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      throw new Error("You can only like a player once every 24 hours");
    }

    // Update timestamp
    const { error: updateError } = await supabase
      .from('player_likes')
      .update({ last_liked_at: now.toISOString() })
      .eq('id', existingLike.id);

    if (updateError) throw updateError;
  } else {
    // Insert new like
    const { error: insertError } = await supabase
      .from('player_likes')
      .insert({
        player_id: targetPlayerId,
        liker_id: user.id
      });

    if (insertError) throw insertError;
  }
};

export const getPublicPlayerProfile = async (playerId: string) => {
  // Get player details
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (playerError) throw playerError;

  // Get current team
  let currentTeam = null;
  if (player.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, logo_url, country')
      .eq('id', player.team_id)
      .single();
    currentTeam = team;
  }

  // Get history
  const { data: history } = await supabase
    .from('player_team_history')
    .select(`
      *,
      team:teams (name, logo_url)
    `)
    .eq('player_id', playerId)
    .order('joined_at', { ascending: false });

  // Get like count
  const { count: likeCount } = await supabase
    .from('player_likes')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', playerId);

  return {
    player: {
      ...player,
      teamId: player.team_id,
      createdAt: player.created_at,
      instagramUrl: player.instagram_url,
      youtubeUrl: player.youtube_url
    },
    currentTeam,
    history: history?.map((h: any) => ({
      ...h,
      teamName: h.team?.name,
      teamLogoUrl: h.team?.logo_url
    })) || [],
    likeCount: likeCount || 0
  };
};

export const getPublicPlayerProfileByUsername = async (username: string) => {
  // Get player details by username
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .single();

  if (playerError) throw playerError;

  // Reuse the logic by calling getPublicPlayerProfile with the found ID
  // Or just duplicate/refactor. Reusing is better but might be slightly less efficient (2 calls).
  // Let's just implement it directly to be efficient.

  // Get current team
  let currentTeam = null;
  if (player.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, logo_url, country')
      .eq('id', player.team_id)
      .single();
    currentTeam = team;
  }

  // Get history from team_history table
  const { data: history } = await supabase
    .from('team_history')
    .select(`
      *,
      team:teams (name, logo_url)
    `)
    .eq('player_id', player.id)
    .order('left_at', { ascending: false });

  // Get like count
  const { count: likeCount } = await supabase
    .from('player_likes')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', player.id);

  return {
    player: {
      ...player,
      teamId: player.team_id,
      createdAt: player.created_at,
      instagramUrl: player.instagram_url,
      youtubeUrl: player.youtube_url
    },
    currentTeam,
    history: history?.map((h: any) => ({
      ...h,
      teamName: h.team?.name,
      teamLogoUrl: h.team?.logo_url
    })) || [],
    likeCount: likeCount || 0
  };
};

export const updatePlayerSocials = async (playerId: string, instagramUrl?: string, youtubeUrl?: string) => {
  const { error } = await supabase
    .from('players')
    .update({
      instagram_url: instagramUrl,
      youtube_url: youtubeUrl
    })
    .eq('id', playerId);

  if (error) throw error;
};

export const joinTeam = async (playerId: string, joinCode: string) => {
  // 1. Find team by code
  const team = await getTeamByJoinCode(joinCode);
  if (!team) throw new Error("Invalid join code");

  // 2. Check if already requested or member
  const { data: existingRequest } = await supabase
    .from('join_requests')
    .select('*')
    .eq('player_id', playerId)
    .eq('team_id', team.id)
    .eq('status', 'pending')
    .single();

  if (existingRequest) throw new Error("You have already requested to join this team");

  // 2.5 Fetch player details
  const player = await getPlayerById(playerId);
  if (!player) throw new Error("Player not found");

  // 3. Create request
  await saveJoinRequest({
    id: generateId(),
    playerId,
    playerUsername: player.username,
    playerEmail: player.email,
    teamId: team.id,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  // 4. Update player status to pending
  await supabase
    .from('players')
    .update({
      team_id: team.id,
      status: 'pending'
    })
    .eq('id', playerId);

  return team;
};

// --- Reports System ---

export const createReport = async (
  scrimId: string,
  reportedPlayerId: string,
  reason: string,
  matchId?: string
) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from('reports')
    .insert({
      scrim_id: scrimId,
      match_id: matchId,
      reporter_id: user.id,
      reported_player_id: reportedPlayerId,
      reason
    });

  if (error) throw error;
};

export const getReportsByScrimId = async (scrimId: string) => {
  const user = await getCurrentUser();
  const userId = user?.id;

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:players!reporter_id(username, in_game_name, phone_number),
      reported_player:players!reported_player_id(username, in_game_name),
      rv:report_votes(vote_type, voter_id)
    `)
    .eq('scrim_id', scrimId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((r: any) => {
    const likes = r.rv.filter((v: any) => v.vote_type === 'like').length;
    const dislikes = r.rv.filter((v: any) => v.vote_type === 'dislike').length;
    const userVote = userId ? r.rv.find((v: any) => v.voter_id === userId)?.vote_type : null;

    return {
      id: r.id,
      scrimId: r.scrim_id,
      matchId: r.match_id,
      reporterId: r.reporter_id,
      reportedPlayerId: r.reported_player_id,
      reason: r.reason,
      createdAt: r.created_at,
      reporter: {
        username: r.reporter.username,
        inGameName: r.reporter.in_game_name,
        phoneNumber: r.reporter.phone_number
      },
      reportedPlayer: {
        username: r.reported_player.username,
        inGameName: r.reported_player.in_game_name
      },
      likes,
      dislikes,
      userVote
    };
  });
};

export const voteOnReport = async (reportId: string, voteType: 'like' | 'dislike') => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  // Upsert vote
  const { error } = await supabase
    .from('report_votes')
    .upsert({
      report_id: reportId,
      voter_id: user.id,
      vote_type: voteType
    }, { onConflict: 'report_id, voter_id' });

  if (error) throw error;
};

export const getAllReportsForAdmin = async (page = 1, pageSize = 20) => {
  const { data, error, count } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:players!reporter_id(username, in_game_name, phone_number),
      reported_player:players!reported_player_id(username, in_game_name),
      rv:report_votes(vote_type),
      scrim:scrims(name)
    `, { count: 'exact' })
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    data: data.map((r: any) => ({
      id: r.id,
      scrimId: r.scrim_id,
      scrimName: r.scrim?.name,
      matchId: r.match_id,
      reporterId: r.reporter_id,
      reportedPlayerId: r.reported_player_id,
      reason: r.reason,
      createdAt: r.created_at,
      reporter: {
        username: r.reporter.username,
        inGameName: r.reporter.in_game_name,
        phoneNumber: r.reporter.phone_number
      },
      reportedPlayer: {
        username: r.reported_player.username,
        inGameName: r.reported_player.in_game_name
      },
      likes: r.rv.filter((v: any) => v.vote_type === 'like').length,
      dislikes: r.rv.filter((v: any) => v.vote_type === 'dislike').length
    })),
    count: count || 0
  };
};

// --- Recruitment Center ---

export const createRecruitmentPost = async (
  type: 'LFT' | 'LFP',
  role: string,
  description: string,
  minKd: number = 0,
  teamId?: string
) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from('recruitment_posts')
    .insert({
      type,
      author_id: user.id,
      team_id: teamId,
      role,
      description,
      min_kd: minKd
    });

  if (error) throw error;
};

export const getRecruitmentPosts = async (type?: 'LFT' | 'LFP') => {
  let query = supabase
    .from('recruitment_posts')
    .select(`
      *,
      author:players(username, in_game_name, profile_url, role),
      team:teams(name, logo_url)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((post: any) => ({
    id: post.id,
    type: post.type,
    authorId: post.author_id,
    teamId: post.team_id,
    role: post.role,
    description: post.description,
    minKd: post.min_kd,
    status: post.status,
    createdAt: post.created_at,
    author: {
      username: post.author.username,
      inGameName: post.author.in_game_name,
      profileUrl: post.author.profile_url,
      role: post.author.role
    },
    team: post.team ? {
      name: post.team.name,
      logoUrl: post.team.logo_url
    } : undefined
  }));
};

export const closeRecruitmentPost = async (postId: string) => {
  const { error } = await supabase
    .from('recruitment_posts')
    .update({ status: 'closed' })
    .eq('id', postId);

  if (error) throw error;
};

export const deleteRecruitmentPost = async (postId: string) => {
  const { error } = await supabase
    .from('recruitment_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
};

// --- Advanced Transfer System ---

export const applyToTeam = async (postId: string, message: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase.from('team_applications').insert({
    post_id: postId,
    player_id: user.id,
    message
  });
  if (error) throw error;
};

export const getApplicationsForPost = async (postId: string) => {
  const { data, error } = await supabase
    .from('team_applications')
    .select(`
      *,
      player:players(username, in_game_name, profile_url, role)
    `)
    .eq('post_id', postId);
  if (error) throw error;

  return data.map((app: any) => ({
    id: app.id,
    postId: app.post_id,
    playerId: app.player_id,
    status: app.status,
    message: app.message,
    createdAt: app.created_at,
    player: {
      username: app.player.username,
      inGameName: app.player.in_game_name,
      profileUrl: app.player.profile_url,
      role: app.player.role
    }
  }));
};

export const getApplicationsForTeam = async (teamId: string) => {
  // 1. Get all posts by this team (via author or team_id? LFP posts have team_id)
  // LFP posts: team_id is set.
  const { data: posts } = await supabase.from('recruitment_posts').select('id, role').eq('team_id', teamId);
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map(p => p.id);

  // 2. Get applications for these posts
  const { data, error } = await supabase
    .from('team_applications')
    .select(`
      *,
      player:players(id, username, in_game_name, profile_url, role)
    `)
    .in('post_id', postIds)
    .eq('status', 'pending'); // Only show pending? Or all. Let's show pending for dashboard notification.

  if (error) throw error;

  return data.map((app: any) => ({
    id: app.id,
    postId: app.post_id,
    playerId: app.player_id,
    status: app.status,
    message: app.message,
    createdAt: app.created_at,
    player: {
      id: app.player.id,
      username: app.player.username,
      inGameName: app.player.in_game_name,
      profileUrl: app.player.profile_url,
      role: app.player.role
    },
    postRole: posts.find(p => p.id === app.post_id)?.role // Helper to show what they applied for
  }));
};

export const getMyApplications = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from('team_applications')
    .select(`
      *,
      post:recruitment_posts(
        role,
        team:teams(name, logo_url)
      )
    `)
    .eq('player_id', user.id);
  if (error) throw error;

  return data.map((app: any) => ({
    id: app.id,
    postId: app.post_id,
    playerId: app.player_id,
    status: app.status,
    message: app.message,
    createdAt: app.created_at,
    post: {
      role: app.post.role,
      team: {
        name: app.post.team.name,
        logoUrl: app.post.team.logo_url
      }
    }
  }));
};

export const updateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected') => {
  const { error } = await supabase
    .from('team_applications')
    .update({ status })
    .eq('id', appId);
  if (error) throw error;

  // If accepted, add player to team (Simplified flow: Direct Join)
  // In a real strict system, this might trigger a transfer offer instead.
  // For now, we assume if you apply to a team, you are ready to join.
  if (status === 'accepted') {
    // 1. Get Application details
    const { data: app } = await supabase.from('team_applications').select('player_id, post_id').eq('id', appId).single();
    if (app) {
      const { data: post } = await supabase.from('recruitment_posts').select('team_id').eq('id', app.post_id).single();
      if (post && post.team_id) {
        // 2. Add player to team (Update player table)
        await supabase.from('players').update({ team_id: post.team_id }).eq('id', app.player_id);
      }
    }
  }
};

export const sendTransferOffer = async (teamId: string, playerId: string, message: string) => {
  const { error } = await supabase.from('transfer_offers').insert({
    team_id: teamId,
    player_id: playerId,
    message
  });
  if (error) throw error;
};

export const getMyOffers = async () => { // For Players
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from('transfer_offers')
    .select(`
      *,
      team:teams(name, logo_url)
    `)
    .eq('player_id', user.id)
    .neq('status', 'rejected'); // Don't show rejected offers? Or show history.
  if (error) throw error;

  return data.map((o: any) => ({
    id: o.id,
    teamId: o.team_id,
    playerId: o.player_id,
    status: o.status,
    message: o.message,
    createdAt: o.created_at,
    team: {
      name: o.team.name,
      logoUrl: o.team.logo_url
    }
  }));
};

export const getTeamOffers = async (teamId: string) => { // For Teams
  const { data, error } = await supabase
    .from('transfer_offers')
    .select(`
      *,
      player:players(username, in_game_name)
    `)
    .eq('team_id', teamId);
  if (error) throw error;

  return data.map((o: any) => ({
    id: o.id,
    teamId: o.team_id,
    playerId: o.player_id,
    status: o.status,
    message: o.message,
    createdAt: o.created_at,
    player: {
      username: o.player.username,
      inGameName: o.player.in_game_name
    }
  }));
};

export const respondToOffer = async (offerId: string, response: 'accepted' | 'rejected') => {
  if (response === 'rejected') {
    const { error } = await supabase.from('transfer_offers').update({ status: 'rejected' }).eq('id', offerId);
    if (error) throw error;
    return;
  }

  // If Accepted:
  // Check if player is already in a team
  const user = await getCurrentUser();
  const { data: player } = await supabase.from('players').select('team_id').eq('id', user.id).single();

  if (player?.team_id) {
    // Player has a team -> Set status to 'pending_exit_approval'
    await supabase.from('transfer_offers').update({ status: 'pending_exit_approval' }).eq('id', offerId);
  } else {
    // Player is free -> Transfer immediately
    const { data: offer } = await supabase.from('transfer_offers').select('team_id').eq('id', offerId).single();
    if (offer) {
      await supabase.from('players').update({ team_id: offer.team_id }).eq('id', user.id);
      await supabase.from('transfer_offers').update({ status: 'accepted' }).eq('id', offerId);
    }
  }
};

export const approveTransferExit = async (offerId: string) => {
  // 1. Get offer details
  const { data: offer } = await supabase.from('transfer_offers').select('*').eq('id', offerId).single();
  if (!offer) throw new Error("Offer not found");

  // 2. Get player's current team info for history
  const { data: player } = await supabase.from('players').select('team_id, created_at').eq('id', offer.player_id).single();

  if (player?.team_id) {
    // 3. Save old team to history
    // Use player's created_at as approximate join date if we don't have exact data
    await supabase.from('team_history').insert({
      player_id: offer.player_id,
      team_id: player.team_id,
      joined_at: player.created_at, // Approximate - could be enhanced with actual join tracking
      left_at: new Date().toISOString()
    });
  }

  // 4. Transfer Player to new team
  await supabase.from('players').update({ team_id: offer.team_id }).eq('id', offer.player_id);

  // 5. Mark offer as accepted
  await supabase.from('transfer_offers').update({ status: 'accepted' }).eq('id', offerId);
};

export const getTransferRequestsForCaptain = async (captainTeamId: string) => {
  // Find offers where status is 'pending_exit_approval' AND player is currently in captain's team
  // This is a bit complex relational query.
  // Step 1: Find players in my team
  const { data: players } = await supabase.from('players').select('id').eq('team_id', captainTeamId);
  const playerIds = players?.map((p: any) => p.id) || [];

  if (playerIds.length === 0) return [];

  // Step 2: Find offers for these players with status 'pending_exit_approval'
  const { data, error } = await supabase
    .from('transfer_offers')
    .select(`
      *,
      player:players(username, in_game_name),
      target_team:teams!transfer_offers_team_id_fkey(name)
    `) // Note: joined team is the TARGET team (the one offering)
    .in('player_id', playerIds)
    .eq('status', 'pending_exit_approval');

  if (error) throw error;

  return data.map((o: any) => ({
    id: o.id,
    targetTeamName: o.target_team.name,
    playerName: o.player.in_game_name || o.player.username,
    createdAt: o.created_at
  }));
};

export const getAllTransferActivitiesForAdmin = async (limit = 50) => {
  const { data: apps, error: appError } = await supabase
    .from('team_applications')
    .select(`
      *,
      player:players(in_game_name, username),
      post:recruitment_posts(team:teams(name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (appError) throw appError;

  const { data: offers, error: offerError } = await supabase
    .from('transfer_offers')
    .select(`
      *,
      player:players(in_game_name, username),
      team:teams(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (offerError) throw offerError;

  // Combine and sort
  const combined = [
    ...apps.map((a: any) => ({
      type: 'application',
      id: a.id,
      date: new Date(a.created_at),
      actor: a.player.in_game_name || a.player.username, // Player applying
      target: a.post?.team?.name || 'Unknown Team',
      status: a.status,
      details: a.message
    })),
    ...offers.map((o: any) => ({
      type: 'offer',
      id: o.id,
      date: new Date(o.created_at),
      actor: o.team.name, // Team offering
      target: o.player.in_game_name || o.player.username,
      status: o.status, // Can be pending_exit_approval
      details: o.message
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);

  return combined;
};

export const getPlayerTeamHistory = async (playerId: string) => {
  const { data, error } = await supabase
    .from('team_history')
    .select(`
      *,
      team:teams(name, logo_url)
    `)
    .eq('player_id', playerId)
    .order('left_at', { ascending: false });

  if (error) throw error;

  return data.map((h: any) => ({
    id: h.id,
    playerId: h.player_id,
    teamId: h.team_id,
    joinedAt: h.joined_at,
    leftAt: h.left_at,
    createdAt: h.created_at,
    team: h.team ? {
      name: h.team.name,
      logoUrl: h.team.logo_url
    } : undefined
  }));
};
