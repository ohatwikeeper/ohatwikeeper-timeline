'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    (originX: number, originY: number) => {
      const next = theme === 'light' ? 'dark' : 'light';
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!doc.startViewTransition || reduceMotion) {
        setTheme(next);
        return;
      }

      const transition = doc.startViewTransition(() => {
        setTheme(next);
      });

      transition.ready.then(() => {
        const radius = Math.hypot(
          Math.max(originX, window.innerWidth - originX),
          Math.max(originY, window.innerHeight - originY),
        );
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${originX}px ${originY}px)`,
              `circle(${radius}px at ${originX}px ${originY}px)`,
            ],
          },
          {
            duration: 500,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      });
    },
    [theme],
  );

  return { theme, toggle };
}
