import { useState } from 'react';
import type { Anniversary } from '../hooks/useAnniversaries';
import { nextOccurrence } from '../hooks/useAnniversaries';
import { EVENT_COLORS } from '../data/templates';

interface Props {
  anniversaries: Anniversary[];
  userId: string;
  onAdd: (data: Omit<Anniversary, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const TYPE_ICON: Record<string, string> = { anniversary: '🎉', birthday: '🎂', other: '⭐' };
const TYPE_LABELS = [
  { key: 'anniversary', label: '記念日' },
  { key: 'birthday',    label: '誕生日' },
  { key: 'other',       label: 'その他' },
] as const;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

type FormState = Omit<Anniversary, 'id'>;

const emptyForm = (userId: string): FormState => ({
  title: '',
  type: 'anniversary',
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  startYear: new Date().getFullYear(),
  color: EVENT_COLORS[0].value,
  notifyDaysBefore: 7,
  createdBy: userId,
});

export function AnniversaryModal({ anniversaries, userId, onAdd, onDelete, onClose }: Props) {
  const [form, setForm]     = useState<FormState>(() => emptyForm(userId));
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onAdd(form);
      setForm(emptyForm(userId));
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    await onDelete(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(8,4,18,.8)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <div className="animate-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ background: '#0f0a1e', border: '1px solid rgba(255,255,255,.1)', maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <span className="font-head font-extrabold text-sm">記念日・誕生日</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdding(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold"
              style={{ background: 'rgba(167,139,250,.15)', color: 'var(--purple)' }}>
              ＋ 追加
            </button>
            <button onClick={onClose} className="text-lg opacity-40 hover:opacity-70">✕</button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {anniversaries.length === 0 && !adding && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>
              記念日・誕生日を登録しましょう
            </p>
          )}

          {anniversaries.map(ann => {
            const { daysLeft, yearsElapsed } = nextOccurrence(ann);
            return (
              <div key={ann.id} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: `${ann.color}12`, border: `1px solid ${ann.color}25` }}>
                <span className="text-2xl">{TYPE_ICON[ann.type] || '⭐'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: ann.color }}>{ann.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {ann.month}月{ann.day}日
                    {ann.startYear ? ` · ${ann.startYear}年〜` : ''}
                    {' · '}
                    {daysLeft === 0 ? '今日！' : `あと${daysLeft}日`}
                    {yearsElapsed != null ? `（${yearsElapsed}周年）` : ''}
                  </div>
                </div>
                <button onClick={() => handleDelete(ann.id, ann.title)}
                  className="text-xs opacity-40 hover:opacity-70 px-2 py-1 rounded-lg"
                  style={{ color: 'var(--rose)' }}>
                  削除
                </button>
              </div>
            );
          })}

          {/* Add form */}
          {adding && (
            <div className="p-4 rounded-2xl space-y-3"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)' }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>タイトル</label>
                <input autoFocus value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="例: 付き合った記念日・さくの誕生日"
                  className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--text)' }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>種別</label>
                <div className="flex gap-2">
                  {TYPE_LABELS.map(({ key, label }) => (
                    <button key={key} onClick={() => set('type', key)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold"
                      style={{
                        background: form.type === key ? 'rgba(167,139,250,.25)' : 'rgba(255,255,255,.06)',
                        border: form.type === key ? '1px solid rgba(167,139,250,.5)' : '1px solid rgba(255,255,255,.08)',
                        color: form.type === key ? 'var(--purple)' : 'var(--text-2)',
                      }}>
                      {TYPE_ICON[key]} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month / Day */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>月</label>
                  <select value={form.month} onChange={e => set('month', Number(e.target.value))}
                    className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--text)' }}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>日</label>
                  <input type="number" min={1} max={31} value={form.day}
                    onChange={e => set('day', Number(e.target.value))}
                    className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              {/* Start year (for anniversaries) */}
              {form.type !== 'birthday' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
                    起算年（周年計算）
                  </label>
                  <input type="number" min={1990} max={2030} value={form.startYear || ''}
                    onChange={e => set('startYear', e.target.value ? Number(e.target.value) : null)}
                    placeholder="例: 2022"
                    className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--text)' }}
                  />
                </div>
              )}

              {/* Notify days before */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
                  N日前に通知
                </label>
                <div className="flex gap-1.5">
                  {[0, 1, 3, 7, 14].map(n => (
                    <button key={n} onClick={() => set('notifyDaysBefore', n)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: form.notifyDaysBefore === n ? 'rgba(167,139,250,.25)' : 'rgba(255,255,255,.06)',
                        color: form.notifyDaysBefore === n ? 'var(--purple)' : 'var(--text-3)',
                      }}>
                      {n === 0 ? '当日' : `${n}日前`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>カラー</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c.value} onClick={() => set('color', c.value)}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        background: c.value,
                        outline: form.color === c.value ? `3px solid ${c.value}` : 'none',
                        outlineOffset: '2px',
                        transform: form.color === c.value ? 'scale(1.2)' : 'scale(1)',
                      }} />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAdding(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,.06)', color: 'var(--text-2)' }}>
                  キャンセル
                </button>
                <button onClick={handleSave} disabled={saving || !form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  {saving ? '保存中…' : '登録'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
