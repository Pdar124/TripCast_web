import { Component, lazy, Suspense, type ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { HeroScenePlaceholder } from '@/features/home/components/hero-scene-placeholder';

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

  componentDidCatch(error: Error) {
    console.error('3D 히어로를 렌더링하지 못해 정적 장면으로 대체합니다.', error);
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
      <HeroScenePlaceholder hidden={ready} />
      {supportsWebGL && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
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
