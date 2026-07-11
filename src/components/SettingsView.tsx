import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { AlertSettings } from '../hooks/useAlerts';
import type { CustomTemplate } from '../hooks/useSettings';
import type { UserId } from '../types';

interface Props {
  userId: UserId;
  alertSettings: AlertSettings;
  customTemplates: CustomTemplate[];
  onAddTemplate: (t: Omit<CustomTemplate, 'id'>) => void;
  onRemoveTemplate: (id: string) => void;
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

export function SettingsView({
  userId, alertSettings, customTemplates, onAddTemplate, onRemoveTemplate, onAlertChange, onSwitchUser,
}: Props) {
  const userLabel    = userId === 'kenshin' ? '👦 けんしん' : '🌸 れなちゃん';
  const partnerLabel = userId === 'kenshin' ? '🌸 れなちゃん' : '👦 けんしん';

  // ntfy トピック（RINGI と共有: ringi/settings.ntfyTopic）
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfySaved, setNtfySaved] = useState(false);
  useEffect(() => {
    getDoc(doc(db, 'ringi', 'settings'))
      .then(snap => setNtfyTopic((snap.data()?.ntfyTopic as string) || ''))
      .catch(() => {});
  }, []);
  const saveNtfy = async () => {
    try {
      await setDoc(doc(db, 'ringi', 'settings'), { ntfyTopic: ntfyTopic.trim() }, { merge: true });
      setNtfySaved(true);
      setTimeout(() => setNtfySaved(false), 2000);
    } catch { /* noop */ }
  };

  const [showTpl, setShowTpl] = useState(false);
  const [tIcon, setTIcon]     = useState('📋');
  const [tName, setTName]     = useState('');
  const [tDays, setTDays]     = useState(1);
  const [tTasks, setTTasks]   = useState('');

  const saveTemplate = () => {
    if (!tName.trim()) return;
    const subTasks = tTasks.split('\n').map(s => s.trim()).filter(Boolean).map(title => ({ title }));
    onAddTemplate({ icon: tIcon || '📋', type: tName.trim(), description: `${subTasks.length}個のサブタスク`, defaultDays: tDays, subTasks });
    setTIcon('📋'); setTName(''); setTDays(1); setTTasks(''); setShowTpl(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-3 flex flex-col gap-4"
      style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>

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

      {/* Push notification (ntfy) */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          🔔 プッシュ通知（ntfy）
        </div>
        <div className="px-4 py-4 space-y-2.5" style={{ background: 'var(--surface)' }}>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
            スマホに <b>ntfy</b> アプリを入れ、下のトピック名を購読すると、予定の追加やリマインダーがプッシュ通知で届きます（けんしん・れなちゃん共通）。
          </div>
          <div className="flex gap-2">
            <input value={ntfyTopic} onChange={e => setNtfyTopic(e.target.value)} placeholder="例: st-days-xxxx"
              className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <button onClick={saveNtfy}
              className="text-xs font-bold px-3 py-2 rounded-xl text-white active:scale-95 transition-all"
              style={{ background: ntfySaved ? 'var(--emerald,#059669)' : 'var(--purple)' }}>
              {ntfySaved ? '保存済' : '保存'}
            </button>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-3)' }}>
            他人に推測されにくい固有の文字列にしてください。
          </div>
        </div>
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

      {/* Custom templates */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            マイテンプレート
          </span>
          <button onClick={() => setShowTpl(v => !v)}
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)' }}>
            {showTpl ? '閉じる' : '＋ 作成'}
          </button>
        </div>

        {showTpl && (
          <div className="px-4 py-3 space-y-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-2">
              <input value={tIcon} onChange={e => setTIcon(e.target.value)} placeholder="📋"
                className="w-14 text-center text-lg rounded-xl px-2 py-2 outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} />
              <input value={tName} onChange={e => setTName(e.target.value)} placeholder="テンプレート名"
                className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>期間</span>
              <input type="number" min={1} value={tDays} onChange={e => setTDays(Number(e.target.value))}
                className="w-16 text-sm rounded-xl px-2 py-1.5 outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>日</span>
            </div>
            <textarea value={tTasks} onChange={e => setTTasks(e.target.value)} rows={3}
              placeholder={'サブタスク（1行に1つ）\n例: 宿を予約\n例: 持ち物を準備'}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <button onClick={saveTemplate}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              テンプレートを保存
            </button>
          </div>
        )}

        {customTemplates.length === 0 && !showTpl && (
          <div className="px-4 py-3 text-xs" style={{ background: 'var(--surface)', color: 'var(--text-3)' }}>
            よく使う予定をテンプレート化できます
          </div>
        )}

        {customTemplates.map((t, i) => (
          <div key={t.id}
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'var(--surface)', borderBottom: i < customTemplates.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span className="text-2xl">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t.type}</div>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>{t.subTasks.length}タスク · {t.defaultDays}日</div>
            </div>
            <button onClick={() => onRemoveTemplate(t.id)}
              className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--rose)' }}>削除</button>
          </div>
        ))}
      </div>

      <div className="text-center text-xs pb-2" style={{ color: 'var(--text-3)' }}>
        DAYS {VERSION} · けんしん &amp; れなちゃん
      </div>
    </div>
  );
}
