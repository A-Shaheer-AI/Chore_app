import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, isWithinInterval, nextDay, setHours, setMinutes } from 'date-fns';
import type { Day } from 'date-fns';

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
  
  // Schedule payload
  time_of_day: string; // "HH:mm"
  frequency_days?: number; // for custom_interval
  day_of_week?: number; // for weekly (0-6)
  target_date?: number; // for specific_date

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
  setActiveChore: (id: string) => void;
  markChoreDone: (choreId: string) => void;
  addUser: (name: string) => void;
  removeUser: (id: string) => void;
  updateUserAway: (id: string, start: number | null, end: number | null) => void;
  addChore: (payload: Omit<Chore, 'id' | 'current_user_id' | 'due_date'>) => void;
  removeChore: (id: string) => void;
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
      // 0 = Sunday, 1 = Monday, etc.
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

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      users: [
        { id: '1', name: 'Alice', away_start: null, away_end: null, points: 0 },
        { id: '2', name: 'Bob', away_start: null, away_end: null, points: 0 },
        { id: '3', name: 'Charlie', away_start: null, away_end: null, points: 0 },
        { id: '4', name: 'Diana', away_start: null, away_end: null, points: 0 },
        { id: '5', name: 'Eve', away_start: null, away_end: null, points: 0 },
      ],
      chores: [
        { 
          id: 'c1', name: 'Dishes', schedule_type: 'daily', time_of_day: '20:00', 
          current_user_id: '1', due_date: applyTime(addDays(new Date(), 1), '20:00').getTime() 
        },
        { 
          id: 'c2', name: 'Vacuuming', schedule_type: 'custom_interval', frequency_days: 3, time_of_day: '10:00', 
          current_user_id: '3', due_date: applyTime(addDays(new Date(), 2), '10:00').getTime() 
        },
        { 
          id: 'c3', name: 'Trash', schedule_type: 'weekly', day_of_week: 1, time_of_day: '08:00', 
          current_user_id: '4', due_date: applyTime(nextDay(new Date(), 1), '08:00').getTime() 
        },
      ],
      history: [],
      activeChoreId: 'c1',

      setActiveChore: (id) => set({ activeChoreId: id }),

      markChoreDone: (choreId) => set((state) => {
        const now = Date.now();
        
        const activeUsers = state.users.filter(u => {
          if (!u.away_start || !u.away_end) return true;
          return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
        });

        if (activeUsers.length === 0) return state;

        const targetChore = state.chores.find(c => c.id === choreId);
        if (!targetChore) return state;

        const userForHistory = state.users.find(u => u.id === targetChore.current_user_id);

        // Point calculation
        const hoursOverdue = (now - targetChore.due_date) / (1000 * 60 * 60);
        let pointsEarned = 0;
        
        if (hoursOverdue < 24) {
          pointsEarned = 10; // Within 24 hours of due date
        } else if (hoursOverdue < 48) {
          pointsEarned = 5; // Within 48 hours of due date
        } else {
          pointsEarned = -2; // Beyond 48 hours
        }

        const newHistoryEntry = userForHistory ? {
          id: Math.random().toString(),
          chore_name: targetChore.name,
          user_name: userForHistory.name,
          completed_at: now,
          points_awarded: pointsEarned
        } : null;

        return {
          history: newHistoryEntry ? [newHistoryEntry, ...state.history].slice(0, 50) : state.history,
          users: state.users.map(u => {
            if (u.id === targetChore.current_user_id) {
              return { ...u, points: (u.points || 0) + pointsEarned };
            }
            return u;
          }),
          chores: state.chores.map(chore => {
            if (chore.id !== choreId) return chore;

            // Find next user
            let nextUserIndex = 0;
            const currentUserActiveIndex = activeUsers.findIndex(u => u.id === chore.current_user_id);
            
            if (currentUserActiveIndex !== -1) {
              nextUserIndex = (currentUserActiveIndex + 1) % activeUsers.length;
            }
            const nextUser = activeUsers[nextUserIndex];

            // Re-assign or leave assigned if one-time
            if (chore.schedule_type === 'specific_date') {
              // specific_date chores don't repeat, but for roulette they might just pass to next person and wait?
              // Let's just update the user, maybe the user wants it to just pass on.
              // Actually, if it's one time, we should probably delete it or mark it completed. 
              // For simplicity, we just push it 1 year in future or something?
              // Let's push it 1 year if it's one-time, just to get it out of the way.
            }

            return {
              ...chore,
              current_user_id: nextUser.id,
              due_date: calculateNextDueDate(chore, new Date())
            };
          })
        };
      }),

      addUser: (name) => set((state) => ({
        users: [...state.users, { id: Math.random().toString(), name, away_start: null, away_end: null, points: 0 }]
      })),

      removeUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),

      updateUserAway: (id, start, end) => set((state) => {
        const now = Date.now();
        const updatedUsers = state.users.map(u => u.id === id ? { ...u, away_start: start, away_end: end } : u);
        
        const activeUsers = updatedUsers.filter(u => {
          if (!u.away_start || !u.away_end) return true;
          return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
        });

        if (activeUsers.length === 0) return { users: updatedUsers };

        const updatedChores = state.chores.map(chore => {
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
            return { ...chore, current_user_id: nextUser.id };
          }
          return chore;
        });

        return { users: updatedUsers, chores: updatedChores };
      }),

      addChore: (payload) => set((state) => {
        const now = Date.now();
        const activeUsers = state.users.filter(u => {
          if (!u.away_start || !u.away_end) return true;
          return !isWithinInterval(now, { start: u.away_start, end: u.away_end });
        });
        const assignedUser = activeUsers.length > 0 ? activeUsers[0].id : state.users[0]?.id;
        
        const initialDueDate = calculateNextDueDate(payload, new Date());

        return {
          chores: [...state.chores, {
            id: Math.random().toString(),
            ...payload,
            current_user_id: assignedUser,
            due_date: initialDueDate
          }]
        };
      }),

      removeChore: (id) => set((state) => ({
        chores: state.chores.filter(c => c.id !== id),
        activeChoreId: state.activeChoreId === id ? null : state.activeChoreId
      }))
    }),
    {
      name: 'chore-roulette-v2', // bump version to reset state
    }
  )
);
