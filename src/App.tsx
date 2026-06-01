import { useState, useMemo, useRef } from 'react';
import { useUser }           from './hooks/useUser';
import { useEvents }         from './hooks/useEvents';
import { useAlerts, DEFAULT_ALERT_SETTINGS } from './hooks/useAlerts';
import type { AlertSettings }                from './hooks/useAlerts';
import { useAnniversaries }  from './hooks/useAnniversaries';
import { useTodos }          from './hooks/useTodos';
import { useNotes }          from './hooks/useNotes';
import { useStamps }         from './hooks/useStamps';
import { useSettings }       from './hooks/useSettings';
import { STAMPS }            from './components/StampPicker';
import { UserSelect }         from './components/UserSelect';
import { CalendarGrid }       from './components/CalendarGrid';
import { EventModal }         from './components/EventModal';
import { DayPanel }           from './components/DayPanel';
import { WeekView }           from './components/WeekView';
import { TodayView }          from './components/TodayView';
import { BottomNav }          from './components/BottomNav';
import { TodoTabView }        from './components/TodoTabView';
import { StampTabView }       from './components/StampTabView';
import { SettingsView }       from './components/SettingsView';
import { AnniversaryCountdown } from './components/AnniversaryCountdown';
import { StampShelf }           from './components/StampShelf';
import type { CalendarEvent, BottomTab, CalendarSubView } from './types';

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

function expandRepeats(events: CalendarEvent[], rangeStart: string, rangeEnd: string): CalendarEvent[] {
  const result: CalendarEvent[] = [];
  for (const ev of events) {
    if (!ev.repeat || ev.repeat === 'none') { result.push(ev); continue; }
    const origDate  = new Date(ev.date + 'T00:00:00');
    const endDate   = ev.endDate || ev.date;
    const durDays   = Math.round((new Date(endDate + 'T00:00:00').getTime() - origDate.getTime()) / 86400000);
    const until     = ev.repeatUntil ? new Date(ev.repeatUntil + 'T00:00:00') : new Date(rangeEnd + 'T00:00:00');
    const rangeEndD = new Date(rangeEnd + 'T00:00:00');
    let cur = new Date(origDate), cnt = 0;
    while (cur <= rangeEndD && cur <= until && cnt < 500) {
      const ds = fmtD(cur), de = fmtD(addDays(cur, durDays));
      if (de >= rangeStart) result.push({ ...ev, id: ds === ev.date ? ev.id : `${ev.id}_${ds}`, date: ds, endDate: de });
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

const originalId = (id: string) => id.replace(/_\d{4}-\d{2}-\d{2}$/, '');

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { userId, selectUser, clearUser }                   = useUser();
  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents();
  const { anniversaries, addAnniversary, deleteAnniversary }    = useAnniversaries();
  const { todosByDate, addTodo, toggleTodo, deleteTodo }        = useTodos(userId);
  const { notesByDate, saveNote }                               = useNotes(userId);
  const { stampsByDate, stampDayByDate, addStamp, removeStamp, toggleStamp, setStampNote } = useStamps(userId);
  const { customStamps, addCustomStamp, removeCustomStamp, customTemplates, addCustomTemplate, removeCustomTemplate } = useSettings();
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS);
  const alerts = useAlerts(events, alertSettings);

  const now = new Date();

  // Navigation state
  const [bottomTab, setBottomTab]         = useState<BottomTab>('calendar');
  const [calSubView, setCalSubView]       = useState<CalendarSubView>('month');

  // Calendar state
  const [year, setYear]               = useState(now.getFullYear());
  const [month, setMonth]             = useState(now.getMonth());
  const [weekStart, setWeekStart]     = useState(() => getWeekStart(now));
  const [selectedDate, setSelectedDate] = useState(fmtD(now));
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [filter, setFilter]           = useState<'all' | 'self' | 'other'>('all');

  const [formEvent, setFormEvent]     = useState<Partial<CalendarEvent> | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const touchX = useRef(0);

  // ── Computed ranges ──────────────────────────────────────────────────────────

  const rangeStart = calSubView === 'month'
    ? `${year}-${pad(month + 1)}-01`
    : calSubView === 'week' ? fmtD(weekStart)
    : fmtD(now);

  const rangeEnd = calSubView === 'month'
    ? fmtD(new Date(year, month + 1, 0))
    : calSubView === 'week' ? fmtD(addDays(weekStart, 6))
    : fmtD(now);

  const filteredEvents = useMemo(() => {
    const base = !userId || filter === 'all' ? events
      : filter === 'self'
        ? events.filter(e => e.assignee === userId || e.assignee === 'both')
        : events.filter(e => e.assignee !== userId && e.assignee !== 'both');
    return expandRepeats(base, rangeStart, rangeEnd);
  }, [events, filter, userId, rangeStart, rangeEnd]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const navigate = (dir: number) => {
    if (calSubView === 'month') {
      let m = month + dir, y = year;
      if (m < 0)  { m = 11; y--; }
      if (m > 11) { m = 0;  y++; }
      setYear(y); setMonth(m);
    } else if (calSubView === 'week') {
      setWeekStart(s => addDays(s, dir * 7));
    }
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear()); setMonth(t.getMonth());
    setWeekStart(getWeekStart(t));
    setSelectedDate(fmtD(t));
  };

  // ── Header label ─────────────────────────────────────────────────────────────

  const headerTitle = bottomTab !== 'calendar' ? { calendar: '', todo: 'ToDo', stamp: 'スタンプ', settings: '設定' }[bottomTab]
    : calSubView === 'today' ? '今日'
    : calSubView === 'month' ? `${year}年 ${month + 1}月`
    : (() => {
        const we = addDays(weekStart, 6);
        return weekStart.getMonth() === we.getMonth()
          ? `${weekStart.getMonth() + 1}月 ${weekStart.getDate()}〜${we.getDate()}日`
          : `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${we.getMonth() + 1}/${we.getDate()}`;
      })();

  const userLabel = userId === 'saku' ? '👦' : '🌸';

  // ── Modal ────────────────────────────────────────────────────────────────────

  const openNew = (date?: string, startTime?: string) => {
    const d = date || selectedDate;
    setFormEvent({ date: d, endDate: d, isAllDay: !startTime, startTime: startTime || '', endTime: startTime ? `${pad((parseInt(startTime.split(':')[0]) + 1) % 24)}:${startTime.split(':')[1]}` : '' });
    setShowForm(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    const orig = events.find(e => e.id === originalId(ev.id)) || ev;
    setFormEvent(orig);
    setShowForm(true);
  };

  const handleSave = async (ev: Omit<CalendarEvent, 'id'> | CalendarEvent) => {
    if ('id' in ev && ev.id) { const { id, ...data } = ev; await updateEvent(id, data); }
    else await addEvent(ev as Omit<CalendarEvent, 'id'>);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (formEvent?.id) await deleteEvent(originalId(formEvent.id));
    setShowForm(false);
  };

  const onAddPress = () => {
    if (bottomTab === 'calendar') openNew(selectedDate);
    else openNew(fmtD(now));
  };

  if (!userId) return <UserSelect onSelect={selectUser} />;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-dvh max-w-xl mx-auto relative"
      style={{ background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Subtle bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '50%', paddingTop: '50%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.05) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40%', paddingTop: '40%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(109,40,217,.03) 0%,transparent 70%)' }} />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center px-2 py-2 relative z-10"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>

        <button onClick={clearUser} title="ユーザー切替"
          className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mr-1 transition-transform active:scale-90"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          {userLabel}
        </button>

        {bottomTab === 'calendar' && calSubView !== 'today' && (
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center text-2xl flex-shrink-0"
            style={{ color: 'var(--text-3)' }}>‹</button>
        )}

        <h1 className="flex-1 text-center font-head font-bold tracking-tight select-none"
          style={{ fontSize: 15, color: 'var(--text)' }}>
          {headerTitle}
        </h1>

        {bottomTab === 'calendar' && calSubView !== 'today' && (
          <button onClick={() => navigate(1)}
            className="w-9 h-9 flex items-center justify-center text-2xl flex-shrink-0"
            style={{ color: 'var(--text-3)' }}>›</button>
        )}

        {bottomTab === 'calendar' && (
          <button onClick={goToday}
            className="text-xs font-bold px-2.5 py-1.5 rounded-full ml-1 flex-shrink-0 transition-all active:scale-95"
            style={{ background: 'rgba(124,58,237,.1)', color: 'var(--purple)', border: '1px solid rgba(124,58,237,.25)' }}>
            今日
          </button>
        )}
      </header>

      {/* ── Calendar sub-tabs (only in calendar tab) ─────────────────────── */}
      {bottomTab === 'calendar' && (
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-1 relative z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex gap-1">
            {([['today','今日'], ['month','月'], ['week','週']] as [CalendarSubView, string][]).map(([m, label]) => (
              <button key={m}
                onClick={() => { setCalSubView(m); if (m === 'week') setWeekStart(getWeekStart(new Date(selectedDate + 'T00:00:00'))); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: calSubView === m ? 'rgba(124,58,237,.15)' : 'transparent',
                  color: calSubView === m ? 'var(--purple)' : 'var(--text-3)',
                  border: calSubView === m ? '1px solid rgba(124,58,237,.3)' : '1px solid transparent',
                }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 items-center">
            {(['all', 'self', 'other'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-2 py-1 rounded-full text-xs font-bold transition-all"
                style={{
                  background: filter === f ? 'rgba(124,58,237,.15)' : 'transparent',
                  color: filter === f ? 'var(--purple)' : 'var(--text-3)',
                  border: filter === f ? '1px solid rgba(124,58,237,.3)' : '1px solid transparent',
                }}>
                {f === 'all' ? '全員' : f === 'self' ? '自分' : '相手'}
              </button>
            ))}
            <button onClick={() => setShowAlertsOnly(v => !v)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm ml-0.5"
              style={{ background: showAlertsOnly ? 'rgba(214,119,0,.15)' : 'transparent', color: showAlertsOnly ? 'var(--amber)' : 'var(--text-3)', border: showAlertsOnly ? '1px solid rgba(214,119,0,.3)' : '1px solid transparent' }}>
              ⚠
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 relative z-10 flex flex-col" style={{ paddingBottom: 64 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(245,244,250,.7)' }}>
            <div className="skel w-32 h-4 rounded-full" />
          </div>
        )}

        {/* ── Calendar tab ──────────────────────────────────────────────── */}
        {bottomTab === 'calendar' && calSubView === 'today' && (
          <TodayView
            events={filteredEvents} alerts={alerts}
            stamps={stampDayByDate[fmtD(now)]?.stamps || []}
            stampNotes={stampDayByDate[fmtD(now)]?.notes || {}}
            customStamps={customStamps}
            todos={todosByDate[fmtD(now)] || []}
            noteContent={notesByDate[fmtD(now)] || ''}
            onToggleStamp={s => toggleStamp(fmtD(now), s)}
            onRemoveStamp={s => removeStamp(fmtD(now), s)}
            onSetStampNote={(s, note) => setStampNote(fmtD(now), s, note)}
            onAddCustomStamp={addCustomStamp}
            onAddTodo={title => addTodo(fmtD(now), title)}
            onToggleTodo={toggleTodo} onDeleteTodo={deleteTodo}
            onSaveNote={saveNote}
            onEventClick={openEdit} onAddEvent={() => openNew(fmtD(now))}
          />
        )}

        {bottomTab === 'calendar' && calSubView === 'month' && (
          <div className="flex flex-col h-full min-h-0">
            {/* Scrollable area: banner + grid + day panel */}
            <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 120 }}
              onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
              onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 80) navigate(dx < 0 ? 1 : -1); }}>
              <AnniversaryCountdown anniversaries={anniversaries} userId={userId!} onAdd={addAnniversary} onDelete={deleteAnniversary} />
              <div className="px-2 pt-2">
                <CalendarGrid year={year} month={month} events={filteredEvents} alerts={alerts}
                  anniversaries={anniversaries} stampsByDate={stampsByDate}
                  showAlertsOnly={showAlertsOnly} selectedDate={selectedDate}
                  onDayClick={setSelectedDate} onEventClick={openEdit}
                  onStampDrop={(date, stamp) => addStamp(date, stamp)} />
              </div>
              <DayPanel selectedDate={selectedDate} events={filteredEvents} alerts={alerts}
                stamps={stampDayByDate[selectedDate]?.stamps || []}
                stampNotes={stampDayByDate[selectedDate]?.notes || {}}
                customStamps={customStamps}
                todos={todosByDate[selectedDate] || []}
                noteContent={notesByDate[selectedDate] || ''}
                showAlertsOnly={showAlertsOnly}
                onToggleStamp={s => toggleStamp(selectedDate, s)}
                onRemoveStamp={s => removeStamp(selectedDate, s)}
                onSetStampNote={(s, note) => setStampNote(selectedDate, s, note)}
                onAddCustomStamp={addCustomStamp}
                onAddTodo={title => addTodo(selectedDate, title)}
                onToggleTodo={toggleTodo} onDeleteTodo={deleteTodo}
                onSaveNote={saveNote}
                onEventClick={openEdit} onAddClick={openNew} />
            </div>
            {/* Fixed stamp shelf above bottom nav */}
            <StampShelf stamps={[...STAMPS, ...customStamps.map(e => ({ emoji: e, label: 'カスタム' }))]}
              onDrop={(date, stamp) => addStamp(date, stamp)} />
          </div>
        )}

        {bottomTab === 'calendar' && calSubView === 'week' && (
          <WeekView weekStart={weekStart} events={filteredEvents} onEventClick={openEdit}
            onSlotClick={(dt) => { const [d, t] = dt.split('T'); setSelectedDate(d); openNew(d, t); }}
            onSwipePrev={() => navigate(-1)} onSwipeNext={() => navigate(1)} />
        )}

        {/* ── ToDo tab ──────────────────────────────────────────────────── */}
        {bottomTab === 'todo' && (
          <TodoTabView todosByDate={todosByDate}
            onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} />
        )}

        {/* ── Stamp tab ─────────────────────────────────────────────────── */}
        {bottomTab === 'stamp' && (
          <StampTabView stampsByDate={stampsByDate}
            customStamps={customStamps}
            onToggle={toggleStamp}
            onAddCustom={addCustomStamp}
            onRemoveCustom={removeCustomStamp} />
        )}

        {/* ── Settings tab ──────────────────────────────────────────────── */}
        {bottomTab === 'settings' && (
          <SettingsView userId={userId} alertSettings={alertSettings}
            customTemplates={customTemplates}
            onAddTemplate={addCustomTemplate}
            onRemoveTemplate={removeCustomTemplate}
            onAlertChange={(k, v) => setAlertSettings(s => ({ ...s, [k]: v }))}
            onSwitchUser={clearUser} />
        )}
      </main>

      {/* ── Bottom navigation ─────────────────────────────────────────── */}
      <BottomNav active={bottomTab} onChange={setBottomTab} onAdd={onAddPress} />

      {/* ── Event form modal ──────────────────────────────────────────── */}
      {showForm && (
        <EventModal initial={formEvent || undefined} userId={userId}
          customTemplates={customTemplates}
          onSave={handleSave}
          onDelete={formEvent?.id ? handleDelete : undefined}
          onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
