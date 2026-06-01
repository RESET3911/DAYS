import { useRef, useEffect } from 'react';
import type { CalendarEvent } from '../types';

const WDS = ['日', '月', '火', '水', '木', '金', '土'];
const HOUR_PX = 64;    // px per hour
const TOTAL_H = HOUR_PX * 24;

const pad  = (n: number) => String(n).padStart(2, '0');
const fmtD = (d: Date)  => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

interface LayedEvent { ev: CalendarEvent; col: number; totalCols: number; startMin: number; endMin: number; }

function layoutDay(events: CalendarEvent[]): LayedEvent[] {
  const sorted = events
    .filter(e => e.isAllDay === false && e.startTime)
    .map(e => ({
      ev: e,
      startMin: toMin(e.startTime!),
      endMin:   toMin(e.endTime || e.startTime!),
      col: 0, totalCols: 1,
    }))
    .sort((a, b) => a.startMin - b.startMin);

  const cols: number[] = []; // each col's current end minute

  for (const item of sorted) {
    let placed = false;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i] <= item.startMin) {
        cols[i] = item.endMin;
        item.col = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      item.col = cols.length;
      cols.push(item.endMin);
    }
  }

  const numCols = cols.length || 1;
  for (const item of sorted) item.totalCols = numCols;

  return sorted;
}

interface Props {
  weekStart: Date;
  events: CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
  onSlotClick: (datetime: string) => void;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
}

export function WeekView({ weekStart, events, onEventClick, onSlotClick, onSwipePrev, onSwipeNext }: Props) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const today      = fmtD(new Date());

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to 8:00 on first mount / week change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_PX - 16;
    }
  }, [weekStart]);

  // Current time position
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = nowMin * (HOUR_PX / 60);

  // All-day events and timed events per day
  const allDayMap: Record<string, CalendarEvent[]>  = {};
  const timedMap:  Record<string, CalendarEvent[]>  = {};

  for (const day of days) {
    const ds = fmtD(day);
    allDayMap[ds] = [];
    timedMap[ds]  = [];

    for (const ev of events) {
      const evStart = ev.date;
      const evEnd   = ev.endDate || ev.date;
      if (ds < evStart || ds > evEnd) continue;

      if (ev.isAllDay !== false || !ev.startTime) {
        allDayMap[ds].push(ev);
      } else {
        timedMap[ds].push(ev);
      }
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 60) dx < 0 ? onSwipeNext() : onSwipePrev();
      }}>

      {/* Day headers */}
      <div className="flex-shrink-0 flex" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-10 flex-shrink-0" />
        {days.map(day => {
          const ds       = fmtD(day);
          const isToday  = ds === today;
          const isSun    = day.getDay() === 0;
          const isSat    = day.getDay() === 6;
          const textColor = isToday ? '#fff' : isSun ? 'var(--rose)' : isSat ? '#60a5fa' : 'var(--text-2)';

          return (
            <div key={ds} className="flex-1 flex flex-col items-center py-1.5"
              style={{ borderLeft: '1px solid var(--border)' }}>
              <span className="text-xs font-bold" style={{ color: isSun ? 'var(--rose)' : isSat ? '#60a5fa' : 'var(--text-3)' }}>
                {WDS[day.getDay()]}
              </span>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: isToday ? 'var(--purple)' : 'transparent', color: textColor }}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      <div className="flex-shrink-0 flex min-h-7"
        style={{ borderBottom: '2px solid var(--border)' }}>
        <div className="w-10 flex-shrink-0 flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--text-3)', fontSize: '9px' }}>終日</span>
        </div>
        {days.map(day => {
          const ds    = fmtD(day);
          const evs   = allDayMap[ds] || [];
          return (
            <div key={ds} className="flex-1 p-0.5 flex flex-col gap-0.5"
              style={{ borderLeft: '1px solid var(--border)' }}>
              {evs.slice(0, 2).map(ev => (
                <button key={ev.id} onClick={() => onEventClick(ev)}
                  className="w-full text-left px-1.5 rounded text-xs font-bold truncate"
                  style={{ background: `${ev.color || '#a78bfa'}25`, color: ev.color || '#a78bfa', minHeight: '18px' }}>
                  {ev.title}
                </button>
              ))}
              {evs.length > 2 && (
                <span className="text-xs text-center" style={{ color: 'var(--text-3)' }}>+{evs.length - 2}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative"
        style={{ scrollbarWidth: 'thin' }}>
        <div style={{ height: TOTAL_H, display: 'flex', position: 'relative' }}>

          {/* Hour gutter */}
          <div className="w-10 flex-shrink-0 relative" style={{ borderRight: '1px solid var(--border)' }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{
                position: 'absolute',
                top: h * HOUR_PX - 8,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 4,
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', userSelect: 'none' }}>
                  {h > 0 ? `${pad(h)}:00` : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1" style={{ position: 'relative' }}>
            {days.map((day) => {
              const ds      = fmtD(day);
              const isToday = ds === today;
              const laid    = layoutDay(timedMap[ds] || []);

              return (
                <div key={ds} className="flex-1 relative"
                  style={{
                    borderLeft: '1px solid var(--border)',
                    background: isToday ? 'rgba(167,139,250,0.03)' : 'transparent',
                  }}
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('[data-event]')) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y    = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0);
                    const min  = Math.floor(y / (HOUR_PX / 60) / 30) * 30;
                    onSlotClick(`${ds}T${pad(Math.floor(min/60))}:${pad(min%60)}`);
                  }}>

                  {/* Hour grid lines */}
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} style={{
                      position: 'absolute',
                      top: h * HOUR_PX,
                      left: 0, right: 0,
                      height: 1,
                      background: 'var(--border)',
                      pointerEvents: 'none',
                    }} />
                  ))}

                  {/* Half-hour lines */}
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={`half-${h}`} style={{
                      position: 'absolute',
                      top: h * HOUR_PX + HOUR_PX / 2,
                      left: 0, right: 0,
                      height: 1,
                      background: 'rgba(0,0,0,0.04)',
                      pointerEvents: 'none',
                    }} />
                  ))}

                  {/* Events */}
                  {laid.map(({ ev, col, totalCols, startMin, endMin }) => {
                    const top    = startMin * (HOUR_PX / 60);
                    const height = Math.max((endMin - startMin) * (HOUR_PX / 60), 24);
                    const w      = `${100 / totalCols}%`;
                    const l      = `${(100 / totalCols) * col}%`;
                    const color  = ev.color || '#a78bfa';
                    const isShort = height < 44;

                    return (
                      <button
                        key={ev.id}
                        data-event="1"
                        onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                        style={{
                          position: 'absolute',
                          top, height,
                          left: l, width: w,
                          padding: '2px 4px',
                          background: `${color}30`,
                          borderLeft: `3px solid ${color}`,
                          borderRadius: '4px',
                          overflow: 'hidden',
                          zIndex: 1,
                          textAlign: 'left',
                        }}>
                        <div style={{
                          fontSize: isShort ? '9px' : '11px',
                          fontWeight: 700,
                          color,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}>
                          {ev.title}
                        </div>
                        {!isShort && (
                          <div style={{ fontSize: '9px', color: `${color}aa`, lineHeight: 1 }}>
                            {ev.startTime}〜{ev.endTime}
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Current time line (only on today's column) */}
                  {isToday && (
                    <div style={{
                      position: 'absolute',
                      top: nowTop,
                      left: -2, right: 0,
                      height: 2,
                      background: 'var(--rose)',
                      zIndex: 5,
                      pointerEvents: 'none',
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: -4, top: -4,
                        width: 8, height: 8,
                        borderRadius: '50%',
                        background: 'var(--rose)',
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
