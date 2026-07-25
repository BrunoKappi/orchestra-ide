import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ResizableSplitPaneProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export const ResizableSplitPane: React.FC<ResizableSplitPaneProps> = ({
  leftPane,
  rightPane,
  initialLeftWidth = 320,
  minLeftWidth = 200,
  maxLeftWidth = 1600,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const currentMax = Math.min(maxLeftWidth, rect.width - 150);
      const newWidth = Math.min(Math.max(relativeX, minLeftWidth), currentMax);
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden select-none relative">
      {/* Left Pane */}
      <div
        style={{ width: `${leftWidth}px` }}
        className="shrink-0 h-full overflow-hidden border-r border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {leftPane}
      </div>

      {/* Resize Divider Bar */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1.5 h-full cursor-col-resize hover:bg-emerald-500 transition-colors duration-150 relative z-20 shrink-0 ${
          isDragging ? 'bg-emerald-500' : 'bg-slate-200 dark:border-slate-800 dark:bg-slate-800'
        }`}
      />

      {/* Right Pane */}
      <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
        {rightPane}
      </div>
    </div>
  );
};
