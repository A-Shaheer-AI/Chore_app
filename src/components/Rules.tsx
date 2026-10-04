import { Info, AlertTriangle, Plane, Crown, Trophy, Bell, ArrowLeftRight, Calendar, ShieldCheck } from 'lucide-react';

export const Rules = () => {
  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          &#127922; House Rules
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to our household management system! Chore Roulette keeps our shared
          spaces clean while making it fair, transparent, and a little competitive.
        </p>
        <div className="space-y-6">

          {/* Announcement & Schedule Update Log */}
          <section className="bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white p-5 rounded-2xl border-2 border-indigo-200 shadow-sm">
            <h2 className="text-xl font-extrabold text-indigo-950 mb-3 flex items-center gap-2">
              <Bell className="text-indigo-600" /> 📢 Policy Updates &amp; Announcement Log
            </h2>
            <p className="text-xs text-indigo-900 mb-4 font-medium">
              Official record of house policy changes, chore frequency adjustments, and announcement dates:
            </p>

            <div className="space-y-3.5">
              {/* Oct 5, 2026 Announcement */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>⏳</span> Progressive Daily Overdue Penalty Policy
                  </span>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Announced: Oct 5, 2026
                  </span>
                </div>
                <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Progressive Overdue Deductions:</strong> Starting from the next cycle onwards (for all upcoming chores due after Oct 4), reaching 48 hours overdue triggers the initial <strong>-4 point penalty</strong> and Treat Alert. For <strong>every additional day</strong> (each 24 hours) the chore remains overdue, an <strong>extra -2 points</strong> are deducted (4 + 2 pts/day: 3 days late = -6 pts, 4 days late = -8 pts, etc.).
                  </li>
                  <li>
                    <strong>Exemption for Current Round:</strong> Pre-existing overdue chores from this current round are grandfathered under the previous flat rate. The progressive deductions take effect starting from the next rotation cycle onwards or for the next person who lets a chore fall overdue.
                  </li>
                </ul>
              </div>

              {/* Oct 4, 2026 Announcement */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>🧹</span> Mopping Start Trigger &amp; Penalty Adjustments
                  </span>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Announced: Oct 4, 2026
                  </span>
                </div>
                <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Mopping Follows Vacuuming:</strong> Mopping starts from the day when vacuuming the whole house is marked done for every cycle going forward (scheduled 1 day after vacuuming). Mopping is never penalized while waiting for vacuuming to be completed.
                  </li>
                  <li>
                    <strong>Zubair Mopping Penalty Cleared:</strong> The premature overdue penalty on Zubair was cleared (+4 points restored) and mopping given a fair window starting from vacuuming completion.
                  </li>
                  <li>
                    <strong>Ahmed Inside Bins Cleared &amp; Completed:</strong> Ahmed's penalty was cleared (+4 points restored), marked as done as of yesterday with +10 points awarded, advancing the turn to Arslan.
                  </li>
                </ul>
              </div>

              {/* Sept 30, 2026 Announcement */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>⚖️</span> Turn Swap Rules &amp; First Penalty Leniency
                  </span>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Announced: Sept 30, 2026
                  </span>
                </div>
                <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Swap / Pass Fee:</strong> Increased to <strong>4 points</strong> (previously 2 points).
                  </li>
                  <li>
                    <strong>Rotation Cycle Restriction:</strong> Each person can only perform a swap <strong>once per rotation cycle</strong> for each chore.
                  </li>
                  <li>
                    <strong>First Penalty Leniency:</strong> Furqan and Awais were granted a 10-point penalty reduction (reduced to <strong>-20 points</strong>, +10 points refunded) because it was their first penalty. <strong>All ongoing and future penalties remain strictly 30 points.</strong>
                  </li>
                </ul>
              </div>

              {/* Sept 29, 2026 Announcement */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>🗓️</span> Frequency Adjustments &amp; House Inspection Policy
                  </span>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Announced: Sept 29, 2026
                  </span>
                </div>
                <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1.5 leading-relaxed">
                  <li>
                    <strong>Vacuuming the Whole House:</strong> Frequency changed from 15 days to <strong>every 10 days</strong>.
                  </li>
                  <li>
                    <strong>Mopping the Whole House:</strong> Frequency changed from 30 days to <strong>every 20 days</strong>. Scheduled <strong>1 day after vacuuming</strong> so two vacuumings happen per mopping cycle with one vacuuming in between.
                  </li>
                  <li>
                    <strong>Fridge &amp; Drawers Cleaning:</strong> Changed frequency to <strong>every 20 days</strong> (was 15 days).
                  </li>
                  <li>
                    <strong>House Inspection Alignment:</strong> Chores leading up to inspection day are delayed and aligned to 1 or 2 days prior to inspection day.
                  </li>
                  <li>
                    <strong>Automatic Announcements:</strong> Whenever an inspection date is set or cleared, an announcement is automatically broadcast to the house.
                  </li>
                  <li>
                    <strong>Coordinator Authorization:</strong> <strong>Only Minhaz and Ahmed</strong> are authorized to set, modify, or clear house inspection dates.
                  </li>
                </ul>
              </div>

              {/* Sept 23, 2026 Announcement */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>🗑️</span> Bin &amp; Trash Neglect Penalty Policy
                  </span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                    Announced: Sept 23, 2026
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Roommates who repeatedly fail to take out household or verge bins—forcing another roommate to perform their chore multiple times consecutively—are issued a <strong>-30 point penalty</strong>.
                </p>
              </div>

              {/* Sept 15, 2026 Announcement */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                    <span>🔄</span> 2-Person Return Turn Restoration &amp; 60h Swaps
                  </span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                    Announced: Sept 15, 2026
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Introduced the <strong>Two-Person Return Turn Restoration Rule</strong> (returns with &gt;1 day remaining restore the chore to the returned roommate) and <strong>Turn Swapping</strong> (-2 pts cost, 60h window with +13/+10/+7 pt reward tiers, -4 pts + treat penalty if exceeded).
                </p>
              </div>
            </div>
          </section>

          {/* House Inspection Alignment Section */}
          <section className="bg-amber-50/70 border border-amber-300 p-5 rounded-2xl shadow-sm">
            <h2 className="text-xl font-extrabold text-amber-950 border-b border-amber-200 pb-2 mb-3 flex items-center gap-2">
              <Calendar className="text-amber-700" /> 🔍 House Inspection Alignment Rule
            </h2>
            <p className="text-sm text-amber-900 mb-3 leading-relaxed">
              When a property inspection is scheduled, chore due dates are delayed and aligned so the entire house is freshly cleaned right before the inspection day without doing chores too far in advance.
            </p>

            <div className="space-y-3 text-xs text-amber-950">
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <h3 className="font-bold text-sm text-amber-900 mb-1 flex items-center gap-1.5">
                  <span>📅</span> Two-Day Staged Cleaning Timeline
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 mt-2">
                  <li>
                    <strong>2 Days Before Inspection (Day -2) — Deep Cleaning &amp; Appliances:</strong>
                    <span className="text-gray-700 block mt-0.5">
                      Vacuum the whole house, Fridge &amp; drawers organising/cleaning, Oven &amp; microwave, Master bedroom bathroom, Bathroom &amp; countertop.
                    </span>
                  </li>
                  <li>
                    <strong>1 Day Before Inspection (Day -1) — Surfaces, Mopping &amp; Waste:</strong>
                    <span className="text-gray-700 block mt-0.5">
                      Mop the whole house (scheduled 1 day after vacuuming!), Kitchen countertops &amp; stove, Dishes &amp; sink, Empty inside bins, Common toilet, Verge bins.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <h3 className="font-bold text-sm text-amber-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" /> Coordinator Authorization
                </h3>
                <p className="text-gray-700 leading-relaxed mt-1">
                  <strong>Only Minhaz and Ahmed</strong> are authorized to schedule, adjust, or clear house inspection dates. All other roommates have read-only access to inspection deadlines.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <h3 className="font-bold text-sm text-amber-900 mb-1 flex items-center gap-1.5">
                  <Bell size={16} className="text-amber-600" /> Automatic House Announcements
                </h3>
                <p className="text-gray-600 leading-relaxed mt-1">
                  Whenever an inspection date is set or cleared by Minhaz or Ahmed, the app automatically publishes an announcement to the <strong>News (Announcements)</strong> tab and creates an inspection log in <strong>Receipts</strong>, notifying all roommates instantly.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-blue-500" /> Chore Rotation &amp; Dashboard
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>All Chores Visible:</strong> Every chore is displayed on the Dashboard along with its due date, current turn, and next person up.</li>
              <li><strong>Current Turn:</strong> Only the person whose turn it is can upload completion photos and mark the chore as done.</li>
              <li><strong>Full Rotation:</strong> Click on <strong>Next Up</strong> to view the entire randomized rotation order for any chore.</li>
              <li><strong>Custom Assignments:</strong> Some chores are done only by specific roommates, rotating exclusively between them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Point System &amp; Scoreboard
            </h2>
            <p className="text-gray-600 mb-3">Points are awarded automatically on completion:</p>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-green-600">+10 pts</span>
                <span className="text-sm text-green-800"><strong>Perfect:</strong> Done on time or within 24 hrs.</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-orange-600">+5 pts</span>
                <span className="text-sm text-orange-800"><strong>Late:</strong> Done 24–48 hrs late.</span>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-red-600">-4 pts</span>
                <span className="text-sm text-red-800"><strong>Penalty:</strong> Over 48 hrs late — you owe the house food!</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-purple-600">+1 pt</span>
                <span className="text-sm text-purple-800"><strong>Photo Bonus:</strong> Upload a photo when marking a chore done.</span>
              </div>
              <div className="bg-pink-50 border border-pink-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-pink-600">+1 pt</span>
                <span className="text-sm text-pink-800"><strong>Cheer Bonus:</strong> Another flat-mate can cheer your receipt once to give you +1 pt.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Plane className="text-indigo-500" /> Skip-Turn Redemption
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Spend <strong>100 points</strong> to skip your next chore assignment — one-time use, one chore only.</li>
              <li>When the wheel reaches your turn it is automatically skipped and passes to the next person.</li>
              <li>The skip is logged in the Receipts feed for full transparency.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-purple-500" /> Photo Bonus
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Optionally upload a photo when marking a chore done to earn <strong>+1 bonus point</strong>.</li>
              <li>Photos are stored for <strong>7 days</strong> and then automatically deleted.</li>
              <li>Photos appear in the Receipts feed where others can cheer them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Trophy className="text-pink-500" /> Cheer Others
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>In the Receipts feed, tap <strong>Cheer</strong> on any completion or photo entry.</li>
              <li>The person you cheer receives <strong>+1 point</strong>.</li>
              <li>You can only cheer a given receipt <strong>once</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <ArrowLeftRight className="text-indigo-500" /> Turn Swapping &amp; Passing (-4 pts)
            </h2>
            <p className="text-gray-600 mb-2">Can't do your chore right now? You can swap your turn with another roommate:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>Cost:</strong> Passing your turn deducts <strong>4 points</strong> from your score.</li>
              <li><strong>Rotation Limit:</strong> A swap can only be performed <strong>once per rotation cycle per person</strong> for each chore.</li>
              <li><strong>Choose Roommate:</strong> You select which roommate in the chore's rotation takes your place.</li>
              <li><strong>60-Hour Window:</strong> The person who receives the turn has <strong>60 hours</strong> to complete it.</li>
              <li><strong>Recipient Rewards:</strong>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs">
                    <span className="font-bold text-emerald-700 block">≤ 24 hours:</span>
                    <strong className="text-emerald-800 text-sm">+13 points</strong>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-xs">
                    <span className="font-bold text-blue-700 block">24–48 hours:</span>
                    <strong className="text-blue-800 text-sm">+10 points</strong>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-xs">
                    <span className="font-bold text-amber-700 block">48–60 hours:</span>
                    <strong className="text-amber-800 text-sm">+7 points</strong>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-1 block">(&gt;60 hours overdue results in -4 penalty pts).</span>
              </li>
              <li><strong>Rotation Swap:</strong> You swap positions in the rotation with that person for this round. When their original turn comes up, <strong>it will be your turn</strong>! Once everyone has completed the round, the rotation automatically resets back to the original order.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" /> Overdue Deadlines, Progressive Penalties &amp; Treat Alerts
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>0–24 hrs late:</strong> Due date turns orange (+10 pts if completed).</li>
              <li><strong>24–48 hrs late:</strong> Flashing orange WARNING badge (+5 pts if completed).</li>
              <li><strong>48 hrs late (Day 2):</strong> Flashing red PENALTY MODE (<strong>-4 pts</strong>) and automated <strong>🍩 House Treat Alert</strong> posted to News &amp; Receipts. You officially <strong>owe everyone in the house a food treat!</strong></li>
              <li><strong>Daily Progressive Penalties (From Next Cycle Onwards):</strong> For every additional day a chore remains overdue past 48 hours, an extra <strong>-2 points</strong> are deducted automatically:
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    <span className="font-bold text-red-900 block">48–72h (Day 2):</span>
                    <strong className="text-red-700 text-sm">-4 points</strong>
                    <span className="text-red-600 block mt-0.5">+ Treat Owed</span>
                  </div>
                  <div className="bg-red-100/70 border border-red-300 p-2.5 rounded-xl">
                    <span className="font-bold text-red-950 block">72–96h (Day 3):</span>
                    <strong className="text-red-800 text-sm">-6 points</strong>
                    <span className="text-red-600 block mt-0.5">(4 + 2 extra pts)</span>
                  </div>
                  <div className="bg-red-200/60 border border-red-400 p-2.5 rounded-xl">
                    <span className="font-bold text-red-950 block">96h+ (Day 4+):</span>
                    <strong className="text-red-900 text-sm">-8 pts, -10 pts...</strong>
                    <span className="text-red-700 block mt-0.5">(-2 pts per extra day)</span>
                  </div>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Plane className="text-indigo-500" /> I am Away!
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Toggle <strong>Away</strong> in the Management tab when you leave town.</li>
              <li>You are removed from the wheel while away; chores reassign automatically.</li>
              <li>Remember to toggle back to <strong>Active</strong> when you return!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Bell className="text-blue-400" /> Browser Notifications
            </h2>
            <p className="text-gray-600 mb-2">Grant notification permission when prompted. You will be notified when:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>It becomes your turn on the wheel.</li>
              <li>Your chore is 24 hrs overdue, then again at 48 hrs.</li>
              <li>Your rent is due in <strong>4 days</strong>.</li>
              <li>Any flat-mate posts a new announcement.</li>
              <li>A skip-turn token is used that affects your turn.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-green-600" /> Announcements
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Post house-wide alerts in the <strong>Announcements</strong> tab.</li>
              <li>All announcements are kept <strong>permanently</strong> — full history is always visible.</li>
              <li>Every flat-mate gets a browser notification when a new announcement is posted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Crown className="text-yellow-600" /> Rent Reminders
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Each flat-mate sets their own rent due date in the Management tab.</li>
              <li>The app sends a personal browser notification <strong>4 days before</strong> rent is due.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Crown className="text-yellow-600" /> Solo Caretaker Reward
            </h2>
            <p className="text-gray-600">
              If everyone goes away and leaves exactly <strong>one person</strong> behind, a gold banner
              activates on the dashboard. The rest of the house owes that person a{' '}
              <strong>food treat upon return!</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
