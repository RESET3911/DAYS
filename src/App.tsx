import { useState, useMemo, useRef } from 'react';
import { useUser }          from './hooks/useUser';
import { useEvents }        from './hooks/useEvents';
import { useAlerts, DEFAULT_ALERT_SETTINGS } from './hooks/useAlerts';
import type { AlertSettings }               from './hooks/useAlerts';
import { useAnniversaries } from './hooks/useAnniversaries';
import { UserSelect }        from './components/UserSelect';
import { CalendarGrid }      from './components/CalendarGrid';
import { EventModal }        from './components/EventModal';
import { DayPanel }          from './components/DayPanel';
import { WeekView }          from './components/WeekView';
import { AnniversaryCountdown } from './components/AnniversaryCountdown';
import type { CalendarEvent, ViewMode } from './types';

// ─── Utilities ────────────────────────────────────────────────────────────────

const pad  = (n: number) => String(n).padStart(2, '0');
const fmtD = (d: Date)   => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getWeekStart(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * Expand repeating events into occurrences within [rangeStart, rangeEnd] (YYYY-MM-DD strings).
 * Virtual copies get a composite ID so they're detectable.
 */
function expandRepeats(events: CalendarEvent[], rangeStart: string, rangeEnd: string): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const ev of events) {
    if (!ev.repeat || ev.repeat === 'none') {
      result.push(ev);
      continue;
    }

    const origDate  = new Date(ev.date + 'T00:00:00');
    const endDate   = ev.endDate || ev.date;
    const durDays   = Math.round(
      (new Date(endDate + 'T00:00:00').getTime() - origDate.getTime()) / 86400000
    );
    const until     = ev.repeatUntil
      ? new Date(ev.repeatUntil + 'T00:00:00')
      : new Date(rangeEnd + 'T00:00:00');
    const rangeEndD = new Date(rangeEnd + 'T00:00:00');

    let cur = new Date(origDate);
    let cnt = 0;

    while (cur <= rangeEndD && cur <= until && cnt < 500) {
      const ds = fmtD(cur);
      const de = fmtD(addDays(cur, durDays));
      if (de >= rangeStart) {
        result.push({
          ...ev,
          id:      ds === ev.date ? ev.id : `${ev.id}_${ds}`,
          date:    ds,
          endDate: de,
        });
      }
      switch (ev.repeat) {
        case 'daily':   cur.setDate(cur.getDate() + 1);         break;
        case 'weekly':  cur.setDate(cur.getDate() + 7);         break;
        case 'monthly': cur.setMonth(cur.getMonth() + 1);       break;
        case 'yearly':  cur.setFullYear(cur.getFullYear() + 1); break;
        default:        cur = new Date(rangeEndD.getTime() + 1);
      }
      cnt++;
    }
  }

  return result;
}

/** Strip the `_YYYY-MM-DD` suffix that virtual repeat copies carry */
const originalId = (id: string) => id.replace(/_\d{4}-\d{2}-\d{2}$/, '');

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { userId, selectUser, clearUser }                  = useUser();
  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents();
  const { anniversaries, addAnniversary, deleteAnniversary }   = useAnniversaries();
  const [alertSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
  const alerts = useAlerts(events, alertSettings);

  const now = new Date();

  const [viewMode, setViewMode]       = useState<ViewMode>('month');
  const [year, setYear]               = useState(now.getFullYear());
  const [month, setMonth]             = useState(now.getMonth());
  const [weekStart, setWeekStart]     = useState(() => getWeekStart(now));
  const [selectedDate, setSelectedDate] = useState(fmtD(now));
  const [filter, setFilter]           = useState<'all' | 'self' | 'other'>('all');
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);

  const [formEvent, setFormEvent]     = useState<Partial<CalendarEvent> | null>(null);
  const [showForm, setShowForm]       = useState(false);

  // Touch swipe for month view
  const touchX = useRef(0);

  // ── Derived ranges ──────────────────────────────────────────────────────────

  const rangeStart = viewMode === 'month'
    ? `${year}-${pad(month + 1)}-01`
    : fmtD(weekStart);

  const rangeEnd = viewMode === 'month'
    ? fmtD(new Date(year, month + 1, 0))
    : fmtD(addDays(weekStart, 6));

  // ── Filtered + expanded events ───────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    const base = !userId || filter === 'all' ? events
      : filter === 'self'
        ? events.filter(e => e.assignee === userId || e.assignee === 'both')
        : events.filter(e => e.assignee !== userId && e.assignee !== 'both');

    return expandRepeats(base, rangeStart, rangeEnd);
  }, [events, filter, userId, rangeStart, rangeEnd]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const navigate = (dir: number) => {
    if (viewMode === 'month') {
      let m = month + dir, y = year;
      if (m < 0)  { m = 11; y--; }
      if (m > 11) { m = 0;  y++; }
      setYear(y);
      setMonth(m);
    } else {
      setWeekStart(s => addDays(s, dir * 7));
    }
  };

  const goToday = () => {
    const t = new Date();
    if (viewMode === 'month') { setYear(t.getFullYear()); setMonth(t.getMonth()); }
    else { setWeekStart(getWeekStart(t)); }
    setSelectedDate(fmtD(t));
  };

  // ── Header label ─────────────────────────────────────────────────────────────

  const headerLabel = viewMode === 'month'
    ? `${year}年 ${month + 1}月`
    : (() => {
        const we = addDays(weekStart, 6);
        return weekStart.getMonth() === we.getMonth()
          ? `${weekStart.getMonth() + 1}月 ${weekStart.getDate()}〜${we.getDate()}日`
          : `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${we.getMonth() + 1}/${we.getDate()}`;
      })();

  // ── Modal handlers ───────────────────────────────────────────────────────────

  const openNew = (date?: string, startTime?: string) => {
    const d = date || selectedDate;
    setFormEvent({
      date: d, endDate: d,
      isAllDay: !startTime,
      startTime: startTime || '',
      endTime: startTime
        ? `${pad((parseInt(startTime.split(':')[0]) + 1) % 24)}:${startTime.split(':')[1]}`
        : '',
    });
    setShowForm(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    // Find original in events list (virtual repeat copies have composite IDs)
    const orig = events.find(e => e.id === originalId(ev.id)) || ev;
    setFormEvent(orig);
    setShowForm(true);
  };

  const handleSave = async (ev: Omit<CalendarEvent, 'id'> | CalendarEvent) => {
    if ('id' in ev && ev.id) {
      const { id, ...data } = ev;
      await updateEvent(id, data);
    } else {
      await addEvent(ev as Omit<CalendarEvent, 'id'>);
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (formEvent?.id) await deleteEvent(originalId(formEvent.id));
    setShowForm(false);
  };

  // ── User not selected ────────────────────────────────────────────────────────

  if (!userId) return <UserSelect onSelect={selectUser} />;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-dvh max-w-xl mx-auto relative"
      style={{ background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Subtle light background accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '50%', paddingTop: '50%', borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(124,58,237,.06) 0%,transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: '40%', paddingTop: '40%', borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(109,40,217,.04) 0%,transparent 70%)',
        }} />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center px-2 py-2 relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>

        <button
          onClick={clearUser}
          title="ユーザー切替"
          className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mr-1 transition-transform active:scale-90"
          style={{ background: 'var(--surface)' }}>
          {userId === 'saku' ? '🌸' : '🔷'}
        </button>

        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center text-2xl flex-shrink-0"
          style={{ color: 'var(--text-3)' }}>‹</button>

        <h1 className="flex-1 text-center font-head font-bold tracking-tight select-none"
          style={{ fontSize: '15px' }}>
          {headerLabel}
        </h1>

        <button onClick={() => navigate(1)}
          className="w-9 h-9 flex items-center justify-center text-2xl flex-shrink-0"
          style={{ color: 'var(--text-3)' }}>›</button>

        <button onClick={goToday}
          className="text-xs font-bold px-3 py-1.5 rounded-full ml-1 flex-shrink-0 transition-all active:scale-95"
          style={{
            background: 'rgba(167,139,250,.15)',
            color: 'var(--purple)',
            border: '1px solid rgba(167,139,250,.3)',
          }}>
          今日
        </button>
      </header>

      {/* ── Tab bar + filter ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1 relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}>

        {/* View tabs */}
        <div className="flex gap-1">
          {(['month', 'week'] as ViewMode[]).map(m => (
            <button key={m}
              onClick={() => {
                setViewMode(m);
                if (m === 'week') setWeekStart(getWeekStart(new Date(selectedDate + 'T00:00:00')));
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: viewMode === m ? 'rgba(167,139,250,.2)' : 'transparent',
                color: viewMode === m ? 'var(--purple)' : 'var(--text-3)',
                border: viewMode === m ? '1px solid rgba(167,139,250,.3)' : '1px solid transparent',
              }}>
              {m === 'month' ? '月' : '週'}
            </button>
          ))}
        </div>

        {/* Assignee filter + alert toggle */}
        <div className="flex gap-1 items-center">
          {(['all', 'self', 'other'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === f ? 'rgba(167,139,250,.2)' : 'transparent',
                color: filter === f ? 'var(--purple)' : 'var(--text-3)',
                border: filter === f ? '1px solid rgba(167,139,250,.3)' : '1px solid transparent',
              }}>
              {f === 'all' ? '全員' : f === 'self' ? '自分' : '相手'}
            </button>
          ))}
          <button
            onClick={() => setShowAlertsOnly(v => !v)}
            title="アラートのみ"
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm ml-0.5 transition-all"
            style={{
              background: showAlertsOnly ? 'rgba(251,191,36,.2)' : 'transparent',
              color: showAlertsOnly ? 'var(--amber)' : 'var(--text-3)',
              border: showAlertsOnly ? '1px solid rgba(251,191,36,.3)' : '1px solid transparent',
            }}>
            ⚠
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 relative z-10 flex flex-col">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(8,4,18,.5)' }}>
            <div className="skel w-32 h-4 rounded-full" />
          </div>
        )}

        {viewMode === 'month' ? (
          <div className="flex flex-col h-full min-h-0"
            onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
            }}>
            {/* Anniversary countdown banner */}
            <AnniversaryCountdown
              anniversaries={anniversaries}
              userId={userId!}
              onAdd={addAnniversary}
              onDelete={deleteAnniversary}
            />
            <div className="flex-shrink-0 px-2 pt-2">
              <CalendarGrid
                year={year}
                month={month}
                events={filteredEvents}
                alerts={alerts}
                anniversaries={anniversaries}
                showAlertsOnly={showAlertsOnly}
                selectedDate={selectedDate}
                onDayClick={setSelectedDate}
                onEventClick={openEdit}
              />
            </div>
            <DayPanel
              selectedDate={selectedDate}
              events={filteredEvents}
              alerts={alerts}
              showAlertsOnly={showAlertsOnly}
              onEventClick={openEdit}
              onAddClick={openNew}
            />
          </div>
        ) : (
          <WeekView
            weekStart={weekStart}
            events={filteredEvents}
            onEventClick={openEdit}
            onSlotClick={(datetime) => {
              const [date, time] = datetime.split('T');
              setSelectedDate(date);
              openNew(date, time);
            }}
            onSwipePrev={() => navigate(-1)}
            onSwipeNext={() => navigate(1)}
          />
        )}
      </main>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <button
        onClick={() => openNew()}
        aria-label="イベントを追加"
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full text-white font-bold text-2xl flex items-center justify-center z-20 transition-transform active:scale-90"
        style={{
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          boxShadow: '0 4px 24px rgba(124,58,237,.55)',
        }}>
        ＋
      </button>

      {/* ── Event form modal ──────────────────────────────────────────────── */}
      {showForm && (
        <EventModal
          initial={formEvent || undefined}
          userId={userId}
          onSave={handleSave}
          onDelete={formEvent?.id ? handleDelete : undefined}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
