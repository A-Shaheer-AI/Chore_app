import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khsqirrkrquliyzbweej.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("=== STEP 1: RECONCILING POINTS TO MATCH VERIFIED RECEIPTS ===");
  const { data: users } = await supabase.from('users').select('*');
  const { data: receipts } = await supabase.from('receipts').select('*').order('created_at', { ascending: true });

  for (const u of users) {
    const userReceipts = receipts.filter(r => r.user_id === u.id);
    let calculated = 0;
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
    }

    console.log(`User ${u.name.padEnd(16)}: current points = ${String(u.points).padEnd(4)}, verified ledger sum = ${calculated}`);
    if (u.points !== calculated) {
      const { error } = await supabase.from('users').update({ points: calculated }).eq('id', u.id);
      if (error) console.error(`Error updating ${u.name}:`, error);
      else console.log(`  -> Successfully updated ${u.name} points to ${calculated}!`);
    } else {
      console.log(`  -> Points already matching.`);
    }
  }

  console.log("\n=== STEP 2: FIXING INSIDE BINS ASSIGNMENT ===");
  const { data: binsChore } = await supabase.from('chores').select('*').eq('id', 'd5ec2dc1-76a2-4352-b704-c8e20fde62be').single();
  console.log("Current Bins chore:", binsChore.name, "assigned to:", binsChore.current_user_id);
  
  const arslanId = '1dc493e7-5085-42b1-801e-f1415fd8c1f6';
  const { error: binsError } = await supabase.from('chores').update({
    current_user_id: arslanId,
  }).eq('id', 'd5ec2dc1-76a2-4352-b704-c8e20fde62be');

  if (binsError) console.error("Error updating Bins chore:", binsError);
  else console.log("  -> Successfully reassigned Bins chore to Arslan!");

  console.log("\n=== STEP 3: VERIFICATION ===");
  const { data: updatedUsers } = await supabase.from('users').select('id, name, points');
  console.table(updatedUsers);

  const { data: updatedBins } = await supabase.from('chores').select('id, name, current_user_id').eq('id', 'd5ec2dc1-76a2-4352-b704-c8e20fde62be').single();
  const assignedUser = updatedUsers.find(u => u.id === updatedBins.current_user_id)?.name;
  console.log("Updated Bins chore assigned to:", assignedUser);
}

main().catch(console.error);
