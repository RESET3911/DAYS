import { useState } from 'react';
import { STAMPS } from './StampPicker';

const pad  = (n: number) => String(n).padStart(2, '0');
const WDS  = ['日', '月', '火', '水', '木', '金', '土'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function recentDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return dates;
}

interface Props {
  stampsByDate: Record<string, string[]>;
  customStamps: string[];
  onToggle: (date: string, stamp: string) => Promise<void>;
  onAddCustom: (emoji: string) => void;
  onRemoveCustom: (emoji: string) => void;
}

export function StampTabView({ stampsByDate, customStamps, onToggle, onAddCustom, onRemoveCustom }: Props) {
  const today = todayStr();
  const todayStamps = stampsByDate[today] || [];
  const dates = recentDates(14);
  const [custom, setCustom] = useState('');
  const displayStamps = [...STAMPS, ...customStamps.map(emoji => ({ emoji, label: 'カスタム' }))];

  const submitCustom = () => {
    const e = custom.trim();
    if (e) { onAddCustom(e); setCustom(''); }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-3 flex flex-col gap-4">

      {/* Today's stamps */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
          今日のスタンプ
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {todayStamps.length === 0 && (
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>スタンプを追加しよう</span>
          )}
          {todayStamps.map(s => (
            <button key={s} onClick={() => onToggle(today, s)}
              className="rounded-xl p-2 text-2xl leading-none transition-all active:scale-90"
              style={{ background: 'rgba(124,58,237,.1)', border: '2px solid rgba(124,58,237,.3)' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Custom stamp adder */}
        <div className="flex gap-2 mb-3">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitCustom(); }}
            placeholder="絵文字を入力して追加 😀"
            className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button onClick={submitCustom}
            className="px-4 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            追加
          </button>
        </div>

        {/* Stamp picker grid */}
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
          タップして追加
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {displayStamps.map(({ emoji, label }) => {
            const active = todayStamps.includes(emoji);
            const isCustom = customStamps.includes(emoji);
            return (
              <button key={emoji} onClick={() => onToggle(today, emoji)} title={label}
                onContextMenu={e => { if (isCustom) { e.preventDefault(); onRemoveCustom(emoji); } }}
                className="relative flex flex-col items-center rounded-xl py-1.5 gap-0.5 transition-all active:scale-90"
                style={{
                  background: active ? 'rgba(124,58,237,.12)' : 'var(--bg)',
                  border: active ? '2px solid rgba(124,58,237,.4)' : '2px solid transparent',
                }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ fontSize: 8, color: 'var(--text-3)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stamp history */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
          最近14日
        </div>
        <div className="flex flex-col gap-2">
          {dates.filter(d => (stampsByDate[d] || []).length > 0 || d === today).map(date => {
            const stamps = stampsByDate[date] || [];
            const d = new Date(date + 'T00:00:00');
            const isToday = date === today;
            return (
              <div key={date} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-14 text-right">
                  <div className="text-xs font-bold" style={{ color: isToday ? 'var(--purple)' : 'var(--text-2)' }}>
                    {isToday ? '今日' : `${d.getMonth() + 1}/${d.getDate()}`}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-3)' }}>{WDS[d.getDay()]}</div>
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {stamps.length === 0 ? (
                    <span style={{ fontSize: 18, opacity: 0.15 }}>・</span>
                  ) : (
                    stamps.map(s => (
                      <span key={s} style={{ fontSize: 20 }}>{s}</span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
