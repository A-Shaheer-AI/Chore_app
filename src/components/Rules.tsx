import { Info, AlertTriangle, Plane, Crown, Trophy } from 'lucide-react';

export const Rules = () => {
  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-6 pb-20">
      
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          🎲 House Rules
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to our household management system! Chore Roulette is designed to keep our shared spaces clean while making it fair, transparent, and a little competitive.
        </p>

        <div className="space-y-6">
          
          {/* Wheel */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-blue-500" /> The Roulette Wheel
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>The Rotation:</strong> The wheel operates sequentially (clockwise) among all active house members. Look at the wheel to see when your turn is coming up next.</li>
              <li><strong>"Up Next":</strong> The person whose name is highlighted in the center of the wheel is currently on duty for that specific chore.</li>
              <li><strong>Completing a Chore:</strong> When you finish a chore, click the big green <strong>"I have done it!"</strong> button. The app will log your completion, award you points, and automatically assign the next person.</li>
            </ul>
          </section>

          {/* Points */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Point System & Scoreboard
            </h2>
            <p className="text-gray-600 mb-3">Check the Management tab to see who is currently in the lead! Points are awarded automatically based on when you click "I have done it!":</p>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-green-600">+10 Points</span>
                <span className="text-sm"><strong>Perfect:</strong> Completed on time or early (up to 24 hours late is still accepted for full points).</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-orange-600">+5 Points</span>
                <span className="text-sm"><strong>Late:</strong> Completed, but between 24 and 48 hours late.</span>
              </div>
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-red-600">-2 Points</span>
                <span className="text-sm"><strong>Penalty:</strong> Completed, but over 48 hours late.</span>
              </div>
            </div>
          </section>

          {/* Deadlines */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" /> The 48-Hour Deadline
            </h2>
            <p className="text-gray-600 mb-3">We run a strict 48-hour deadline policy. If a chore passes its due date, the dashboard will track how late it is:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>0 - 24 Hours Late:</strong> The due date turns Orange.</li>
              <li><strong>24 - 48 Hours Late:</strong> A flashing Orange <span className="font-bold">⚠️ WARNING</span> badge appears.</li>
              <li>
                <strong>48+ Hours Late:</strong> A flashing Red <span className="font-bold">🚨 PENALTY MODE</span> badge appears. 
                <span className="block mt-1 font-bold text-red-600">If you hit Penalty Mode, you owe the house food!</span>
              </li>
            </ul>
          </section>

          {/* Away Status */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Plane className="text-indigo-500" /> "I'm Away!"
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>If you are out of town, toggle your status to <strong>"Away"</strong> in the Management tab.</li>
              <li>When Away, you are temporarily removed from the Roulette wheel.</li>
              <li>If a chore was assigned to you, it will <strong>automatically shift</strong> to the next available person.</li>
              <li><strong>Important:</strong> Don't forget to toggle your status back to Active when you return!</li>
            </ul>
          </section>

          {/* Solo Caretaker */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Crown className="text-yellow-600" /> Solo Caretaker Reward
            </h2>
            <p className="text-gray-600">
              If everyone in the house goes away and leaves exactly <strong>one person</strong> behind, a gold banner will activate on the dashboard. Because this person is left to handle all chores by themselves, <strong>the rest of the house owes them a food treat upon return!</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
