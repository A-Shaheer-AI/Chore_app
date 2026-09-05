import os

store_content = """import { create } from 'zustand';
import { addDays, isWithinInterval, nextDay, setHours, setMinutes } from 'date-fns';
import type { Day } from 'date-fns';
import { supabase } from './supabase';

export type User = {
  id: string;
  name: string;
  away_start: number | null;
  away_end: number | null;
  points: number;
  skip_next_chore: boolean;
  rent_due_date: string | null;
  rent_reminder_offset: number;
};

export type ScheduleType = 'daily' | 'weekly' | 'custom_interval' | 'specific_date';

export type Chore = {
  id: string;
  name: string;
  schedule_type: ScheduleType;
  time_of_day: string;
  frequency_days?: number;
  day_of_week?: number;
  target_date?: number;
  current_user_id: string;
  due_date: number;
  assigned_user_ids: string[] | null;
  rotation_order: string[] | null;
};

export type ChoreHistory = {
  id: string;
  chore_name: string;
  user_name: string;
  completed_at: number;
  points_awarded: number;
};

export type Receipt = {
  id: string;
  user_id: string;
  chore_id: string | null;
  type: 'completion' | 'photo' | 'cheer' | 'skip' | 'announcement';
  details: Record<string, unknown>;
  created_at: number;
};

export type Announcement = {
  id: string;
  author_id: string;
  title: string;
  message: string;
  created_at: number;
};

interface AppState {
  users: User[];
  chores: Chore[];
  history: ChoreHistory[];
  receipts: Receipt[];
  announcements: Announcement[];
  activeChoreId: string | null;
  isLoaded: boolean;
  currentUserId: string | null;

  init: () => Promise<void>;
  setCurrentUser: (id: string) => void;
  setActiveChore: (id: string) => void;
  markChoreDone: (choreId: string, photoFile?: File) => Promise<void>;
  addUser: (name: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateUserAway: (id: string, start: number | null, end: number | null) => Promise<void>;
  updateUserRentDueDate: (id: string, date: string | null) => Promise<void>;
  addChore: (payload: Omit<Chore, 'id' | 'current_user_id' | 'due_date' | 'rotation_order'>) => Promise<void>;
  removeChore: (id: string) => Promise<void>;
  updateChoreAssignment: (choreId: string, userIds: string[] | null) => Promise<void>;
  redeemSkipTurn: (userId: string) => Promise<void>;
  cheerReceipt: (receiptId: string, cheererId: string, receiptUserId: string) => Promise<void>;
  postAnnouncement: (authorId: string, title: string, message: string) => Promise<void>;
}

const applyTime = (date: Date, timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return setMinutes(setHours(date, hours || 0), minutes || 0);
};

export const calculateNextDueDate = (chore: Partial<Chore>, fromDate: Date = new Date()): number => {
  let nextDate = fromDate;
  switch (chore.schedule_type) {
    case 'daily':
      nextDate = addDays(fromDate, 1);
      break;
    case 'weekly':
      nextDate = nextDay(fromDate, (chore.day_of_week || 0) as Day);
      break;
    case 'custom_interval':
      nextDate = addDays(fromDate, chore.frequency_days || 1);
      break;
    case 'specific_date':
      if (chore.target_date) nextDate = new Date(chore.target_date);
      break;
  }
  if (chore.time_of_day) nextDate = applyTime(nextDate, chore.time_of_day);
  return nextDate.getTime();
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const sendNotification = (title: string, body: string, icon = "/favicon.ico") => {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon });
  }
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const computeRotation = (chore: Partial<Chore>, users: User[]): User[] => {
  const now = Date.now();
  const activeUsers = users.filter(u => {
    if (!u.away_start || !u.away_end) return true;
    return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
  });

  const eligibleUsers = chore.assigned_user_ids && chore.assigned_user_ids.length > 0
    ? activeUsers.filter(u => chore.assigned_user_ids!.includes(u.id))
    : activeUsers;

  let baseOrder = chore.rotation_order || [];
  let currentRotationIds = baseOrder.filter(id => eligibleUsers.some(u => u.id === id));

  // Add any eligible users missing from the base order
  eligibleUsers.forEach(u => {
    if (!currentRotationIds.includes(u.id)) {
      currentRotationIds.push(u.id);
    }
  });

  if (currentRotationIds.length === 0) return [];
  return currentRotationIds.map(id => users.find(u => u.id === id)!).filter(Boolean);
};

export const getNextUser = (chore: Partial<Chore>, users: User[]): User | null => {
  const rotation = computeRotation(chore, users);
  if (rotation.length === 0) return null;
  const currentIdx = rotation.findIndex(u => u.id === chore.current_user_id);
  if (currentIdx === -1) return rotation[0];
  return rotation[(currentIdx + 1) % rotation.length];
};

export const useStore = create<AppState>((set, get) => ({
  users: [],
  chores: [],
  history: [],
  receipts: [],
  announcements: [],
  activeChoreId: null,
  isLoaded: false,
  currentUserId: null,

  init: async () => {
    const [
      { data: users },
      { data: chores },
      { data: history },
      { data: receipts },
      { data: announcements },
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("chores").select("*"),
      supabase.from("history").select("*").order("completed_at", { ascending: false }).limit(50),
      supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    ]);

    set({
      users: users || [],
      chores: chores || [],
      history: history || [],
      receipts: receipts || [],
      announcements: announcements || [],
      activeChoreId: chores && chores.length > 0 ? chores[0].id : null,
      isLoaded: true,
    });

    supabase.channel("public:users")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async () => {
        const { data } = await supabase.from("users").select("*");
        if (data) set({ users: data });
      }).subscribe();

    supabase.channel("public:chores")
      .on("postgres_changes", { event: "*", schema: "public", table: "chores" }, async () => {
        const { data } = await supabase.from("chores").select("*");
        if (data) set({ chores: data });
      }).subscribe();

    supabase.channel("public:history")
      .on("postgres_changes", { event: "*", schema: "public", table: "history" }, async () => {
        const { data } = await supabase.from("history").select("*").order("completed_at", { ascending: false }).limit(50);
        if (data) set({ history: data });
      }).subscribe();

    supabase.channel("public:receipts")
      .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, async () => {
        const { data } = await supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(100);
        if (data) set({ receipts: data });
      }).subscribe();

    supabase.channel("public:announcements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, async (payload) => {
        const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
        if (data) set({ announcements: data });
        const row = payload.new as Announcement;
        sendNotification("Announcement: " + row.title, row.message);
      }).subscribe();

    const checkRentReminders = (userList: User[]) => {
      const today = new Date();
      userList.forEach(u => {
        if (!u.rent_due_date) return;
        const due = new Date(u.rent_due_date);
        const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const offset = u.rent_reminder_offset ?? 4;
        if (diff === offset) {
          sendNotification("Rent Reminder", u.name + ", your rent is due in " + offset + " days (" + u.rent_due_date + ").");
        }
      });
    };
    checkRentReminders(users || []);
  },

  setCurrentUser: (id) => set({ currentUserId: id }),
  setActiveChore: (id) => set({ activeChoreId: id }),

  markChoreDone: async (choreId, photoFile) => {
    const state = get();
    const now = Date.now();

    const targetChore = state.chores.find(c => c.id === choreId);
    if (!targetChore) return;

    const rotation = computeRotation(targetChore, state.users);
    if (rotation.length === 0) return;

    const userForHistory = state.users.find(u => u.id === targetChore.current_user_id);

    const hoursOverdue = (now - targetChore.due_date) / (1000 * 60 * 60);
    let pointsEarned = 0;
    if (hoursOverdue < 24) pointsEarned = 10;
    else if (hoursOverdue < 48) pointsEarned = 5;
    else pointsEarned = -4;

    let photoBonus = 0;
    let storagePath: string | null = null;

    if (photoFile && userForHistory) {
      const ext = photoFile.name.split(".").pop();
      const path = "chore_photos/" + choreId + "_" + now + "." + ext;
      const { error: uploadError } = await supabase.storage.from("chore_photos").upload(path, photoFile);
      if (!uploadError) {
        storagePath = path;
        photoBonus = 1;
        const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
        const { data: photoReceiptRow } = await supabase.from("receipts").insert({
          user_id: userForHistory.id,
          chore_id: choreId,
          type: "photo",
          details: { storage_path: storagePath, points_awarded: 1 },
          created_at: now + 1,
        }).select().single();
        if (photoReceiptRow) {
          await supabase.from("chore_photos").insert({
            receipt_id: photoReceiptRow.id,
            storage_path: storagePath,
            uploaded_at: now,
            expires_at: expiresAt,
          });
        }
      }
    }

    const totalPoints = pointsEarned + photoBonus;

    if (userForHistory) {
      await supabase.from("history").insert({
        chore_name: targetChore.name,
        user_name: userForHistory.name,
        completed_at: now,
        points_awarded: totalPoints,
      });

      await supabase.from("receipts").insert({
        user_id: userForHistory.id,
        chore_id: choreId,
        type: "completion",
        details: { points_awarded: totalPoints, photo_path: storagePath },
        created_at: now,
      });

      await supabase.from("users").update({
        points: (userForHistory.points || 0) + totalPoints,
      }).eq("id", userForHistory.id);
    }

    // Determine Next User
    const currentIdx = rotation.findIndex(u => u.id === targetChore.current_user_id);
    let nextUserIndex = currentIdx !== -1 ? (currentIdx + 1) % rotation.length : 0;
    let nextUser = rotation[nextUserIndex];

    if (nextUser && nextUser.skip_next_chore) {
      await supabase.from("users").update({ skip_next_chore: false }).eq("id", nextUser.id);
      await supabase.from("receipts").insert({
        user_id: nextUser.id,
        chore_id: choreId,
        type: "skip",
        details: { message: nextUser.name + " used their skip-turn token" },
        created_at: now + 2,
      });
      nextUserIndex = (nextUserIndex + 1) % rotation.length;
      nextUser = rotation[nextUserIndex];
      if (nextUser) sendNotification("Turn Skipped", nextUser.name + ", it is now your turn for " + targetChore.name + "!");
    } else {
      if (nextUser) sendNotification("Your Turn!", nextUser.name + ", it is your turn for " + targetChore.name + "!");
    }

    if (nextUser) {
      await supabase.from("chores").update({
        current_user_id: nextUser.id,
        due_date: calculateNextDueDate(targetChore, new Date()),
      }).eq("id", targetChore.id);
    }
  },

  addUser: async (name) => {
    await supabase.from("users").insert({
      name,
      away_start: null,
      away_end: null,
      points: 0,
      skip_next_chore: false,
      rent_due_date: null,
      rent_reminder_offset: 4,
    });
  },

  removeUser: async (id) => {
    await supabase.from("users").delete().eq("id", id);
  },

  updateUserAway: async (id, start, end) => {
    const state = get();
    await supabase.from("users").update({ away_start: start, away_end: end }).eq("id", id);
    
    // Automatically reassign chores if the current person just went away
    const now = Date.now();
    const updatedUsers = state.users.map(u => u.id === id ? { ...u, away_start: start, away_end: end } : u);
    
    for (const chore of state.chores) {
      if (chore.current_user_id === id) {
         const rotation = computeRotation(chore, updatedUsers);
         if (rotation.length > 0) {
           await supabase.from("chores").update({ current_user_id: rotation[0].id }).eq("id", chore.id);
         }
      }
    }
  },

  updateUserRentDueDate: async (id, date) => {
    await supabase.from("users").update({ rent_due_date: date }).eq("id", id);
  },

  addChore: async (payload) => {
    const state = get();
    const now = Date.now();
    const activeUsers = state.users.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
    });
    
    const eligibleActive = payload.assigned_user_ids && payload.assigned_user_ids.length > 0
      ? activeUsers.filter(u => payload.assigned_user_ids!.includes(u.id))
      : activeUsers;
      
    // Randomize rotation for this specific chore!
    const rotation_order = shuffleArray(eligibleActive.map(u => u.id));
    const assignedUser = rotation_order.length > 0 ? rotation_order[0] : state.users[0]?.id;
    
    if (!assignedUser) return;
    const initialDueDate = calculateNextDueDate(payload, new Date());
    
    await supabase.from("chores").insert({
      ...payload,
      rotation_order,
      current_user_id: assignedUser,
      due_date: initialDueDate,
    });
  },

  removeChore: async (id) => {
    await supabase.from("chores").delete().eq("id", id);
  },

  updateChoreAssignment: async (choreId, userIds) => {
    const state = get();
    const eligibleUsers = userIds && userIds.length > 0
      ? state.users.filter(u => userIds.includes(u.id))
      : state.users;
      
    const rotation_order = shuffleArray(eligibleUsers.map(u => u.id));
    
    await supabase.from("chores").update({
      assigned_user_ids: userIds && userIds.length > 0 ? userIds : null,
      rotation_order,
    }).eq("id", choreId);
  },

  redeemSkipTurn: async (userId) => {
    const state = get();
    const user = state.users.find(u => u.id === userId);
    if (!user || user.points < 100) return;
    await supabase.from("users").update({
      points: user.points - 100,
      skip_next_chore: true,
    }).eq("id", userId);
    await supabase.from("receipts").insert({
      user_id: userId,
      chore_id: null,
      type: "skip",
      details: { message: user.name + " redeemed a skip-turn token (-100 pts)" },
      created_at: Date.now(),
    });
  },

  cheerReceipt: async (receiptId, cheererId, receiptUserId) => {
    const { error } = await supabase.from("cheer_log").insert({
      user_id: cheererId,
      receipt_id: receiptId,
      created_at: Date.now(),
    });
    if (error) return;
    const state = get();
    const cheeredUser = state.users.find(u => u.id === receiptUserId);
    if (!cheeredUser) return;
    await supabase.from("users").update({ points: (cheeredUser.points || 0) + 1 }).eq("id", receiptUserId);
    await supabase.from("receipts").insert({
      user_id: receiptUserId,
      chore_id: null,
      type: "cheer",
      details: { cheerer_id: cheererId, points_awarded: 1 },
      created_at: Date.now(),
    });
  },

  postAnnouncement: async (authorId, title, message) => {
    await supabase.from("announcements").insert({
      author_id: authorId,
      title,
      message,
      created_at: Date.now(),
    });
  },
}));
"""

dashboard_content = """import { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (choreId: string, file: File | null) => {
    setPhotoFiles(prev => ({ ...prev, [choreId]: file }));
  };

  const handleDone = async (choreId: string) => {
    const file = photoFiles[choreId];
    await markChoreDone(choreId, file ?? undefined);
    setPhotoFiles(prev => ({ ...prev, [choreId]: null }));
    if (fileInputRefs.current[choreId]) {
      fileInputRefs.current[choreId]!.value = '';
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
                  ref={el => fileInputRefs.current[chore.id] = el}
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
                  className="flex-1 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <CheckCircle size={24} />
                  Mark as Done
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
"""

with open('src/store.ts', 'w', encoding='utf-8') as f:
    f.write(store_content)

with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(dashboard_content)

print("Successfully wrote store.ts and Dashboard.tsx!")

