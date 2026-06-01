import { useState } from 'react';
import type { CalendarEvent, AlertEvent, Todo } from '../types';
import { ASSIGNEE_LABELS } from '../data/templates';
import { StampPicker } from './StampPicker';
import { TodoList } from './TodoList';
import { DayNote } from './DayNote';

const WDS = ['日', '月', '火', '水', '木', '金', '土'];

function fmtDate(ds: string) {
  const d = new Date(ds + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日（${WDS[d.getDay()]}）`;
}

function fmtTime(t?: string) { return t ? t.slice(0, 5) : ''; }

interface Props {
  selectedDate: string;
  events:       CalendarEvent[];
  alerts:       AlertEvent[];
  stamps:       string[];
  todos:        Todo[];
  noteContent:  string;
  showAlertsOnly: boolean;
  onToggleStamp: (s: string) => Promise<void>;
  onAddTodo:    (title: string) => Promise<void>;
  onToggleTodo: (id: string, done: boolean) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onSaveNote:   (date: string, content: string) => Promise<void>;
  onEventClick: (ev: CalendarEvent) => void;
  onAddClick:   (date: string) => void;
}

export function DayPanel({
  selectedDate, events, alerts, stamps, todos, noteContent, showAlertsOnly,
  onToggleStamp, onAddTodo, onToggleTodo, onDeleteTodo, onSaveNote,
  onEventClick, onAddClick,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const dayEvents = showAlertsOnly ? [] : events.filter(ev => {
    const s = ev.date, e = ev.endDate || ev.date;
    return selectedDate >= s && selectedDate <= e;
  }).sort((a, b) => {
    if (a.isAllDay !== false && b.isAllDay === false) return -1;
    if (a.isAllDay === false && b.isAllDay !== false) return 1;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const dayAlerts = alerts.filter(a => a.date === selectedDate);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden"
      style={{ borderTop: '2px solid rgba(124,58,237,.3)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span className="font-head font-bold text-sm" style={{ color: 'var(--purple)' }}>
          {fmtDate(selectedDate)}
        </span>
        <button onClick={() => onAddClick(selectedDate)}
          className="w-7 h-7 rounded-full font-bold text-base flex items-center justify-center active:scale-90"
          style={{ background: 'rgba(124,58,237,.12)', color: 'var(--purple)' }}>
          ＋
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>

        {/* Stamps row */}
        <div className="px-4 py-2.5 flex flex-wrap items-center gap-1.5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {stamps.map(s => (
            <button key={s} onClick={() => onToggleStamp(s)}
              className="text-xl leading-none rounded-lg p-1 active:scale-90 transition-all"
              style={{ background: 'rgba(124,58,237,.08)' }}>
              {s}
            </button>
          ))}
          <button onClick={() => setShowPicker(true)}
            className="rounded-lg px-2 py-1 text-xs font-bold active:scale-90 transition-all"
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-3)' }}>
            ＋スタンプ
          </button>
        </div>

        {/* Events */}
        {(dayEvents.length > 0 || dayAlerts.length > 0) && (
          <ul className="px-4 py-2 flex flex-col gap-1.5">
            {dayEvents.map(ev => {
              const color = ev.color || '#7c3aed';
              const time  = ev.isAllDay === false && ev.startTime
                ? `${fmtTime(ev.startTime)}〜${fmtTime(ev.endTime)}`
                : '終日';
              return (
                <li key={ev.id}>
                  <button onClick={() => onEventClick(ev)}
                    className="w-full flex items-center gap-3 text-left rounded-xl px-3 py-2 active:scale-98 transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: 44 }}>
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{ev.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {time} · {ASSIGNEE_LABELS[ev.assignee] || ev.assignee}
                        {ev.repeat && ev.repeat !== 'none' && ' 🔁'}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-3)', fontSize: 14 }}>›</span>
                  </button>
                </li>
              );
            })}
            {dayAlerts.map(a => (
              <li key={a.id} className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: `${a.color}0d`, border: `1px solid ${a.color}25` }}>
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: a.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color: a.color }}>⚠️ 自動</div>
                  <div className="text-sm truncate" style={{ color: 'var(--text)' }}>{a.title}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {dayEvents.length === 0 && dayAlerts.length === 0 && !showAlertsOnly && (
          <div className="px-4 py-2 text-sm" style={{ color: 'var(--text-3)' }}>予定はありません</div>
        )}

        {/* Divider + ToDo */}
        <div className="px-4 pt-2 pb-1">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            ✅ ToDo
          </div>
          <TodoList
            todos={todos}
            onAdd={onAddTodo}
            onToggle={onToggleTodo}
            onDelete={onDeleteTodo}
          />
        </div>

        {/* Note */}
        <div className="px-4 pt-1 pb-4">
          <div className="text-xs font-bold uppercase tracking-wider mb-2 mt-2" style={{ color: 'var(--text-3)' }}>
            📝 メモ
          </div>
          <DayNote
            date={selectedDate}
            initialContent={noteContent}
            onSave={onSaveNote}
          />
        </div>
      </div>

      {showPicker && (
        <StampPicker
          selected={stamps}
          onToggle={onToggleStamp}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
