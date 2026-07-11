import type { CalendarEvent, UserId } from '../types';
import { writeNotification, ntfyPush, getSharedNtfyTopic } from '../shared/notify';

const USER_LABEL: Record<UserId, string> = { kenshin: 'けんしん', rena: 'れなちゃん' };

// ── イベント追加時に相手へ即時通知 ────────────────────────────────
export async function notifyEventAdded(ev: Omit<CalendarEvent, 'id'>, fromUser: UserId): Promise<void> {
  const toUser: UserId = fromUser === 'kenshin' ? 'rena' : 'kenshin';
  // 自分専用の予定（相手に無関係）は通知しない
  if (ev.assignee !== 'both' && ev.assignee !== toUser) return;

  const time  = ev.startTime ? `（${ev.startTime}〜）` : '';
  const title = `📅 ${USER_LABEL[fromUser]}が予定を追加しました`;
  const body  = `${ev.title}\n${ev.date}${time}`;

  const topic = await getSharedNtfyTopic();
  await Promise.allSettled([
    writeNotification({ toUser, fromApp: 'calendar', type: 'calendar_event_added', title, body, linkedUrl: 'https://RESET3911.github.io/DAYS/' }),
    ntfyPush(topic, title, body),
  ]);
}
