import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khsqirrkrquliyzbweej.supabase.co';
const supabaseAnonKey = 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing insert...");
  const { data, error } = await supabase.from('users').insert({
    name: 'TestUser',
    away_start: null,
    away_end: null,
    points: 0
  }).select();
  
  if (error) {
    console.error("Insert error:", error);
  } else {
    console.log("Insert success:", data);
  }
}

test();
