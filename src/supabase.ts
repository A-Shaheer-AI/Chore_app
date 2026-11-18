import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof globalThis !== 'undefined' && (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env) || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://khsqirrkrquliyzbweej.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
