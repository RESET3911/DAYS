import { useEffect, useState } from 'react';
import { collection, onSnapshot, setDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface StampDay {
  stamps: string[];
  notes: Record<string, string>; // emoji → memo
}

export function useStamps(userId: string | null) {
  const [stampDayByDate, setStampDayByDate] = useState<Record<string, StampDay>>({});

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'st_days_stamps'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      const map: Record<string, StampDay> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[data.date as string] = {
          stamps: (data.stamps || []) as string[],
          notes:  (data.notes  || {}) as Record<string, string>,
        };
      });
      setStampDayByDate(map);
    }, (err) => console.warn('useStamps error:', err));
  }, [userId]);

  const stampsByDate: Record<string, string[]> = {};
  for (const [date, day] of Object.entries(stampDayByDate)) {
    stampsByDate[date] = day.stamps;
  }

  const write = async (date: string, day: StampDay) => {
    if (!userId) return;
    await setDoc(doc(db, 'st_days_stamps', `${userId}_${date}`), {
      date, stamps: day.stamps, notes: day.notes, userId, updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  const addStamp = async (date: string, stamp: string) => {
    const cur = stampDayByDate[date] ?? { stamps: [], notes: {} };
    if (cur.stamps.includes(stamp)) return;
    await write(date, { ...cur, stamps: [...cur.stamps, stamp] });
  };

  const removeStamp = async (date: string, stamp: string) => {
    const cur = stampDayByDate[date] ?? { stamps: [], notes: {} };
    const notes = { ...cur.notes }; delete notes[stamp];
    await write(date, { stamps: cur.stamps.filter(s => s !== stamp), notes });
  };

  const toggleStamp = async (date: string, stamp: string) => {
    const cur = stampDayByDate[date] ?? { stamps: [], notes: {} };
    if (cur.stamps.includes(stamp)) return removeStamp(date, stamp);
    return addStamp(date, stamp);
  };

  const setStampNote = async (date: string, stamp: string, note: string) => {
    const cur = stampDayByDate[date] ?? { stamps: [], notes: {} };
    await write(date, { stamps: cur.stamps, notes: { ...cur.notes, [stamp]: note } });
  };

  return { stampsByDate, stampDayByDate, addStamp, removeStamp, toggleStamp, setStampNote };
}
