// Stamp list: emoji + short label for accessibility
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
  onToggle: (stamp: string) => void;
  onClose: () => void;
}

export function StampPicker({ selected, onToggle, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-xl rounded-t-3xl p-4 pb-8 animate-modal shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-3 px-1">
          <span className="font-head font-bold text-sm" style={{ color: 'var(--text)' }}>
            スタンプを選ぶ
          </span>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18 }}>✕</button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {STAMPS.map(({ emoji, label }) => {
            const active = selected.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={() => onToggle(emoji)}
                title={label}
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
