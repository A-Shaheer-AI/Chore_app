import { Info, AlertTriangle, Plane, Crown, Trophy, Bell } from 'lucide-react';

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
              <AlertTriangle className="text-orange-500" /> The 48-Hour Deadline
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>0–24 hrs late:</strong> Due date turns orange.</li>
              <li><strong>24–48 hrs late:</strong> Flashing orange WARNING badge.</li>
              <li><strong>48+ hrs late:</strong> Flashing red PENALTY MODE — you owe the house food!</li>
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
