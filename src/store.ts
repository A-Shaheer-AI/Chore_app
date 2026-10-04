import { create } from 'zustand';
import { addDays, isWithinInterval, nextDay, format } from 'date-fns';
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
  type: 'completion' | 'photo' | 'cheer' | 'skip' | 'loan' | 'penalty' | 'inspection';
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
  inspectionDate: number | null;

  init: () => Promise<void>;
  setCurrentUser: (id: string) => void;
  setActiveChore: (id: string) => void;
  markChoreDone: (choreId: string, photoFile?: File) => Promise<void>;
  passChoreTurn: (choreId: string, targetUserId: string) => Promise<void>;
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
  scheduleInspection: (inspectionDateStr: string, customOffsets?: Record<string, 1 | 2 | 0>) => Promise<void>;
  clearInspection: (restorePreviousDates?: boolean) => Promise<void>;
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

export const getDefaultInspectionOffset = (choreName: string): 1 | 2 => {
  const name = choreName.toLowerCase();
  // Vacuum must be 1 day before mopping, so vacuum is Day -2, mopping is Day -1
  if (name.includes('vaccum') || name.includes('vacuum')) return 2;
  if (name.includes('mop')) return 1;
  // Deep cleaning & appliances 2 days before
  if (name.includes('fridge') || name.includes('drawer')) return 2;
  if (name.includes('oven') || name.includes('microwave') || name.includes('appliance')) return 2;
  if (name.includes('master bedroom')) return 2;
  if (name.includes('counter top') && name.includes('bathroom')) return 2;
  // Surface / dishes / bins / common toilet 1 day before
  if (name.includes('dish') || name.includes('sink')) return 1;
  if (name.includes('countertop') || name.includes('stove') || name.includes('table')) return 1;
  if (name.includes('bin') || name.includes('toilet')) return 1;
  return 1;
};

export const getActiveInspectionDate = (receiptList: Receipt[]): number | null => {
  const latest = receiptList.find(r => r.type === 'inspection');
  if (!latest) return null;
  const d = latest.details as Record<string, unknown>;
  if (d.action === 'schedule' && typeof d.inspection_timestamp === 'number') {
    // Keep active through the end of the inspection day (+24 hours)
    if (Date.now() <= d.inspection_timestamp + 86400000) {
      return d.inspection_timestamp;
    }
  }
  return null;
};

export const isInspectionAuthorized = (user: User | null | undefined): boolean => {
  if (!user) return false;
  const name = user.name.toLowerCase().trim();
  return name === 'ahmed' || name === 'minhaz' || name === 'minhaj' ||
    user.id === '05fcfeb9-0458-4abd-b658-12b6fb9470d1' || // Ahmed
    user.id === 'e25f95d6-4921-4669-9824-db5a818c37d6';   // Minhaz
};

export const getNextUser = (chore: Partial<Chore>, users: User[]): User | null => {
  const rotation = computeRotation(chore, users);
  if (rotation.length === 0) return null;
  const currentIdx = rotation.findIndex(u => u.id === chore.current_user_id);
  if (currentIdx === -1) return rotation[0];
  return rotation[(currentIdx + 1) % rotation.length];
};

export const canUserSwapChoreTurn = (
  chore: Chore,
  userId: string,
  receipts: Receipt[],
  users: User[]
): { allowed: boolean; reason?: string } => {
  const user = users.find(u => u.id === userId);
  if (!user) return { allowed: false, reason: "User not found." };
  if ((user.points || 0) < 4) {
    return { allowed: false, reason: "You need at least 4 points to swap your turn." };
  }

  // Check if chore is currently in an active, unfulfilled loan
  const latestLoanOverall = receipts.find(r => r.chore_id === chore.id && r.type === 'loan');
  const latestCompletionOverall = receipts.find(r => r.chore_id === chore.id && r.type === 'completion');
  const isCurrentlyLoaned = Boolean(
    latestLoanOverall &&
    (!latestCompletionOverall || latestLoanOverall.created_at > latestCompletionOverall.created_at)
  );
  if (isCurrentlyLoaned) {
    return { allowed: false, reason: "This chore is currently in an active swapped turn and cannot be swapped again until completed." };
  }

  const rotation = computeRotation(chore, users);
  const rotationLength = Math.max(1, rotation.length);

  // Find the most recent loan initiated by this user for this chore
  const latestUserLoan = receipts.find(r =>
    r.chore_id === chore.id &&
    r.type === 'loan' &&
    ((r.details as Record<string, unknown>)?.loaner_id === userId || r.user_id === userId)
  );

  if (latestUserLoan) {
    const turnsSinceSwap = receipts.filter(r =>
      r.chore_id === chore.id &&
      (r.type === 'completion' || r.type === 'skip') &&
      r.created_at > latestUserLoan.created_at
    ).length;

    if (turnsSinceSwap < rotationLength) {
      return {
        allowed: false,
        reason: `A swap can only be performed once per rotation per person (${turnsSinceSwap}/${rotationLength} turns completed in this rotation).`
      };
    }
  }

  return { allowed: true };
};

export const isMoppingWaitingForVacuum = (
  chore: Chore,
  chores: Chore[],
  receipts: Receipt[]
): boolean => {
  if (!chore.name.toLowerCase().includes('mop')) return false;

  const vacuumChore = chores.find(
    c => c.name.toLowerCase().includes('vacuum') || c.name.toLowerCase().includes('vaccum')
  );
  if (!vacuumChore) return false;

  const latestVacuumCompletion = receipts.find(
    r => r.type === 'completion' &&
    Boolean(
      (r.details as Record<string, unknown>)?.chore_name &&
      (((r.details as Record<string, unknown>).chore_name as string).toLowerCase().includes('vacuum') ||
       ((r.details as Record<string, unknown>).chore_name as string).toLowerCase().includes('vaccum'))
    )
  );

  const latestMopCompletion = receipts.find(
    r => r.type === 'completion' &&
    Boolean(
      (r.details as Record<string, unknown>)?.chore_name &&
      ((r.details as Record<string, unknown>).chore_name as string).toLowerCase().includes('mop')
    )
  );

  // If mopping was completed more recently than vacuuming, mopping is waiting for the next vacuuming
  if (latestMopCompletion && latestVacuumCompletion && latestMopCompletion.created_at >= latestVacuumCompletion.created_at) {
    return true;
  }

  if (!latestVacuumCompletion) {
    return true;
  }

  return false;
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
  inspectionDate: null,

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
    const activeInspection = getActiveInspectionDate(receipts || []);

    set({
      users: users || [],
      chores: chores || [],
      history: history || [],
      receipts: receipts || [],
      announcements: announcements || [],
      cheers: cheers || [],
      activeChoreId: chores && chores.length > 0 ? chores[0].id : null,
      currentUserId: initialUserId,
      inspectionDate: activeInspection,
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
        if (data) set({ receipts: data, inspectionDate: getActiveInspectionDate(data) });
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

        if (diff <= offset && diff >= 0) {
          const key = `rent_notified_${u.id}_${u.rent_due_date}`;
          if (!localStorage.getItem(key)) {
            const daysText = diff === 0 ? "today" : `in ${diff} day${diff === 1 ? "" : "s"}`;
            sendNotification("Rent Reminder", `${u.name}, your rent is due ${daysText} (${u.rent_due_date}).`);
            localStorage.setItem(key, "true");
          }
        }
      });
    };
    
    const checkOverdueChores = async (choreList: Chore[]) => {
      const now = Date.now();
      const activeUserId = get().currentUserId;

      for (const chore of choreList) {
        // Check if this chore is currently in an active swapped/loaned turn
        const latestLoan = get().receipts.find(r => r.chore_id === chore.id && r.type === 'loan');
        const latestCompletion = get().receipts.find(r => r.chore_id === chore.id && r.type === 'completion');
        const isLoan = Boolean(
          latestLoan &&
          (!latestCompletion || latestLoan.created_at > latestCompletion.created_at) &&
          (latestLoan.details as Record<string, unknown>)?.recipient_id === chore.current_user_id
        );

        if (isLoan) {
          // For a loaned chore, due_date is set to loaned_at + 60h.
          // When now >= chore.due_date, the 60 hours have passed!
          const isOver60h = now >= chore.due_date;

          if (isOver60h) {
            const treatKey = `treat_posted_loan_60h_${chore.id}_${chore.due_date}`;
            const alreadyPosted = get().receipts.some(
              r => r.type === 'penalty' && r.chore_id === chore.id && (r.details as Record<string, unknown>)?.due_date === chore.due_date
            ) || (typeof window !== 'undefined' && Boolean(localStorage.getItem(treatKey)));

            if (!alreadyPosted) {
              const overdueUser = get().users.find(u => u.id === chore.current_user_id);
              const overdueUserName = overdueUser ? overdueUser.name : 'Roommate';

              if (typeof window !== 'undefined') {
                localStorage.setItem(treatKey, "true");
              }

              if (overdueUser) {
                const newPoints = (overdueUser.points || 0) - 4;
                await supabase.from("users").update({ points: newPoints }).eq("id", chore.current_user_id);
                set(s => ({
                  users: s.users.map(u => u.id === chore.current_user_id ? { ...u, points: newPoints } : u)
                }));
              }

              await supabase.from("announcements").insert({
                author_id: chore.current_user_id,
                title: `🍩 Treat Alert: ${overdueUserName} owes everyone a treat!`,
                message: `${overdueUserName} was loaned "${chore.name}" with a 60-hour deadline and did not complete it in time. As per house rules, they lose 4 points and owe everyone in the house a food treat!`,
                created_at: now,
              });

              const { data: treatReceipt } = await supabase.from("receipts").insert({
                user_id: chore.current_user_id,
                chore_id: chore.id,
                type: "penalty",
                details: {
                  chore_name: chore.name,
                  user_name: overdueUserName,
                  due_date: chore.due_date,
                  treat_penalty: true,
                  is_loan: true,
                  points_awarded: -4,
                  message: `${overdueUserName} exceeded the 60-hour loan deadline on "${chore.name}" (-4 pts) and owes everyone a treat!`,
                },
                created_at: now,
              }).select().single();

              if (treatReceipt) {
                set(s => ({ receipts: [treatReceipt, ...s.receipts] }));
              }
            }

            if (activeUserId && chore.current_user_id === activeUserId) {
              const key = `notified_loan_60h_${chore.id}_${chore.due_date}`;
              if (!localStorage.getItem(key)) {
                sendNotification("Loan Deadline Exceeded (60h+)", `Penalty! "${chore.name}" exceeded the 60-hour deadline (-4 pts). You owe the house a treat!`);
                localStorage.setItem(key, "true");
              }
            }
          }
        } else {
          // Standard chore overdue checks
          if (isMoppingWaitingForVacuum(chore, choreList, get().receipts)) {
            // Mopping starts from the day when vacuuming is marked done.
            // Do not flag overdue or penalize while waiting for vacuuming.
            continue;
          }

          const hoursOverdue = (now - chore.due_date) / (1000 * 60 * 60);

          if (hoursOverdue >= 24 && hoursOverdue < 48) {
            if (activeUserId && chore.current_user_id === activeUserId) {
              const key = `notified_24h_${chore.id}_${chore.due_date}`;
              if (!localStorage.getItem(key)) {
                sendNotification("Chore Overdue (24h)", `"${chore.name}" is over 24 hours late!`);
                localStorage.setItem(key, "true");
              }
            }
          }

          if (hoursOverdue >= 48) {
            const treatKey = `treat_posted_${chore.id}_${chore.due_date}`;
            const alreadyPosted = get().receipts.some(
              r => r.type === 'penalty' && r.chore_id === chore.id && (r.details as Record<string, unknown>)?.due_date === chore.due_date
            ) || (typeof window !== 'undefined' && Boolean(localStorage.getItem(treatKey)));

            if (!alreadyPosted) {
              const overdueUser = get().users.find(u => u.id === chore.current_user_id);
              const overdueUserName = overdueUser ? overdueUser.name : 'Roommate';

              if (typeof window !== 'undefined') {
                localStorage.setItem(treatKey, "true");
              }

              if (overdueUser) {
                const newPoints = (overdueUser.points || 0) - 4;
                await supabase.from("users").update({ points: newPoints }).eq("id", chore.current_user_id);
                set(s => ({
                  users: s.users.map(u => u.id === chore.current_user_id ? { ...u, points: newPoints } : u)
                }));
              }

              await supabase.from("announcements").insert({
                author_id: chore.current_user_id,
                title: `🍩 Treat Alert: ${overdueUserName} owes everyone a treat!`,
                message: `${overdueUserName} is over 48 hours late on "${chore.name}". As per house rules, they now owe everyone in the house a food treat!`,
                created_at: now,
              });

              const { data: treatReceipt } = await supabase.from("receipts").insert({
                user_id: chore.current_user_id,
                chore_id: chore.id,
                type: "penalty",
                details: {
                  chore_name: chore.name,
                  user_name: overdueUserName,
                  due_date: chore.due_date,
                  treat_penalty: true,
                  points_awarded: -4,
                  message: `${overdueUserName} is over 48 hours late on "${chore.name}" (-4 pts) and owes everyone a treat!`,
                },
                created_at: now,
              }).select().single();

              if (treatReceipt) {
                set(s => ({ receipts: [treatReceipt, ...s.receipts] }));
              }
            }

            if (activeUserId && chore.current_user_id === activeUserId) {
              const key = `notified_48h_${chore.id}_${chore.due_date}`;
              if (!localStorage.getItem(key)) {
                sendNotification("Chore Penalty (48h+)", `Penalty! "${chore.name}" is over 48 hours late (-4 pts). You owe the house a treat!`);
                localStorage.setItem(key, "true");
              }
            }

            // Daily progressive penalty: deduct 2 extra points for each extra day overdue (starting from next cycle)
            // "for this upcoming one dont apply it, but from next cycle onwards or next eprson who makes chores overdue set it in motion"
            const isProgressivePenaltyEligible = chore.due_date > 1791177599000;
            const daysOverdue = Math.floor(hoursOverdue / 24);

            if (isProgressivePenaltyEligible && daysOverdue >= 3) {
              const overdueUser = get().users.find(u => u.id === chore.current_user_id);
              const overdueUserName = overdueUser ? overdueUser.name : 'Roommate';

              for (let d = 3; d <= daysOverdue; d++) {
                const dayKey = `overdue_day_${d}_posted_${chore.id}_${chore.due_date}`;
                const alreadyDeductedDay = get().receipts.some(
                  r => r.type === 'penalty' &&
                       r.chore_id === chore.id &&
                       (r.details as Record<string, unknown>)?.due_date === chore.due_date &&
                       (r.details as Record<string, unknown>)?.overdue_day === d
                ) || (typeof window !== 'undefined' && Boolean(localStorage.getItem(dayKey)));

                if (!alreadyDeductedDay) {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(dayKey, "true");
                  }

                  const currentUserObj = get().users.find(u => u.id === chore.current_user_id);
                  if (currentUserObj) {
                    const newPts = (currentUserObj.points || 0) - 2;
                    await supabase.from("users").update({ points: newPts }).eq("id", chore.current_user_id);
                    set(s => ({
                      users: s.users.map(u => u.id === chore.current_user_id ? { ...u, points: newPts } : u)
                    }));
                  }

                  const totalPenaltySoFar = 4 + 2 * (d - 2);
                  const { data: dayReceipt } = await supabase.from("receipts").insert({
                    user_id: chore.current_user_id,
                    chore_id: chore.id,
                    type: "penalty",
                    details: {
                      chore_name: chore.name,
                      user_name: overdueUserName,
                      due_date: chore.due_date,
                      overdue_day: d,
                      points_awarded: -2,
                      message: `${overdueUserName} is ${d} days overdue on "${chore.name}" (-2 extra pts, total -${totalPenaltySoFar} pts)`,
                    },
                    created_at: now,
                  }).select().single();

                  if (dayReceipt) {
                    set(s => ({ receipts: [dayReceipt, ...s.receipts] }));
                  }

                  if (activeUserId && chore.current_user_id === activeUserId) {
                    sendNotification(
                      `Extra Overdue Penalty (-2 pts)`,
                      `"${chore.name}" is ${d} days late. An extra -2 points was deducted (total -${totalPenaltySoFar} pts)!`
                    );
                  }
                }
              }
            }
          }
        }
      }
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

    // Prevent rapid duplicate completions (cooldown: 30 seconds)
    const recentCompletion = state.receipts.find(
      r => r.chore_id === choreId && r.type === 'completion' && (now - r.created_at) < 30000
    );
    if (recentCompletion) {
      console.warn("Chore was already marked done moments ago. Ignoring duplicate submission.");
      return;
    }

    const userForHistory = state.users.find(u => u.id === targetChore.current_user_id);
    if (!userForHistory) return;

    // Check if this chore completion is fulfilling a swapped turn (loan)
    const latestLoan = state.receipts.find(r => r.chore_id === choreId && r.type === 'loan');
    const latestCompletion = state.receipts.find(r => r.chore_id === choreId && r.type === 'completion');

    const isLoanRecipientCompletion = Boolean(
      latestLoan &&
      (!latestCompletion || latestLoan.created_at > latestCompletion.created_at) &&
      (latestLoan.details as Record<string, unknown>)?.recipient_id === targetChore.current_user_id
    );

    // Check if overdue penalty was already deducted for this overdue cycle
    const alreadyPenalized = state.receipts.some(
      r => r.type === 'penalty' && r.chore_id === choreId && (r.details as Record<string, unknown>)?.due_date === targetChore.due_date
    );

    let pointsEarned = 0;
    let hoursSinceLoan: number | null = null;

    if (isLoanRecipientCompletion && latestLoan) {
      hoursSinceLoan = (now - latestLoan.created_at) / (1000 * 60 * 60);
      if (hoursSinceLoan <= 24) pointsEarned = 13;
      else if (hoursSinceLoan <= 48) pointsEarned = 10;
      else if (hoursSinceLoan <= 60) pointsEarned = 7;
      else pointsEarned = alreadyPenalized ? 0 : -4;
    } else {
      const hoursOverdue = (now - targetChore.due_date) / (1000 * 60 * 60);
      if (hoursOverdue < 24) pointsEarned = 10;
      else if (hoursOverdue < 48) pointsEarned = 5;
      else if (alreadyPenalized) pointsEarned = 0;
      else {
        const daysOverdue = Math.floor(hoursOverdue / 24);
        const isProgressive = targetChore.due_date > 1791177599000;
        pointsEarned = isProgressive ? -(4 + 2 * Math.max(0, daysOverdue - 2)) : -4;
      }
    }

    let photoBonus = 0;
    let storagePath: string | null = null;

    if (photoFile) {
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
        }
      } catch (uploadErr) {
        console.error("Photo upload exception:", uploadErr);
      }
    }

    const totalPoints = pointsEarned + photoBonus;
    const newPoints = (userForHistory.points || 0) + totalPoints;

    await supabase.from("history").insert({
      chore_name: targetChore.name,
      user_name: userForHistory.name,
      completed_at: now,
      points_awarded: totalPoints,
    });

    // Single combined receipt (completion + photo + chore name)
    const { data: completionReceipt } = await supabase.from("receipts").insert({
      user_id: userForHistory.id,
      chore_id: choreId,
      type: "completion",
      details: {
        chore_name: targetChore.name,
        points_awarded: totalPoints,
        base_points: pointsEarned,
        photo_bonus: photoBonus,
        storage_path: storagePath,
        has_photo: Boolean(storagePath),
        is_loan: isLoanRecipientCompletion,
        hours_taken: hoursSinceLoan !== null ? Math.round(hoursSinceLoan * 10) / 10 : null,
      },
      created_at: now,
    }).select().single();

    if (storagePath && completionReceipt) {
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
      await supabase.from("chore_photos").insert({
        receipt_id: completionReceipt.id,
        storage_path: storagePath,
        uploaded_at: now,
        expires_at: expiresAt,
      });
    }

    await supabase.from("users").update({
      points: newPoints,
    }).eq("id", userForHistory.id);

    // Determine Next User & Rotation
    let nextUser: User | null = null;
    let updatedRotationOrder: string[] | null = targetChore.rotation_order;

    // Check if we are currently in an active swapped rotation from latestLoan
    const details = latestLoan?.details as Record<string, unknown> | undefined;
    const swappedRotation = details?.swapped_rotation as string[] | undefined;
    const originalRotation = details?.original_rotation as string[] | undefined;

    if (latestLoan && swappedRotation && originalRotation && targetChore.rotation_order && JSON.stringify(targetChore.rotation_order) === JSON.stringify(swappedRotation)) {
      const currIdxInSwapped = swappedRotation.indexOf(targetChore.current_user_id);
      if (currIdxInSwapped !== -1) {
        if (currIdxInSwapped < swappedRotation.length - 1) {
          // Next person in the swapped round
          const nextId = swappedRotation[currIdxInSwapped + 1];
          nextUser = state.users.find(u => u.id === nextId) || null;
          updatedRotationOrder = swappedRotation;
        } else {
          // Last person in the swapped round just finished!
          // Reset rotation back to originalRotation!
          updatedRotationOrder = originalRotation;
          const firstId = originalRotation[0];
          nextUser = state.users.find(u => u.id === firstId) || null;
        }
      }
    }

    if (!nextUser) {
      const rotation = computeRotation(targetChore, state.users);
      if (rotation.length > 0) {
        const currentIdx = rotation.findIndex(u => u.id === targetChore.current_user_id);
        let nextUserIndex = currentIdx !== -1 ? (currentIdx + 1) % rotation.length : 0;
        nextUser = rotation[nextUserIndex];
      }
    }

    if (nextUser && nextUser.skip_next_chore) {
      await supabase.from("users").update({ skip_next_chore: false }).eq("id", nextUser.id);
      await supabase.from("receipts").insert({
        user_id: nextUser.id,
        chore_id: choreId,
        type: "skip",
        details: { message: nextUser.name + " used their skip-turn token", chore_name: targetChore.name },
        created_at: now + 2,
      });
      const rotation = computeRotation({ ...targetChore, rotation_order: updatedRotationOrder }, state.users);
      const skipIdx = rotation.findIndex(u => u.id === nextUser!.id);
      nextUser = rotation[(skipIdx + 1) % rotation.length];
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
        rotation_order: updatedRotationOrder,
      }).eq("id", targetChore.id);

      set(s => ({
        users: s.users.map(u => u.id === userForHistory.id ? { ...u, points: newPoints } : u),
        chores: s.chores.map(c => c.id === choreId ? {
          ...c,
          current_user_id: nextUser.id,
          due_date: nextDueDate,
          rotation_order: updatedRotationOrder,
        } : c),
        receipts: completionReceipt ? [completionReceipt, ...s.receipts] : s.receipts,
      }));
    } else {
      set(s => ({
        users: s.users.map(u => u.id === userForHistory.id ? { ...u, points: newPoints } : u),
        receipts: completionReceipt ? [completionReceipt, ...s.receipts] : s.receipts,
      }));
    }

    // When vacuuming is marked done, mopping starts from today (scheduled 1 day after vacuuming)
    const isVacuumChore = targetChore.name.toLowerCase().includes('vacuum') || targetChore.name.toLowerCase().includes('vaccum');
    if (isVacuumChore) {
      const mopChore = state.chores.find(c => c.name.toLowerCase().includes('mop'));
      if (mopChore) {
        // Align mopping if it is currently due or due within the next 10 days (the 20-day mopping mark)
        const isMopInCurrentCycle = mopChore.due_date <= now + 10 * 86400000;
        if (isMopInCurrentCycle) {
          let mopTargetDate = addDays(new Date(), 1);
          if (mopChore.time_of_day) {
            mopTargetDate = applyTime(mopTargetDate, mopChore.time_of_day);
            if (mopTargetDate.getTime() - now < 18 * 3600 * 1000) {
              mopTargetDate = addDays(mopTargetDate, 1);
            }
          }
          const nextMopDueDate = mopTargetDate.getTime();

          await supabase.from("chores").update({
            due_date: nextMopDueDate,
          }).eq("id", mopChore.id);

          set(s => ({
            chores: s.chores.map(c => c.id === mopChore.id ? { ...c, due_date: nextMopDueDate } : c)
          }));

          const mopper = state.users.find(u => u.id === mopChore.current_user_id);
          if (mopper) {
            try {
              sendNotification(
                "Floor Vacuumed — Mopping Starts!",
                `${mopper.name}, the house has been vacuumed! Your mopping turn starts now, scheduled 1 day after vacuuming.`
              );
            } catch (err) {
              console.warn(err);
            }
          }
        }
      }
    }
  },

  passChoreTurn: async (choreId: string, targetUserId: string) => {
    const state = get();
    const targetChore = state.chores.find(c => c.id === choreId);
    if (!targetChore) return;

    const loanerId = targetChore.current_user_id;
    if (!state.currentUserId || state.currentUserId !== loanerId) {
      console.warn("Only the assigned person can pass their turn.");
      return;
    }

    const loaner = state.users.find(u => u.id === loanerId);
    if (!loaner) return;

    const targetUser = state.users.find(u => u.id === targetUserId);
    if (!targetUser || targetUser.id === loanerId) {
      alert("Please select a valid roommate to swap turns with.");
      return;
    }

    const baseRotation = targetChore.rotation_order && targetChore.rotation_order.length > 0
      ? [...targetChore.rotation_order]
      : computeRotation(targetChore, state.users).map(u => u.id);

    // Re-align circular rotation order so current turn (loaner) is at index 0
    const currIdx = baseRotation.indexOf(loanerId);
    const ordered = currIdx !== -1
      ? [...baseRotation.slice(currIdx), ...baseRotation.slice(0, currIdx)]
      : baseRotation;

    const targetIdx = ordered.indexOf(targetUserId);
    if (targetIdx === -1) {
      alert("The selected roommate is not part of this chore's rotation.");
      return;
    }

    const swapCheck = canUserSwapChoreTurn(targetChore, loanerId, state.receipts, state.users);
    if (!swapCheck.allowed) {
      alert(swapCheck.reason || "You cannot swap this turn.");
      return;
    }

    // Swap positions: targetUser takes index 0 (now), loaner takes targetIdx
    const swappedRotation = [...ordered];
    swappedRotation[0] = targetUserId;
    swappedRotation[targetIdx] = loanerId;

    const now = Date.now();
    // 60 hours = 60 * 3600 * 1000 ms
    const newDueDate = now + 60 * 3600 * 1000;
    const newPoints = (loaner.points || 0) - 4;

    await supabase.from("users").update({ points: newPoints }).eq("id", loanerId);

    await supabase.from("chores").update({
      current_user_id: targetUserId,
      due_date: newDueDate,
      rotation_order: swappedRotation,
    }).eq("id", targetChore.id);

    const { data: loanReceipt } = await supabase.from("receipts").insert({
      user_id: loanerId,
      chore_id: targetChore.id,
      type: "loan",
      details: {
        chore_name: targetChore.name,
        loaner_id: loanerId,
        loaner_name: loaner.name,
        recipient_id: targetUserId,
        recipient_name: targetUser.name,
        points_deducted: 4,
        loaned_at: now,
        original_due_date: targetChore.due_date,
        new_due_date: newDueDate,
        original_rotation: ordered,
        swapped_rotation: swappedRotation,
        message: `${loaner.name} swapped turn for "${targetChore.name}" with ${targetUser.name} (-4 pts, 60h deadline)`,
      },
      created_at: now,
    }).select().single();

    set(s => ({
      users: s.users.map(u => u.id === loanerId ? { ...u, points: newPoints } : u),
      chores: s.chores.map(c => c.id === targetChore.id ? {
        ...c,
        current_user_id: targetUserId,
        due_date: newDueDate,
        rotation_order: swappedRotation,
      } : c),
      receipts: loanReceipt ? [loanReceipt, ...s.receipts] : s.receipts,
    }));

    sendNotification(
      "Chore Turn Swapped!",
      `${targetUser.name}, ${loaner.name} swapped "${targetChore.name}" with you! You have 60h to complete it.`
    );
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

  removeUser: async (_id) => {
    console.warn("User deletion is disabled by house rules.");
    alert("Deleting roommates is disabled by house rules.");
  },

  updateUserAway: async (id, start, end) => {
    const state = get();

    // Only allow the person who is selected in "🏠 I am" to toggle their away status
    if (!state.currentUserId || state.currentUserId !== id) {
      alert("You can only change your own away status. Please select your name in '🏠 I am' at the top.");
      return;
    }

    const user = state.users.find(u => u.id === id);
    const previousAwayStart = user?.away_start ?? null;
    const userName = user ? user.name : "Roommate";

    await supabase.from("users").update({ away_start: start, away_end: end }).eq("id", id);
    
    const updatedUsers = state.users.map(u => u.id === id ? { ...u, away_start: start, away_end: end } : u);
    const now = Date.now();

    const isGoingAway = Boolean(start && end && isWithinInterval(now, { start: Math.min(start, end), end: Math.max(start, end) }));
    const isReturning = !start || !end;

    if (isGoingAway) {
      // Reassign chores currently on this user
      for (const chore of state.chores) {
        if (chore.current_user_id === id) {
          const nextUser = getNextUser(chore, updatedUsers);
          if (nextUser && nextUser.id !== id) {
            await supabase.from("chores").update({ current_user_id: nextUser.id }).eq("id", chore.id);

            const awayMsg = `${userName} is away; turn for "${chore.name}" passed to ${nextUser.name}`;
            await supabase.from("receipts").insert({
              user_id: id,
              chore_id: chore.id,
              type: "skip",
              details: {
                message: awayMsg,
                chore_name: chore.name,
                original_user_id: id,
                reassigned_to_id: nextUser.id,
                away_reassignment: true,
              },
              created_at: now,
            });

            await supabase.from("announcements").insert({
              author_id: id,
              title: `🏖️ Turn Passed: ${userName} is away`,
              message: `${userName} is away, so their turn for "${chore.name}" has passed to ${nextUser.name}.`,
              created_at: now,
            });

            set(s => ({
              chores: s.chores.map(c => c.id === chore.id ? { ...c, current_user_id: nextUser.id } : c),
            }));
          }
        }
      }
    } else if (isReturning) {
      // User is active again: check for chores to restore
      for (const chore of state.chores) {
        const moreThanOneDayLeft = (chore.due_date - now) > 24 * 60 * 60 * 1000;

        // 1. Two-person chore rule:
        // If there are exactly two people assigned/in rotation, one was away, the other person did it once already,
        // and now the away person comes back with > 1 day before due date, restore the turn to the person who came back.
        const eligibleUserIds = chore.assigned_user_ids && chore.assigned_user_ids.length > 0
          ? chore.assigned_user_ids
          : (chore.rotation_order && chore.rotation_order.length > 0 ? chore.rotation_order : state.users.map(u => u.id));

        const isTwoPersonChore = eligibleUserIds.length === 2 && eligibleUserIds.includes(id);

        if (isTwoPersonChore && moreThanOneDayLeft) {
          const otherUserId = eligibleUserIds.find(uid => uid !== id);
          const otherUser = state.users.find(u => u.id === otherUserId);
          const otherUserName = otherUser ? otherUser.name : "Roommate";

          if (chore.current_user_id === otherUserId) {
            // Check if other person completed the chore at least once
            const otherDidChore = state.receipts.some(
              r => r.chore_id === chore.id &&
                   r.type === 'completion' &&
                   r.user_id === otherUserId &&
                   (!previousAwayStart || r.created_at >= previousAwayStart - 1000)
            ) || state.history.some(
              h => h.chore_name === chore.name &&
                   h.user_name === otherUserName &&
                   (!previousAwayStart || h.completed_at >= previousAwayStart - 1000)
            );

            if (otherDidChore) {
              await supabase.from("chores").update({ current_user_id: id }).eq("id", chore.id);

              const restoreMsg = `${userName} returned from away; turn for "${chore.name}" restored to ${userName} (2-person chore, >1 day remaining)`;
              await supabase.from("receipts").insert({
                user_id: id,
                chore_id: chore.id,
                type: "skip",
                details: {
                  message: restoreMsg,
                  chore_name: chore.name,
                  turn_restored: true,
                  two_person_rule: true,
                },
                created_at: now,
              });

              await supabase.from("announcements").insert({
                author_id: id,
                title: `🔄 Turn Restored: ${userName}`,
                message: `${userName} returned from away! Since ${otherUserName} already did "${chore.name}" once and more than 1 day remains before the due date, the turn has been restored to ${userName}.`,
                created_at: now,
              });

              set(s => ({
                chores: s.chores.map(c => c.id === chore.id ? { ...c, current_user_id: id } : c),
              }));
              continue;
            }
          }
        }

        // 2. General uncompleted away reassignment with > 1 day left
        const latestAwayReceipt = state.receipts.find(
          r => r.chore_id === chore.id &&
               r.type === 'skip' &&
               (r.details as Record<string, unknown>)?.away_reassignment === true &&
               (r.details as Record<string, unknown>)?.original_user_id === id
        );

        if (latestAwayReceipt && moreThanOneDayLeft) {
          const completionSince = state.receipts.find(
            r => r.chore_id === chore.id &&
                 r.type === 'completion' &&
                 r.created_at > latestAwayReceipt.created_at
          );

          if (!completionSince && chore.current_user_id !== id) {
            await supabase.from("chores").update({ current_user_id: id }).eq("id", chore.id);

            const restoreMsg = `${userName} returned from away; turn for "${chore.name}" restored (>1 day remaining)`;
            await supabase.from("receipts").insert({
              user_id: id,
              chore_id: chore.id,
              type: "skip",
              details: {
                message: restoreMsg,
                chore_name: chore.name,
                turn_restored: true,
              },
              created_at: now,
            });

            await supabase.from("announcements").insert({
              author_id: id,
              title: `👋 Welcome Back: ${userName}`,
              message: `${userName} is back! Their turn for "${chore.name}" has been restored.`,
              created_at: now,
            });

            set(s => ({
              chores: s.chores.map(c => c.id === chore.id ? { ...c, current_user_id: id } : c),
            }));
          }
        }
      }
    }

    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, away_start: start, away_end: end } : u),
    }));
  },

  updateUserRentDueDate: async (id, date) => {
    await supabase.from("users").update({ rent_due_date: date }).eq("id", id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, rent_due_date: date } : u)
    }));
  },

  addChore: async (payload) => {
    const state = get();
    const eligibleUsers = payload.assigned_user_ids && payload.assigned_user_ids.length > 0
      ? state.users.filter(u => payload.assigned_user_ids!.includes(u.id))
      : state.users;
      
    if (eligibleUsers.length === 0) return;

    // Randomize initial rotation including all assigned users
    const rotation_order = shuffleArray(eligibleUsers.map(u => u.id));
    
    // Pick first active user for initial assignment, fallback to rotation_order[0]
    const now = Date.now();
    const activeRotation = rotation_order.filter(id => {
      const u = state.users.find(x => x.id === id);
      if (!u || !u.away_start || !u.away_end) return true;
      return !isWithinInterval(now, { start: Math.min(u.away_start, u.away_end), end: Math.max(u.away_start, u.away_end) });
    });
    const assignedUser = activeRotation.length > 0 ? activeRotation[0] : rotation_order[0];
    
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
    const targetChore = state.chores.find(c => c.id === choreId);
    if (!targetChore) return;

    const eligibleUsers = userIds && userIds.length > 0
      ? state.users.filter(u => userIds.includes(u.id))
      : state.users;
      
    const eligibleIds = eligibleUsers.map(u => u.id);

    // Preserve existing rotation order for users still assigned
    const existingOrder = targetChore.rotation_order || [];
    const preservedRotation: string[] = existingOrder.filter(id => eligibleIds.includes(id));
    // Append newly assigned users at the end
    eligibleIds.forEach(id => {
      if (!preservedRotation.includes(id)) {
        preservedRotation.push(id);
      }
    });

    // If current assignee is no longer part of this chore, reassign to first person in rotation
    let newCurrentUserId = targetChore.current_user_id;
    if (!eligibleIds.includes(newCurrentUserId)) {
      newCurrentUserId = preservedRotation.length > 0 ? preservedRotation[0] : (state.users[0]?.id || "");
    }
    
    await supabase.from("chores").update({
      assigned_user_ids: userIds && userIds.length > 0 ? userIds : null,
      rotation_order: preservedRotation,
      current_user_id: newCurrentUserId,
    }).eq("id", choreId);

    set(s => ({
      chores: s.chores.map(c => c.id === choreId ? {
        ...c,
        assigned_user_ids: userIds && userIds.length > 0 ? userIds : null,
        rotation_order: preservedRotation,
        current_user_id: newCurrentUserId,
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
    await supabase.from("announcements").insert({
      author_id: authorId,
      title,
      message,
      created_at: Date.now(),
    });
  },

  scheduleInspection: async (inspectionDateStr: string, customOffsets?: Record<string, 1 | 2 | 0>) => {
    const state = get();
    const currentUser = state.users.find(u => u.id === state.currentUserId);
    if (!isInspectionAuthorized(currentUser)) {
      alert("Only Minhaz and Ahmed are authorized to set house inspection dates.");
      return;
    }

    const [year, month, day] = inspectionDateStr.split('-').map(Number);
    if (!year || !month || !day) return;
    const inspectionDateObj = new Date(year, month - 1, day, 12, 0, 0);
    const inspectionTimestamp = inspectionDateObj.getTime();

    const shifts: Array<{
      chore_id: string;
      chore_name: string;
      previous_due_date: number;
      new_due_date: number;
      offset_days: number;
    }> = [];

    const updatedChores = [...state.chores];

    for (let i = 0; i < updatedChores.length; i++) {
      const chore = updatedChores[i];
      const offset = customOffsets && customOffsets[chore.id] !== undefined
        ? customOffsets[chore.id]
        : getDefaultInspectionOffset(chore.name);

      if (offset === 0) continue; // Roommate chose not to shift this chore

      const targetDate = new Date(year, month - 1, day - offset, 12, 0, 0);
      const [hours, minutes] = (chore.time_of_day || '09:00').split(':').map(Number);
      targetDate.setHours(hours || 0, minutes || 0, 0, 0);
      const newDueDate = targetDate.getTime();

      shifts.push({
        chore_id: chore.id,
        chore_name: chore.name,
        previous_due_date: chore.due_date,
        new_due_date: newDueDate,
        offset_days: offset,
      });

      updatedChores[i] = {
        ...chore,
        due_date: newDueDate,
      };

      await supabase.from("chores").update({ due_date: newDueDate }).eq("id", chore.id);
    }

    const authorName = currentUser?.name || 'Roommate';
    const authorId = state.currentUserId || state.users[0]?.id || '';
    const formattedDate = format(inspectionDateObj, 'EEEE, MMMM d, yyyy');

    await supabase.from("announcements").insert({
      author_id: authorId,
      title: `🔍 House Inspection Scheduled: ${format(inspectionDateObj, 'MMM d, yyyy')}`,
      message: `${authorName} scheduled house inspection for ${formattedDate}. ${shifts.length} chores have been aligned to 1 or 2 days prior to inspection so the house is thoroughly cleaned! Check your dashboard for updated deadlines.`,
      created_at: Date.now(),
    });

    const { data: newReceipt } = await supabase.from("receipts").insert({
      user_id: authorId,
      chore_id: null,
      type: "inspection",
      details: {
        action: "schedule",
        inspection_date: inspectionDateStr,
        inspection_timestamp: inspectionTimestamp,
        author_name: authorName,
        shifts: shifts,
      },
      created_at: Date.now(),
    }).select();

    set({
      chores: updatedChores,
      inspectionDate: inspectionTimestamp,
      receipts: newReceipt ? [newReceipt[0], ...state.receipts] : state.receipts,
    });
  },

  clearInspection: async (restorePreviousDates = false) => {
    const state = get();
    const currentUser = state.users.find(u => u.id === state.currentUserId);
    if (!isInspectionAuthorized(currentUser)) {
      alert("Only Minhaz and Ahmed are authorized to clear house inspection dates.");
      return;
    }

    const latestInspectionReceipt = state.receipts.find(
      r => r.type === 'inspection' && (r.details as Record<string, unknown>)?.action === 'schedule'
    );

    let updatedChores = [...state.chores];

    if (restorePreviousDates && latestInspectionReceipt) {
      const shifts = (latestInspectionReceipt.details as Record<string, unknown>)?.shifts as Array<{
        chore_id: string;
        previous_due_date: number;
      }> | undefined;

      if (shifts && shifts.length > 0) {
        for (const shift of shifts) {
          await supabase.from("chores").update({ due_date: shift.previous_due_date }).eq("id", shift.chore_id);
          const idx = updatedChores.findIndex(c => c.id === shift.chore_id);
          if (idx !== -1) {
            updatedChores[idx] = { ...updatedChores[idx], due_date: shift.previous_due_date };
          }
        }
      }
    }

    const authorName = currentUser?.name || 'Roommate';
    const authorId = state.currentUserId || state.users[0]?.id || '';

    await supabase.from("announcements").insert({
      author_id: authorId,
      title: `🔍 Inspection Schedule Cleared`,
      message: `${authorName} cleared the upcoming house inspection schedule${restorePreviousDates ? ' and restored original chore deadlines' : ''}.`,
      created_at: Date.now(),
    });

    const { data: newReceipt } = await supabase.from("receipts").insert({
      user_id: authorId,
      chore_id: null,
      type: "inspection",
      details: {
        action: "clear",
        cleared_by: authorName,
        restored_previous_dates: restorePreviousDates,
      },
      created_at: Date.now(),
    }).select();

    set({
      chores: updatedChores,
      inspectionDate: null,
      receipts: newReceipt ? [newReceipt[0], ...state.receipts] : state.receipts,
    });
  },
}));
