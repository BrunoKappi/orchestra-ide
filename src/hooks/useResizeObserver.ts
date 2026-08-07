import { useState, useEffect, useRef } from 'react';

export function useResizeObserver<T extends HTMLElement>() {
  const [dimensions, setDimensions] = useState({ width: 300, height: 150 });
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: width || 300, height: height || 150 });
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  return { elementRef, dimensions };
}
