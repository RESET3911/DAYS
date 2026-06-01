import { useEffect, useRef, useState } from 'react';

interface Props {
  date: string;
  initialContent: string;
  onSave: (date: string, content: string) => Promise<void>;
}

export function DayNote({ date, initialContent, onSave }: Props) {
  const [text, setText] = useState(initialContent);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when date changes
  useEffect(() => { setText(initialContent); }, [date, initialContent]);

  const handleChange = (val: string) => {
    setText(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { onSave(date, val); }, 800);
  };

  return (
    <textarea
      value={text}
      onChange={e => handleChange(e.target.value)}
      placeholder="今日のメモ…"
      rows={3}
      className="w-full text-sm outline-none resize-none bg-transparent leading-relaxed"
      style={{ color: 'var(--text)' }}
    />
  );
}
