import { useState } from 'react';
import { useStore } from '../store';
import type { ScheduleType } from '../store';
import { format, addDays } from 'date-fns';
import { Trash2, UserPlus, Plus, SkipForward, Calendar, Users } from 'lucide-react';

export const Management = () => {
  const { users, chores, addUser, removeUser, updateUserAway, updateUserRentDueDate, updateUserPoints, redeemSkipTurn, addChore, removeChore, updateChoreAssignment, currentUserId } = useStore();
  
  const [newUserName, setNewUserName] = useState('');
  const [editingPointsId, setEditingPointsId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<string>('0');
  
  // Chore Form State
  const [choreName, setChoreName] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [timeOfDay, setTimeOfDay] = useState('12:00');
  const [frequencyDays, setFrequencyDays] = useState('3');
  const [dayOfWeek, setDayOfWeek] = useState('0'); // 0=Sun, 1=Mon...
  const [targetDate, setTargetDate] = useState(''); // YYYY-MM-DD
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]); // empty = all

  // Edit-assignment state for existing chores
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [editUserIds, setEditUserIds] = useState<string[]>([]);

  const toggleUserId = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const handleAddChore = () => {
    if (!choreName.trim()) return;

    const payload: any = {
      name: choreName.trim(),
      schedule_type: scheduleType,
      time_of_day: timeOfDay,
      assigned_user_ids: selectedUserIds.length > 0 ? selectedUserIds : null,
    };

    if (scheduleType === 'custom_interval') {
      payload.frequency_days = Number(frequencyDays);
    } else if (scheduleType === 'weekly') {
      payload.day_of_week = Number(dayOfWeek);
    } else if (scheduleType === 'specific_date' && targetDate) {
      payload.target_date = new Date(targetDate).getTime();
    }

    addChore(payload);
    setChoreName('');
    setSelectedUserIds([]);
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium">{user.points} pts</span>
                    {editingPointsId === user.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={pointsInput}
                          onChange={e => setPointsInput(e.target.value)}
                          className="w-16 text-xs border border-gray-300 rounded px-1 py-0.5"
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            await updateUserPoints(user.id, Number(pointsInput) || 0);
                            setEditingPointsId(null);
                          }}
                          className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPointsId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPointsId(user.id);
                          setPointsInput(String(user.points));
                        }}
                        className="text-[10px] text-indigo-500 hover:text-indigo-700 underline"
                      >
                        edit points
                      </button>
                    )}
                  </div>
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

          {/* Who does this chore? */}
          {users.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Users size={13} /> Who does this chore? <span className="text-gray-400">(leave all unchecked = everyone)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {users.map(u => (
                  <label key={u.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm font-medium transition-colors ${
                    selectedUserIds.includes(u.id)
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleUserId(u.id, selectedUserIds, setSelectedUserIds)}
                    />
                    {u.name}
                  </label>
                ))}
              </div>
              {selectedUserIds.length > 0 && (
                <p className="text-xs text-indigo-600 mt-1">Only {selectedUserIds.map(id => users.find(u => u.id === id)?.name).join(', ')} will rotate for this chore.</p>
              )}
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
            <li key={chore.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{chore.name}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {chore.schedule_type.replace('_', ' ')} @ {chore.time_of_day}
                  </p>
                  {/* Show assigned users */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {chore.assigned_user_ids && chore.assigned_user_ids.length > 0 ? (
                      chore.assigned_user_ids.map(uid => {
                        const u = users.find(x => x.id === uid);
                        return u ? (
                          <span key={uid} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{u.name}</span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Everyone</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => {
                      setEditingChoreId(editingChoreId === chore.id ? null : chore.id);
                      setEditUserIds(chore.assigned_user_ids ?? []);
                    }}
                    className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <Users size={13} /> People
                  </button>
                  <button onClick={() => removeChore(chore.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Edit assignment panel */}
              {editingChoreId === chore.id && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1"><Users size={13} /> Select who does "{chore.name}"</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {users.map(u => (
                      <label key={u.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm font-medium transition-colors ${
                        editUserIds.includes(u.id)
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={editUserIds.includes(u.id)}
                          onChange={() => toggleUserId(u.id, editUserIds, setEditUserIds)}
                        />
                        {u.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {editUserIds.length === 0 ? 'All users will rotate.' : `Only ${editUserIds.map(id => users.find(u => u.id === id)?.name).join(', ')} will rotate.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await updateChoreAssignment(chore.id, editUserIds.length > 0 ? editUserIds : null);
                        setEditingChoreId(null);
                      }}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChoreId(null)}
                      className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
