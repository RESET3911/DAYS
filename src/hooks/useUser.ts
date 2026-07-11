import { useState } from 'react';
import type { UserId } from '../types';
import { loadUser, saveUser, clearUser } from '../shared/users';

const LEGACY = { key: 'stcal_user', map: { saku: 'kenshin', takahashi: 'rena' } as Record<string, UserId> };

export function useUser() {
  const [userId, setUserId] = useState<UserId | null>(() => loadUser(LEGACY));

  const selectUser = (id: UserId) => {
    saveUser(id);
    setUserId(id);
  };

  const clearUserSelection = () => {
    clearUser();
    setUserId(null);
  };

  return { userId, selectUser, clearUser: clearUserSelection };
}
