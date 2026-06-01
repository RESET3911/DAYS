import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { AlertEvent, CalendarEvent } from '../types';

const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (date: string, n: number) => {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fmt(d);
};

function taxAlerts(year: number): AlertEvent[] {
  const next = year + 1;
  return [
    { id: `tax_income_${year}`, date: `${year}-03-15`, title: '所得税 確定申告期限', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_sub_${year}`, date: `${year}-05-31`, title: '所得税 振替納税', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_cons_${year}`, date: `${year}-03-31`, title: '消費税 申告期限', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_res1_${year}`, date: `${year}-06-30`, title: '住民税 第1期', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_res2_${year}`, date: `${year}-08-31`, title: '住民税 第2期', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_res3_${year}`, date: `${year}-10-31`, title: '住民税 第3期', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_res4_${next}`, date: `${next}-01-31`, title: '住民税 第4期', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_est1_${year}`, date: `${year}-07-31`, title: '所得税 予定納税 第1期', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
    { id: `tax_est2_${year}`, date: `${year}-11-30`, title: '所得税 予定納税 第2期', type: 'tax', color: '#ef4444', sourceApp: 'CASHFLOW', isAuto: true },
  ];
}

export interface AlertSettings {
  cashflow: boolean;
  ringi: boolean;
  gantt: boolean;
  tax: boolean;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  cashflow: true, ringi: true, gantt: true, tax: true,
};

export function useAlerts(events: CalendarEvent[], settings: AlertSettings = DEFAULT_ALERT_SETTINGS) {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const year   = new Date().getFullYear();
      const result: AlertEvent[] = settings.tax
        ? [...taxAlerts(year), ...taxAlerts(year - 1)]
        : [];

      // income alerts (cashflow_incomes)
      if (settings.cashflow) try {
        const snap = await getDocs(collection(db, 'cashflow_incomes'));
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.isPaid) return;
          const date = data.invoiceDate || data.expectedPaymentDate;
          if (!date) return;
          result.push({
            id: `income_${d.id}`,
            date,
            title: `入金予定: ${data.clientName || '—'} ${data.amount ? '¥' + data.amount.toLocaleString() : ''}`,
            type: 'income',
            color: '#34d399',
            amount: data.amount,
            sourceApp: 'CASHFLOW',
            sourceUrl: 'https://RESET3911.github.io/CASHFLOW/',
            isAuto: true,
          });
        });
      } catch (_) { /* ignore */ }

      // fixed expense / card alerts (cashflow_expenses)
      if (settings.cashflow) try {
        const snap = await getDocs(collection(db, 'cashflow_expenses'));
        const now = new Date();
        snap.docs.forEach(d => {
          const data = d.data();
          if (!data.isActive) return;
          const day: number = data.billingDay;
          if (!day) return;
          const type = (data.type || '').includes('カード') ? 'card' : 'expense';
          const color = type === 'card' ? '#fbbf24' : '#fb7185';
          // generate next 3 months
          for (let m = 0; m < 3; m++) {
            const target = new Date(now.getFullYear(), now.getMonth() + m, day);
            result.push({
              id: `exp_${d.id}_${m}`,
              date: fmt(target),
              title: `${type === 'card' ? 'カード引き落とし' : '固定費'}: ${data.name || '—'} ¥${(data.amount || 0).toLocaleString()}`,
              type,
              color,
              amount: data.amount,
              sourceApp: 'CASHFLOW',
              sourceUrl: 'https://RESET3911.github.io/CASHFLOW/',
              isAuto: true,
            });
          }
        });
      } catch (_) { /* ignore */ }

      // RINGI pending alerts
      if (settings.ringi) try {
        const snap = await getDocs(collection(db, 'applications'));
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.status !== 'pending') return;
          const date = data.deadline;
          if (!date) return;
          result.push({
            id: `ringi_${d.id}`,
            date,
            title: `RINGI期限: ${data.item || '—'}`,
            type: 'ringi',
            color: '#fbbf24',
            amount: data.amount,
            sourceApp: 'RINGI',
            sourceUrl: 'https://RESET3911.github.io/RINGI/',
            isAuto: true,
          });
        });
      } catch (_) { /* ignore */ }

      // Gantt task deadline alerts
      if (settings.gantt) try {
        const snap = await getDocs(collection(db, 'tasks'));
        const now = new Date();
        snap.docs.forEach(d => {
          const data = d.data();
          if (!['not_started', 'in_progress'].includes(data.status || '')) return;
          const endDate = data.endDate || data.end_date;
          if (!endDate) return;
          const taskEnd = new Date(endDate + 'T00:00:00');
          if (taskEnd < now) return;
          result.push({
            id: `gantt_${d.id}`,
            date: endDate,
            title: `📊 タスク締切: ${data.title || data.name || '—'}`,
            type: 'expense',
            color: '#94a3b8',
            sourceApp: 'Gantt',
            sourceUrl: 'https://gantt-tau.vercel.app/',
            isAuto: true,
          });
        });
      } catch (_) { /* ignore */ }

      // Anniversary preparation alerts (7 days before)
      events
        .filter(e => e.templateType === '記念日')
        .forEach(e => {
          const prepDate = addDays(e.date, -7);
          result.push({
            id: `anniv_prep_${e.id}`,
            date: prepDate,
            title: `準備期限: ${e.title}（7日後）`,
            type: 'anniversary',
            color: '#f472b6',
            sourceApp: 'ST カレンダー',
            isAuto: true,
          });
        });

      if (!cancelled) setAlerts(result);
    }

    load();
    return () => { cancelled = true; };
  }, [events, settings.cashflow, settings.ringi, settings.gantt, settings.tax]);

  return alerts;
}
