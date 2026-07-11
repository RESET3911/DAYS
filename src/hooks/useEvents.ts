import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { notifyEventAdded } from '../utils/notify';
import type { CalendarEvent } from '../types';

const COL = 'st_calendar_events';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('date', 'asc'));
    const unsub = onSnapshot(q,
      snap => {
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent)));
        setLoading(false);
      },
      err => {
        console.error('useEvents error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const addEvent = async (ev: Omit<CalendarEvent, 'id'>) => {
    try {
      await addDoc(collection(db, COL), { ...ev, createdAt: serverTimestamp() });
      // 相手へ即時通知（通知センター書き込み + ntfy push）。失敗してもイベント追加は成功扱い。
      notifyEventAdded(ev, ev.createdBy).catch(err => console.error('notifyEventAdded failed:', err));
    } catch (err) {
      console.error('addEvent failed:', err);
      throw err;
    }
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    await updateDoc(doc(db, COL, id), data as Record<string, unknown>);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return { events, loading, addEvent, updateEvent, deleteEvent };
}
