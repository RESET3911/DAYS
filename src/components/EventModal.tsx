import { useState, useEffect } from 'react';
import type { CalendarEvent, UserId, Assignee, SubTask, RepeatType } from '../types';
import { TemplateModal } from './TemplateModal';
import { SubtaskList } from './SubtaskList';
import { TEMPLATES, EVENT_COLORS, DEFAULT_COLOR, ASSIGNEE_LABELS, buildSubTasksFromTemplate } from '../data/templates';
import type { Template } from '../data/templates';

interface Props {
  initial?: Partial<CalendarEvent>;
  userId: UserId;
  onSave: (ev: Omit<CalendarEvent, 'id'> | CalendarEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const REPEAT_LABELS: Record<RepeatType, string> = {
  none: 'なし', daily: '毎日', weekly: '毎週', monthly: '毎月', yearly: '毎年',
};

const emptyEvent = (date: string, userId: UserId, startTime?: string): Omit<CalendarEvent, 'id'> => ({
  title: '',
  date,
  endDate: date,
  isAllDay: !startTime,
  startTime: startTime || '',
  endTime: startTime
    ? `${String((parseInt(startTime.split(':')[0]) + 1) % 24).padStart(2,'0')}:${startTime.split(':')[1]}`
    : '',
  assignee: 'both',
  createdBy: userId,
  subTasks: [],
  templateType: null,
  cashflowCategory: null,
  color: DEFAULT_COLOR,
  note: '',
  repeat: 'none',
});

export function EventModal({ initial, userId, onSave, onDelete, onClose }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'> & { id?: string }>(
    () => ({ ...emptyEvent(initial?.date || today, userId, initial?.startTime), ...initial })
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const applyTemplate = (t: Template) => {
    setShowTemplates(false);
    const tasks = buildSubTasksFromTemplate(t, userId);
    const endDate = new Date(form.date + 'T00:00:00');
    endDate.setDate(endDate.getDate() + t.defaultDays - 1);
    setForm(f => ({
      ...f,
      title: f.title || t.type,
      templateType: t.type,
      subTasks: tasks,
      cashflowCategory: t.cashflowCategory,
      endDate: endDate.toISOString().split('T')[0],
    }));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const templateInfo = form.templateType
    ? TEMPLATES.find(t => t.type === form.templateType)
    : null;

  const isEdit = !!initial?.id;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-6"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}>
        <div
          className="animate-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,.15)',
            maxHeight: '92dvh',
          }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-head font-extrabold text-sm tracking-tight">
              {isEdit ? 'イベントを編集' : 'イベントを追加'}
            </span>
            <button onClick={onClose} className="text-lg opacity-40 hover:opacity-70 transition-opacity">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>タイトル</label>
              <input
                autoFocus
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="イベント名を入力"
                className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-colors"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {/* Template button (only for new events) */}
            {!isEdit && (
              <button
                onClick={() => setShowTemplates(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-98"
                style={{
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px dashed rgba(167,139,250,0.35)',
                  color: 'var(--purple)',
                }}>
                {templateInfo ? (
                  <>
                    <span className="text-xl">{TEMPLATES.find(t => t.type === form.templateType)?.icon}</span>
                    <div>
                      <div className="text-xs font-bold">{form.templateType} テンプレート適用中</div>
                      <div className="text-xs opacity-60">クリックで変更</div>
                    </div>
                    <span className="ml-auto text-xs opacity-60">✕</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">📋</span>
                    <span className="text-sm font-bold">テンプレートから作成</span>
                    <span className="ml-auto text-xs opacity-60">›</span>
                  </>
                )}
              </button>
            )}

            {/* All-day toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>終日</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isAllDay: !f.isAllDay, startTime: '', endTime: '' }))}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: form.isAllDay !== false ? 'var(--purple)' : 'rgba(0,0,0,0.12)' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: form.isAllDay !== false ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>開始日</label>
                <input type="date" value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-3 outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>終了日</label>
                <input type="date" value={form.endDate || form.date}
                  min={form.date}
                  onChange={e => set('endDate', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-3 outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* Time (hidden when all-day) */}
            {form.isAllDay === false && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>開始時刻</label>
                  <input type="time" value={form.startTime || ''}
                    onChange={e => set('startTime', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-3 outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>終了時刻</label>
                  <input type="time" value={form.endTime || ''}
                    onChange={e => set('endTime', e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-3 outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            )}

            {/* Repeat */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>繰り返し</label>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(REPEAT_LABELS) as [RepeatType, string][]).map(([k, v]) => (
                  <button key={k} type="button"
                    onClick={() => set('repeat', k)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: form.repeat === k ? 'rgba(124,58,237,0.12)' : 'var(--bg)',
                      border: form.repeat === k ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
                      color: form.repeat === k ? 'var(--purple)' : 'var(--text-2)',
                    }}>
                    {v}
                  </button>
                ))}
              </div>
              {form.repeat && form.repeat !== 'none' && (
                <div className="mt-2">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-3)' }}>繰り返し終了日</label>
                  <input type="date" value={form.repeatUntil || ''}
                    onChange={e => set('repeatUntil', e.target.value)}
                    className="text-sm rounded-xl px-3 py-2 outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>担当</label>
              <div className="flex gap-2">
                {(['both', 'saku', 'takahashi'] as Assignee[]).map(a => (
                  <button key={a}
                    onClick={() => set('assignee', a)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: form.assignee === a ? 'rgba(124,58,237,0.12)' : 'var(--bg)',
                      border: form.assignee === a ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
                      color: form.assignee === a ? 'var(--purple)' : 'var(--text-2)',
                    }}>
                    {ASSIGNEE_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>カラー</label>
              <div className="flex gap-2">
                {EVENT_COLORS.map(c => (
                  <button key={c.value}
                    onClick={() => set('color', c.value)}
                    className="w-8 h-8 rounded-full transition-transform"
                    style={{
                      background: c.value,
                      outline: form.color === c.value ? `3px solid ${c.value}` : 'none',
                      outlineOffset: '2px',
                      transform: form.color === c.value ? 'scale(1.2)' : 'scale(1)',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* CASHFLOW category */}
            {form.cashflowCategory && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: 'var(--emerald)' }}>
                <span>💴</span>
                <span>CASHFLOW カテゴリ: <strong>{form.cashflowCategory}</strong></span>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>メモ</label>
              <textarea
                value={form.note || ''}
                onChange={e => set('note', e.target.value)}
                placeholder="メモを入力（任意）"
                rows={2}
                className="w-full text-sm rounded-xl px-4 py-3 outline-none resize-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            {/* Subtasks */}
            <SubtaskList
              tasks={form.subTasks || []}
              onChange={tasks => set('subTasks', tasks as SubTask[])}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}>
            {isEdit && onDelete && (
              <button onClick={() => { onDelete(); onClose(); }}
                className="px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ background: 'rgba(251,113,133,0.1)', color: 'var(--rose)' }}>
                削除
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors"
              style={{ background: 'var(--surface-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              {isEdit ? '更新' : '追加'}
            </button>
          </div>
        </div>
      </div>

      {showTemplates && (
        <TemplateModal
          onSelect={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </>
  );
}
