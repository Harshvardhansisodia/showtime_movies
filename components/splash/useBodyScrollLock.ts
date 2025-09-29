// components/splash/useBodyScrollLock.ts
'use client';

import { useEffect } from 'react';

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverscrollY: (documentElement.style as any).overscrollBehaviorY || '',
    };

    // Prevent pull-to-refresh / scroll chaining
    (documentElement.style as any).overscrollBehaviorY = 'contain';

    // Lock body scroll (iOS-safe)
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      (documentElement.style as any).overscrollBehaviorY = prev.htmlOverscrollY;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      const top = body.style.top;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;

      const y = top ? -parseInt(top, 10) : 0;
      window.scrollTo(0, y);
    };
  }, [active]);
}
