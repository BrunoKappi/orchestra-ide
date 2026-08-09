import { useState, useEffect, useCallback } from 'react';

export function useResizeObserver<T extends HTMLElement>() {
  const [dimensions, setDimensions] = useState({ width: 300, height: 150 });
  const [element, setElement] = useState<T | null>(null);

  const elementRef = useCallback((node: T | null) => {
    if (node !== null) {
      setElement(node);
    }
  }, []);

  useEffect(() => {
    if (!element) return;

    // Immediate initial measurement
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [element]);

  return { elementRef, dimensions };
}

