import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseRoadviewThumbnail } from '@/features/courses/components/course-roadview-thumbnail';
import { CourseRouteThumbnail } from '@/features/courses/components/course-route-thumbnail';
import { loadKakaoMaps, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

vi.mock('@/shared/lib/kakao-maps', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/kakao-maps')>()),
  loadKakaoMaps: vi.fn(),
}));

type Position = { latitude: number; longitude: number };

function createFakeMaps(options: { panoId?: number | null } = {}) {
  const { panoId = 1234 } = options;
  const mapOptions: Record<string, unknown>[] = [];
  const overlays: { content: HTMLElement; setMap: ReturnType<typeof vi.fn> }[] = [];
  const staticMaps: Record<string, unknown>[] = [];
  const markers: { options: Record<string, unknown>; setMap: ReturnType<typeof vi.fn> }[] = [];
  const mapInstance = { setCenter: vi.fn(), setBounds: vi.fn() };
  const roadview = {
    setPanoId: vi.fn(),
    setViewpoint: vi.fn(),
    getProjection: vi.fn(() => ({
      viewpointFromCoords: vi.fn(() => ({ pan: 123, tilt: -5, zoom: 0 })),
    })),
  };
  const initHandlers: (() => void)[] = [];
  const tilesLoadedHandlers: (() => void)[] = [];
  const getNearestPanoId = vi.fn(
    (_position: Position, _radius: number, callback: (id: number | null) => void) =>
      callback(panoId),
  );

  const maps = {
    LatLng: vi.fn(function (this: object, latitude: number, longitude: number) {
      Object.assign(this, { latitude, longitude });
    }),
    LatLngBounds: vi.fn(function (this: object) {
      Object.assign(this, { extend: vi.fn() });
    }),
    Map: vi.fn(function (_container: HTMLElement, options: Record<string, unknown>) {
      mapOptions.push(options);
      return mapInstance;
    }),
    StaticMap: vi.fn(function (_container: HTMLElement, options: Record<string, unknown>) {
      staticMaps.push(options);
    }),
    Roadview: vi.fn(function () {
      return roadview;
    }),
    RoadviewClient: vi.fn(function () {
      return { getNearestPanoId };
    }),
    Marker: vi.fn(function (options: Record<string, unknown>) {
      const marker = { options, setMap: vi.fn() };
      markers.push(marker);
      return marker;
    }),
    CustomOverlay: vi.fn(function (options: { content: HTMLElement }) {
      const overlay = { content: options.content, setMap: vi.fn() };
      overlays.push(overlay);
      return overlay;
    }),
    event: {
      addListener: vi.fn((_target: unknown, type: string, handler: () => void) => {
        if (type === 'init') initHandlers.push(handler);
        if (type === 'tilesloaded') tilesLoadedHandlers.push(handler);
      }),
      removeListener: vi.fn(),
    },
  };

  return {
    maps: maps as unknown as KakaoMapsApi,
    mapInstance,
    mapOptions,
    overlays,
    staticMaps,
    markers,
    roadview,
    initHandlers,
    tilesLoadedHandlers,
    getNearestPanoId,
  };
}

beforeEach(() => {
  vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(loadKakaoMaps).mockReset();
});

describe('CourseRoadviewThumbnail', () => {
  const coordinate = { latitude: 37.5796, longitude: 126.977 };

  it('대표 관광지 근처의 로드뷰를 상호작용 없이 보여 주고 마커를 표시한다', async () => {
    const fake = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    render(<CourseRoadviewThumbnail {...coordinate} />);

    await waitFor(() => expect(fake.roadview.setPanoId).toHaveBeenCalledTimes(1));
    expect(loadKakaoMaps).toHaveBeenCalledWith('test-key');
    expect(fake.getNearestPanoId.mock.calls[0][1]).toBe(100);
    expect(fake.roadview.setPanoId.mock.calls[0][0]).toBe(1234);

    // 파노라마가 뜨기 전에는 빈 화면 대신 대체 화면을 유지한다.
    expect(screen.getByTestId('course-roadview-thumbnail')).toHaveAttribute(
      'data-view',
      'fallback',
    );

    act(() => fake.initHandlers[0]());

    expect(fake.markers).toHaveLength(1);
    // 마커를 향한 시점(pan·tilt)을 쓰고 확대 수준만 낮춘다.
    expect(fake.roadview.setViewpoint).toHaveBeenCalledWith({ pan: 123, tilt: -5, zoom: -3 });
    const wrapper = screen.getByTestId('course-roadview-thumbnail');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toHaveAttribute('data-view', 'roadview');
    expect(wrapper.querySelector('.pointer-events-none')).toBeInTheDocument();
  });

  it('로드뷰는 동시에 4개까지만 만들고 먼저 뜬 만큼 다음 카드를 시작한다', async () => {
    const fake = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    render(
      <>
        {Array.from({ length: 6 }, (_, index) => (
          <CourseRoadviewThumbnail key={index} latitude={37.5 + index / 100} longitude={126.977} />
        ))}
      </>,
    );

    await waitFor(() => expect(fake.maps.Roadview).toHaveBeenCalledTimes(4));
    expect(fake.initHandlers).toHaveLength(4);

    act(() => fake.initHandlers[0]());
    await waitFor(() => expect(fake.maps.Roadview).toHaveBeenCalledTimes(5));

    act(() => fake.initHandlers[1]());
    await waitFor(() => expect(fake.maps.Roadview).toHaveBeenCalledTimes(6));
  });

  it('파노라마가 없으면 정적 지도로 대체한다', async () => {
    const fake = createFakeMaps({ panoId: null });
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    render(<CourseRoadviewThumbnail {...coordinate} />);

    await waitFor(() => expect(fake.staticMaps).toHaveLength(1));
    expect(fake.staticMaps[0]).toMatchObject({ level: 4, marker: expect.any(Object) });
    expect(fake.maps.Roadview).not.toHaveBeenCalled();
    expect(screen.getByTestId('course-roadview-thumbnail')).toHaveAttribute(
      'data-view',
      'static-map',
    );
  });

  it('좌표가 없으면 SDK를 불러오지 않고 공통 배경을 보여 준다', () => {
    render(<CourseRoadviewThumbnail />);

    expect(loadKakaoMaps).not.toHaveBeenCalled();
    const thumbnail = screen.getByTestId('course-roadview-thumbnail');
    expect(thumbnail).toHaveAttribute('data-view', 'fallback');
    expect(thumbnail).toHaveClass('tc-route-visual');
    expect(thumbnail.querySelector('img')).not.toBeInTheDocument();
  });

  it('잘못된 좌표나 앱 키 누락이면 SDK를 불러오지 않고 공통 배경을 보여 준다', () => {
    const { rerender } = render(
      <CourseRoadviewThumbnail latitude={Number.NaN} longitude={Number.NaN} />,
    );
    expect(screen.getByTestId('course-roadview-thumbnail')).toHaveClass('tc-route-visual');

    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '');
    rerender(<CourseRoadviewThumbnail {...coordinate} />);

    expect(screen.getByTestId('course-roadview-thumbnail')).toHaveClass('tc-route-visual');
    expect(loadKakaoMaps).not.toHaveBeenCalled();
  });

  it('SDK 로드에 실패하면 대체 화면을 유지한다', async () => {
    vi.mocked(loadKakaoMaps).mockRejectedValue(new Error('network'));

    render(<CourseRoadviewThumbnail {...coordinate} />);

    await waitFor(() => expect(loadKakaoMaps).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('course-roadview-thumbnail')).toHaveClass('tc-route-visual'),
    );
    expect(screen.getByTestId('course-roadview-thumbnail')).toHaveAttribute(
      'data-view',
      'fallback',
    );
  });
});

describe('CourseRouteThumbnail', () => {
  const route = {
    startLatitude: 37.5796,
    startLongitude: 126.977,
    endLatitude: 37.5512,
    endLongitude: 126.9882,
  };

  it('상호작용을 막은 지도에 출발과 도착 마커만 표시한다', async () => {
    const fake = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    render(<CourseRouteThumbnail {...route} />);

    await waitFor(() => expect(fake.overlays).toHaveLength(2));
    expect(fake.overlays.map((overlay) => overlay.content.textContent).sort()).toEqual([
      '도착',
      '출발',
    ]);
    expect(fake.mapOptions[0]).toMatchObject({
      draggable: false,
      scrollwheel: false,
      disableDoubleClick: true,
    });
    expect(fake.mapInstance.setBounds).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('course-route-thumbnail')).toHaveAttribute('aria-hidden', 'true');
    // 타일이 뜨기 전에는 빈 지도 대신 대체 화면을 유지한다.
    expect(screen.getByTestId('course-route-thumbnail')).toHaveAttribute('data-view', 'fallback');

    act(() => fake.tilesLoadedHandlers[0]());

    expect(screen.getByTestId('course-route-thumbnail')).toHaveAttribute('data-view', 'route-map');
    expect(
      screen.getByTestId('course-route-thumbnail').querySelector('.pointer-events-none'),
    ).toBeInTheDocument();
  });

  it('출발과 도착이 같은 위치면 마커 하나로 합친다', async () => {
    const fake = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    render(
      <CourseRouteThumbnail
        {...route}
        endLatitude={route.startLatitude}
        endLongitude={route.startLongitude}
      />,
    );

    await waitFor(() => expect(fake.overlays).toHaveLength(1));
    expect(fake.overlays[0].content.textContent).toBe('출발·도착');
    expect(fake.mapInstance.setBounds).not.toHaveBeenCalled();
    expect(fake.mapInstance.setCenter).toHaveBeenCalledTimes(1);
  });

  it('도착 좌표가 없으면 출발 지점만 표시한다', async () => {
    const fake = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    render(<CourseRouteThumbnail {...route} endLatitude={null} endLongitude={null} />);

    await waitFor(() => expect(fake.overlays).toHaveLength(1));
  });

  it('언마운트하면 마커를 제거한다', async () => {
    const fake = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(fake.maps);

    const { unmount } = render(<CourseRouteThumbnail {...route} />);
    await waitFor(() => expect(fake.overlays).toHaveLength(2));

    unmount();

    fake.overlays.forEach((overlay) => expect(overlay.setMap).toHaveBeenCalledWith(null));
  });

  it('출발 좌표가 없으면 SDK를 불러오지 않고 공통 배경을 보여 준다', () => {
    render(<CourseRouteThumbnail />);

    expect(loadKakaoMaps).not.toHaveBeenCalled();
    const thumbnail = screen.getByTestId('course-route-thumbnail');
    expect(thumbnail).toHaveAttribute('data-view', 'fallback');
    expect(thumbnail).toHaveClass('tc-route-visual');
    expect(thumbnail.querySelector('img')).not.toBeInTheDocument();
  });

  it('앱 키가 없거나 SDK 로드에 실패하면 대체 화면을 보여 준다', async () => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '');
    const { unmount } = render(<CourseRouteThumbnail {...route} />);
    expect(loadKakaoMaps).not.toHaveBeenCalled();
    expect(screen.getByTestId('course-route-thumbnail')).toHaveClass('tc-route-visual');
    unmount();

    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-key');
    vi.mocked(loadKakaoMaps).mockRejectedValue(new Error('network'));
    render(<CourseRouteThumbnail {...route} />);

    await waitFor(() => expect(loadKakaoMaps).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('course-route-thumbnail')).toHaveClass('tc-route-visual'),
    );
  });
});
