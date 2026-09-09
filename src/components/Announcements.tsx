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
            Select your name in <strong>"🏠 I am"</strong> at the top to post announcements.
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
