import { runOverdueCheck } from './check-overdue.mjs';

const INTERVAL_MINUTES = 30; // Check every 30 minutes
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

console.log(`Chore Roulette Background Daemon started! Checking every ${INTERVAL_MINUTES} minutes...`);

// Initial run
runOverdueCheck().catch(console.error);

// Periodic loop
setInterval(() => {
  runOverdueCheck().catch(console.error);
}, INTERVAL_MS);
