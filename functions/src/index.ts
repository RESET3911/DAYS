/**
 * ST CALENDAR — Firebase Cloud Functions
 *
 * 毎朝8時（Asia/Tokyo）に以下を実行:
 *  1. 当日・前日・3日前のカレンダーイベントをリマインダー通知
 *  2. 記念日・誕生日の N 日前通知
 *  3. サブタスク期限（翌日）の通知
 *
 * フロントエンドからのイベント追加通知（HTTP callable）も提供。
 */

import { onSchedule }   from 'firebase-functions/v2/scheduler';
import { onCall }       from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp }  from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

// ── Types ──────────────────────────────────────────────────────────────────

interface NtfySettings { saku?: string; takahashi?: string; }

// ── Helpers ────────────────────────────────────────────────────────────────

const pad  = (n: number) => String(n).padStart(2, '0');
const fmt  = (d: Date)   => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00+09:00');
  d.setDate(d.getDate() + n);
  return fmt(d);
}

function daysUntil(dateStr: string): number {
  const now   = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

async function getNtfySettings(): Promise<NtfySettings> {
  try {
    const snap = await db.collection('ringi').doc('settings').get();
    const data = snap.data() || {};
    return {
      saku:      data.userA?.ntfyTopic || data.ntfyTopic || '',
      takahashi: data.userB?.ntfyTopic || data.ntfyTopicB || '',
    };
  } catch { return {}; }
}

async function sendNtfy(topic: string, title: string, body: string) {
  if (!topic) return;
  await fetch('https://ntfy.sh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, title, message: body, priority: 3, tags: ['calendar'] }),
  });
}

async function writeNotification(params: {
  toUser: string; type: string; title: string; body: string; linkedId?: string;
}) {
  await db.collection('notifications').add({
    toUser:    params.toUser,
    fromApp:   'calendar',
    type:      params.type,
    title:     params.title,
    body:      params.body,
    isRead:    false,
    linkedUrl: 'https://RESET3911.github.io/DAYS/',
    linkedId:  params.linkedId || null,
    createdAt: Timestamp.now(),
  });
}

async function isAlreadySent(key: string): Promise<boolean> {
  const snap = await db.collection('calendar_notification_logs').doc(key).get();
  return snap.exists;
}

async function markSent(key: string) {
  await db.collection('calendar_notification_logs').doc(key).set({ sentAt: Timestamp.now() });
}

// ── Scheduled job (毎朝8時 JST) ───────────────────────────────────────────

export const dailyCalendarNotify = onSchedule(
  { schedule: 'every day 23:00', timeZone: 'UTC', region: 'asia-northeast1' }, // 8:00 JST = 23:00 UTC prev day
  async () => {
    const ntfy    = await getNtfySettings();
    const today   = fmt(new Date());
    const tomorrow = addDays(today, 1);

    // ── 1. Calendar event reminders ──────────────────────────────────────
    const evSnap = await db.collection('st_calendar_events').get();

    for (const doc of evSnap.docs) {
      const ev   = doc.data();
      const days = daysUntil(ev.date);
      if (![0, 1, 3].includes(days)) continue;

      const key = `${doc.id}_${today}_event`;
      if (await isAlreadySent(key)) continue;

      const when = days === 0 ? '今日' : days === 1 ? '明日' : '3日後';
      const time = ev.startTime ? `（${ev.startTime}〜）` : '';
      const title = `📅 ${when}: ${ev.title}`;
      const body  = `${ev.date} ${time}`;

      const toUsers: string[] = ev.assignee === 'both'
        ? ['saku', 'takahashi']
        : [ev.assignee];

      for (const u of toUsers) {
        const topic = ntfy[u as keyof NtfySettings] || '';
        await sendNtfy(topic, title, body);
        await writeNotification({ toUser: u, type: 'calendar_event_near', title, body, linkedId: doc.id });
      }
      await markSent(key);
    }

    // ── 2. Anniversary reminders ─────────────────────────────────────────
    const annSnap = await db.collection('st_anniversaries').get();

    for (const doc of annSnap.docs) {
      const ann   = doc.data();
      const thisY = new Date().getFullYear();
      const annDate = `${thisY}-${pad(ann.month)}-${pad(ann.day)}`;
      const days  = daysUntil(annDate);

      if (days < 0 || days > (ann.notifyDaysBefore || 7)) continue;

      const key = `${doc.id}_${thisY}_ann`;
      if (await isAlreadySent(key)) continue;

      const elapsed = ann.startYear ? thisY - ann.startYear : null;
      const icon    = ann.type === 'birthday' ? '🎂' : '🎉';
      const suffix  = elapsed ? `（今年で${elapsed}周年）` : '';
      const label   = days === 0 ? '今日' : `あと${days}日`;
      const title   = `${icon} ${ann.title}まで${label}${suffix}`;
      const body    = `${ann.month}月${ann.day}日`;

      for (const u of ['saku', 'takahashi'] as const) {
        await sendNtfy(ntfy[u] || '', title, body);
        await writeNotification({ toUser: u, type: 'anniversary_near', title, body, linkedId: doc.id });
      }
      await markSent(key);
    }

    // ── 3. Subtask due-tomorrow reminders ────────────────────────────────
    const evSnap2 = await db.collection('st_calendar_events').get();

    for (const doc of evSnap2.docs) {
      const ev = doc.data();
      const tasks: Array<{ id: string; title: string; dueDate?: string; done?: boolean; assignee?: string }> =
        ev.subTasks || [];

      for (const task of tasks) {
        if (task.done || !task.dueDate) continue;
        if (task.dueDate !== tomorrow) continue;

        const key = `${doc.id}_${task.id}_subtask`;
        if (await isAlreadySent(key)) continue;

        const title = `✅ 明日の締切: ${task.title}`;
        const body  = `親イベント: ${ev.title}`;
        const u     = task.assignee || ev.assignee || 'both';
        const users = u === 'both' ? ['saku', 'takahashi'] : [u];

        for (const user of users) {
          await sendNtfy(ntfy[user as keyof NtfySettings] || '', title, body);
          await writeNotification({ toUser: user, type: 'subtask_due', title, body, linkedId: doc.id });
        }
        await markSent(key);
      }
    }
  }
);

// ── HTTP Callable: notify other user when event is added ────────────────────

export const notifyCalendarEvent = onCall(
  { region: 'asia-northeast1' },
  async (request) => {
    const { eventTitle, eventDate, fromUser } = request.data as {
      eventTitle: string; eventDate: string; fromUser: string;
    };

    const ntfy    = await getNtfySettings();
    const toUser  = fromUser === 'saku' ? 'takahashi' : 'saku';
    const fromLabel = fromUser === 'saku' ? 'さく' : 'たかはし';
    const title   = `📅 ${fromLabel}が予定を追加しました`;
    const body    = `${eventTitle}（${eventDate}）`;
    const topic   = ntfy[toUser as keyof NtfySettings] || '';

    await sendNtfy(topic, title, body);
    await writeNotification({ toUser, type: 'calendar_event_near', title, body });

    return { ok: true };
  }
);
