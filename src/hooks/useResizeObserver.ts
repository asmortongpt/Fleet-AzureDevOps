/**
 * useResizeObserver - Hook to observe element size changes
 */

import { useEffect, useState, RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useResizeObserver(
  ref: RefObject<HTMLElement>
): Size {
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(element);

    // Set initial size
    const { width, height } = element.getBoundingClientRect();
    setSize({ width, height });

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
