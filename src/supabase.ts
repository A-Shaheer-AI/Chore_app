import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://khsqirrkrquliyzbweej.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
