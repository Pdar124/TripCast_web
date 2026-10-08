import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SpotCard } from '@/features/spots/components/spot-card';
import { loadKakaoMaps, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

vi.mock('@/shared/lib/kakao-maps', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/kakao-maps')>()),
  loadKakaoMaps: vi.fn(),
}));

function createFakeMaps() {
  const staticMaps: { container: HTMLElement; options: Record<string, unknown> }[] = [];
  const maps = {
    LatLng: vi.fn(function (this: object, latitude: number, longitude: number) {
      Object.assign(this, { latitude, longitude });
    }),
    StaticMap: vi.fn(function (container: HTMLElement, options: Record<string, unknown>) {
      staticMaps.push({ container, options });
      container.appendChild(document.createElement('img'));
    }),
  };

  return { maps: maps as unknown as KakaoMapsApi, staticMaps };
}

const spot = { id: 7, name: '경복궁', latitude: 37.5796, longitude: 126.977 };

function renderCard(overrides: Partial<typeof spot> = {}) {
  return render(
    <MemoryRouter initialEntries={['/spots']}>
      <Routes>
        <Route element={<SpotCard spot={{ ...spot, ...overrides }} />} path="/spots" />
        <Route element={<p>상세 페이지</p>} path="/spots/:id" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SpotCard 정적 지도 썸네일', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(loadKakaoMaps).mockReset();
  });

  it('관광지 좌표를 중심으로 마커가 있는 정적 지도를 그린다', async () => {
    const { maps, staticMaps } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    renderCard();

    await waitFor(() => expect(staticMaps).toHaveLength(1));
    expect(loadKakaoMaps).toHaveBeenCalledWith('test-key');
    expect(staticMaps[0].options).toMatchObject({
      center: { latitude: 37.5796, longitude: 126.977 },
      level: 4,
      marker: { position: { latitude: 37.5796, longitude: 126.977 } },
    });
    expect(screen.getByTestId('spot-static-map')).toHaveAttribute('aria-hidden', 'true');
  });

  it('지도가 있어도 카드를 눌러 상세 페이지로 이동하고 텍스트 정보를 유지한다', async () => {
    const user = userEvent.setup();
    const { maps, staticMaps } = createFakeMaps();
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    renderCard();
    await waitFor(() => expect(staticMaps).toHaveLength(1));

    const link = screen.getByRole('link', { name: /경복궁/ });
    expect(link).toHaveTextContent('위도 37.5796 · 경도 126.9770');

    await user.click(link);

    expect(screen.getByText('상세 페이지')).toBeInTheDocument();
  });

  it('좌표가 유효하지 않으면 SDK를 불러오지 않고 대체 화면을 보여 준다', () => {
    renderCard({ latitude: Number.NaN, longitude: Number.NaN });

    expect(loadKakaoMaps).not.toHaveBeenCalled();
    expect(screen.getByTestId('spot-static-map')).toHaveClass('tc-route-visual');
    expect(screen.getByRole('link', { name: /경복궁/ })).toBeInTheDocument();
  });

  it('앱 키가 없으면 SDK를 불러오지 않고 대체 화면을 보여 준다', () => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '');

    renderCard();

    expect(loadKakaoMaps).not.toHaveBeenCalled();
    expect(screen.getByTestId('spot-static-map')).toHaveClass('tc-route-visual');
  });

  it('SDK 로드에 실패해도 대체 화면과 카드 이동이 유지된다', async () => {
    const user = userEvent.setup();
    vi.mocked(loadKakaoMaps).mockRejectedValue(new Error('network'));

    renderCard();

    await waitFor(() => expect(loadKakaoMaps).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('spot-static-map').querySelector('svg')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('spot-static-map')).toHaveClass('tc-route-visual');

    await user.click(screen.getByRole('link', { name: /경복궁/ }));

    expect(screen.getByText('상세 페이지')).toBeInTheDocument();
  });
});
