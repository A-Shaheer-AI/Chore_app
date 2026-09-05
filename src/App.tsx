import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Management } from './components/Management';
import { Rules } from './components/Rules';
import { Receipts } from './components/Receipts';
import { Announcements } from './components/Announcements';
import { useStore, requestNotificationPermission } from './store';

function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'management' | 'receipts' | 'announcements' | 'rules'>('dashboard');
  const { init, isLoaded, users, currentUserId, setCurrentUser } = useStore();

  useEffect(() => {
    init();
    // Ask for notification permission once
    requestNotificationPermission();
  }, [init]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading live data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top bar: user selector */}
      <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold">👤 I am:</span>
        <select
          value={currentUserId ?? ''}
          onChange={e => setCurrentUser(e.target.value)}
          className="text-sm bg-white text-gray-800 rounded px-2 py-1 font-medium"
        >
          <option value="">-- select your name --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex overflow-x-auto">
          {([
            ['dashboard',     'Dashboard'],
            ['management',    'Manage'],
            ['receipts',      'Receipts'],
            ['announcements', 'News'],
            ['rules',         'Rules'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              className={`flex-1 py-3 font-bold text-center border-b-4 transition-colors text-sm whitespace-nowrap px-1 ${
                currentTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setCurrentTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-12">
        {currentTab === 'dashboard'     && <Dashboard />}
        {currentTab === 'management'    && <Management />}
        {currentTab === 'receipts'      && <Receipts />}
        {currentTab === 'announcements' && <Announcements />}
        {currentTab === 'rules'         && <Rules />}
      </main>
    </div>
  );
}

export default App;
