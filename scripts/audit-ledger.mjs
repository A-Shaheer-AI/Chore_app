import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khsqirrkrquliyzbweej.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: users } = await supabase.from('users').select('*');
  const { data: receipts } = await supabase.from('receipts').select('*').order('created_at', { ascending: true });

  console.log('=== AUDITING USERS & ALL RECEIPTS ===');
  for (const u of users) {
    const userReceipts = receipts.filter(r => r.user_id === u.id);
    let calculated = 0;
    const breakdown = { completion: 0, photo: 0, cheer: 0, penalty: 0, skip: 0, loan: 0, other: 0 };
    for (const r of userReceipts) {
      let delta = 0;
      if (r.details?.points_awarded !== undefined) {
        delta = Number(r.details.points_awarded);
      } else if (r.type === 'completion') {
        delta = 10;
      } else if (r.type === 'photo') {
        delta = 1;
      } else if (r.type === 'cheer') {
        delta = 1;
      } else if (r.type === 'penalty') {
        delta = -4;
      } else if (r.type === 'skip') {
        if (r.details?.message?.includes('-100')) delta = -100;
      }
      calculated += delta;
      if (breakdown[r.type] !== undefined) breakdown[r.type] += delta;
      else breakdown.other += delta;
    }
    console.log(`User: ${u.name.padEnd(16)} | DB points: ${String(u.points).padEnd(5)} | Ledger sum: ${String(calculated).padEnd(5)} | Diff: ${u.points - calculated}`);
    console.log(`  Receipt count: ${userReceipts.length} | Breakdown:`, JSON.stringify(breakdown));
  }
}

main().catch(console.error);
