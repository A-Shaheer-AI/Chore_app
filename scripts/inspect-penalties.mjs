import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khsqirrkrquliyzbweej.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: users } = await supabase.from('users').select('*');
  const { data: penalties } = await supabase.from('receipts').select('*').eq('type', 'penalty').order('created_at', { ascending: true });

  console.log(`Total penalty receipts: ${penalties.length}`);
  for (const p of penalties) {
    const u = users.find(x => x.id === p.user_id)?.name || p.user_id;
    const timeStr = new Date(p.created_at).toLocaleString('en-AU', { timeZone: 'Australia/Perth' });
    console.log(timeStr, u.padEnd(16), JSON.stringify(p.details));
  }
}

main().catch(console.error);
