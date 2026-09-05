import { create } from 'zustand';
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
  addChore: (payload: Omit<Chore, 'id' | 'current_user_id' | 'due_date'>) => Promise<void>;
  removeChore: (id: string) => Promise<void>;
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
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const sendNotification = (title: string, body: string, icon = '/favicon.ico') => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
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
      supabase.from('users').select('*'),
      supabase.from('chores').select('*'),
      supabase.from('history').select('*').order('completed_at', { ascending: false }).limit(50),
      supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
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

    supabase.channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
        const { data } = await supabase.from('users').select('*');
        if (data) set({ users: data });
      }).subscribe();

    supabase.channel('public:chores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' }, async () => {
        const { data } = await supabase.from('chores').select('*');
        if (data) set({ chores: data });
      }).subscribe();

    supabase.channel('public:history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, async () => {
        const { data } = await supabase.from('history').select('*').order('completed_at', { ascending: false }).limit(50);
        if (data) set({ history: data });
      }).subscribe();

    supabase.channel('public:receipts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, async () => {
        const { data } = await supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(100);
        if (data) set({ receipts: data });
      }).subscribe();

    supabase.channel('public:announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, async (payload) => {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (data) set({ announcements: data });
        const row = payload.new as Announcement;
        sendNotification('Announcement: ' + row.title, row.message);
      }).subscribe();

    const checkRentReminders = (userList: User[]) => {
      const today = new Date();
      userList.forEach(u => {
        if (!u.rent_due_date) return;
        const due = new Date(u.rent_due_date);
        const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const offset = u.rent_reminder_offset ?? 4;
        if (diff === offset) {
          sendNotification('Rent Reminder', u.name + ', your rent is due in ' + offset + ' days (' + u.rent_due_date + ').');
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

    const activeUsers = state.users.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
    });

    if (activeUsers.length === 0) return;

    const targetChore = state.chores.find(c => c.id === choreId);
    if (!targetChore) return;

    const userForHistory = state.users.find(u => u.id === targetChore.current_user_id);

    const hoursOverdue = (now - targetChore.due_date) / (1000 * 60 * 60);
    let pointsEarned = 0;
    if (hoursOverdue < 24) pointsEarned = 10;
    else if (hoursOverdue < 48) pointsEarned = 5;
    else pointsEarned = -4;

    let photoBonus = 0;
    let storagePath: string | null = null;

    if (photoFile && userForHistory) {
      const ext = photoFile.name.split('.').pop();
      const path = 'chore_photos/' + choreId + '_' + now + '.' + ext;
      const { error: uploadError } = await supabase.storage.from('chore_photos').upload(path, photoFile);
      if (!uploadError) {
        storagePath = path;
        photoBonus = 1;
        const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
        const { data: photoReceiptRow } = await supabase.from('receipts').insert({
          user_id: userForHistory.id,
          chore_id: choreId,
          type: 'photo',
          details: { storage_path: storagePath, points_awarded: 1 },
          created_at: now + 1,
        }).select().single();
        if (photoReceiptRow) {
          await supabase.from('chore_photos').insert({
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
      await supabase.from('history').insert({
        chore_name: targetChore.name,
        user_name: userForHistory.name,
        completed_at: now,
        points_awarded: totalPoints,
      });

      await supabase.from('receipts').insert({
        user_id: userForHistory.id,
        chore_id: choreId,
        type: 'completion',
        details: { points_awarded: totalPoints, photo_path: storagePath },
        created_at: now,
      });

      await supabase.from('users').update({
        points: (userForHistory.points || 0) + totalPoints,
      }).eq('id', userForHistory.id);
    }

    let nextUserIndex = 0;
    const currentUserActiveIndex = activeUsers.findIndex(u => u.id === targetChore.current_user_id);
    if (currentUserActiveIndex !== -1) {
      nextUserIndex = (currentUserActiveIndex + 1) % activeUsers.length;
    }
    let nextUser = activeUsers[nextUserIndex];

    if (nextUser && nextUser.skip_next_chore) {
      await supabase.from('users').update({ skip_next_chore: false }).eq('id', nextUser.id);
      await supabase.from('receipts').insert({
        user_id: nextUser.id,
        chore_id: choreId,
        type: 'skip',
        details: { message: nextUser.name + ' used their skip-turn token' },
        created_at: now + 2,
      });
      nextUserIndex = (nextUserIndex + 1) % activeUsers.length;
      nextUser = activeUsers[nextUserIndex];
      if (nextUser) sendNotification('Turn Skipped', nextUser.name + ', it is now your turn for ' + targetChore.name + '!');
    } else {
      if (nextUser) sendNotification('Your Turn!', nextUser.name + ', it is your turn for ' + targetChore.name + '!');
    }

    if (nextUser) {
      await supabase.from('chores').update({
        current_user_id: nextUser.id,
        due_date: calculateNextDueDate(targetChore, new Date()),
      }).eq('id', targetChore.id);
    }
  },

  addUser: async (name) => {
    await supabase.from('users').insert({
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
    await supabase.from('users').delete().eq('id', id);
  },

  updateUserAway: async (id, start, end) => {
    const state = get();
    const now = Date.now();
    const updatedUsers = state.users.map(u => u.id === id ? { ...u, away_start: start, away_end: end } : u);
    const activeUsers = updatedUsers.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
    });
    await supabase.from('users').update({ away_start: start, away_end: end }).eq('id', id);
    if (activeUsers.length === 0) return;
    for (const chore of state.chores) {
      const isCurrentUserActive = activeUsers.some(u => u.id === chore.current_user_id);
      if (!isCurrentUserActive) {
        const oldUserIndex = state.users.findIndex(u => u.id === chore.current_user_id);
        let nextUser = activeUsers[0];
        for (let i = 1; i < state.users.length; i++) {
          const candidateIndex = (oldUserIndex + i) % state.users.length;
          const candidateUser = state.users[candidateIndex];
          if (activeUsers.some(u => u.id === candidateUser.id)) {
            nextUser = candidateUser;
            break;
          }
        }
        await supabase.from('chores').update({ current_user_id: nextUser.id }).eq('id', chore.id);
      }
    }
  },

  updateUserRentDueDate: async (id, date) => {
    await supabase.from('users').update({ rent_due_date: date }).eq('id', id);
  },

  addChore: async (payload) => {
    const state = get();
    const now = Date.now();
    const activeUsers = state.users.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
    });
    const assignedUser = activeUsers.length > 0 ? activeUsers[0].id : state.users[0]?.id;
    if (!assignedUser) return;
    const initialDueDate = calculateNextDueDate(payload, new Date());
    await supabase.from('chores').insert({
      ...payload,
      current_user_id: assignedUser,
      due_date: initialDueDate,
    });
  },

  removeChore: async (id) => {
    await supabase.from('chores').delete().eq('id', id);
  },

  redeemSkipTurn: async (userId) => {
    const state = get();
    const user = state.users.find(u => u.id === userId);
    if (!user || user.points < 100) return;
    await supabase.from('users').update({
      points: user.points - 100,
      skip_next_chore: true,
    }).eq('id', userId);
    await supabase.from('receipts').insert({
      user_id: userId,
      chore_id: null,
      type: 'skip',
      details: { message: user.name + ' redeemed a skip-turn token (-100 pts)' },
      created_at: Date.now(),
    });
  },

  cheerReceipt: async (receiptId, cheererId, receiptUserId) => {
    const { error } = await supabase.from('cheer_log').insert({
      user_id: cheererId,
      receipt_id: receiptId,
      created_at: Date.now(),
    });
    if (error) return;
    const state = get();
    const cheeredUser = state.users.find(u => u.id === receiptUserId);
    if (!cheeredUser) return;
    await supabase.from('users').update({ points: (cheeredUser.points || 0) + 1 }).eq('id', receiptUserId);
    await supabase.from('receipts').insert({
      user_id: receiptUserId,
      chore_id: null,
      type: 'cheer',
      details: { cheerer_id: cheererId, points_awarded: 1 },
      created_at: Date.now(),
    });
  },

  postAnnouncement: async (authorId, title, message) => {
    await supabase.from('announcements').insert({
      author_id: authorId,
      title,
      message,
      created_at: Date.now(),
    });
  },
}));
