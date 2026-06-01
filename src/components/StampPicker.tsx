import { useState } from 'react';

// Default stamp list: emoji + short label
export const STAMPS = [
  { emoji: '😊', label: '良い日' },
  { emoji: '😔', label: 'しんどい' },
  { emoji: '😤', label: 'イライラ' },
  { emoji: '😴', label: '眠い' },
  { emoji: '🤒', label: '体調不良' },
  { emoji: '💊', label: '薬' },
  { emoji: '🏃', label: '運動' },
  { emoji: '📚', label: '勉強' },
  { emoji: '🎮', label: 'ゲーム' },
  { emoji: '🎵', label: '音楽' },
  { emoji: '🍺', label: 'お酒' },
  { emoji: '☕', label: 'カフェ' },
  { emoji: '🍜', label: '外食' },
  { emoji: '🎂', label: '誕生日' },
  { emoji: '🎉', label: 'お祝い' },
  { emoji: '💕', label: 'デート' },
  { emoji: '🛒', label: '買い物' },
  { emoji: '✈️', label: '旅行' },
  { emoji: '🏠', label: '在宅' },
  { emoji: '💰', label: 'お金' },
  { emoji: '☀️', label: '晴れ' },
  { emoji: '🌧️', label: '雨' },
  { emoji: '🔥', label: '暑い' },
  { emoji: '❄️', label: '寒い' },
];

interface Props {
  selected: string[];
  customStamps?: string[];
  onToggle: (stamp: string) => void;
  onAddCustom?: (emoji: string) => void;
  onClose: () => void;
}

export function StampPicker({ selected, customStamps = [], onToggle, onAddCustom, onClose }: Props) {
  const [custom, setCustom] = useState('');

  const submitCustom = () => {
    const e = custom.trim();
    if (e && onAddCustom) { onAddCustom(e); onToggle(e); setCustom(''); }
  };

  const customItems = customStamps.map(emoji => ({ emoji, label: 'カスタム' }));

  return (
    <div className="fixed inset-0 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(6px)', zIndex: 110 }}
      onClick={onClose}>
      <div className="w-full max-w-xl rounded-t-3xl p-4 animate-modal shadow-2xl"
        style={{ background: 'var(--surface)', maxHeight: '80dvh', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-3 px-1">
          <span className="font-head font-bold text-sm" style={{ color: 'var(--text)' }}>
            スタンプを選ぶ
          </span>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18 }}>✕</button>
        </div>

        {/* Custom stamp adder */}
        {onAddCustom && (
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
        )}

        <div className="grid grid-cols-6 gap-2">
          {[...STAMPS, ...customItems].map(({ emoji, label }) => {
            const active = selected.includes(emoji);
            return (
              <button key={emoji} onClick={() => onToggle(emoji)} title={label}
                className="flex flex-col items-center justify-center rounded-2xl py-2 gap-0.5 transition-all active:scale-90"
                style={{
                  background: active ? 'rgba(124,58,237,.12)' : 'var(--bg)',
                  border: active ? '2px solid rgba(124,58,237,.5)' : '2px solid transparent',
                }}>
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <span style={{ fontSize: 9, color: 'var(--text-3)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
