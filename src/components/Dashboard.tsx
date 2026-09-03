import { useMemo, useState, useEffect } from 'react';
import { isWithinInterval, formatDistanceToNow, isPast, format } from 'date-fns';
import { useStore } from '../store';
import { Wheel } from './Wheel';
import { CheckCircle, Clock, Calendar } from 'lucide-react';

export const Dashboard = () => {
  const { users, chores, history, activeChoreId, setActiveChore, markChoreDone } = useStore();

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeChore = chores.find(c => c.id === activeChoreId) || chores[0];
  
  const activeUsers = useMemo(() => {
    return users.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(currentTime, { start: u.away_start, end: u.away_end });
    });
  }, [users, currentTime]);

  if (!activeChore) {
    return <div className="p-8 text-center text-gray-500">No chores set up yet.</div>;
  }

  const currentUser = users.find(u => u.id === activeChore.current_user_id);
  const isOverdue = isPast(activeChore.due_date);
  
  const hoursOverdue = isOverdue ? (currentTime - activeChore.due_date) / (1000 * 60 * 60) : 0;
  const isDelayed = hoursOverdue > 0;
  const isWarning = hoursOverdue >= 24 && hoursOverdue < 48;
  const isPenalty = hoursOverdue >= 48;

  // Next task overall (not just active)
  const upcomingChores = [...chores].sort((a, b) => a.due_date - b.due_date).filter(c => !isPast(c.due_date));
  const nextChoreOverall = upcomingChores.length > 0 ? upcomingChores[0] : null;

  return (
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto w-full">
      {/* Current Time Display */}
      <div className="bg-white/50 px-4 py-2 rounded-full mb-6 text-sm font-semibold text-gray-600 shadow-sm flex items-center gap-2 border border-gray-200">
        <Clock size={16} className="text-primary" />
        {format(currentTime, 'EEEE, MMM do - h:mm:ss a')}
      </div>
      
      {/* Chore Selector */}
      <div className="flex gap-2 overflow-x-auto w-full mb-6 pb-2 scrollbar-hide justify-center">
        {chores.map(chore => (
          <button
            key={chore.id}
            onClick={() => setActiveChore(chore.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              activeChoreId === chore.id 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {chore.name}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{activeChore.name}</h2>
        <div className="mb-8 text-center">
          <p className="text-gray-500 mb-1">Up next:</p>
          <p className={`text-xl font-bold ${isPenalty || isWarning ? 'text-red-500' : 'text-primary'}`}>
            {currentUser?.name || 'Unknown'}
          </p>
          
          <div className="mt-3 text-sm flex flex-col items-center gap-1">
            {isPenalty && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold inline-block mb-1 animate-pulse border border-red-300 shadow-sm">
                🚨 PENALTY MODE: Owes food!
              </span>
            )}
            {isWarning && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold inline-block mb-1 animate-pulse border border-orange-300 shadow-sm">
                ⚠️ WARNING: Task is heavily delayed!
              </span>
            )}
            
            <p className={`${isDelayed ? (isWarning || isPenalty ? 'text-red-600' : 'text-orange-500') : 'text-gray-700'} font-medium flex items-center gap-1`}>
              <Calendar size={14} /> 
              {isDelayed ? 'OVERDUE' : 'DUE:'} {format(activeChore.due_date, 'MMM do, h:mm a')}
            </p>
            <p className={`${isDelayed ? (isWarning || isPenalty ? 'text-red-500' : 'text-orange-400') : 'text-gray-500'} text-xs font-semibold`}>
              ({formatDistanceToNow(activeChore.due_date, { addSuffix: true })})
            </p>
          </div>
        </div>

        <Wheel activeUsers={activeUsers} currentUserId={activeChore.current_user_id} />
        
        <button
          onClick={() => markChoreDone(activeChore.id)}
          className="mt-10 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <CheckCircle size={24} />
          I have done it!
        </button>
      </div>

      {/* Next Upcoming Overall */}
      {nextChoreOverall && (
        <div className="mt-6 w-full text-center text-sm text-gray-500">
          Next upcoming task: <span className="font-bold text-gray-700">{nextChoreOverall.name}</span> on {format(nextChoreOverall.due_date, 'MMM do')}
        </div>
      )}
      
      {/* Solo Caretaker Reward Banner */}
      {activeUsers.length === 1 && users.length > 1 && (
        <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r shadow-md w-full">
          <p className="font-bold">👑 Solo Caretaker Reward Active!</p>
          <p className="text-sm">Everyone else is away. The house owes {activeUsers[0].name} a food treat!</p>
        </div>
      )}

      {/* History Section */}
      {history && history.length > 0 && (
        <div className="mt-10 w-full">
          <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Recent Activity</h3>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {history.map(item => (
                <li key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{item.user_name} <span className="font-normal text-gray-500">completed</span> {item.chore_name}</p>
                      <p className="text-xs text-gray-400 mt-1">{format(item.completed_at, 'MMM do, h:mm a')}</p>
                    </div>
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
