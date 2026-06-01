import { useRef, useEffect } from 'react';
import { STAMPS } from './StampPicker';

interface Props {
  onDrop: (date: string, stamp: string) => Promise<void>;
}

/**
 * Horizontal stamp palette.
 * - Desktop: HTML5 drag-and-drop onto [data-date] cells
 * - Mobile : touch drag with a floating ghost element
 */
export function StampShelf({ onDrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ghostRef     = useRef<HTMLDivElement | null>(null);
  const dragStamp    = useRef<string | null>(null);
  const onDropRef    = useRef(onDrop);
  onDropRef.current  = onDrop;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-stamp]') as HTMLElement | null;
      if (!btn) return;
      e.preventDefault(); // block scroll during drag

      const stamp = btn.dataset.stamp!;
      dragStamp.current = stamp;
      const t0 = e.touches[0];

      // Create ghost emoji that follows finger
      const g = document.createElement('div');
      g.textContent = stamp;
      g.style.cssText = `
        position:fixed;left:${t0.clientX - 24}px;top:${t0.clientY - 32}px;
        font-size:44px;pointer-events:none;z-index:9999;opacity:.85;
        user-select:none;transition:none;
      `;
      document.body.appendChild(g);
      ghostRef.current = g;

      const onMove = (ev: TouchEvent) => {
        ev.preventDefault();
        if (!ghostRef.current) return;
        const t = ev.touches[0];
        ghostRef.current.style.left = t.clientX - 24 + 'px';
        ghostRef.current.style.top  = t.clientY - 32 + 'px';

        // Highlight cell under finger
        ghostRef.current.style.display = 'none';
        const under = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
        ghostRef.current.style.display = '';
        document.querySelectorAll('[data-drag-over]').forEach(c => c.removeAttribute('data-drag-over'));
        const cell = under?.closest('[data-date]') as HTMLElement | null;
        if (cell) cell.setAttribute('data-drag-over', 'true');
      };

      const onEnd = (ev: TouchEvent) => {
        const g = ghostRef.current;
        const s = dragStamp.current;
        ghostRef.current = null;
        dragStamp.current = null;
        document.querySelectorAll('[data-drag-over]').forEach(c => c.removeAttribute('data-drag-over'));

        if (g && s) {
          g.style.display = 'none';
          const t = ev.changedTouches[0];
          const under = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
          g.remove();
          const cell = under?.closest('[data-date]') as HTMLElement | null;
          if (cell?.dataset.date) onDropRef.current(cell.dataset.date, s);
        } else {
          g?.remove();
        }

        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      };

      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd, { once: true });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    return () => el.removeEventListener('touchstart', onTouchStart);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0 overflow-x-auto"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '2px solid rgba(124,58,237,.18)',
        scrollbarWidth: 'none',
      }}>
      <span className="text-xs font-bold flex-shrink-0 mr-0.5" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
        ↑ D&amp;D
      </span>
      {STAMPS.map(({ emoji, label }) => (
        <button
          key={emoji}
          data-stamp={emoji}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('stamp', emoji);
            e.dataTransfer.effectAllowed = 'copy';
          }}
          title={label}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-xl select-none"
          style={{ background: 'var(--bg)', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
          {emoji}
        </button>
      ))}
    </div>
  );
}
