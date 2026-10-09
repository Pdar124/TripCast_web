import { useEffect, useRef, useState } from 'react';

/**
 * 요소가 화면 근처에 처음 보일 때 true가 된다(이후 유지). IntersectionObserver가 없는 환경이나
 * `enabled`가 false인 경우에는 관찰하지 않고 바로 true로 취급한다.
 */
export function useVisibleOnce<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  const visible = seen || !enabled || typeof IntersectionObserver === 'undefined';

  useEffect(() => {
    const element = ref.current;
    if (visible || !element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}
