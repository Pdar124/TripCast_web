import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseMap, type CourseMapStop } from '@/features/courses/components/course-map';
import { loadKakaoMaps, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

vi.mock('@/shared/lib/kakao-maps', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/kakao-maps')>()),
  loadKakaoMaps: vi.fn(),
}));

type OverlayOptions = { content: HTMLElement; zIndex?: number; clickable?: boolean };
type PolylineOptions = { path: unknown[] };

function createFakeMaps() {
  const overlays: Array<{ options: OverlayOptions; setMap: ReturnType<typeof vi.fn> }> = [];
  const polylines: Array<{ options: PolylineOptions; setMap: ReturnType<typeof vi.fn> }> = [];
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
    CustomOverlay: vi.fn(function (options: OverlayOptions) {
      const overlay = { options, setMap: vi.fn() };
      overlays.push(overlay);
      return overlay;
    }),
    Polyline: vi.fn(function (options: PolylineOptions) {
      const polyline = { options, setMap: vi.fn() };
      polylines.push(polyline);
      return polyline;
    }),
  };

  return { maps: maps as unknown as KakaoMapsApi, mapInstance, overlays, polylines };
}

const stops: CourseMapStop[] = [
  { stopId: 1, spotId: 101, order: 1, name: '경복궁', latitude: 37.5796, longitude: 126.977 },
  {
    stopId: 2,
    spotId: 102,
    order: 2,
    name: '국립고궁박물관',
    latitude: 37.5775,
    longitude: 126.9741,
  },
  { stopId: 3, spotId: 103, order: 3, name: '인사동', latitude: 37.574, longitude: 126.985 },
];

describe('CourseMap', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(loadKakaoMaps).mockReset();
  });

  it('앱 키가 없으면 SDK를 불러오지 않고 플레이스홀더를 보여 준다', () => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '');

    render(<CourseMap label="코스 지도" stops={stops} />);

    expect(screen.getByRole('heading', { name: '코스 경로' })).toBeInTheDocument();
    expect(loadKakaoMaps).not.toHaveBeenCalled();
  });

  it('방문 순서 번호 마커와 출발 마커, 경로 선을 표시한다', async () => {
    const { maps, overlays, polylines, mapInstance } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    render(<CourseMap label="코스 지도" stops={stops} />);

    await waitFor(() => expect(overlays).toHaveLength(3));
    expect(screen.getByRole('region', { name: '코스 지도' })).toBeInTheDocument();

    const [start, second, third] = overlays.map(({ options }) => options.content);
    expect(start).toHaveAttribute('aria-label', '출발 1번 경복궁');
    expect(start).toHaveTextContent('1');
    expect(start).toHaveTextContent('출발');
    expect(second).toHaveAttribute('aria-label', '2번 국립고궁박물관');
    expect(second).not.toHaveTextContent('출발');
    expect(third).toHaveAttribute('aria-label', '3번 인사동');
    // 출발 마커가 다른 마커 위에 보인다.
    expect(overlays[0].options.zIndex).toBeGreaterThan(overlays[1].options.zIndex ?? 0);

    expect(polylines).toHaveLength(1);
    expect(polylines[0].options.path).toHaveLength(3);
    expect(mapInstance.setBounds).toHaveBeenCalledTimes(1);
  });

  it('마커를 누르면 관광지 식별자를 전달한다', async () => {
    const user = userEvent.setup();
    const { maps, overlays } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);
    const onSelectStop = vi.fn();

    render(<CourseMap label="코스 지도" onSelectStop={onSelectStop} stops={stops} />);
    await waitFor(() => expect(overlays).toHaveLength(3));

    document.body.appendChild(overlays[1].options.content);
    await user.click(screen.getByRole('button', { name: '2번 국립고궁박물관' }));

    expect(onSelectStop).toHaveBeenCalledWith(102);
  });

  it('좌표가 유효하지 않은 정류지는 제외하고 순서 번호는 그대로 유지한다', async () => {
    const { maps, overlays, polylines } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    render(
      <CourseMap
        label="코스 지도"
        stops={[stops[0], { ...stops[1], latitude: Number.NaN }, stops[2]]}
      />,
    );

    await waitFor(() => expect(overlays).toHaveLength(2));
    expect(overlays.map(({ options }) => options.content.getAttribute('aria-label'))).toEqual([
      '출발 1번 경복궁',
      '3번 인사동',
    ]);
    expect(polylines[0].options.path).toHaveLength(2);
  });

  it('정류지가 하나면 경로 선 없이 해당 위치를 중심으로 맞춘다', async () => {
    const { maps, overlays, polylines, mapInstance } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    render(<CourseMap label="코스 지도" stops={[stops[0]]} />);

    await waitFor(() => expect(overlays).toHaveLength(1));
    expect(polylines).toHaveLength(0);
    expect(mapInstance.setCenter).toHaveBeenCalledTimes(1);
    expect(mapInstance.setBounds).not.toHaveBeenCalled();
  });

  it('언마운트하면 마커와 경로 선을 제거한다', async () => {
    const { maps, overlays, polylines } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    const { unmount } = render(<CourseMap label="코스 지도" stops={stops} />);
    await waitFor(() => expect(overlays).toHaveLength(3));

    unmount();

    overlays.forEach((overlay) => expect(overlay.setMap).toHaveBeenCalledWith(null));
    expect(polylines[0].setMap).toHaveBeenCalledWith(null);
  });

  it('표시할 수 있는 좌표가 없으면 SDK를 불러오지 않고 안내한다', () => {
    render(
      <CourseMap label="코스 지도" stops={[{ ...stops[0], latitude: 999, longitude: 999 }]} />,
    );

    expect(screen.getByRole('heading', { name: '위치 정보 없음' })).toBeInTheDocument();
    expect(loadKakaoMaps).not.toHaveBeenCalled();
  });

  it('SDK 로드에 실패하면 안내 문구를 보여 주고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    const { maps, overlays } = createFakeMaps();
    vi.mocked(loadKakaoMaps)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(maps);

    render(<CourseMap label="코스 지도" stops={stops} />);

    expect(
      await screen.findByRole('heading', { name: '지도를 불러오지 못했습니다' }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(overlays).toHaveLength(3));
    expect(loadKakaoMaps).toHaveBeenCalledTimes(2);
  });
});
