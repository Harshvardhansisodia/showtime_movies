// components/splash/useLoadReady.ts
'use client';

import { useEffect, useRef, useState } from 'react';

type Options = { idleMs?: number; minDurationMs?: number };

export function useLoadReady({ idleMs = 500, minDurationMs = 1500 }: Options = {}) {
  const [ready, setReady] = useState(false);
  const startRef = useRef(performance.now());
  const inFlightRef = useRef(0);
  const lastChangeRef = useRef(performance.now());

  useEffect(() => {
    const originalFetch = window.fetch;
    const wrapped: typeof window.fetch = async (...args) => {
      inFlightRef.current++;
      lastChangeRef.current = performance.now();
      try {
        return await originalFetch(...(args as Parameters<typeof originalFetch>));
      } finally {
        inFlightRef.current--;
        lastChangeRef.current = performance.now();
      }
    };

    (window as any).fetch = wrapped;

    let raf = 0;
    const check = () => {
      const now = performance.now();
      const networkIdle = inFlightRef.current === 0 && now - lastChangeRef.current >= idleMs;
      const docLoaded = document.readyState === 'complete';
      const minElapsed = now - startRef.current >= minDurationMs;

      if (networkIdle && docLoaded && minElapsed) {
        setReady(true);
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);

    return () => {
      (window as any).fetch = originalFetch;
      cancelAnimationFrame(raf);
    };
  }, [idleMs, minDurationMs]);

  return ready;
}
