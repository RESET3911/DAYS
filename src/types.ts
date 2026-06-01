export type UserId = 'saku' | 'takahashi';
export type Assignee = UserId | 'both';
export type LinkedApp = 'RINGI' | 'WISHLIST' | 'CASHFLOW' | null;
export type TemplateType = '旅行' | '引っ越し' | '記念日' | '高額購入' | '確定申告';
export type AlertType = 'income' | 'expense' | 'tax' | 'card' | 'ringi' | 'anniversary';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  assignee?: Assignee;
  linkedApp?: LinkedApp;
  linkedCategory?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD start
  endDate?: string;    // YYYY-MM-DD end (inclusive)
  startTime?: string;  // HH:mm — omit for all-day
  endTime?: string;    // HH:mm — omit for all-day
  isAllDay?: boolean;  // true when no startTime
  assignee: Assignee;
  templateType?: TemplateType | null;
  subTasks?: SubTask[];
  cashflowCategory?: string | null;
  createdBy: UserId;
  createdAt?: number;
  note?: string;
  color?: string;
  repeat?: RepeatType;
  repeatUntil?: string; // YYYY-MM-DD
}

export interface AlertEvent {
  id: string;
  date: string;
  title: string;
  type: AlertType;
  color: string;
  amount?: number;
  sourceApp: string;
  sourceUrl?: string;
  isAuto: true;
}

export type ViewMode = 'month' | 'week';
