import { useState } from 'react';
import { useStore, getDefaultInspectionOffset } from '../store';
import type { ScheduleType } from '../store';
import { format, addDays } from 'date-fns';
import { Trash2, UserPlus, Plus, SkipForward, Calendar, Users } from 'lucide-react';

export const Management = () => {
  const { 
    users, 
    chores, 
    addUser, 
    updateUserAway, 
    updateUserRentDueDate, 
    redeemSkipTurn, 
    addChore, 
    removeChore, 
    updateChoreAssignment, 
    currentUserId,
    inspectionDate,
    scheduleInspection,
    clearInspection,
  } = useStore();
  
  const [newUserName, setNewUserName] = useState('');
  
  // Inspection State
  const [inspectionInputDate, setInspectionInputDate] = useState<string>(
    inspectionDate ? format(inspectionDate, 'yyyy-MM-dd') : ''
  );
  const [customOffsets, setCustomOffsets] = useState<Record<string, 1 | 2 | 0>>({});
  const [isSchedulingInspection, setIsSchedulingInspection] = useState(false);
  const [inspectionFeedback, setInspectionFeedback] = useState<string | null>(null);

  const getChoreOffset = (chore: { id: string; name: string }): 1 | 2 | 0 => {
    if (customOffsets[chore.id] !== undefined) {
      return customOffsets[chore.id];
    }
    return getDefaultInspectionOffset(chore.name);
  };

  const handleSetOffset = (choreId: string, offset: 1 | 2 | 0) => {
    setCustomOffsets(prev => ({ ...prev, [choreId]: offset }));
  };

  const calculateProjectedDate = (chore: { due_date: number; time_of_day: string }, offset: 1 | 2 | 0) => {
    if (offset === 0 || !inspectionInputDate) return chore.due_date;
    const [year, month, day] = inspectionInputDate.split('-').map(Number);
    if (!year || !month || !day) return chore.due_date;
    const targetDate = new Date(year, month - 1, day - offset, 12, 0, 0);
    const [hours, minutes] = (chore.time_of_day || '09:00').split(':').map(Number);
    targetDate.setHours(hours || 0, minutes || 0, 0, 0);
    return targetDate.getTime();
  };

  const handleApplyInspection = async () => {
    if (!inspectionInputDate) {
      alert("Please select an inspection date first.");
      return;
    }
    setIsSchedulingInspection(true);
    try {
      await scheduleInspection(inspectionInputDate, customOffsets);
      setInspectionFeedback("Inspection schedule applied! All chore due dates have been aligned.");
      setTimeout(() => setInspectionFeedback(null), 5000);
    } catch (err) {
      console.error("Failed to schedule inspection:", err);
      alert("Failed to schedule inspection. Please check console.");
    } finally {
      setIsSchedulingInspection(false);
    }
  };

  const handleClearInspection = async () => {
    const restore = window.confirm("Do you want to restore the chores' original deadlines before the inspection was scheduled?\n\nClick 'OK' to restore previous deadlines, or 'Cancel' to keep current dates.");
    setIsSchedulingInspection(true);
    try {
      await clearInspection(restore);
      setInspectionInputDate('');
      setInspectionFeedback("Inspection schedule cleared.");
      setTimeout(() => setInspectionFeedback(null), 4000);
    } catch (err) {
      console.error("Failed to clear inspection:", err);
    } finally {
      setIsSchedulingInspection(false);
    }
  };
  
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

    if (scheduleType === 'specific_date' && !targetDate) {
      alert("Please select a date for this chore.");
      return;
    }

    const payload: any = {
      name: choreName.trim(),
      schedule_type: scheduleType,
      time_of_day: timeOfDay || '12:00',
      assigned_user_ids: selectedUserIds.length > 0 ? selectedUserIds : null,
    };

    if (scheduleType === 'custom_interval') {
      payload.frequency_days = Math.max(1, Number(frequencyDays) || 1);
    } else if (scheduleType === 'weekly') {
      payload.day_of_week = Number(dayOfWeek);
    } else if (scheduleType === 'specific_date' && targetDate) {
      payload.target_date = new Date(targetDate).getTime();
    }

    addChore(payload);
    setChoreName('');
    setTargetDate('');
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

      {/* House Inspection Alignment Section */}
      <section className="bg-white rounded-xl shadow-md p-6 border-2 border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">House Inspection Alignment</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Delay and align chore deadlines to 1 or 2 days before inspection day so the house is thoroughly cleaned without doing chores too far in advance.
              </p>
            </div>
          </div>
        </div>

        {/* Active Inspection Banner / Status */}
        {inspectionDate ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-extrabold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Active Inspection Scheduled
                </span>
                <span className="text-xs font-bold text-amber-800">
                  {format(inspectionDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Chores have been synchronized for this inspection. You can adjust individual chores below or clear the inspection schedule.
              </p>
            </div>
            <button
              onClick={handleClearInspection}
              disabled={isSchedulingInspection}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              ❌ Clear Inspection Schedule
            </button>
          </div>
        ) : null}

        {/* Date Selector */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-bold text-gray-700 whitespace-nowrap flex items-center gap-1.5">
              <Calendar size={16} className="text-amber-600" />
              Inspection Date:
            </label>
            <input
              type="date"
              value={inspectionInputDate}
              onChange={e => {
                setInspectionInputDate(e.target.value);
                setInspectionFeedback(null);
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {inspectionInputDate && (
              <span className="text-xs text-gray-500 font-medium">
                Day -2: <span className="font-bold text-indigo-700">{format(addDays(new Date(inspectionInputDate + 'T12:00:00'), -2), 'EEE, MMM d')}</span> &nbsp;|&nbsp; 
                Day -1: <span className="font-bold text-indigo-700">{format(addDays(new Date(inspectionInputDate + 'T12:00:00'), -1), 'EEE, MMM d')}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 <strong>House Inspection Rule:</strong> Vacuuming & deep cleaning are set 2 days before; mopping (1 day after vacuuming), kitchen counters, dishes & bins are set 1 day before.
          </p>
        </div>

        {/* Feedback Alert */}
        {inspectionFeedback && (
          <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-800 text-xs font-bold rounded-lg flex items-center gap-2">
            <span>✅</span>
            <span>{inspectionFeedback}</span>
          </div>
        )}

        {/* Chore Preview & Customization Table */}
        {inspectionInputDate ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center justify-between">
              <span>Chore Schedule Preview & Customization</span>
              <span className="text-xs font-normal text-gray-500">{chores.length} chores</span>
            </h3>

            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {chores.map(chore => {
                const offset = getChoreOffset(chore);
                const projectedDue = calculateProjectedDate(chore, offset);
                const assignee = users.find(u => u.id === chore.current_user_id)?.name || 'Unknown';

                return (
                  <div key={chore.id} className="p-3 sm:p-4 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-800 break-words">{chore.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          👤 {assignee}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>Current: <span className="font-semibold text-gray-700">{format(chore.due_date, 'EEE, MMM d, HH:mm')}</span></span>
                        <span>➔</span>
                        <span>
                          Target: <span className={`font-bold ${offset === 0 ? 'text-gray-600' : 'text-amber-700'}`}>
                            {offset === 0 ? 'Keep current' : format(projectedDue, 'EEE, MMM d, HH:mm')}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Timing Selector Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetOffset(chore.id, 2)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          offset === 2
                            ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        2 Days Before
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetOffset(chore.id, 1)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          offset === 1
                            ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        1 Day Before
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetOffset(chore.id, 0)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          offset === 0
                            ? 'bg-gray-700 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Don't Shift
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Aligning will update chore due dates in real-time, post an announcement, and log a transparent receipt.
              </p>
              <button
                type="button"
                onClick={handleApplyInspection}
                disabled={isSchedulingInspection}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                📅 {isSchedulingInspection ? 'Aligning Chores...' : 'Align All Chores for Inspection'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-3">
            Select an inspection date above to preview and customize chore schedule alignment.
          </p>
        )}
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
              const trimmed = newUserName.trim();
              if (!trimmed) return;
              if (users.some(u => u.name.toLowerCase() === trimmed.toLowerCase())) {
                alert("A roommate with this name already exists.");
                return;
              }
              addUser(trimmed);
              setNewUserName('');
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
                  {currentUserId === user.id ? (
                    <button
                      onClick={() => {
                        if (user.away_start) {
                          updateUserAway(user.id, null, null);
                        } else {
                          updateUserAway(user.id, Date.now(), addDays(new Date(), 3).getTime());
                        }
                      }}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-3 py-1 rounded transition-colors"
                    >
                      {user.away_start ? "Mark Active" : "Toggle Away"}
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">
                      {user.away_start ? "Away" : "Active"}
                    </span>
                  )}
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
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${chore.name}"?`)) {
                        removeChore(chore.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded"
                  >
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
