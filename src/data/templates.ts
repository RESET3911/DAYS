import type { TemplateType, LinkedApp, Assignee } from '../types';

export interface TemplateSubTask {
  title: string;
  linkedApp?: LinkedApp;
  linkedCategory?: string;
}

export interface Template {
  type: TemplateType;
  icon: string;
  description: string;
  subTasks: TemplateSubTask[];
  defaultDays: number;
  cashflowCategory: string;
  startMonth?: number;
}

export const TEMPLATES: Template[] = [
  {
    type: '旅行',
    icon: '✈️',
    description: '宿・交通・予算・持ち物を一括管理',
    subTasks: [
      { title: '宿予約' },
      { title: '交通手段手配' },
      { title: '旅行予算設定', linkedApp: 'CASHFLOW', linkedCategory: '旅費交通費' },
      { title: '持ち物リスト作成' },
      { title: '支払い確認' },
    ],
    defaultDays: 3,
    cashflowCategory: '旅費交通費',
  },
  {
    type: '引っ越し',
    icon: '🏠',
    description: '物件探しから転居届まで',
    subTasks: [
      { title: '物件内見' },
      { title: '契約手続き' },
      { title: '家具・家電購入', linkedApp: 'RINGI' },
      { title: 'ライフライン手続き（電気・水道・ガス・ネット）' },
      { title: '転居届' },
    ],
    defaultDays: 30,
    cashflowCategory: 'その他',
  },
  {
    type: '記念日',
    icon: '🎉',
    description: '予約・プレゼント・予算を事前に準備',
    subTasks: [
      { title: '店・場所の予約' },
      { title: 'プレゼント準備', linkedApp: 'WISHLIST' },
      { title: '移動手段確認' },
      { title: '予算確認', linkedApp: 'CASHFLOW', linkedCategory: '接待交際費' },
    ],
    defaultDays: 1,
    cashflowCategory: '接待交際費',
  },
  {
    type: '高額購入',
    icon: '💳',
    description: 'RINGIと連携した購入フロー',
    subTasks: [
      { title: '候補の比較検討' },
      { title: '見積もり取得' },
      { title: 'RINGI申請', linkedApp: 'RINGI' },
      { title: '購入実行' },
      { title: '購入後レビュー記録' },
    ],
    defaultDays: 14,
    cashflowCategory: '消耗品費',
  },
  {
    type: '確定申告',
    icon: '📋',
    description: '1月から始める申告準備チェックリスト',
    subTasks: [
      { title: '書類・領収書整理' },
      { title: 'CASSHFLOWで経費確認', linkedApp: 'CASHFLOW' },
      { title: '申告書作成' },
      { title: '税務署提出または e-Tax' },
      { title: '納税' },
    ],
    defaultDays: 60,
    cashflowCategory: 'その他',
    startMonth: 1,
  },
];

export const EVENT_COLORS: { label: string; value: string; bg: string }[] = [
  { label: 'パープル', value: '#a78bfa', bg: 'rgba(167,139,250,0.2)' },
  { label: 'エメラルド', value: '#34d399', bg: 'rgba(52,211,153,0.2)' },
  { label: 'ローズ',   value: '#fb7185', bg: 'rgba(251,113,133,0.2)' },
  { label: 'アンバー', value: '#fbbf24', bg: 'rgba(251,191,36,0.2)' },
  { label: 'スカイ',   value: '#38bdf8', bg: 'rgba(56,189,248,0.2)' },
];

export const DEFAULT_COLOR = EVENT_COLORS[0].value;

export const ASSIGNEE_LABELS: Record<string, string> = {
  saku:      'さく',
  takahashi: 'たかはし',
  both:      '2人',
};

export function buildSubTasksFromTemplate(
  template: Template,
  createdBy: string
): import('../types').SubTask[] {
  return template.subTasks.map((t, i) => ({
    id: `${Date.now()}_${i}`,
    title: t.title,
    done: false,
    linkedApp: t.linkedApp ?? null,
    linkedCategory: t.linkedCategory ?? undefined,
    assignee: (createdBy === 'saku' ? 'saku' : 'takahashi') as Assignee,
  }));
}
