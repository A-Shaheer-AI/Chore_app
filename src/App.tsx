import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Management } from './components/Management';
import { Rules } from './components/Rules';
import { useStore } from './store';

function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'management' | 'rules'>('dashboard');
  const { init, isLoaded } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading live data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex">
          <button 
            className={`flex-1 py-4 font-bold text-center border-b-4 transition-colors ${currentTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-center border-b-4 transition-colors ${currentTab === 'management' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCurrentTab('management')}
          >
            Management
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-center border-b-4 transition-colors ${currentTab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCurrentTab('rules')}
          >
            Rules
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-12">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'management' && <Management />}
        {currentTab === 'rules' && <Rules />}
      </main>
    </div>
  );
}

export default App;
