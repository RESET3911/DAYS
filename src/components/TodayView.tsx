import { useState } from 'react';
import type { CalendarEvent, AlertEvent, Todo } from '../types';
import { StampPicker } from './StampPicker';
import { StampRow } from './StampRow';
import { TodoList } from './TodoList';
import { DayNote } from './DayNote';
import { ASSIGNEE_LABELS } from '../data/templates';

const WDS = ['日', '月', '火', '水', '木', '金', '土'];
const pad  = (n: number) => String(n).padStart(2, '0');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatFullDate(ds: string) {
  const d   = new Date(ds + 'T00:00:00');
  const wd  = WDS[d.getDay()];
  const col = d.getDay() === 0 ? 'var(--rose)' : d.getDay() === 6 ? 'var(--sky)' : 'var(--text-2)';
  return { label: `${d.getMonth() + 1}月${d.getDate()}日（${wd}）`, color: col };
}

function fmtTime(t?: string) { return t ? t.slice(0, 5) : ''; }

interface Props {
  events:      CalendarEvent[];
  alerts:      AlertEvent[];
  stamps:      string[];
  stampNotes:  Record<string, string>;
  customStamps: string[];
  todos:       Todo[];
  noteContent: string;
  onToggleStamp:    (s: string) => Promise<void>;
  onRemoveStamp:    (s: string) => Promise<void>;
  onSetStampNote:   (s: string, note: string) => Promise<void>;
  onAddCustomStamp: (e: string) => void;
  onAddTodo:   (title: string) => Promise<void>;
  onToggleTodo:(id: string, done: boolean) => Promise<void>;
  onDeleteTodo:(id: string) => Promise<void>;
  onSaveNote:  (date: string, content: string) => Promise<void>;
  onEventClick:(ev: CalendarEvent) => void;
  onAddEvent:  () => void;
}

export function TodayView({
  events, alerts, stamps, stampNotes, customStamps, todos, noteContent,
  onToggleStamp, onRemoveStamp, onSetStampNote, onAddCustomStamp,
  onAddTodo, onToggleTodo, onDeleteTodo, onSaveNote,
  onEventClick, onAddEvent,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const today = todayStr();
  const { label: dateLabel, color: wdColor } = formatFullDate(today);

  const h = new Date().getHours();
  const greeting = h < 4 ? 'おやすみ' : h < 11 ? 'おはよう' : h < 17 ? 'こんにちは' : 'こんばんは';

  const todayEvents = events.filter(ev => {
    const s = ev.date, e = ev.endDate || ev.date;
    return today >= s && today <= e;
  }).sort((a, b) => {
    if (a.isAllDay !== false && b.isAllDay === false) return -1;
    if (a.isAllDay === false && b.isAllDay !== false) return 1;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const todayAlerts = alerts.filter(a => a.date === today);

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 pt-3 flex flex-col gap-3"
      style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>

      {/* Date header */}
      <div className="pt-1 pb-2 px-1">
        <div className="text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>{greeting}！</div>
        <div className="font-head font-extrabold text-2xl tracking-tight" style={{ color: 'var(--text)' }}>
          今日
          <span className="text-base font-bold ml-2" style={{ color: wdColor }}>{dateLabel}</span>
        </div>
      </div>

      {/* Stamps */}
      <Section label="スタンプ">
        <StampRow
          stamps={stamps}
          notes={stampNotes}
          onAdd={() => setShowPicker(true)}
          onRemove={onRemoveStamp}
          onSetNote={onSetStampNote}
        />
      </Section>

      {/* Events */}
      <Section label={`📅 今日の予定 (${todayEvents.length + todayAlerts.length}件)`}>
        {todayEvents.length === 0 && todayAlerts.length === 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>予定はありません</span>
            <button onClick={onAddEvent}
              className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)' }}>
              ＋ 追加
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayEvents.map(ev => {
              const color = ev.color || '#7c3aed';
              const time  = ev.isAllDay === false && ev.startTime
                ? `${fmtTime(ev.startTime)}〜${fmtTime(ev.endTime)}`
                : '終日';
              return (
                <li key={ev.id}>
                  <button onClick={() => onEventClick(ev)}
                    className="w-full flex items-center gap-3 text-left"
                    style={{ minHeight: 44 }}>
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{ev.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {time} · {ASSIGNEE_LABELS[ev.assignee] || ev.assignee}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {todayAlerts.map(a => (
              <li key={a.id} className="flex items-center gap-3">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: a.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color: a.color }}>⚠️ 自動</div>
                  <div className="text-sm truncate" style={{ color: 'var(--text)' }}>{a.title}</div>
                </div>
              </li>
            ))}
            <li>
              <button onClick={onAddEvent}
                className="text-xs font-bold px-3 py-1.5 rounded-xl mt-1"
                style={{ background: 'rgba(124,58,237,.08)', color: 'var(--purple)' }}>
                ＋ 予定を追加
              </button>
            </li>
          </ul>
        )}
      </Section>

      {/* ToDo */}
      <Section label="✅ ToDo">
        <TodoList
          todos={todos}
          onAdd={onAddTodo}
          onToggle={onToggleTodo}
          onDelete={onDeleteTodo}
        />
      </Section>

      {/* Note */}
      <Section label="📝 今日のメモ">
        <DayNote
          date={today}
          initialContent={noteContent}
          onSave={onSaveNote}
        />
      </Section>

      {showPicker && (
        <StampPicker
          selected={stamps}
          customStamps={customStamps}
          onToggle={onToggleStamp}
          onAddCustom={onAddCustomStamp}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
