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
};

export type ScheduleType = 'daily' | 'weekly' | 'custom_interval' | 'specific_date';

export type Chore = {
  id: string;
  name: string;
  schedule_type: ScheduleType;
  
  time_of_day: string; // "HH:mm"
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

interface AppState {
  users: User[];
  chores: Chore[];
  history: ChoreHistory[];
  activeChoreId: string | null;
  isLoaded: boolean;
  
  init: () => Promise<void>;
  setActiveChore: (id: string) => void;
  markChoreDone: (choreId: string) => Promise<void>;
  addUser: (name: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateUserAway: (id: string, start: number | null, end: number | null) => Promise<void>;
  addChore: (payload: Omit<Chore, 'id' | 'current_user_id' | 'due_date'>) => Promise<void>;
  removeChore: (id: string) => Promise<void>;
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
      if (chore.target_date) {
        nextDate = new Date(chore.target_date);
      }
      break;
  }
  
  if (chore.time_of_day) {
    nextDate = applyTime(nextDate, chore.time_of_day);
  }
  
  return nextDate.getTime();
};

export const useStore = create<AppState>((set, get) => ({
  users: [],
  chores: [],
  history: [],
  activeChoreId: null,
  isLoaded: false,

  init: async () => {
    // Initial fetch
    const [ { data: users }, { data: chores }, { data: history } ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('chores').select('*'),
      supabase.from('history').select('*').order('completed_at', { ascending: false }).limit(50)
    ]);

    set({ 
      users: users || [], 
      chores: chores || [], 
      history: history || [],
      activeChoreId: chores && chores.length > 0 ? chores[0].id : null,
      isLoaded: true
    });

    // Realtime subscriptions
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
  },

  setActiveChore: (id) => set({ activeChoreId: id }),

  markChoreDone: async (choreId) => {
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

    // Point calculation
    const hoursOverdue = (now - targetChore.due_date) / (1000 * 60 * 60);
    let pointsEarned = 0;
    
    if (hoursOverdue < 24) {
      pointsEarned = 10;
    } else if (hoursOverdue < 48) {
      pointsEarned = 5;
    } else {
      pointsEarned = -2;
    }

    if (userForHistory) {
      // 1. Insert history
      await supabase.from('history').insert({
        chore_name: targetChore.name,
        user_name: userForHistory.name,
        completed_at: now,
        points_awarded: pointsEarned
      });

      // 2. Update user points
      await supabase.from('users').update({ 
        points: (userForHistory.points || 0) + pointsEarned 
      }).eq('id', userForHistory.id);
    }

    // 3. Find next user for chore
    let nextUserIndex = 0;
    const currentUserActiveIndex = activeUsers.findIndex(u => u.id === targetChore.current_user_id);
    if (currentUserActiveIndex !== -1) {
      nextUserIndex = (currentUserActiveIndex + 1) % activeUsers.length;
    }
    const nextUser = activeUsers[nextUserIndex];

    // 4. Update chore
    await supabase.from('chores').update({
      current_user_id: nextUser.id,
      due_date: calculateNextDueDate(targetChore, new Date())
    }).eq('id', targetChore.id);
  },

  addUser: async (name) => {
    await supabase.from('users').insert({
      name,
      away_start: null,
      away_end: null,
      points: 0
    });
  },

  removeUser: async (id) => {
    await supabase.from('users').delete().eq('id', id);
  },

  updateUserAway: async (id, start, end) => {
    const state = get();
    const now = Date.now();
    
    // Optimistic update to check chores re-assignment
    const updatedUsers = state.users.map(u => u.id === id ? { ...u, away_start: start, away_end: end } : u);
    
    const activeUsers = updatedUsers.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
    });

    await supabase.from('users').update({ away_start: start, away_end: end }).eq('id', id);

    if (activeUsers.length === 0) return;

    // Reassign chores if necessary
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

  addChore: async (payload) => {
    const state = get();
    const now = Date.now();
    const activeUsers = state.users.filter(u => {
      if (!u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
    });
    const assignedUser = activeUsers.length > 0 ? activeUsers[0].id : state.users[0]?.id;
    
    if (!assignedUser) return; // No users to assign to

    const initialDueDate = calculateNextDueDate(payload, new Date());

    await supabase.from('chores').insert({
      ...payload,
      current_user_id: assignedUser,
      due_date: initialDueDate
    });
  },

  removeChore: async (id) => {
    await supabase.from('chores').delete().eq('id', id);
  }
}));
