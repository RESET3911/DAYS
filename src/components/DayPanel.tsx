import type { CalendarEvent, AlertEvent } from '../types';
import { ASSIGNEE_LABELS } from '../data/templates';

const WDS = ['日', '月', '火', '水', '木', '金', '土'];

function fmtDate(ds: string) {
  const d = new Date(ds + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日（${WDS[d.getDay()]}）`;
}

function fmtTime(t?: string) {
  return t ? t.slice(0, 5) : '';
}

interface Props {
  selectedDate: string;
  events: CalendarEvent[];
  alerts: AlertEvent[];
  showAlertsOnly: boolean;
  onEventClick: (ev: CalendarEvent) => void;
  onAddClick: (date: string) => void;
}

export function DayPanel({ selectedDate, events, alerts, showAlertsOnly, onEventClick, onAddClick }: Props) {
  const dayEvents = showAlertsOnly ? [] : events.filter(ev => {
    const start = ev.date;
    const end   = ev.endDate || ev.date;
    return selectedDate >= start && selectedDate <= end;
  }).sort((a, b) => {
    if (a.isAllDay !== false && b.isAllDay === false) return -1;
    if (a.isAllDay === false && b.isAllDay !== false) return 1;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const dayAlerts = alerts.filter(a => a.date === selectedDate);

  const isEmpty = dayEvents.length === 0 && dayAlerts.length === 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col"
      style={{ borderTop: '2px solid rgba(167,139,250,0.4)', background: 'rgba(255,255,255,0.02)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-head font-bold text-sm tracking-tight" style={{ color: 'var(--purple)' }}>
          {fmtDate(selectedDate)}
        </span>
        <button
          onClick={() => onAddClick(selectedDate)}
          className="w-7 h-7 rounded-full font-bold text-base flex items-center justify-center transition-transform active:scale-90"
          style={{ background: 'rgba(167,139,250,0.2)', color: 'var(--purple)' }}>
          ＋
        </button>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 pb-16"
            style={{ color: 'var(--text-3)' }}>
            <span className="text-3xl opacity-30">📅</span>
            <p className="text-xs">この日の予定はありません</p>
          </div>
        ) : (
          <ul className="p-2 flex flex-col gap-1.5">
            {dayEvents.map(ev => {
              const isTimedEvent = ev.isAllDay === false && ev.startTime;
              const timeLabel = isTimedEvent
                ? `${fmtTime(ev.startTime)}〜${fmtTime(ev.endTime)}`
                : '終日';
              const assigneeLabel = ASSIGNEE_LABELS[ev.assignee] || ev.assignee;
              const color = ev.color || '#a78bfa';

              return (
                <li key={ev.id}>
                  <button
                    onClick={() => onEventClick(ev)}
                    className="w-full flex items-stretch gap-3 p-3 rounded-xl text-left transition-all active:scale-98"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-1 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {ev.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{timeLabel}</span>
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>· {assigneeLabel}</span>
                        {ev.repeat && ev.repeat !== 'none' && (
                          <span className="text-xs" style={{ color: 'var(--purple)' }}>🔁</span>
                        )}
                        {ev.subTasks && ev.subTasks.length > 0 && (
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                            ✓ {ev.subTasks.filter(t => t.done).length}/{ev.subTasks.length}
                          </span>
                        )}
                      </div>
                      {ev.note && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{ev.note}</p>
                      )}
                    </div>
                    <span className="text-xs flex-shrink-0 self-center" style={{ color: 'var(--text-3)' }}>›</span>
                  </button>
                </li>
              );
            })}

            {dayAlerts.map(a => (
              <li key={a.id}>
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
                  <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: a.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate" style={{ color: a.color }}>
                      ⚠️ 自動アラート
                    </div>
                    <div className="text-sm truncate mt-0.5" style={{ color: 'var(--text)' }}>
                      {a.title}
                    </div>
                    {a.sourceUrl && (
                      <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-0.5 inline-block" style={{ color: a.color }}
                        onClick={e => e.stopPropagation()}>
                        {a.sourceApp} で確認 →
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
