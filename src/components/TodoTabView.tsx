import { useState } from 'react';
import type { Todo } from '../types';

const WDS = ['日', '月', '火', '水', '木', '金', '土'];
const pad  = (n: number) => String(n).padStart(2, '0');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtDateLabel(ds: string) {
  const today = todayStr();
  const d = new Date(ds + 'T00:00:00');
  const diff = Math.round((new Date(ds + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
  if (diff === 0) return '今日';
  if (diff === 1) return '明日';
  if (diff === -1) return '昨日';
  return `${d.getMonth() + 1}/${d.getDate()}（${WDS[d.getDay()]}）`;
}

interface Props {
  todosByDate: Record<string, Todo[]>;
  onAdd: (date: string, title: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoTabView({ todosByDate, onAdd, onToggle, onDelete }: Props) {
  const today   = todayStr();
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  // Sort dates: today first, then future, then past
  const allDates = Object.keys(todosByDate).sort((a, b) => {
    const ad = a === today ? -1 : a > today ? 0 : 1;
    const bd = b === today ? -1 : b > today ? 0 : 1;
    return ad !== bd ? ad - bd : a.localeCompare(b);
  });

  const submitToday = async () => {
    if (!input.trim()) return;
    await onAdd(today, input);
    setInput('');
    setAdding(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-3 flex flex-col gap-4"
      style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>

      {/* Add today's todo */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
          今日のToDo
        </div>

        {/* Today's todos */}
        {(todosByDate[today] || []).map(t => (
          <div key={t.id} className="flex items-center gap-2 py-1.5 group">
            <button onClick={() => onToggle(t.id, t.done)}
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: t.done ? 'var(--emerald)' : 'var(--border)',
                background:  t.done ? 'rgba(5,150,105,.12)' : 'transparent',
              }}>
              {t.done && <span style={{ fontSize: 10, color: 'var(--emerald)' }}>✓</span>}
            </button>
            <span className="flex-1 text-sm" style={{
              color: t.done ? 'var(--text-3)' : 'var(--text)',
              textDecoration: t.done ? 'line-through' : 'none',
            }}>{t.title}</span>
            <button onClick={() => onDelete(t.id)}
              className="opacity-0 group-hover:opacity-60 text-xs px-1"
              style={{ color: 'var(--text-3)' }}>✕</button>
          </div>
        ))}

        {/* Quick add */}
        {adding ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--border)' }} />
            <input autoFocus value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitToday(); if (e.key === 'Escape') setAdding(false); }}
              onBlur={() => { if (!input) setAdding(false); }}
              placeholder="ToDoを入力…"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: 'var(--text)' }}
            />
            <button onClick={submitToday}
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)' }}>
              追加
            </button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm mt-2 py-0.5"
            style={{ color: 'var(--text-3)' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
            <span>ToDoを追加</span>
          </button>
        )}
      </div>

      {/* Other dates */}
      {allDates.filter(d => d !== today && (todosByDate[d] || []).some(t => !t.done)).map(date => (
        <div key={date} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-bold mb-2" style={{ color: date < today ? 'var(--rose)' : 'var(--text-3)' }}>
            {date < today ? '⚠️ ' : ''}{fmtDateLabel(date)}
          </div>
          {(todosByDate[date] || []).filter(t => !t.done).map(t => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 group">
              <button onClick={() => onToggle(t.id, t.done)}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'var(--border)', background: 'transparent' }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{t.title}</span>
              <button onClick={() => onDelete(t.id)}
                className="opacity-0 group-hover:opacity-60 text-xs px-1"
                style={{ color: 'var(--text-3)' }}>✕</button>
            </div>
          ))}
        </div>
      ))}

      {/* Completed section */}
      {allDates.some(d => (todosByDate[d] || []).some(t => t.done)) && (
        <details className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <summary className="px-4 py-3 text-xs font-bold cursor-pointer select-none"
            style={{ background: 'var(--surface)', color: 'var(--text-3)', listStyle: 'none' }}>
            ✓ 完了済み
          </summary>
          <div className="px-4 pb-3 pt-1" style={{ background: 'var(--bg)' }}>
            {allDates.flatMap(d => (todosByDate[d] || []).filter(t => t.done)).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(5,150,105,.12)', border: '1.5px solid rgba(5,150,105,.3)' }}>
                  <span style={{ fontSize: 10, color: 'var(--emerald)' }}>✓</span>
                </div>
                <span className="flex-1 text-sm line-through" style={{ color: 'var(--text-3)' }}>{t.title}</span>
                <button onClick={() => onDelete(t.id)}
                  className="text-xs opacity-40 px-1" style={{ color: 'var(--text-3)' }}>✕</button>
              </div>
            ))}
          </div>
        </details>
      )}

      {allDates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3"
          style={{ color: 'var(--text-3)' }}>
          <span style={{ fontSize: 40, opacity: 0.3 }}>✅</span>
          <p className="text-sm">ToDoはありません</p>
        </div>
      )}
    </div>
  );
}
