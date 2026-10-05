import { useEffect, useState } from 'react';

import { loadKakaoMaps, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

type KakaoMapsState =
  { status: 'loading' } | { status: 'ready'; maps: KakaoMapsApi } | { status: 'error' };

/**
 * 카카오맵 SDK 로드 상태를 관리한다. `enabled`가 false이면 SDK를 불러오지 않는다.
 * `retry`는 실패한 로드를 다시 시도한다.
 */
export function useKakaoMaps(appKey: string, enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<KakaoMapsState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    loadKakaoMaps(appKey).then(
      (maps) => {
        if (!cancelled) setState({ status: 'ready', maps });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [appKey, enabled, attempt]);

  function retry() {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }

  return {
    status: state.status,
    maps: state.status === 'ready' ? state.maps : null,
    retry,
  };
}
