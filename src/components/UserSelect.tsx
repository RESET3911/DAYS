import type { UserId } from '../types';

interface Props {
  onSelect: (id: UserId) => void;
}

export function UserSelect({ onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}>
      <div className="animate-modal w-full max-w-xs text-center p-10 rounded-3xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-5xl mb-5">📅</div>
        <h1 className="font-head text-xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text)' }}>
          DAYS
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>どちらのアカウントで使いますか？</p>
        <div className="flex gap-3">
          <button
            onClick={() => onSelect('kenshin')}
            className="flex-1 py-4 rounded-2xl font-head font-bold text-sm text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            👦 けんしん
          </button>
          <button
            onClick={() => onSelect('rena')}
            className="flex-1 py-4 rounded-2xl font-head font-bold text-sm text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg,#be185d,#e11d48)', boxShadow: '0 4px 20px rgba(225,29,72,0.3)' }}>
            🌸 れなちゃん
          </button>
        </div>
      </div>
    </div>
  );
}
