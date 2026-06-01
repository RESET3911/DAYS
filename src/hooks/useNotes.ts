import { useEffect, useState } from 'react';
import { collection, onSnapshot, setDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useNotes(userId: string | null) {
  const [notesByDate, setNotesByDate] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'st_days_notes'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[data.date as string] = data.content as string;
      });
      setNotesByDate(map);
    }, () => {});
  }, [userId]);

  const saveNote = async (date: string, content: string) => {
    if (!userId) return;
    await setDoc(doc(db, 'st_days_notes', `${userId}_${date}`), {
      date, content, userId, updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  return { notesByDate, saveNote };
}
