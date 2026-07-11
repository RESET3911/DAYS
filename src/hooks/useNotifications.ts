import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserId } from '../types';

export interface AppNotification {
  id: string;
  toUser: UserId | 'both';
  fromApp: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  linkedUrl?: string;
  linkedId?: string | null;
  createdAt: number;
}

// createdAt は number（クライアント書き込み）か Firestore Timestamp（Functions）の両方がありうる
function toMillis(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof (v as { toMillis?: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function useNotifications(userId: UserId | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId) { setNotifications([]); return; }
    const q = query(collection(db, 'notifications'), where('toUser', 'in', [userId, 'both']));
    const unsub = onSnapshot(q,
      snap => {
        const items = snap.docs.map(d => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: toMillis(data.createdAt) } as AppNotification;
        });
        items.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(items);
      },
      err => console.error('useNotifications error:', err),
    );
    return unsub;
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
    await batch.commit();
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  return { notifications, unreadCount, markRead, markAllRead, remove };
}
