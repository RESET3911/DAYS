import { TEMPLATES } from '../data/templates';
import type { Template } from '../data/templates';

interface Props {
  onSelect: (t: Template) => void;
  onClose: () => void;
}

export function TemplateModal({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(8,4,18,0.85)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}>
      <div className="animate-modal w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: '#120c24', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="font-head font-bold text-sm tracking-tight">テンプレートから作成</span>
          <button onClick={onClose} className="text-lg leading-none opacity-40 hover:opacity-70 transition-opacity">✕</button>
        </div>
        <div className="p-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
          {TEMPLATES.map(t => (
            <button
              key={t.type}
              onClick={() => onSelect(t)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
              <span className="text-3xl flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-head font-bold text-sm">{t.type}</div>
                <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>{t.description}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs font-bold" style={{ color: 'var(--purple)' }}>{t.subTasks.length}</div>
                <div className="text-xs" style={{ color: 'var(--text-3)' }}>tasks</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
