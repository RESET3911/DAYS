import { useState } from 'react';
import type { SubTask, Assignee } from '../types';
import { ASSIGNEE_LABELS } from '../data/templates';

const RINGI_URL    = 'https://RESET3911.github.io/RINGI/';
const WISHLIST_URL = 'https://RESET3911.github.io/ST_WISHLIST/';
const CASHFLOW_URL = 'https://RESET3911.github.io/CASHFLOW/';

interface Props { tasks: SubTask[]; onChange: (tasks: SubTask[]) => void; }

export function SubtaskList({ tasks, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggle = (id: string) =>
    onChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const update = (id: string, patch: Partial<SubTask>) =>
    onChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
  const remove = (id: string) => onChange(tasks.filter(t => t.id !== id));
  const addNew = () => {
    const id = `new_${Date.now()}`;
    onChange([...tasks, { id, title: '', done: false }]);
    setEditingId(id);
  };

  const getLinkedUrl = (app: SubTask['linkedApp']) => {
    if (app === 'RINGI') return RINGI_URL;
    if (app === 'WISHLIST') return WISHLIST_URL;
    if (app === 'CASHFLOW') return CASHFLOW_URL;
    return null;
  };
  const linkedAppColor: Record<string, string> = {
    RINGI: '#7c3aed', WISHLIST: '#e11d48', CASHFLOW: '#059669',
  };

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: '12px',
    outline: 'none',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          サブタスク ({tasks.filter(t => t.done).length}/{tasks.length})
        </span>
        <button onClick={addNew}
          className="text-xs px-3 py-1.5 rounded-xl font-bold transition-colors"
          style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)' }}>
          + 追加
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {tasks.map(task => (
          <div key={task.id} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            {editingId === task.id ? (
              <div className="p-3 space-y-2">
                <input autoFocus value={task.title}
                  onChange={e => update(task.id, { title: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                  placeholder="タスク名"
                  className="w-full text-sm bg-transparent outline-none"
                  style={{ color: 'var(--text)' }}
                />
                <div className="flex gap-2 flex-wrap">
                  <select value={task.assignee || 'both'}
                    onChange={e => update(task.id, { assignee: e.target.value as Assignee })}
                    style={inputStyle}>
                    <option value="both">2人</option>
                    <option value="kenshin">けんしん</option>
                    <option value="rena">れなちゃん</option>
                  </select>
                  <input type="date" value={task.dueDate || ''}
                    onChange={e => update(task.id, { dueDate: e.target.value || undefined })}
                    style={inputStyle}
                  />
                  <select value={task.linkedApp || ''}
                    onChange={e => update(task.id, { linkedApp: (e.target.value as SubTask['linkedApp']) || null })}
                    style={inputStyle}>
                    <option value="">連携なし</option>
                    <option value="RINGI">RINGI</option>
                    <option value="WISHLIST">WISHLIST</option>
                    <option value="CASHFLOW">CASHFLOW</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => remove(task.id)}
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ color: 'var(--rose)', background: 'rgba(225,29,72,.08)' }}>
                    削除
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="text-xs px-3 py-1 rounded-lg font-bold"
                    style={{ color: 'var(--purple)', background: 'rgba(124,58,237,.1)' }}>
                    完了
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button onClick={() => toggle(task.id)}
                  className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    background: task.done ? 'rgba(5,150,105,.15)' : 'var(--surface)',
                    border: task.done ? '1px solid rgba(5,150,105,.4)' : '1px solid var(--border)',
                    color: 'var(--emerald)',
                  }}>
                  {task.done && <span className="text-xs">✓</span>}
                </button>
                <span className="flex-1 text-sm cursor-pointer"
                  style={{ color: task.done ? 'var(--text-3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}
                  onClick={() => setEditingId(task.id)}>
                  {task.title || '（タスク名未入力）'}
                </span>
                {task.assignee && task.assignee !== 'both' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    {ASSIGNEE_LABELS[task.assignee]}
                  </span>
                )}
                {task.linkedApp && (() => {
                  const url   = getLinkedUrl(task.linkedApp);
                  const color = linkedAppColor[task.linkedApp] || 'var(--purple)';
                  return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0 font-bold"
                      style={{ background: `${color}15`, color }}
                      onClick={e => e.stopPropagation()}>
                      {task.linkedApp} →
                    </a>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
