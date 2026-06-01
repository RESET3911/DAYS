import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import type { CalendarEvent } from '../types';

const COL = 'st_calendar_events';

async function notifyOtherUser(eventTitle: string, eventDate: string, fromUser: string) {
  try {
    const functions = getFunctions(undefined, 'asia-northeast1');
    const fn = httpsCallable(functions, 'notifyCalendarEvent');
    await fn({ eventTitle, eventDate, fromUser });
  } catch { /* non-critical */ }
}

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
      notifyOtherUser(ev.title, ev.date, ev.createdBy);
    } catch (err) {
      console.error('addEvent failed:', err);
      throw err; // re-throw so EventModal can show error
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
