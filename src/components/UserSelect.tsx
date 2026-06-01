import type { UserId } from '../types';

interface Props {
  onSelect: (id: UserId) => void;
}

export function UserSelect({ onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(8,4,18,0.97)', backdropFilter: 'blur(24px)' }}>
      <div className="animate-modal w-full max-w-xs text-center p-10 rounded-3xl"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)' }}>
        <div className="text-5xl mb-5">📅</div>
        <h1 className="font-head text-xl font-extrabold mb-2 tracking-tight">DAYS</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>どちらのアカウントで使いますか？</p>
        <div className="flex gap-3">
          <button
            onClick={() => onSelect('saku')}
            className="flex-1 py-4 rounded-2xl font-head font-bold text-sm text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg,#be185d,#e11d48)', boxShadow: '0 4px 24px rgba(225,29,72,0.4)' }}>
            🌸 さく
          </button>
          <button
            onClick={() => onSelect('takahashi')}
            className="flex-1 py-4 rounded-2xl font-head font-bold text-sm text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 24px rgba(124,58,237,0.45)' }}>
            🔷 たかはし
          </button>
        </div>
      </div>
    </div>
  );
}
