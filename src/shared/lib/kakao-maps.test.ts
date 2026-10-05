import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidCoordinate, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

function findSdkScripts() {
  return Array.from(document.head.querySelectorAll<HTMLScriptElement>('script[src*="dapi.kakao"]'));
}

describe('isValidCoordinate', () => {
  it('유한한 위경도 범위 안의 좌표만 유효하다', () => {
    expect(isValidCoordinate(37.5796, 126.977)).toBe(true);
    expect(isValidCoordinate(Number.NaN, 126.977)).toBe(false);
    expect(isValidCoordinate(37.5796, Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCoordinate(91, 126.977)).toBe(false);
    expect(isValidCoordinate(37.5796, 181)).toBe(false);
    expect(isValidCoordinate(0, 0)).toBe(false);
  });
});

describe('loadKakaoMaps', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    findSdkScripts().forEach((script) => script.remove());
    delete window.kakao;
    vi.unstubAllEnvs();
  });

  it('autoload=false로 SDK를 한 번만 불러오고 load 콜백 이후 maps를 돌려준다', async () => {
    const { loadKakaoMaps } = await import('@/shared/lib/kakao-maps');
    const maps = { load: vi.fn((callback: () => void) => callback()) } as unknown as KakaoMapsApi;

    const first = loadKakaoMaps('test-key');
    const second = loadKakaoMaps('test-key');

    const scripts = findSdkScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe(
      'https://dapi.kakao.com/v2/maps/sdk.js?appkey=test-key&autoload=false',
    );

    window.kakao = { maps };
    scripts[0].dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(maps);
    await expect(second).resolves.toBe(maps);
    expect(maps.load).toHaveBeenCalledTimes(1);
  });

  it('로드에 실패하면 거절하고 다음 호출에서 다시 시도한다', async () => {
    const { loadKakaoMaps } = await import('@/shared/lib/kakao-maps');

    const failed = loadKakaoMaps('test-key');
    findSdkScripts()[0].dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('failed to load');
    expect(findSdkScripts()).toHaveLength(0);

    const retried = loadKakaoMaps('test-key');
    expect(findSdkScripts()).toHaveLength(1);

    const maps = { load: (callback: () => void) => callback() } as unknown as KakaoMapsApi;
    window.kakao = { maps };
    findSdkScripts()[0].dispatchEvent(new Event('load'));
    await expect(retried).resolves.toBe(maps);
  });

  it('SDK가 응답하지 않으면 제한 시간 후 거절한다', async () => {
    vi.useFakeTimers();
    try {
      const { loadKakaoMaps } = await import('@/shared/lib/kakao-maps');
      const assertion = expect(loadKakaoMaps('test-key')).rejects.toThrow('timed out');

      await vi.advanceTimersByTimeAsync(10_000);

      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('앱 키가 공백뿐이면 getKakaoMapAppKey는 빈 문자열이다', async () => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '  ');
    const { getKakaoMapAppKey } = await import('@/shared/lib/kakao-maps');

    expect(getKakaoMapAppKey()).toBe('');
  });
});
