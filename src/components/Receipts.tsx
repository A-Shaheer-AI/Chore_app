import type { ReactElement } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store';
import { supabase } from '../supabase';
import { Heart, CheckCircle, Camera, SkipForward, Megaphone } from 'lucide-react';

const TYPE_META: Record<string, { icon: ReactElement; label: string; color: string }> = {
  completion: { icon: <CheckCircle size={18} className="text-green-500" />, label: 'Completed chore', color: 'green' },
  photo:      { icon: <Camera size={18} className="text-purple-500" />,     label: 'Photo uploaded', color: 'purple' },
  cheer:      { icon: <Heart size={18} className="text-pink-500" />,        label: 'Cheered',        color: 'pink' },
  skip:       { icon: <SkipForward size={18} className="text-indigo-500" />,label: 'Turn skipped',   color: 'indigo' },
  announcement:{ icon: <Megaphone size={18} className="text-yellow-500" />, label: 'Announcement',   color: 'yellow' },
};

export const Receipts = () => {
  const { receipts, users, currentUserId, cheers, cheerReceipt } = useStore();

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  const handleCheer = async (receiptId: string, receiptUserId: string) => {
    if (!currentUserId || currentUserId === receiptUserId) return;
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
            const alreadyCheered = Boolean(currentUserId && cheers.some(c => c.user_id === currentUserId && c.receipt_id === r.id));
            const cheerCount = cheers.filter(c => c.receipt_id === r.id).length;
            const details = r.details as Record<string, unknown>;

            return (
              <li key={r.id} className="py-4 flex items-start gap-3">
                <div className="mt-1">{meta.icon}</div>
                <div className="flex-1 min-w-0">
                  {r.type === 'cheer' ? (
                    <p className="font-semibold text-gray-800 text-sm">
                      {getUserName(String(details.cheerer_id))}{' '}
                      <span className="font-normal text-gray-500">cheered</span>{' '}
                      {getUserName(r.user_id)}
                      <span className="ml-2 text-xs font-bold text-green-600">+1 pt</span>
                    </p>
                  ) : (
                    <p className="font-semibold text-gray-800 text-sm">
                      {getUserName(r.user_id)}{' '}
                      <span className="font-normal text-gray-500">{meta.label}</span>
                      {typeof details.points_awarded === 'number' && details.points_awarded !== 0 && (
                        <span className={`ml-2 text-xs font-bold ${(details.points_awarded as number) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(details.points_awarded as number) > 0 ? '+' : ''}{details.points_awarded as number} pts
                        </span>
                      )}
                    </p>
                  )}

                  {typeof details.message === 'string' && details.message && (
                    <p className="text-xs text-gray-500 mt-0.5">{details.message}</p>
                  )}

                  {(() => {
                    const photoPath = (typeof details.storage_path === 'string' && details.storage_path)
                      ? details.storage_path
                      : (typeof details.photo_path === 'string' && details.photo_path)
                        ? details.photo_path
                        : null;

                    if (!photoPath) return null;
                    const publicUrl = supabase.storage.from('chore_photos').getPublicUrl(photoPath).data.publicUrl;

                    return (
                      <div className="mt-2">
                        <img
                          src={publicUrl}
                          alt="Chore proof"
                          className="rounded-xl max-h-60 max-w-full object-cover border border-gray-200 shadow-sm cursor-pointer hover:opacity-95"
                          onClick={() => window.open(publicUrl, '_blank')}
                          loading="lazy"
                        />
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400">{format(r.created_at, 'MMM do, h:mm a')}</p>
                    {cheerCount > 0 && (
                      <span className="text-xs text-pink-500 font-semibold flex items-center gap-1">
                        ❤️ {cheerCount} {cheerCount === 1 ? 'cheer' : 'cheers'}
                      </span>
                    )}
                  </div>
                </div>

                {canCheer && (
                  <button
                    onClick={() => handleCheer(r.id, r.user_id)}
                    disabled={alreadyCheered}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                      alreadyCheered
                        ? 'bg-pink-100 text-pink-400 cursor-not-allowed border border-pink-200'
                        : 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200 active:scale-95'
                    }`}
                  >
                    {alreadyCheered ? '🎉 Cheered' : '🎉 Cheer +1'}
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
