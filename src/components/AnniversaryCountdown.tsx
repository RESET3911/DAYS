import { useState } from 'react';
import type { Anniversary } from '../hooks/useAnniversaries';
import { nextOccurrence } from '../hooks/useAnniversaries';
import { AnniversaryModal } from './AnniversaryModal';

interface Props {
  anniversaries: Anniversary[];
  userId: string;
  onAdd: (data: Omit<Anniversary, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TYPE_ICON: Record<string, string> = {
  anniversary: '🎉',
  birthday:    '🎂',
  other:       '⭐',
};

export function AnniversaryCountdown({ anniversaries, userId, onAdd, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false);

  if (!anniversaries.length) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs transition-all"
          style={{ color: 'var(--text-3)' }}>
          <span>+ 記念日・誕生日を登録</span>
        </button>
        {showModal && (
          <AnniversaryModal
            anniversaries={anniversaries}
            userId={userId}
            onAdd={onAdd}
            onDelete={onDelete}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Find the nearest upcoming anniversary
  const sorted = anniversaries
    .map(a => ({ ann: a, ...nextOccurrence(a) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const nearest = sorted[0];
  const { ann, daysLeft, yearsElapsed } = nearest;

  const label = daysLeft === 0
    ? `今日！${yearsElapsed != null ? `（${yearsElapsed}周年）` : ''}`
    : daysLeft === 1
      ? '明日'
      : `あと${daysLeft}日`;

  const suffix = yearsElapsed != null && daysLeft > 0 ? `（${yearsElapsed}周年）` : '';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
        style={{
          background: `${ann.color}12`,
          borderBottom: '1px solid var(--border)',
        }}>
        <span>{TYPE_ICON[ann.type] || '⭐'}</span>
        <span className="flex-1 text-left font-bold" style={{ color: ann.color }}>
          {ann.title}
        </span>
        <span className="font-bold" style={{ color: ann.color }}>{label}{suffix}</span>
        <span style={{ color: 'var(--text-3)' }}>›</span>
      </button>

      {showModal && (
        <AnniversaryModal
          anniversaries={anniversaries}
          userId={userId}
          onAdd={onAdd}
          onDelete={onDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
