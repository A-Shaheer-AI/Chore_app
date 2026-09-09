import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { useStore, computeRotation, getNextUser } from '../store';
import { CheckCircle, Clock, Camera, Users, ChevronRight, X } from 'lucide-react';

export const Dashboard = () => {
  const { users, chores, markChoreDone } = useStore();
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Per-chore photo uploads
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [viewRotationChore, setViewRotationChore] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

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

  const sortedChores = [...chores].sort((a, b) => a.due_date - b.due_date);

  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-6 pb-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
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
        const isPenalty = hoursOverdue >= 48;
        const isWarning = hoursOverdue >= 24 && hoursOverdue < 48;

        const photoFile = photoFiles[chore.id];

        let statusColor = "bg-green-100 text-green-700";
        if (isPenalty) statusColor = "bg-red-100 text-red-700 animate-pulse border border-red-500";
        else if (isWarning) statusColor = "bg-orange-100 text-orange-700 border border-orange-400 animate-pulse";
        else if (isOverdue) statusColor = "bg-yellow-100 text-yellow-700";

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

              {/* Action Buttons */}
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
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition-colors w-full sm:w-auto ${
                    photoFile
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Camera size={18} />
                  {photoFile ? `📷 ${photoFile.name}` : 'Add photo (+1 pt)'}
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
            </div>
          </div>
        );
      })}

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
