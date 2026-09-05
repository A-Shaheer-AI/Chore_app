import os

# ───────────────────────────────────────────────
# Rules.tsx
# ───────────────────────────────────────────────
rules = """\
import { Info, AlertTriangle, Plane, Crown, Trophy, Bell } from 'lucide-react';

export const Rules = () => {
  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          &#127922; House Rules
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to our household management system! Chore Roulette keeps our shared
          spaces clean while making it fair, transparent, and a little competitive.
        </p>
        <div className="space-y-6">

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-blue-500" /> The Roulette Wheel
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>The Rotation:</strong> The wheel runs clockwise among all active members.</li>
              <li><strong>Up Next:</strong> The highlighted name in the center is currently on duty.</li>
              <li><strong>Completing a Chore:</strong> Click <strong>I have done it!</strong> — points are awarded and the next person is assigned.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Point System &amp; Scoreboard
            </h2>
            <p className="text-gray-600 mb-3">Points are awarded automatically on completion:</p>
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-green-600">+10 pts</span>
                <span className="text-sm text-green-800"><strong>Perfect:</strong> Done on time or within 24 hrs.</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-orange-600">+5 pts</span>
                <span className="text-sm text-orange-800"><strong>Late:</strong> Done 24–48 hrs late.</span>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-red-600">-4 pts</span>
                <span className="text-sm text-red-800"><strong>Penalty:</strong> Over 48 hrs late — you owe the house food!</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-purple-600">+1 pt</span>
                <span className="text-sm text-purple-800"><strong>Photo Bonus:</strong> Upload a photo when marking a chore done.</span>
              </div>
              <div className="bg-pink-50 border border-pink-200 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-pink-600">+1 pt</span>
                <span className="text-sm text-pink-800"><strong>Cheer Bonus:</strong> Another flat-mate can cheer your receipt once to give you +1 pt.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Plane className="text-indigo-500" /> Skip-Turn Redemption
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Spend <strong>100 points</strong> to skip your next chore assignment — one-time use, one chore only.</li>
              <li>When the wheel reaches your turn it is automatically skipped and passes to the next person.</li>
              <li>The skip is logged in the Receipts feed for full transparency.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-purple-500" /> Photo Bonus
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Optionally upload a photo when marking a chore done to earn <strong>+1 bonus point</strong>.</li>
              <li>Photos are stored for <strong>7 days</strong> and then automatically deleted.</li>
              <li>Photos appear in the Receipts feed where others can cheer them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Trophy className="text-pink-500" /> Cheer Others
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>In the Receipts feed, tap <strong>Cheer</strong> on any completion or photo entry.</li>
              <li>The person you cheer receives <strong>+1 point</strong>.</li>
              <li>You can only cheer a given receipt <strong>once</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" /> The 48-Hour Deadline
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>0–24 hrs late:</strong> Due date turns orange.</li>
              <li><strong>24–48 hrs late:</strong> Flashing orange WARNING badge.</li>
              <li><strong>48+ hrs late:</strong> Flashing red PENALTY MODE — you owe the house food!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Plane className="text-indigo-500" /> I am Away!
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Toggle <strong>Away</strong> in the Management tab when you leave town.</li>
              <li>You are removed from the wheel while away; chores reassign automatically.</li>
              <li>Remember to toggle back to <strong>Active</strong> when you return!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Bell className="text-blue-400" /> Browser Notifications
            </h2>
            <p className="text-gray-600 mb-2">Grant notification permission when prompted. You will be notified when:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>It becomes your turn on the wheel.</li>
              <li>Your chore is 24 hrs overdue, then again at 48 hrs.</li>
              <li>Your rent is due in <strong>4 days</strong>.</li>
              <li>Any flat-mate posts a new announcement.</li>
              <li>A skip-turn token is used that affects your turn.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Info className="text-green-600" /> Announcements
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Post house-wide alerts in the <strong>Announcements</strong> tab.</li>
              <li>All announcements are kept <strong>permanently</strong> — full history is always visible.</li>
              <li>Every flat-mate gets a browser notification when a new announcement is posted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Crown className="text-yellow-600" /> Rent Reminders
            </h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Each flat-mate sets their own rent due date in the Management tab.</li>
              <li>The app sends a personal browser notification <strong>4 days before</strong> rent is due.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
              <Crown className="text-yellow-600" /> Solo Caretaker Reward
            </h2>
            <p className="text-gray-600">
              If everyone goes away and leaves exactly <strong>one person</strong> behind, a gold banner
              activates on the dashboard. The rest of the house owes that person a{' '}
              <strong>food treat upon return!</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
"""

# ───────────────────────────────────────────────
# Receipts.tsx
# ───────────────────────────────────────────────
receipts = """\
import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store';
import { Heart, CheckCircle, Camera, SkipForward, Megaphone } from 'lucide-react';

const TYPE_META: Record<string, { icon: JSX.Element; label: string; color: string }> = {
  completion: { icon: <CheckCircle size={18} className="text-green-500" />, label: 'Completed chore', color: 'green' },
  photo:      { icon: <Camera size={18} className="text-purple-500" />,     label: 'Photo uploaded', color: 'purple' },
  cheer:      { icon: <Heart size={18} className="text-pink-500" />,        label: 'Cheered',        color: 'pink' },
  skip:       { icon: <SkipForward size={18} className="text-indigo-500" />,label: 'Turn skipped',   color: 'indigo' },
  announcement:{ icon: <Megaphone size={18} className="text-yellow-500" />, label: 'Announcement',   color: 'yellow' },
};

export const Receipts = () => {
  const { receipts, users, currentUserId, cheerReceipt } = useStore();
  const [cheeredIds, setCheeredIds] = useState<Set<string>>(new Set());

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  const handleCheer = async (receiptId: string, receiptUserId: string) => {
    if (!currentUserId || cheeredIds.has(receiptId) || currentUserId === receiptUserId) return;
    setCheeredIds(prev => new Set([...prev, receiptId]));
    await cheerReceipt(receiptId, currentUserId, receiptUserId);
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4 pb-20">
      <div className="bg-white p-4 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">&#127981; Receipts</h1>
        <p className="text-gray-500 text-sm mb-4">Activity feed — completions, photos, cheers and skips.</p>

        {receipts.length === 0 && (
          <p className="text-center text-gray-400 py-8">No activity yet. Complete a chore to get started!</p>
        )}

        <ul className="divide-y divide-gray-100">
          {receipts.map(r => {
            const meta = TYPE_META[r.type] ?? TYPE_META.completion;
            const canCheer = currentUserId && r.type !== 'cheer' && r.type !== 'skip' && currentUserId !== r.user_id;
            const alreadyCheered = cheeredIds.has(r.id);
            const details = r.details as Record<string, unknown>;

            return (
              <li key={r.id} className="py-4 flex items-start gap-3">
                <div className="mt-1">{meta.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">
                    {getUserName(r.user_id)}{' '}
                    <span className="font-normal text-gray-500">{meta.label}</span>
                    {typeof details.points_awarded === 'number' && details.points_awarded !== 0 && (
                      <span className={`ml-2 text-xs font-bold ${(details.points_awarded as number) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(details.points_awarded as number) > 0 ? '+' : ''}{details.points_awarded as number} pts
                      </span>
                    )}
                  </p>
                  {details.message && (
                    <p className="text-xs text-gray-500 mt-0.5">{details.message as string}</p>
                  )}
                  {details.storage_path && (
                    <p className="text-xs text-purple-500 mt-0.5 italic">&#128247; Photo attached</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{format(r.created_at, 'MMM do, h:mm a')}</p>
                </div>
                {canCheer && (
                  <button
                    onClick={() => handleCheer(r.id, r.user_id)}
                    disabled={alreadyCheered}
                    className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                      alreadyCheered
                        ? 'bg-pink-100 text-pink-400 cursor-not-allowed'
                        : 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200'
                    }`}
                  >
                    {alreadyCheered ? '&#127881; Cheered!' : '&#127881; Cheer +1'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
"""

# ───────────────────────────────────────────────
# Announcements.tsx
# ───────────────────────────────────────────────
announcements = """\
import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store';
import { Megaphone, Send } from 'lucide-react';

export const Announcements = () => {
  const { announcements, users, currentUserId, postAnnouncement } = useStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  const handlePost = async () => {
    if (!currentUserId || !title.trim() || !message.trim()) return;
    setPosting(true);
    await postAnnouncement(currentUserId, title.trim(), message.trim());
    setTitle('');
    setMessage('');
    setPosting(false);
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4 pb-20">

      {/* Post box */}
      <div className="bg-white p-4 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Megaphone className="text-yellow-500" /> Announcements
        </h1>
        <p className="text-gray-500 text-sm mb-4">Post house-wide alerts. All announcements stay permanently.</p>

        {!currentUserId && (
          <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-3 mb-4">
            Select your name in the Management tab to post announcements.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Title (e.g. Water off tomorrow)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            disabled={!currentUserId}
          />
          <textarea
            placeholder="Message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            disabled={!currentUserId}
          />
          <button
            onClick={handlePost}
            disabled={posting || !currentUserId || !title.trim() || !message.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Send size={16} /> {posting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white p-4 rounded-2xl shadow-xl">
        <h2 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">All Announcements</h2>
        {announcements.length === 0 && (
          <p className="text-center text-gray-400 py-8">No announcements yet.</p>
        )}
        <ul className="divide-y divide-gray-100">
          {announcements.map(a => (
            <li key={a.id} className="py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-800">{a.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Posted by <span className="font-medium">{getUserName(a.author_id)}</span>
                    {' '}&#183; {format(a.created_at, 'MMM do yyyy, h:mm a')}
                  </p>
                </div>
                <Megaphone size={18} className="text-yellow-400 mt-1 shrink-0" />
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};
"""

# ───────────────────────────────────────────────
# store.ts
# ───────────────────────────────────────────────
store = """\
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
"""

# ───────────────────────────────────────────────
# Write all files
# ───────────────────────────────────────────────
files = {
    'src/components/Rules.tsx': rules,
    'src/components/Receipts.tsx': receipts,
    'src/components/Announcements.tsx': announcements,
    'src/store.ts': store,
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'OK  {path}  ({len(content.splitlines())} lines)')


