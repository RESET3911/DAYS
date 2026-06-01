import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Todo } from '../types';

export function useTodos(userId: string | null) {
  const [todosByDate, setTodosByDate] = useState<Record<string, Todo[]>>({});

  useEffect(() => {
    if (!userId) return;
    // orderBy removed — composite index not required, sort client-side
    const q = query(collection(db, 'st_days_todos'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      const map: Record<string, Todo[]> = {};
      snap.docs.forEach(d => {
        const t = { id: d.id, ...d.data() } as Todo;
        (map[t.date] ||= []).push(t);
      });
      // Sort each day by creation time client-side
      for (const todos of Object.values(map)) {
        todos.sort((a: any, b: any) =>
          (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
        );
      }
      setTodosByDate(map);
    }, (err) => console.warn('useTodos error:', err));
  }, [userId]);

  const addTodo = async (date: string, title: string) => {
    if (!userId || !title.trim()) return;
    await addDoc(collection(db, 'st_days_todos'), {
      date, title: title.trim(), done: false,
      userId, createdAt: serverTimestamp(),
    });
  };

  const toggleTodo = async (id: string, done: boolean) => {
    await updateDoc(doc(db, 'st_days_todos', id), { done: !done });
  };

  const deleteTodo = async (id: string) => {
    await deleteDoc(doc(db, 'st_days_todos', id));
  };

  return { todosByDate, addTodo, toggleTodo, deleteTodo };
}
