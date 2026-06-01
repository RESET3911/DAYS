import { useState } from 'react';
import type { CalendarEvent, AlertEvent } from '../types';
import type { Anniversary } from '../hooks/useAnniversaries';
import { nextOccurrence } from '../hooks/useAnniversaries';
import { AlertDetail } from './AlertDetail';
import { isHoliday } from '../data/holidays';

const WDS = ['日', '月', '火', '水', '木', '金', '土'];

interface Props {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  alerts: AlertEvent[];
  anniversaries: Anniversary[];
  stampsByDate: Record<string, string[]>;
  showAlertsOnly: boolean;
  selectedDate?: string;
  onDayClick: (date: string) => void;
  onEventClick: (ev: CalendarEvent) => void;
  onStampDrop?: (date: string, stamp: string) => void;
}

const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const e   = new Date((end || start) + 'T00:00:00');
  while (cur <= e) {
    dates.push(localDateStr(cur)); // local, not UTC — avoids JST day-shift
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function CalendarGrid({
  year, month, events, alerts, anniversaries, stampsByDate, showAlertsOnly, selectedDate, onDayClick, onEventClick, onStampDrop,
}: Props) {
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);

  const today    = new Date().toISOString().split('T')[0];
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay  = new Date(year, month + 1, 0).getDate();

  // Build grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const ds = (d: number) => `${year}-${pad2(month + 1)}-${pad2(d)}`;

  // Events per day
  const eventsOnDay: Record<string, CalendarEvent[]> = {};
  events.forEach(ev => {
    datesInRange(ev.date, ev.endDate || ev.date).forEach(d => {
      (eventsOnDay[d] ||= []).push(ev);
    });
  });

  // Alerts per day
  const alertsOnDay: Record<string, AlertEvent[]> = {};
  alerts.forEach(a => { (alertsOnDay[a.date] ||= []).push(a); });

  // Anniversaries per day in this month
  const annOnDay: Record<string, { ann: Anniversary; yearsElapsed: number | null }> = {};
  anniversaries.forEach(ann => {
    const dateStr = `${year}-${pad2(ann.month)}-${pad2(ann.day)}`;
    if (dateStr.startsWith(`${year}-${pad2(month + 1)}`)) {
      const { yearsElapsed } = nextOccurrence(ann);
      annOnDay[dateStr] = { ann, yearsElapsed };
    }
  });

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
          {WDS.map((w, i) => (
            <div key={w} className="text-center py-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: i === 0 ? 'var(--rose)' : i === 6 ? 'var(--sky)' : 'var(--text-3)' }}>
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`empty_${idx}`} className="min-h-16"
                style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,.02)' }} />
            );

            const dateStr   = ds(day);
            const dayEvents = eventsOnDay[dateStr] || [];
            const dayAlerts = alertsOnDay[dateStr] || [];
            const annEntry  = annOnDay[dateStr];
            const holiday   = isHoliday(dateStr);
            const dayStamps = stampsByDate[dateStr] || [];

            const isToday    = dateStr === today;
            const isSelected = selectedDate === dateStr;
            const isSun      = idx % 7 === 0;
            const isSat      = idx % 7 === 6;
            const isHol      = !!holiday;

            const visibleEvents = showAlertsOnly ? [] : dayEvents.slice(0, 3);
            const visibleAlerts = dayAlerts.slice(0, showAlertsOnly ? 4 : 2);
            const overflow =
              (showAlertsOnly ? 0 : Math.max(0, dayEvents.length - 3)) +
              Math.max(0, dayAlerts.length - (showAlertsOnly ? 4 : 2));

            // Day number text color
            const numColor = isToday ? '#fff'
              : isSun || isHol ? 'var(--rose)'
              : isSat           ? 'var(--sky)'
              : 'var(--text-2)';

            return (
              <div
                key={dateStr}
                data-date={dateStr}
                onClick={() => onDayClick(dateStr)}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const stamp = e.dataTransfer.getData('stamp');
                  if (stamp && onStampDrop) onStampDrop(dateStr, stamp);
                }}
                className="p-1 cursor-pointer cal-drop-cell"
                style={{
                  minHeight: 92,
                  borderTop: '1px solid var(--border)',
                  background: isToday    ? 'rgba(124,58,237,.07)'
                            : isSelected ? 'rgba(124,58,237,.04)'
                            : undefined,
                  outline: isSelected && !isToday ? '1px solid rgba(124,58,237,.25)' : undefined,
                  outlineOffset: '-1px',
                }}>

                {/* Day number */}
                <div className="flex justify-center mb-0.5">
                  <span className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                    style={{ background: isToday ? 'var(--purple)' : 'transparent', color: numColor }}>
                    {day}
                  </span>
                </div>

                {/* Holiday label */}
                {holiday && (
                  <div className="truncate mb-0.5" style={{ fontSize: '9px', color: 'var(--rose)', opacity: 0.7 }}>
                    {holiday}
                  </div>
                )}

                {/* Anniversary */}
                {annEntry && (
                  <div className="truncate mb-0.5 flex items-center gap-0.5"
                    style={{ fontSize: '9px', color: annEntry.ann.color }}>
                    {annEntry.ann.type === 'birthday' ? '🎂' : '🎉'}
                    {annEntry.yearsElapsed != null ? `${annEntry.yearsElapsed}周年` : annEntry.ann.title.slice(0, 5)}
                  </div>
                )}

                {/* Events */}
                {visibleEvents.map(ev => (
                  <div key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    className="truncate font-medium cursor-pointer mb-0.5 rounded-md px-1.5 py-0.5"
                    style={{
                      background: `${ev.color || '#a78bfa'}22`,
                      color: ev.color || '#a78bfa',
                      fontSize: '10px',
                    }}>
                    {ev.isAllDay === false && ev.startTime
                      ? `${ev.startTime.slice(0, 5)} ${ev.title}`
                      : ev.title}
                  </div>
                ))}

                {/* Alerts */}
                {visibleAlerts.map(a => (
                  <div key={a.id}
                    onClick={e => { e.stopPropagation(); setSelectedAlert(a); }}
                    className="truncate font-medium cursor-pointer mb-0.5 rounded-md px-1.5 py-0.5 flex items-center gap-0.5"
                    style={{ background: `${a.color}18`, color: a.color, fontSize: '10px' }}>
                    <span style={{ fontSize: '8px' }}>⚠</span>
                    <span className="truncate">{a.title.split(':')[0]}</span>
                  </div>
                ))}

                {overflow > 0 && (
                  <div className="text-center" style={{ color: 'var(--text-3)', fontSize: '9px' }}>
                    +{overflow}
                  </div>
                )}

                {/* Stamps */}
                {dayStamps.length > 0 && (
                  <div className="flex flex-wrap gap-px mt-0.5">
                    {dayStamps.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: 10, lineHeight: 1 }}>{s}</span>
                    ))}
                    {dayStamps.length > 3 && (
                      <span style={{ fontSize: 8, color: 'var(--text-3)' }}>+{dayStamps.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedAlert && (
        <AlertDetail alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </>
  );
}
