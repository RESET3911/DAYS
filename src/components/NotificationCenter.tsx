import { useState } from 'react';
import type { AppNotification } from '../hooks/useNotifications';

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRemove: (id: string) => void;
}

const APP_ICON: Record<string, string> = {
  calendar: '📅', cashflow: '💴', ringi: '📝', wishlist: '🛍️', konomi: '💜',
};

function relTime(ms: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1)  return 'たった今';
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `${d}日前`;
  const date = new Date(ms);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function NotificationCenter({ notifications, unreadCount, onMarkRead, onMarkAllRead, onRemove }: Props) {
  const [open, setOpen] = useState(false);

  const handleTap = (n: AppNotification) => {
    if (!n.isRead) onMarkRead(n.id);
    if (n.linkedUrl && n.fromApp !== 'calendar') window.open(n.linkedUrl, '_blank', 'noopener');
  };

  return (
    <div className="relative flex-shrink-0">
      <button onClick={() => setOpen(v => !v)} title="通知"
        className="w-8 h-8 rounded-full flex items-center justify-center text-base relative transition-transform active:scale-90"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: 'var(--rose)', fontSize: 9 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* tap-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-10 z-50 rounded-2xl overflow-hidden shadow-xl"
            style={{ width: 300, maxWidth: '85vw', background: 'var(--surface)', border: '1px solid var(--border)' }}>

            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>通知</span>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead}
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)' }}>
                  すべて既読
                </button>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                  通知はありません
                </div>
              )}

              {notifications.map((n, i) => (
                <div key={n.id}
                  onClick={() => handleTap(n)}
                  className="px-4 py-3 flex gap-3 cursor-pointer transition-colors active:opacity-70"
                  style={{
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    background: n.isRead ? 'var(--surface)' : 'rgba(124,58,237,.05)',
                  }}>
                  <span className="text-lg flex-shrink-0 leading-tight">{APP_ICON[n.fromApp] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>{n.title}</div>
                    {n.body && (
                      <div className="text-xs mt-0.5 whitespace-pre-line leading-snug" style={{ color: 'var(--text-2)' }}>{n.body}</div>
                    )}
                    <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{relTime(n.createdAt)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onRemove(n.id); }}
                    className="flex-shrink-0 self-start text-xs px-1.5 py-0.5 rounded-lg"
                    style={{ color: 'var(--text-3)' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
