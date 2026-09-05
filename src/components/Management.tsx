import { useState } from 'react';
import { useStore } from '../store';
import type { ScheduleType } from '../store';
import { format, addDays } from 'date-fns';
import { Trash2, UserPlus, Plus, SkipForward, Calendar } from 'lucide-react';

export const Management = () => {
  const { users, chores, addUser, removeUser, updateUserAway, updateUserRentDueDate, redeemSkipTurn, addChore, removeChore, currentUserId } = useStore();
  
  const [newUserName, setNewUserName] = useState('');
  
  // Chore Form State
  const [choreName, setChoreName] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [timeOfDay, setTimeOfDay] = useState('12:00');
  const [frequencyDays, setFrequencyDays] = useState('3');
  const [dayOfWeek, setDayOfWeek] = useState('0'); // 0=Sun, 1=Mon...
  const [targetDate, setTargetDate] = useState(''); // YYYY-MM-DD

  const handleAddChore = () => {
    if (!choreName.trim()) return;

    let payload: any = {
      name: choreName.trim(),
      schedule_type: scheduleType,
      time_of_day: timeOfDay,
    };

    if (scheduleType === 'custom_interval') {
      payload.frequency_days = Number(frequencyDays);
    } else if (scheduleType === 'weekly') {
      payload.day_of_week = Number(dayOfWeek);
    } else if (scheduleType === 'specific_date' && targetDate) {
      payload.target_date = new Date(targetDate).getTime();
    }

    addChore(payload);
    
    // Reset
    setChoreName('');
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-8 pb-20">
      
      {/* Scoreboard Section */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">🏆 Scoreboard</h2>
        <ul className="divide-y">
          {[...users].sort((a, b) => b.points - a.points).map(user => (
            <li key={user.id} className="py-3 flex items-center justify-between">
              <span className="font-semibold text-gray-800">{user.name}</span>
              <span className={`font-bold ${user.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {user.points} pts
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* People Section */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">People</h2>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newUserName}
            onChange={e => setNewUserName(e.target.value)}
            placeholder="New roommate name" 
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button 
            onClick={() => {
              if (newUserName.trim()) {
                addUser(newUserName.trim());
                setNewUserName('');
              }
            }}
            className="bg-primary text-white px-4 py-2 rounded flex items-center gap-1 hover:bg-purple-600"
          >
            <UserPlus size={18} /> Add
          </button>
        </div>

        <ul className="divide-y">
          {users.map(user => (
            <li key={user.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.points} pts</p>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-gray-500">Away:</span>
                    {user.away_start && user.away_end ? (
                      <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs">
                        {format(user.away_start, 'MMM d')} - {format(user.away_end, 'MMM d')}
                      </span>
                    ) : (
                      <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs">Active</span>
                    )}
                    {user.skip_next_chore && (
                      <span className="text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded text-xs font-bold">⏭ Skip queued</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => {
                      if (user.away_start) {
                        updateUserAway(user.id, null, null);
                      } else {
                        updateUserAway(user.id, Date.now(), addDays(new Date(), 3).getTime());
                      }
                    }}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
                  >
                    Toggle Away
                  </button>
                  <button onClick={() => removeUser(user.id)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Rent due date */}
              <div className="mt-2 flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <label className="text-xs text-gray-500">Rent due date:</label>
                <input
                  type="date"
                  value={user.rent_due_date ?? ''}
                  onChange={e => updateUserRentDueDate(user.id, e.target.value || null)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                />
              </div>

              {/* Skip-turn redemption */}
              {currentUserId === user.id && (
                <div className="mt-2">
                  <button
                    onClick={() => redeemSkipTurn(user.id)}
                    disabled={user.points < 100 || user.skip_next_chore}
                    className="flex items-center gap-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <SkipForward size={13} />
                    {user.skip_next_chore ? 'Skip already queued' : `Redeem Skip-Turn (100 pts) — you have ${user.points}`}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Chores Section */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Add New Chore</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <input 
            type="text" 
            value={choreName}
            onChange={e => setChoreName(e.target.value)}
            placeholder="Chore name (e.g. Take out trash)" 
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Schedule Type</label>
              <select 
                value={scheduleType} 
                onChange={e => setScheduleType(e.target.value as ScheduleType)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom_interval">Every X Days</option>
                <option value="specific_date">Specific Date</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Time of Day</label>
              <input 
                type="time" 
                value={timeOfDay} 
                onChange={e => setTimeOfDay(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {scheduleType === 'custom_interval' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Repeat every (Days)</label>
              <input type="number" min="1" value={frequencyDays} onChange={e => setFrequencyDays(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          )}

          {scheduleType === 'weekly' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Day of the Week</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2">
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
          )}

          {scheduleType === 'specific_date' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          )}

          <button 
            onClick={handleAddChore}
            className="bg-primary text-white px-4 py-3 rounded flex items-center justify-center gap-1 hover:bg-purple-600 font-bold w-full"
          >
            <Plus size={18} /> Add Scheduled Chore
          </button>
        </div>

        <h3 className="font-bold text-gray-600 border-b pb-2 mb-3">Existing Chores</h3>
        <ul className="divide-y">
          {chores.map(chore => (
            <li key={chore.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{chore.name}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {chore.schedule_type.replace('_', ' ')} @ {chore.time_of_day}
                </p>
              </div>
              <button onClick={() => removeChore(chore.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded">
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
