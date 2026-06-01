import { useEffect, useState } from 'react';
import { collection, onSnapshot, setDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useStamps(userId: string | null) {
  const [stampsByDate, setStampsByDate] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'st_days_stamps'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      const map: Record<string, string[]> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[data.date as string] = (data.stamps || []) as string[];
      });
      setStampsByDate(map);
    }, () => {});
  }, [userId]);

  const toggleStamp = async (date: string, stamp: string) => {
    if (!userId) return;
    const current = stampsByDate[date] || [];
    const next = current.includes(stamp)
      ? current.filter(s => s !== stamp)
      : [...current, stamp];
    await setDoc(doc(db, 'st_days_stamps', `${userId}_${date}`), {
      date, stamps: next, userId, updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  return { stampsByDate, toggleStamp };
}
