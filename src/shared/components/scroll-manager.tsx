import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

import type { ScrollDirective, ScrollLocationState } from '@/shared/lib/scroll-navigation';

const STORAGE_KEY = 'tripcast.scroll-positions';
const RESTORE_TIMEOUT_MS = 10_000;

type ScrollPosition = {
  x: number;
  y: number;
};

function readPositions(): Record<string, ScrollPosition> {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, ScrollPosition>) : {};
  } catch {
    return {};
  }
}

function writePositions(positions: Record<string, ScrollPosition>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // 저장 공간을 사용할 수 없어도 현재 세션의 라우팅은 계속 동작한다.
  }
}

function scrollWindowTo(position: ScrollPosition) {
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(position.x, position.y);
  document.documentElement.style.scrollBehavior = previousScrollBehavior;
}

function getMaximumScrollY() {
  return Math.max(
    0,
    Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.offsetHeight,
      document.body.offsetHeight,
    ) - window.innerHeight,
  );
}

function restorePosition(position: ScrollPosition) {
  let observer: ResizeObserver | undefined;
  let cancelled = false;

  const cleanup = () => {
    if (cancelled) return;
    cancelled = true;
    observer?.disconnect();
    window.clearTimeout(timeoutTimer);
    window.removeEventListener('load', attempt, true);
    window.removeEventListener('wheel', cancelForUser, true);
    window.removeEventListener('touchstart', cancelForUser, true);
    window.removeEventListener('pointerdown', cancelForUser, true);
    window.removeEventListener('keydown', cancelForUser, true);
  };

  function cancelForUser() {
    cleanup();
  }

  function attempt() {
    if (cancelled) return;

    const maximumY = getMaximumScrollY();
    scrollWindowTo({ x: position.x, y: Math.min(position.y, maximumY) });
  }

  attempt();

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(attempt);
    observer.observe(document.documentElement);
  }

  window.addEventListener('load', attempt, true);
  window.addEventListener('wheel', cancelForUser, true);
  window.addEventListener('touchstart', cancelForUser, true);
  window.addEventListener('pointerdown', cancelForUser, true);
  window.addEventListener('keydown', cancelForUser, true);
  const timeoutTimer = window.setTimeout(cleanup, RESTORE_TIMEOUT_MS);

  return cleanup;
}

function scrollToElement(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) {
    scrollWindowTo({ x: 0, y: 0 });
    return;
  }

  const stickyHeader = document.querySelector<HTMLElement>('[data-sticky-header]');
  const headerHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
  const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
  scrollWindowTo({ x: 0, y: Math.max(0, targetY) });
}

function getScrollDirective(state: unknown): ScrollDirective | undefined {
  if (!state || typeof state !== 'object' || !('scroll' in state)) return undefined;

  const directive = (state as ScrollLocationState).scroll;
  if (directive?.behavior === 'preserve') return directive;
  if (directive?.behavior === 'target' && typeof directive.targetId === 'string') return directive;
  return undefined;
}

export function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const activeLocationKey = useRef(location.key);
  const positions = useRef(readPositions());
  const cancelRestoration = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    const previousKey = activeLocationKey.current;

    cancelRestoration.current?.();
    cancelRestoration.current = undefined;

    if (previousKey !== location.key) {
      positions.current[previousKey] = { x: window.scrollX, y: window.scrollY };
      writePositions(positions.current);
      activeLocationKey.current = location.key;
    }

    if (navigationType === 'POP') {
      cancelRestoration.current = restorePosition(
        positions.current[location.key] ?? { x: 0, y: 0 },
      );
      return () => cancelRestoration.current?.();
    }

    const directive = getScrollDirective(location.state);
    if (directive?.behavior === 'preserve') return undefined;

    if (directive?.behavior === 'target') {
      scrollToElement(directive.targetId);
    } else {
      scrollWindowTo({ x: 0, y: 0 });
    }

    return undefined;
  }, [location.key, location.state, navigationType]);

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const saveCurrentPosition = () => {
      positions.current[activeLocationKey.current] = {
        x: window.scrollX,
        y: window.scrollY,
      };
    };

    const persistCurrentPosition = () => {
      saveCurrentPosition();
      writePositions(positions.current);
    };

    window.addEventListener('scroll', saveCurrentPosition, { passive: true });
    window.addEventListener('pagehide', persistCurrentPosition);

    return () => {
      persistCurrentPosition();
      cancelRestoration.current?.();
      window.removeEventListener('scroll', saveCurrentPosition);
      window.removeEventListener('pagehide', persistCurrentPosition);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  return null;
}
