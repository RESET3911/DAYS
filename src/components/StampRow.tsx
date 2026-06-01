import { useState } from 'react';

interface Props {
  stamps: string[];
  notes: Record<string, string>;
  onAdd: () => void;                              // open picker
  onRemove: (stamp: string) => void;
  onSetNote: (stamp: string, note: string) => void;
}

/**
 * Displays the day's stamps. Tapping a stamp opens a small editor
 * to add a memo or remove it.
 */
export function StampRow({ stamps, notes, onAdd, onRemove, onSetNote }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft]     = useState('');

  const open = (stamp: string) => {
    setEditing(stamp);
    setDraft(notes[stamp] || '');
  };

  const close = () => { setEditing(null); setDraft(''); };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {stamps.map(s => (
          <button key={s} onClick={() => open(s)}
            className="relative flex items-center gap-1 rounded-lg px-1.5 py-1 active:scale-90 transition-all"
            style={{ background: 'rgba(124,58,237,.08)' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{s}</span>
            {notes[s] && (
              <span className="text-xs truncate" style={{ color: 'var(--text-2)', maxWidth: 90 }}>
                {notes[s]}
              </span>
            )}
          </button>
        ))}
        <button onClick={onAdd}
          className="rounded-lg px-2 py-1 text-xs font-bold active:scale-90 transition-all"
          style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-3)' }}>
          ＋スタンプ
        </button>
      </div>

      {/* Editor popover */}
      {editing && (
        <div className="fixed inset-0 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,.3)', zIndex: 110 }}
          onClick={close}>
          <div className="w-full max-w-md rounded-t-3xl p-4 animate-modal"
            style={{ background: 'var(--surface)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 32 }}>{editing}</span>
              <span className="font-head font-bold text-sm flex-1" style={{ color: 'var(--text)' }}>
                スタンプメモ
              </span>
              <button onClick={close} style={{ color: 'var(--text-3)', fontSize: 18 }}>✕</button>
            </div>
            <input
              autoFocus value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onSetNote(editing, draft); close(); } }}
              placeholder="メモを入力（任意）…"
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none mb-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { onRemove(editing); close(); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(225,29,72,.1)', color: 'var(--rose)' }}>
                🗑 削除
              </button>
              <button
                onClick={() => { onSetNote(editing, draft); close(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
