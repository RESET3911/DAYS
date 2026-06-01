import type { AlertSettings } from '../hooks/useAlerts';
import type { UserId } from '../types';

interface Props {
  userId: UserId;
  alertSettings: AlertSettings;
  onAlertChange: (key: keyof AlertSettings, val: boolean) => void;
  onSwitchUser: () => void;
}

const ALERT_ITEMS: { key: keyof AlertSettings; label: string; desc: string }[] = [
  { key: 'cashflow', label: '💴 CASHFLOW',  desc: '入金予定・固定費の支払日を表示' },
  { key: 'ringi',    label: '📝 RINGI',     desc: '承認期限のある申請を表示' },
  { key: 'gantt',    label: '📊 Gantt',     desc: 'タスクの締切日を表示' },
  { key: 'tax',      label: '🏛️ 税金',     desc: '確定申告・住民税などの納付日' },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: 44, height: 26, background: on ? 'var(--purple)' : 'rgba(0,0,0,0.15)' }}>
      <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
        style={{ width: 22, height: 22, left: 2, transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
    </button>
  );
}

const VERSION = 'v1.0';

export function SettingsView({ userId, alertSettings, onAlertChange, onSwitchUser }: Props) {
  const userLabel    = userId === 'saku' ? '👦 けんしん' : '🌸 れなちゃん';
  const partnerLabel = userId === 'saku' ? '🌸 れなちゃん' : '👦 けんしん';

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-3 flex flex-col gap-4">

      {/* User */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          アカウント
        </div>
        <div className="px-4 py-4 flex items-center justify-between"
          style={{ background: 'var(--surface)' }}>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{userLabel}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>相手: {partnerLabel}</div>
          </div>
          <button onClick={onSwitchUser}
            className="text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all"
            style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)' }}>
            切替
          </button>
        </div>
      </div>

      {/* Alert settings */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          アラート表示
        </div>
        {ALERT_ITEMS.map(({ key, label, desc }, i) => (
          <div key={key}
            className="px-4 py-3.5 flex items-center justify-between"
            style={{
              background: 'var(--surface)',
              borderBottom: i < ALERT_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{desc}</div>
            </div>
            <Toggle on={alertSettings[key]} onToggle={() => onAlertChange(key, !alertSettings[key])} />
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          連携アプリ
        </div>
        {[
          { label: '💰 CASHFLOW', url: 'https://RESET3911.github.io/CASHFLOW/' },
          { label: '📝 RINGI',    url: 'https://RESET3911.github.io/RINGI/' },
          { label: '🛍️ WISHLIST', url: 'https://RESET3911.github.io/ST_WISHLIST/' },
          { label: '🏠 ST HUB',  url: 'https://RESET3911.github.io/' },
        ].map(({ label, url }, i, arr) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 transition-all active:bg-opacity-80"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              textDecoration: 'none',
            }}>
            <span className="text-sm font-bold">{label}</span>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>›</span>
          </a>
        ))}
      </div>

      <div className="text-center text-xs pb-2" style={{ color: 'var(--text-3)' }}>
        DAYS {VERSION} · さく &amp; たかはし
      </div>
    </div>
  );
}
