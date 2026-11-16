import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khsqirrkrquliyzbweej.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_29rwbNgCqY4QzAj7inLeyQ_x-kRMwj5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const cleanE164Phone = (raw) => {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/[^\d]/g, '');
  }
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.startsWith('04') && digits.length === 10) {
    return '+61' + digits.slice(1);
  }
  if (digits.startsWith('4') && digits.length === 9) {
    return '+61' + digits;
  }
  return '+' + digits;
};

export const isMoppingWaitingForVacuum = (chore, choreList, receipts) => {
  const name = chore.name.toLowerCase();
  if (!name.includes('mop')) return false;

  const vacuumChore = choreList.find(c => {
    const n = c.name.toLowerCase();
    return n.includes('vacuum') || n.includes('vaccum');
  });

  if (!vacuumChore) return false;

  const latestVacuum = receipts.find(
    r => r.type === 'completion' && r.chore_id === vacuumChore.id
  );

  if (!latestVacuum) return true;

  const latestMop = receipts.find(
    r => r.type === 'completion' && r.chore_id === chore.id
  );

  if (latestMop && latestMop.created_at >= latestVacuum.created_at) {
    return true;
  }

  return false;
};

export async function sendTelnyxSMS(supabaseClient, { to, message, settings }) {
  const formattedTo = cleanE164Phone(to);
  if (!formattedTo || formattedTo.length < 8) {
    return { success: false, error: 'Invalid destination phone number.' };
  }

  try {
    const { data: edgeData, error: edgeError } = await supabaseClient.functions.invoke('send-sms', {
      body: {
        to: formattedTo,
        text: message,
        from: settings.fromNumber,
        apiKey: settings.apiKey,
      },
    });

    if (!edgeError && edgeData && edgeData.success) {
      return { success: true, messageId: edgeData.messageId };
    }
    if (edgeError) {
      console.warn('  ⚠️ Edge Function error:', edgeError);
    }
  } catch (err) {
    console.warn('  ⚠️ Edge Function exception:', err);
  }

  if (settings.apiKey && settings.apiKey.length > 5) {
    try {
      const resp = await fetch('https://api.telnyx.com/v2/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          from: settings.fromNumber,
          to: formattedTo,
          text: message,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.data?.id) {
        return { success: true, messageId: data.data.id };
      }
      return { success: false, error: data?.errors?.[0]?.detail || 'Telnyx direct API error' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  return { success: false, error: 'No SMS dispatch method succeeded.' };
}

export async function runOverdueCheck() {
  const startTime = new Date();
  console.log(`\n======================================================`);
  console.log(`[${startTime.toLocaleString()}] Running Chore Roulette Overdue Check...`);
  console.log(`======================================================`);

  const [
    { data: users, error: usersErr },
    { data: chores, error: choresErr },
    { data: receipts, error: receiptsErr },
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('chores').select('*'),
    supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(200),
  ]);

  if (usersErr || choresErr || receiptsErr) {
    console.error("Database fetch error:", { usersErr, choresErr, receiptsErr });
    return;
  }

  const telnyxReceipt = (receipts || []).find(
    r => r.type === 'settings' && r.details?.setting_key === 'telnyx_config'
  );
  const telnyxDetails = telnyxReceipt?.details || {};
  const telnyxSettings = {
    enabled: Boolean(telnyxDetails.enabled),
    fromNumber: String(telnyxDetails.fromNumber || '+61485939817'),
    apiKey: String(telnyxDetails.apiKey || ''),
  };
  const verifiedPhones = telnyxDetails.contacts || {};

  console.log(`Found ${chores.length} chores, ${users.length} users, Telnyx enabled: ${telnyxSettings.enabled}`);

  const now = Date.now();
  let smsCount = 0;
  let penaltyCount = 0;

  for (const chore of chores) {
    const latestLoan = receipts.find(r => r.chore_id === chore.id && r.type === 'loan');
    const latestCompletion = receipts.find(r => r.chore_id === chore.id && r.type === 'completion');
    const isLoan = Boolean(
      latestLoan &&
      (!latestCompletion || latestLoan.created_at > latestCompletion.created_at) &&
      latestLoan.details?.recipient_id === chore.current_user_id
    );

    if (isMoppingWaitingForVacuum(chore, chores, receipts)) {
      continue;
    }

    const cycleStart = latestCompletion ? latestCompletion.created_at : 0;
    const hoursOverdue = (now - chore.due_date) / (1000 * 60 * 60);

    // 1. 24h SMS Reminder
    if (hoursOverdue >= 24) {
      if (telnyxSettings.fromNumber) {
        const alreadySentSms = receipts.some(
          r => r.type === 'sms' &&
               r.chore_id === chore.id &&
               r.created_at > cycleStart
        );

        if (!alreadySentSms) {
          const overdueUser = users.find(u => u.id === chore.current_user_id);
          const overdueUserName = overdueUser ? overdueUser.name : 'Roommate';
          const userPhone = verifiedPhones[chore.current_user_id] || overdueUser?.phone;

          if (userPhone && typeof userPhone === 'string') {
            const smsMessage = `Chore Roulette: Hey ${overdueUserName}! Friendly reminder that "${chore.name}" is now over 24 hours overdue. Please mark it done in the app before it reaches 48h to avoid a -4 pt penalty & treat fine! (Automated alert - do not reply)`;
            console.log(`  📲 Dispatching 24h SMS to ${overdueUserName} (${userPhone}) for "${chore.name}" (${hoursOverdue.toFixed(1)}h late)...`);

            const res = await sendTelnyxSMS(supabase, {
              to: userPhone,
              message: smsMessage,
              settings: telnyxSettings,
            });

            if (res.success) {
              smsCount++;
              await supabase.from("receipts").insert({
                user_id: chore.current_user_id,
                chore_id: chore.id,
                type: "sms",
                details: {
                  chore_name: chore.name,
                  user_name: overdueUserName,
                  recipient_phone: userPhone,
                  due_date: chore.due_date,
                  message: smsMessage,
                  telnyx_message_id: res.messageId,
                  sent_at: now,
                },
                created_at: now,
              });
              console.log(`  ✅ 24h SMS dispatched successfully! (Msg ID: ${res.messageId})`);
            } else {
              console.warn(`  ❌ Telnyx SMS dispatch failed:`, res.error);
            }
          }
        }
      }
    }

    // 2. 48h Penalty & Treat Alert
    if (hoursOverdue >= 48) {
      const alreadyPosted = receipts.some(
        r => r.type === 'penalty' &&
             r.chore_id === chore.id &&
             r.created_at > cycleStart &&
             r.details?.treat_penalty !== undefined
      );

      if (!alreadyPosted) {
        const overdueUser = users.find(u => u.id === chore.current_user_id);
        const overdueUserName = overdueUser ? overdueUser.name : 'Roommate';

        console.log(`  🚨 48h Penalty triggered for ${overdueUserName} on "${chore.name}" (${hoursOverdue.toFixed(1)}h late)!`);

        if (overdueUser) {
          const newPoints = (overdueUser.points || 0) - 4;
          await supabase.from("users").update({ points: newPoints }).eq("id", chore.current_user_id);
        }

        if (!isLoan) {
          await supabase.from("announcements").insert({
            author_id: chore.current_user_id,
            title: `🍩 Treat Alert: ${overdueUserName} owes everyone a treat!`,
            message: `${overdueUserName} is over 48 hours late on "${chore.name}". As per house rules, they now owe everyone in the house a food treat!`,
            created_at: now,
          });

          await supabase.from("receipts").insert({
            user_id: chore.current_user_id,
            chore_id: chore.id,
            type: "penalty",
            details: {
              chore_name: chore.name,
              user_name: overdueUserName,
              due_date: chore.due_date,
              treat_penalty: true,
              points_awarded: -4,
              message: `${overdueUserName} is over 48 hours late on "${chore.name}" (-4 pts) and owes everyone a treat!`,
            },
            created_at: now,
          });
          penaltyCount++;
        } else {
          await supabase.from("receipts").insert({
            user_id: chore.current_user_id,
            chore_id: chore.id,
            type: "penalty",
            details: {
              chore_name: chore.name,
              user_name: overdueUserName,
              due_date: chore.due_date,
              treat_penalty: false,
              is_loan: true,
              points_awarded: -4,
              message: `${overdueUserName} is over 48 hours past the deadline on swapped chore "${chore.name}" (-4 pts).`,
            },
            created_at: now,
          });
          penaltyCount++;
        }
      }

      // 3. Daily progressive penalty (Day 3+): -2 pts per extra day
      const isProgressivePenaltyEligible = chore.due_date > 1791177599000;
      const daysOverdue = Math.floor(hoursOverdue / 24);

      if (isProgressivePenaltyEligible && daysOverdue >= 3) {
        const overdueUser = users.find(u => u.id === chore.current_user_id);
        const overdueUserName = overdueUser ? overdueUser.name : 'Roommate';

        for (let d = 3; d <= daysOverdue; d++) {
          const alreadyDeductedDay = receipts.some(
            r => r.type === 'penalty' &&
                 r.chore_id === chore.id &&
                 r.created_at > cycleStart &&
                 r.details?.overdue_day === d
          );

          if (!alreadyDeductedDay) {
            console.log(`  📉 Day ${d} Progressive Penalty triggered for ${overdueUserName} on "${chore.name}" (-2 pts)`);
            const currentUserObj = users.find(u => u.id === chore.current_user_id);
            if (currentUserObj) {
              const newPts = (currentUserObj.points || 0) - 2;
              await supabase.from("users").update({ points: newPts }).eq("id", chore.current_user_id);
            }

            const totalPenaltySoFar = 4 + 2 * (d - 2);
            await supabase.from("receipts").insert({
              user_id: chore.current_user_id,
              chore_id: chore.id,
              type: "penalty",
              details: {
                chore_name: chore.name,
                user_name: overdueUserName,
                due_date: chore.due_date,
                overdue_day: d,
                points_awarded: -2,
                is_loan: isLoan,
                treat_penalty: false,
                message: `${overdueUserName} is ${d} days overdue on "${chore.name}" (-2 extra pts, total -${totalPenaltySoFar} pts)`,
              },
              created_at: now,
            });
            penaltyCount++;
          }
        }
      }
    }
  }

  console.log(`[${new Date().toLocaleString()}] Overdue check complete. Sent ${smsCount} SMS reminders, applied ${penaltyCount} penalties.`);
}

// If executed directly from command line (node scripts/check-overdue.mjs)
if (process.argv[1] && process.argv[1].endsWith('check-overdue.mjs')) {
  runOverdueCheck().catch(err => {
    console.error("Fatal error running overdue check:", err);
    process.exit(1);
  });
}
