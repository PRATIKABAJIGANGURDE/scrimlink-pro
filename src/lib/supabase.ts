
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lhrxwcghfvlrfpsezhej.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxocnh3Y2doZnZscmZwc2V6aGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1MDAsImV4cCI6MjA4MDM0MzUwMH0.IL_MoJeQsnlriSs_i-ctqeLoNACXX2ROzZG8f4tywlI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
