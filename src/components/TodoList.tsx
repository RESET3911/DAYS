import { useState, useRef } from 'react';
import type { Todo } from '../types';

interface Props {
  todos: Todo[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoList({ todos, onAdd, onToggle, onDelete }: Props) {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!input.trim()) return;
    await onAdd(input);
    setInput('');
  };

  const done   = todos.filter(t => t.done);
  const undone = todos.filter(t => !t.done);

  return (
    <div>
      {/* Todo items */}
      <ul className="flex flex-col gap-1 mb-1.5">
        {[...undone, ...done].map(t => (
          <li key={t.id} className="flex items-center gap-2 group">
            <button
              onClick={() => onToggle(t.id, t.done)}
              className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: t.done ? 'var(--emerald)' : 'var(--border)',
                background:  t.done ? 'rgba(5,150,105,.15)' : 'transparent',
              }}>
              {t.done && <span style={{ fontSize: 10, color: 'var(--emerald)' }}>✓</span>}
            </button>
            <span className="flex-1 text-sm" style={{
              color: t.done ? 'var(--text-3)' : 'var(--text)',
              textDecoration: t.done ? 'line-through' : 'none',
            }}>
              {t.title}
            </span>
            <button onClick={() => onDelete(t.id)}
              className="opacity-0 group-hover:opacity-100 text-xs transition-opacity px-1"
              style={{ color: 'var(--text-3)' }}>
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Add input */}
      {adding ? (
        <div className="flex items-center gap-2 mt-1">
          <div className="w-5 h-5 flex-shrink-0 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
            onBlur={() => { if (!input) setAdding(false); }}
            placeholder="ToDoを入力…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
          <button onClick={submit} className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ background: 'rgba(124,58,237,.12)', color: 'var(--purple)' }}>
            追加
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 30); }}
          className="flex items-center gap-2 text-sm mt-1 w-full text-left py-0.5"
          style={{ color: 'var(--text-3)' }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
          <span>ToDo を追加</span>
        </button>
      )}
    </div>
  );
}
