import type { BottomTab } from '../types';

interface Props {
  active: BottomTab;
  onChange: (tab: BottomTab) => void;
  onAdd: () => void;
}

const TABS: { id: BottomTab; icon: string; label: string }[] = [
  { id: 'calendar', icon: '📅', label: 'カレンダー' },
  { id: 'todo',     icon: '✅', label: 'ToDo' },
  { id: 'stamp',    icon: '🌟', label: 'スタンプ' },
  { id: 'settings', icon: '⚙️', label: '設定' },
];

export function BottomNav({ active, onChange, onAdd }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center z-50"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
        maxWidth: 480,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
      }}>

      {/* First 2 tabs */}
      {TABS.slice(0, 2).map(tab => (
        <TabBtn key={tab.id} tab={tab} active={active === tab.id} onClick={() => onChange(tab.id)} />
      ))}

      {/* Centre add button */}
      <div className="flex-1 flex items-center justify-center py-2">
        <button
          onClick={onAdd}
          className="flex items-center justify-center w-13 h-13 rounded-full text-white font-bold text-2xl transition-transform active:scale-90"
          style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            boxShadow: '0 4px 20px rgba(124,58,237,.45)',
          }}>
          ＋
        </button>
      </div>

      {/* Last 2 tabs */}
      {TABS.slice(2).map(tab => (
        <TabBtn key={tab.id} tab={tab} active={active === tab.id} onClick={() => onChange(tab.id)} />
      ))}
    </nav>
  );
}

function TabBtn({
  tab, active, onClick,
}: { tab: typeof TABS[0]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all active:scale-90"
      style={{ minHeight: 56 }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
      <span style={{
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--purple)' : 'var(--text-3)',
      }}>
        {tab.label}
      </span>
    </button>
  );
}
