import { useRef, useEffect } from 'react';
import { STAMPS } from './StampPicker';

interface Props {
  stamps: { emoji: string; label: string }[];
  onDrop: (date: string, stamp: string) => void;
}

/**
 * Horizontal stamp palette.
 * - Mobile: LONG-PRESS (220ms) to pick up a stamp, then drag onto a [data-date]
 *   cell. A short touch / horizontal swipe scrolls the shelf normally.
 * - Desktop: native HTML5 drag-and-drop.
 */
export function StampShelf({ stamps, onDrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onDropRef    = useRef(onDrop);
  onDropRef.current  = onDrop;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ghost: HTMLDivElement | null = null;
    let dragging = false;
    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let activeStamp: string | null = null;
    let startX = 0, startY = 0;

    const clearHighlights = () =>
      document.querySelectorAll('[data-drag-over]').forEach(c => c.removeAttribute('data-drag-over'));

    const makeGhost = (stamp: string, x: number, y: number) => {
      const g = document.createElement('div');
      g.textContent = stamp;
      g.style.cssText = `position:fixed;left:${x - 26}px;top:${y - 34}px;font-size:48px;
        pointer-events:none;z-index:9999;opacity:.9;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3));`;
      document.body.appendChild(g);
      return g;
    };

    const onTouchStart = (e: TouchEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-stamp]') as HTMLElement | null;
      if (!btn) return;
      activeStamp = btn.dataset.stamp!;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;

      // Long-press → begin drag
      pressTimer = setTimeout(() => {
        dragging = true;
        ghost = makeGhost(activeStamp!, startX, startY);
        if (navigator.vibrate) navigator.vibrate(15);
      }, 220);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];

      // Not yet dragging: if finger moves before long-press, treat as scroll → cancel
      if (!dragging) {
        const dx = Math.abs(t.clientX - startX);
        const dy = Math.abs(t.clientY - startY);
        if (dx > 8 || dy > 8) {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        }
        return; // allow native scroll
      }

      // Dragging: move ghost, block scroll
      e.preventDefault();
      if (ghost) {
        ghost.style.left = t.clientX - 26 + 'px';
        ghost.style.top  = t.clientY - 34 + 'px';
        ghost.style.display = 'none';
        const under = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
        ghost.style.display = '';
        clearHighlights();
        under?.closest('[data-date]')?.setAttribute('data-drag-over', 'true');
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      if (dragging && ghost) {
        const t = e.changedTouches[0];
        ghost.style.display = 'none';
        const under = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
        const cell = under?.closest('[data-date]') as HTMLElement | null;
        if (cell?.dataset.date && activeStamp) onDropRef.current(cell.dataset.date, activeStamp);
      }
      ghost?.remove();
      ghost = null;
      dragging = false;
      activeStamp = null;
      clearHighlights();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        zIndex: 40,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -2px 10px rgba(0,0,0,.05)',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
      <span className="text-xs font-bold flex-shrink-0 mr-0.5" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
        長押しで貼付
      </span>
      {stamps.map(({ emoji, label }) => (
        <button
          key={emoji}
          data-stamp={emoji}
          draggable
          onDragStart={(e) => { e.dataTransfer.setData('stamp', emoji); e.dataTransfer.effectAllowed = 'copy'; }}
          title={label}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-xl select-none"
          style={{ background: 'var(--bg)', cursor: 'grab', userSelect: 'none' }}>
          {emoji}
        </button>
      ))}
    </div>
  );
}

export { STAMPS };
