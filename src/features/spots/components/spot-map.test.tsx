import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SpotMap } from '@/features/spots/components/spot-map';
import { loadKakaoMaps, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

vi.mock('@/shared/lib/kakao-maps', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/kakao-maps')>()),
  loadKakaoMaps: vi.fn(),
}));

type FakeMarker = { options: { title?: string }; setMap: ReturnType<typeof vi.fn> };

function createFakeMaps() {
  const markers: FakeMarker[] = [];
  const handlers = new Map<FakeMarker, () => void>();
  const mapInstance = { setCenter: vi.fn(), setBounds: vi.fn() };
  const maps = {
    LatLng: vi.fn(function (this: object, latitude: number, longitude: number) {
      Object.assign(this, { latitude, longitude });
    }),
    LatLngBounds: vi.fn(function (this: object) {
      Object.assign(this, { extend: vi.fn() });
    }),
    Map: vi.fn(function () {
      return mapInstance;
    }),
    Marker: vi.fn(function (options: { title?: string }) {
      const marker: FakeMarker = { options, setMap: vi.fn() };
      markers.push(marker);
      return marker;
    }),
    event: {
      addListener: vi.fn((target: FakeMarker, _type: string, handler: () => void) => {
        handlers.set(target, handler);
      }),
      removeListener: vi.fn((target: FakeMarker) => {
        handlers.delete(target);
      }),
    },
  };

  return { maps: maps as unknown as KakaoMapsApi, mapInstance, markers, handlers };
}

const spots = [
  { id: 1, name: '경복궁', latitude: 37.5796, longitude: 126.977 },
  { id: 2, name: '성산일출봉', latitude: 33.4581, longitude: 126.9426 },
];

describe('SpotMap', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(loadKakaoMaps).mockReset();
  });

  it('앱 키가 없으면 SDK를 불러오지 않고 플레이스홀더를 보여 준다', () => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '');

    render(<SpotMap label="지도" markers={spots} />);

    expect(screen.getByRole('heading', { name: '지도 영역' })).toBeInTheDocument();
    expect(loadKakaoMaps).not.toHaveBeenCalled();
  });

  it('유효한 좌표만 마커로 표시하고 마커 클릭을 전달한다', async () => {
    const { maps, markers, handlers, mapInstance } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);
    const onSelectMarker = vi.fn();

    render(
      <SpotMap
        label="검색 결과 지도"
        markers={[...spots, { id: 3, name: '좌표 오류', latitude: Number.NaN, longitude: 127 }]}
        onSelectMarker={onSelectMarker}
      />,
    );

    expect(screen.getByRole('region', { name: '검색 결과 지도' })).toBeInTheDocument();
    await waitFor(() => expect(markers).toHaveLength(2));
    expect(loadKakaoMaps).toHaveBeenCalledWith('test-key');
    expect(markers.map((marker) => marker.options.title)).toEqual(['경복궁', '성산일출봉']);
    expect(mapInstance.setBounds).toHaveBeenCalledTimes(1);

    handlers.get(markers[1])?.();

    expect(onSelectMarker).toHaveBeenCalledWith(2);
  });

  it('마커가 하나면 해당 위치를 중심으로 맞춘다', async () => {
    const { maps, markers, mapInstance } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    render(<SpotMap label="경복궁 위치 지도" markers={[spots[0]]} />);

    await waitFor(() => expect(markers).toHaveLength(1));
    expect(mapInstance.setCenter).toHaveBeenCalledTimes(1);
    expect(mapInstance.setBounds).not.toHaveBeenCalled();
  });

  it('언마운트하면 마커를 제거한다', async () => {
    const { maps, markers } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    const { unmount } = render(<SpotMap label="지도" markers={spots} />);
    await waitFor(() => expect(markers).toHaveLength(2));

    unmount();

    markers.forEach((marker) => expect(marker.setMap).toHaveBeenCalledWith(null));
  });

  it('표시할 수 있는 좌표가 없으면 SDK를 불러오지 않고 안내한다', () => {
    render(
      <SpotMap
        label="지도"
        markers={[{ id: 1, name: '좌표 오류', latitude: 999, longitude: 999 }]}
      />,
    );

    expect(screen.getByRole('heading', { name: '위치 정보 없음' })).toBeInTheDocument();
    expect(loadKakaoMaps).not.toHaveBeenCalled();
  });

  it('SDK 로드에 실패하면 안내 문구를 보여 주고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    const { maps, markers } = createFakeMaps();
    vi.mocked(loadKakaoMaps)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(maps);

    render(<SpotMap label="지도" markers={spots} />);

    expect(
      await screen.findByRole('heading', { name: '지도를 불러오지 못했습니다' }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(markers).toHaveLength(2));
    expect(loadKakaoMaps).toHaveBeenCalledTimes(2);
  });
});
