import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Anniversary {
  id: string;
  title: string;
  type: 'anniversary' | 'birthday' | 'other';
  month: number;         // 1-12
  day: number;           // 1-31
  startYear: number | null;
  color: string;
  notifyDaysBefore: number;
  createdBy: string;
}

const COL = 'st_anniversaries';

/**
 * Given the current year, generate the YYYY-MM-DD string for this anniversary's
 * next upcoming occurrence (could be this year or next year).
 */
export function nextOccurrence(ann: Anniversary): { dateStr: string; daysLeft: number; yearsElapsed: number | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();

  let candidate = new Date(thisYear, ann.month - 1, ann.day);
  if (candidate < today) candidate = new Date(thisYear + 1, ann.month - 1, ann.day);

  const pad    = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
  const daysLeft = Math.round((candidate.getTime() - today.getTime()) / 86400000);
  const yearsElapsed = ann.startYear
    ? candidate.getFullYear() - ann.startYear
    : null;

  return { dateStr, daysLeft, yearsElapsed };
}

/**
 * Generate all occurrences of an anniversary in [yearStart, yearEnd].
 * Returns YYYY-MM-DD strings.
 */
export function annDatesInRange(ann: Anniversary, yearStart: number, yearEnd: number): string[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dates: string[] = [];
  for (let y = yearStart; y <= yearEnd; y++) {
    dates.push(`${y}-${pad(ann.month)}-${pad(ann.day)}`);
  }
  return dates;
}

export function useAnniversaries() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COL), snap => {
      setAnniversaries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Anniversary)));
    });
    return unsub;
  }, []);

  const addAnniversary = async (data: Omit<Anniversary, 'id'>) => {
    await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  };

  const updateAnniversary = async (id: string, data: Partial<Anniversary>) => {
    await updateDoc(doc(db, COL, id), data as Record<string, unknown>);
  };

  const deleteAnniversary = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return { anniversaries, addAnniversary, updateAnniversary, deleteAnniversary };
}
