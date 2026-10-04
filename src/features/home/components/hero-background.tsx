import { Component, lazy, Suspense, type ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';

const LazyHeroScene = lazy(() =>
  import('@/features/home/components/hero-scene').then(({ HeroScene }) => ({
    default: HeroScene,
  })),
);

class HeroErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function HeroBackground() {
  const [ready, setReady] = useState(false);
  const compact = useMediaQuery('(max-width: 767px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const supportsWebGL = typeof window !== 'undefined' && 'WebGLRenderingContext' in window;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <img
        alt=""
        className={cn(
          'absolute inset-0 h-full w-full scale-[1.02] object-cover blur-[2px] transition-opacity duration-700',
          ready && 'opacity-0',
        )}
        height="1440"
        src="/assets/img/hero-terrain.jpg"
        width="1920"
      />
      {supportsWebGL && (
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-700',
            ready && 'opacity-100',
          )}
        >
          <HeroErrorBoundary>
            <Suspense fallback={null}>
              <LazyHeroScene
                compact={compact}
                onReady={() => setReady(true)}
                reducedMotion={reducedMotion}
              />
            </Suspense>
          </HeroErrorBoundary>
        </div>
      )}
    </div>
  );
}
