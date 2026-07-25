import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates so context menu doesn't overflow screen bounds
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className={cn(
        'fixed z-50 min-w-[200px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl text-slate-800 dark:text-slate-200 text-xs font-medium animate-in fade-in-80 zoom-in-95 duration-100 select-none'
      )}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.divider && (
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          )}
          <button
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors duration-150',
              item.disabled
                ? 'opacity-40 cursor-not-allowed'
                : item.danger
                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {item.icon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{item.icon}</span>}
            <span className="flex-1 truncate">{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
