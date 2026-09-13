import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { useStore, computeRotation, getNextUser } from '../store';
import { CheckCircle, Clock, Camera, Users, ChevronRight, X, Lock, ArrowLeftRight, Sparkles } from 'lucide-react';

export const Dashboard = () => {
  const { users, chores, receipts, currentUserId, markChoreDone, passChoreTurn } = useStore();
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Per-chore photo uploads
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [viewRotationChore, setViewRotationChore] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Turn Swap Modal state
  const [swapModalChoreId, setSwapModalChoreId] = useState<string | null>(null);
  const [selectedSwapUserId, setSelectedSwapUserId] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (choreId: string, file: File | null) => {
    setPhotoFiles(prev => ({ ...prev, [choreId]: file }));
  };

  const handleDone = async (choreId: string) => {
    if (submittingId === choreId) return;
    setSubmittingId(choreId);
    try {
      const file = photoFiles[choreId];
      await markChoreDone(choreId, file ?? undefined);
      setPhotoFiles(prev => ({ ...prev, [choreId]: null }));
      if (fileInputRefs.current[choreId]) {
        fileInputRefs.current[choreId]!.value = '';
      }
    } catch (err) {
      console.error("Failed marking chore done:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmSwap = async () => {
    if (!swapModalChoreId || !selectedSwapUserId || isSwapping) return;
    setIsSwapping(true);
    try {
      await passChoreTurn(swapModalChoreId, selectedSwapUserId);
      setSwapModalChoreId(null);
      setSelectedSwapUserId('');
    } catch (err) {
      console.error("Failed to swap chore turn:", err);
    } finally {
      setIsSwapping(false);
    }
  };

  const isChoreLoaned = (choreId: string) => {
    const latestLoan = receipts.find(r => r.chore_id === choreId && r.type === 'loan');
    const latestCompletion = receipts.find(r => r.chore_id === choreId && r.type === 'completion');
    return Boolean(
      latestLoan &&
      (!latestCompletion || latestLoan.created_at > latestCompletion.created_at)
    );
  };

  const sortedChores = [...chores].sort((a, b) => a.due_date - b.due_date);
  const currentUserObj = users.find(u => u.id === currentUserId);
  const myChoresDue = currentUserId ? sortedChores.filter(c => c.current_user_id === currentUserId) : [];

  const choreToSwap = swapModalChoreId ? chores.find(c => c.id === swapModalChoreId) : null;
  const eligibleSwapRoommates = choreToSwap
    ? computeRotation(choreToSwap, users).filter(u => u.id !== currentUserId)
    : [];

  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-6 pb-20">

      {/* TOP SECTION: My Chores Due Box */}
      {currentUserId ? (
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 rounded-2xl shadow-md border-2 border-indigo-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h2 className="text-lg sm:text-xl font-extrabold text-indigo-950">My Chores Due</h2>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
              myChoresDue.length > 0 ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {myChoresDue.length} {myChoresDue.length === 1 ? 'chore' : 'chores'}
            </span>
          </div>

          {myChoresDue.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <p className="text-sm font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                <Sparkles size={16} className="text-emerald-600" />
                All caught up, {currentUserObj?.name}!
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                None of the house chores are currently due for you. Enjoy your time!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myChoresDue.map(chore => {
                const isOverdue = isPast(chore.due_date);
                const hoursOverdue = (currentTime - chore.due_date) / (1000 * 60 * 60);
                const isLoan = isChoreLoaned(chore.id);
                const isPenalty = isLoan ? isOverdue : hoursOverdue >= 48;
                const isWarning = isLoan ? false : (hoursOverdue >= 24 && hoursOverdue < 48);
                const photoFile = photoFiles[chore.id];

                let badgeColor = "bg-green-100 text-green-700";
                if (isPenalty) badgeColor = "bg-red-100 text-red-700 font-bold border border-red-400 animate-pulse";
                else if (isWarning) badgeColor = "bg-orange-100 text-orange-700 font-bold border border-orange-300";
                else if (isOverdue) badgeColor = "bg-yellow-100 text-yellow-800";

                return (
                  <div key={chore.id} className="bg-white rounded-xl p-3.5 sm:p-4 border border-indigo-100 shadow-sm flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-snug break-words">
                          {chore.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${badgeColor}`}>
                            <Clock size={12} />
                            {isOverdue ? `Overdue by ${formatDistanceToNow(chore.due_date)}` : `Due in ${formatDistanceToNow(chore.due_date)}`}
                          </span>
                          {isLoan && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                              🔄 Swapped Turn (60h)
                            </span>
                          )}
                          {isPenalty && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                              🍩 Treat Owed!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                      <input
                        ref={el => { fileInputRefs.current[chore.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileChange(chore.id, e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[chore.id]?.click()}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                          photoFile
                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <Camera size={14} />
                        {photoFile ? `📷 Proof attached` : '+ Photo (+1 pt)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSwapModalChoreId(chore.id);
                          setSelectedSwapUserId('');
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        <ArrowLeftRight size={14} />
                        Swap Turn (-2 pts)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDone(chore.id)}
                        disabled={submittingId === chore.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-bold text-xs shadow transition-all"
                      >
                        <CheckCircle size={15} />
                        {submittingId === chore.id ? 'Updating...' : 'Mark as Done'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <span className="text-2xl">👤</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Who are you?</p>
            <p className="text-xs text-amber-700">Select your name in <strong>"🏠 I am"</strong> at the top of the screen to view your due chores and mark them done.</p>
          </div>
        </div>
      )}

      {/* ALL CHORES SECTION */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
        🏠 House Chores
      </h1>
      
      {sortedChores.length === 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-md text-center">
          <p className="text-gray-500">No chores set up yet. Go to Manage to add some!</p>
        </div>
      )}

      {sortedChores.map(chore => {
        const isOverdue = isPast(chore.due_date);
        const hoursOverdue = (currentTime - chore.due_date) / (1000 * 60 * 60);
        const currentUser = users.find(u => u.id === chore.current_user_id);
        const nextUser = getNextUser(chore, users);
        const isLoan = isChoreLoaned(chore.id);
        const isPenalty = isLoan ? isOverdue : hoursOverdue >= 48;
        const isWarning = isLoan ? false : (hoursOverdue >= 24 && hoursOverdue < 48);

        const photoFile = photoFiles[chore.id];

        let statusColor = "bg-green-100 text-green-700";
        if (isPenalty) statusColor = "bg-red-100 text-red-700 animate-pulse border border-red-500 font-bold";
        else if (isWarning) statusColor = "bg-orange-100 text-orange-700 border border-orange-400 animate-pulse font-bold";
        else if (isOverdue) statusColor = "bg-yellow-100 text-yellow-700 font-semibold";

        return (
          <div key={chore.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-indigo-500">
            <div className="p-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 break-words whitespace-pre-wrap leading-tight">
                  {chore.name}
                </h2>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  <span className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 ${statusColor}`}>
                    <Clock size={14} />
                    {isOverdue ? `Overdue by ${formatDistanceToNow(chore.due_date)}` : `Due in ${formatDistanceToNow(chore.due_date)}`}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {format(chore.due_date, "EEEE, h:mm a")}
                  </span>
                  {isLoan && (
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200 text-xs flex items-center gap-1">
                      🔄 Swapped Turn (60h)
                    </span>
                  )}
                  {isPenalty && (
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs flex items-center gap-1 animate-pulse">
                      🍩 Treat Owed!
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Current Turn</p>
                    <p className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                      👤 {currentUser?.name ?? 'Unknown'}
                    </p>
                  </div>
                  
                  {nextUser && (
                    <div 
                      className="cursor-pointer hover:bg-gray-200 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-300"
                      onClick={() => setViewRotationChore(chore.id)}
                    >
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        Next Up <ChevronRight size={14}/>
                      </p>
                      <p className="text-lg font-medium text-gray-600">
                        {nextUser.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons or Turn Restrictions */}
              {(() => {
                const isMyTurn = Boolean(currentUserId && currentUserId === chore.current_user_id);
                const assignedPerson = currentUser?.name ?? 'the assigned person';

                if (isMyTurn) {
                  return (
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
                      <input
                        ref={el => { fileInputRefs.current[chore.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileChange(chore.id, e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[chore.id]?.click()}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-colors w-full sm:w-auto ${
                          photoFile
                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <Camera size={18} />
                        {photoFile ? `📷 Proof attached` : 'Add photo (+1 pt)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSwapModalChoreId(chore.id);
                          setSelectedSwapUserId('');
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors w-full sm:w-auto"
                      >
                        <ArrowLeftRight size={18} />
                        Swap Turn (-2 pts)
                      </button>

                      <button
                        onClick={() => handleDone(chore.id)}
                        disabled={submittingId === chore.id}
                        className="flex-1 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        <CheckCircle size={24} />
                        {submittingId === chore.id ? 'Updating turn...' : 'Mark as Done'}
                      </button>
                    </div>
                  );
                }

                if (!currentUserId) {
                  return (
                    <div className="mt-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                      <span>Select your name in <strong>"🏠 I am"</strong> at the top to complete your chores.</span>
                    </div>
                  );
                }

                return (
                  <div className="mt-6 p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Lock size={15} className="text-gray-400 shrink-0" />
                    <span>Only <strong>{assignedPerson}</strong> can upload photos or mark this done right now.</span>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}

      {/* SWAP TURN MODAL */}
      {swapModalChoreId && choreToSwap && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                <ArrowLeftRight size={20} className="text-indigo-600" />
                Swap Chore Turn
              </h3>
              <button 
                onClick={() => setSwapModalChoreId(null)} 
                className="text-gray-500 hover:text-gray-800 bg-gray-200 p-1 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Chore</p>
                <p className="text-base font-bold text-gray-800">{choreToSwap.name}</p>
              </div>

              <div>
                <label className="text-xs text-gray-600 uppercase font-bold tracking-wider block mb-1.5">
                  Select Roommate to Swap With:
                </label>
                {eligibleSwapRoommates.length === 0 ? (
                  <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    No other eligible roommates in rotation to swap with.
                  </p>
                ) : (
                  <select
                    value={selectedSwapUserId}
                    onChange={e => setSelectedSwapUserId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Choose a roommate --</option>
                    {eligibleSwapRoommates.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.points || 0} pts)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold text-sm text-amber-950 flex items-center gap-1">
                  ⚖️ How Turn Swapping Works:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-800">
                  <li>It will cost <strong>2 points</strong> of your own score.</li>
                  <li>The selected roommate will get <strong>60 hours</strong> to complete it.</li>
                  <li>Reward for them: <strong>13 pts</strong> (≤24h), <strong>10 pts</strong> (≤48h), or <strong>7 pts</strong> (≤60h).</li>
                  <li><strong>Turn Swap:</strong> You will take their place when their turn comes around in the rotation!</li>
                  <li>Once everyone in the rotation finishes the round, the cycle resets back to the original roster order.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border">
                <span>Your current points: <strong>{currentUserObj?.points || 0}</strong></span>
                <span>Points after swap: <strong className="text-red-600">{(currentUserObj?.points || 0) - 2}</strong></span>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setSwapModalChoreId(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedSwapUserId || isSwapping}
                  onClick={handleConfirmSwap}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  {isSwapping ? 'Swapping...' : 'Confirm Swap (-2 pts)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rotation Modal */}
      {viewRotationChore && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Users size={18}/> Rotation Order
              </h3>
              <button onClick={() => setViewRotationChore(null)} className="text-gray-500 hover:text-gray-800 bg-gray-200 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <ul className="space-y-2">
                {(() => {
                  const chore = chores.find(c => c.id === viewRotationChore);
                  if (!chore) return null;
                  const rotation = computeRotation(chore, users);
                  const currentIdx = rotation.findIndex(u => u.id === chore.current_user_id);
                  return rotation.map((u, i) => (
                    <li key={u.id} className={`p-3 rounded-lg flex items-center gap-3 ${i === currentIdx ? 'bg-indigo-100 border border-indigo-300' : 'bg-gray-50 border border-gray-100'}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === currentIdx ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {i + 1}
                      </span>
                      <span className={`font-medium ${i === currentIdx ? 'text-indigo-800' : 'text-gray-700'}`}>
                        {u.name} {i === currentIdx && '(Current)'}
                      </span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
