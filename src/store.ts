import { create } from 'zustand';
import { addDays, isWithinInterval, nextDay } from 'date-fns';
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

export type CheerLog = {
  id?: string;
  user_id: string;
  receipt_id: string;
  created_at?: number;
};

interface AppState {
  users: User[];
  chores: Chore[];
  history: ChoreHistory[];
  receipts: Receipt[];
  announcements: Announcement[];
  cheers: CheerLog[];
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
  updateUserPoints: (id: string, points: number) => Promise<void>;
  addChore: (payload: Omit<Chore, 'id' | 'current_user_id' | 'due_date' | 'rotation_order'>) => Promise<void>;
  removeChore: (id: string) => Promise<void>;
  updateChoreAssignment: (choreId: string, userIds: string[] | null) => Promise<void>;
  redeemSkipTurn: (userId: string) => Promise<void>;
  cheerReceipt: (receiptId: string, cheererId: string, receiptUserId: string) => Promise<void>;
  postAnnouncement: (authorId: string, title: string, message: string) => Promise<void>;
}

const applyTime = (date: Date, timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
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
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const sendNotification = (title: string, body: string, icon = "/favicon.ico") => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon });
    }
  } catch (e) {
    console.warn("Notification error:", e);
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
    const start = Math.min(u.away_start, u.away_end);
    const end = Math.max(u.away_start, u.away_end);
    return !isWithinInterval(now, { start, end });
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
  cheers: [],
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
      { data: cheers },
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("chores").select("*"),
      supabase.from("history").select("*").order("completed_at", { ascending: false }).limit(50),
      supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("cheer_log").select("*"),
    ]);

    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('chore_current_user_id') : null;
    const initialUserId = users?.some(u => u.id === savedUserId) ? savedUserId : null;

    set({
      users: users || [],
      chores: chores || [],
      history: history || [],
      receipts: receipts || [],
      announcements: announcements || [],
      cheers: cheers || [],
      activeChoreId: chores && chores.length > 0 ? chores[0].id : null,
      currentUserId: initialUserId,
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

    supabase.channel("public:cheer_log")
      .on("postgres_changes", { event: "*", schema: "public", table: "cheer_log" }, async () => {
        const { data } = await supabase.from("cheer_log").select("*");
        if (data) set({ cheers: data || [] });
      }).subscribe();

    supabase.channel("public:announcements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, async (payload) => {
        const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
        if (data) set({ announcements: data });
        const row = payload.new as Announcement;
        // Only notify if not posted by current user
        if (row.author_id !== get().currentUserId) {
          sendNotification("Announcement: " + row.title, row.message);
        }
      }).subscribe();

    const checkRentReminders = (userList: User[]) => {
      const activeUserId = get().currentUserId;
      if (!activeUserId) return;

      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      userList.forEach(u => {
        // Only notify the person whose rent is due!
        if (u.id !== activeUserId || !u.rent_due_date) return;

        const [y, m, d] = u.rent_due_date.split('-').map(Number);
        if (!y || !m || !d) return;

        const dueDate = new Date(y, m - 1, d);
        const diff = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        const offset = u.rent_reminder_offset ?? 4;

        if (diff === offset) {
          const key = `rent_notified_${u.id}_${u.rent_due_date}`;
          if (!localStorage.getItem(key)) {
            sendNotification("Rent Reminder", `${u.name}, your rent is due in ${offset} days (${u.rent_due_date}).`);
            localStorage.setItem(key, "true");
          }
        }
      });
    };
    
    const checkOverdueChores = (choreList: Chore[]) => {
      const now = Date.now();
      const activeUserId = get().currentUserId;
      if (!activeUserId) return;

      choreList.forEach(chore => {
        // Only notify the person whose turn is overdue!
        if (chore.current_user_id !== activeUserId) return;

        const hoursOverdue = (now - chore.due_date) / (1000 * 60 * 60);
        
        if (hoursOverdue >= 24 && hoursOverdue < 48) {
          const key = `notified_24h_${chore.id}_${chore.due_date}`;
          if (!localStorage.getItem(key)) {
            sendNotification("Chore Overdue (24h)", `"${chore.name}" is over 24 hours late!`);
            localStorage.setItem(key, "true");
          }
        }
        
        if (hoursOverdue >= 48) {
          const key = `notified_48h_${chore.id}_${chore.due_date}`;
          if (!localStorage.getItem(key)) {
            sendNotification("Chore Penalty (48h+)", `Penalty! "${chore.name}" is over 48 hours late (-4 pts).`);
            localStorage.setItem(key, "true");
          }
        }
      });
    };

    checkRentReminders(users || []);
    checkOverdueChores(chores || []);
    
    // Periodically check for overdues every hour while tab is open
    setInterval(() => {
      checkOverdueChores(get().chores);
    }, 60 * 60 * 1000);
  },

  setCurrentUser: (id) => {
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('chore_current_user_id', id);
      else localStorage.removeItem('chore_current_user_id');
    }
    set({ currentUserId: id || null });
  },
  setActiveChore: (id) => set({ activeChoreId: id }),

  markChoreDone: async (choreId, photoFile) => {
    const state = get();
    const now = Date.now();

    const targetChore = state.chores.find(c => c.id === choreId);
    if (!targetChore) return;

    // Only allow the person whose turn it is to mark as done
    if (!state.currentUserId || state.currentUserId !== targetChore.current_user_id) {
      console.warn("Only the assigned person can mark this chore as done.");
      return;
    }

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
      const ext = photoFile.name.split(".").pop() || "jpg";
      const filename = `${choreId}_${now}.${ext}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from("chore_photos")
          .upload(filename, photoFile, { upsert: true });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          storagePath = filename;
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
      } catch (uploadErr) {
        console.error("Photo upload exception:", uploadErr);
      }
    }

    const totalPoints = pointsEarned + photoBonus;

    if (userForHistory) {
      const newPoints = (userForHistory.points || 0) + totalPoints;

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
        details: { points_awarded: totalPoints, storage_path: storagePath },
        created_at: now,
      });

      await supabase.from("users").update({
        points: newPoints,
      }).eq("id", userForHistory.id);

      // Immediately update user points in local Zustand store
      set(s => ({
        users: s.users.map(u => u.id === userForHistory.id ? { ...u, points: newPoints } : u)
      }));
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
      try {
        if (nextUser) sendNotification("Turn Skipped", nextUser.name + ", it is now your turn for " + targetChore.name + "!");
      } catch (e) {
        console.warn(e);
      }
    } else {
      try {
        if (nextUser) sendNotification("Your Turn!", nextUser.name + ", it is your turn for " + targetChore.name + "!");
      } catch (e) {
        console.warn(e);
      }
    }

    if (nextUser) {
      const nextDueDate = calculateNextDueDate(targetChore, new Date());
      await supabase.from("chores").update({
        current_user_id: nextUser.id,
        due_date: nextDueDate,
      }).eq("id", targetChore.id);

      // Immediately update chore turn in local Zustand store
      set(s => ({
        chores: s.chores.map(c => c.id === choreId ? {
          ...c,
          current_user_id: nextUser.id,
          due_date: nextDueDate,
        } : c)
      }));
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
    const state = get();
    const otherUsers = state.users.filter(u => u.id !== id);

    // 1. Reassign any chores currently assigned to this user to avoid FK error
    for (const chore of state.chores) {
      if (chore.current_user_id === id) {
        const rotation = computeRotation(chore, otherUsers);
        const newAssignee = rotation.length > 0 ? rotation[0].id : (otherUsers[0]?.id || null);
        if (newAssignee) {
          await supabase.from("chores").update({ current_user_id: newAssignee }).eq("id", chore.id);
        }
      }

      // Also clean up assigned_user_ids and rotation_order
      const hasAssigned = chore.assigned_user_ids?.includes(id);
      const hasRotation = chore.rotation_order?.includes(id);
      if (hasAssigned || hasRotation) {
        const newAssigned = chore.assigned_user_ids ? chore.assigned_user_ids.filter(uid => uid !== id) : null;
        const newRotation = chore.rotation_order ? chore.rotation_order.filter(uid => uid !== id) : null;
        await supabase.from("chores").update({
          assigned_user_ids: newAssigned && newAssigned.length > 0 ? newAssigned : null,
          rotation_order: newRotation,
        }).eq("id", chore.id);
      }
    }

    // 2. Delete user from Supabase
    await supabase.from("users").delete().eq("id", id);

    // 3. Clear local storage if current user was removed
    if (state.currentUserId === id && typeof window !== 'undefined') {
      localStorage.removeItem('chore_current_user_id');
    }

    // 4. Update local state immediately
    set(s => ({
      users: s.users.filter(u => u.id !== id),
      currentUserId: s.currentUserId === id ? null : s.currentUserId,
      chores: s.chores.map(c => {
        if (c.current_user_id === id) {
          const newAssignee = otherUsers[0]?.id || c.current_user_id;
          return { ...c, current_user_id: newAssignee };
        }
        return c;
      }),
    }));
  },

  updateUserAway: async (id, start, end) => {
    const state = get();
    await supabase.from("users").update({ away_start: start, away_end: end }).eq("id", id);
    
    // Automatically reassign chores if the current person just went away
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
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, rent_due_date: date } : u)
    }));
  },

  updateUserPoints: async (id, points) => {
    await supabase.from("users").update({ points }).eq("id", id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, points } : u)
    }));
  },

  addChore: async (payload) => {
    const state = get();
    const activeUsers = state.users.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(Date.now(), { start: u.away_start, end: u.away_end });
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
    set(s => ({
      chores: s.chores.filter(c => c.id !== id),
    }));
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

    set(s => ({
      chores: s.chores.map(c => c.id === choreId ? {
        ...c,
        assigned_user_ids: userIds && userIds.length > 0 ? userIds : null,
        rotation_order,
      } : c)
    }));
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
    const state = get();
    // Cannot cheer own receipt
    if (cheererId === receiptUserId) return;
    // Cannot cheer twice
    if (state.cheers.some(c => c.user_id === cheererId && c.receipt_id === receiptId)) return;

    // Optimistically update local state immediately
    set(s => ({
      cheers: [...s.cheers, { user_id: cheererId, receipt_id: receiptId }],
      users: s.users.map(u => u.id === receiptUserId ? { ...u, points: (u.points || 0) + 1 } : u),
    }));

    const { error } = await supabase.from("cheer_log").insert({
      user_id: cheererId,
      receipt_id: receiptId,
      created_at: Date.now(),
    });

    if (error) {
      console.warn("Cheer insert error (already cheered or DB error):", error);
      return;
    }

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
    const now = Date.now();
    await supabase.from("announcements").insert({
      author_id: authorId,
      title,
      message,
      created_at: now,
    });
    // Also record in receipts feed so it's transparent in the activity feed
    await supabase.from("receipts").insert({
      user_id: authorId,
      chore_id: null,
      type: "announcement",
      details: { message: `📢 ${title}: ${message}` },
      created_at: now,
    });
  },
}));
