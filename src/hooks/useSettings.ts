import { useState, useEffect } from 'react';

export interface CustomTemplate {
  id: string;
  icon: string;
  type: string;
  description: string;
  defaultDays: number;
  subTasks: { title: string }[];
}

const STAMPS_KEY    = 'days_custom_stamps';
const TEMPLATES_KEY = 'days_custom_templates';

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) as T : fallback;
  } catch { return fallback; }
}

export function useSettings() {
  const [customStamps, setCustomStamps]       = useState<string[]>(() => read(STAMPS_KEY, []));
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => read(TEMPLATES_KEY, []));

  useEffect(() => { localStorage.setItem(STAMPS_KEY, JSON.stringify(customStamps)); }, [customStamps]);
  useEffect(() => { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customTemplates)); }, [customTemplates]);

  const addCustomStamp = (emoji: string) => {
    const e = emoji.trim();
    if (!e) return;
    setCustomStamps(prev => prev.includes(e) ? prev : [...prev, e]);
  };
  const removeCustomStamp = (emoji: string) =>
    setCustomStamps(prev => prev.filter(s => s !== emoji));

  const addCustomTemplate = (t: Omit<CustomTemplate, 'id'>) =>
    setCustomTemplates(prev => [...prev, { ...t, id: `ct_${Date.now()}` }]);
  const removeCustomTemplate = (id: string) =>
    setCustomTemplates(prev => prev.filter(t => t.id !== id));

  return {
    customStamps, addCustomStamp, removeCustomStamp,
    customTemplates, addCustomTemplate, removeCustomTemplate,
  };
}
