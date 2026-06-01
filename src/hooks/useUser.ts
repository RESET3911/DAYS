import { useState } from 'react';
import type { UserId } from '../types';

const STORAGE_KEY = 'stcal_user';

export function useUser() {
  const [userId, setUserId] = useState<UserId | null>(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'saku' || v === 'takahashi' ? v : null;
  });

  const selectUser = (id: UserId) => {
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  };

  const clearUser = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  };

  return { userId, selectUser, clearUser };
}
