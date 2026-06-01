import type { AlertEvent } from '../types';

const fmt = (n?: number) => n != null ? '¥' + n.toLocaleString('ja-JP') : null;

const TYPE_LABEL: Record<string, string> = {
  income: '入金予定', expense: '固定費', tax: '税金',
  card: 'カード引き落とし', ringi: 'RINGI', anniversary: '記念日',
};
const TYPE_ICON: Record<string, string> = {
  income: '💚', expense: '🔴', tax: '🔴', card: '🟠', ringi: '🟡', anniversary: '🩷',
};

interface Props { alert: AlertEvent; onClose: () => void; }

export function AlertDetail({ alert, onClose }: Props) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', zIndex: 110 }}
      onClick={onClose}>
      <div className="animate-modal w-full max-w-xs rounded-3xl p-5 shadow-xl"
        style={{ background: 'var(--surface)', border: `1px solid ${alert.color}33` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">{TYPE_ICON[alert.type] || '⚠️'}</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{ color: alert.color }}>
              ⚠️ 自動アラート · {TYPE_LABEL[alert.type] || alert.type}
            </div>
            <div className="font-head font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
              {alert.title}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-xs mb-4" style={{ color: 'var(--text-2)' }}>
          <div>📅 {alert.date}</div>
          {alert.amount != null && <div>💴 {fmt(alert.amount)}</div>}
          <div>📱 ソース: {alert.sourceApp}</div>
        </div>
        <div className="flex gap-2">
          {alert.sourceUrl && (
            <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold"
              style={{ background: `${alert.color}18`, color: alert.color }}>
              {alert.sourceApp} を開く →
            </a>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
