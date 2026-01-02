import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a temporary client that DOES NOT persist session
// This ensures the admin stays logged in while creating other users
const getTempClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase credentials missing");
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};

export const adminCreateTeam = async (email: string, password: string, name: string, joinCode: string, country?: string) => {
    const tempClient = getTempClient();

    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                type: 'team',
                name,
                joinCode,
                country,
                createdByAdmin: true
            }
        }
    });

    if (authError) throw authError;
    return authData.user;
};

export const adminCreatePlayer = async (email: string, password: string, username: string, joinCode?: string, role?: string, phoneNumber?: string) => {
    const tempClient = getTempClient();

    let teamId = null;

    // Verify Join Code if provided
    if (joinCode) {
        const { data: team, error: teamError } = await tempClient
            .from('teams')
            .select('id')
            .eq('join_code', joinCode)
            .single();

        if (teamError || !team) throw new Error("Invalid join code");
        teamId = team.id;
    }

    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                type: 'player',
                username,
                teamId: teamId,
                role: role || null,
                phone_number: phoneNumber || null,
                createdByAdmin: true
            }
        }
    });

    if (authError) throw authError;
    return authData.user;
};
