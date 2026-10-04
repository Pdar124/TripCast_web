import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SpotListPage } from '@/features/spots/pages/spot-list-page';
import type { PageResponse, TourSpot } from '@/features/spots/types';
import { http } from '@/shared/api/http';
import { loadKakaoMaps, type KakaoMapsApi } from '@/shared/lib/kakao-maps';

vi.mock('@/shared/lib/kakao-maps', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/kakao-maps')>()),
  loadKakaoMaps: vi.fn(),
}));

const spotPage: PageResponse<TourSpot> = {
  content: [
    { id: 1, name: '경복궁', latitude: 37.5796, longitude: 126.977 },
    { id: 2, name: '좌표 오류', latitude: Number.NaN, longitude: Number.NaN },
  ],
  number: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
};

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{decodeURIComponent(location.pathname + location.search)}</p>;
}

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <Routes>
          <Route element={<SpotListPage />} path="/spots" />
          <Route element={<p>상세 페이지</p>} path="/spots/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SpotListPage 지도 보기', () => {
  beforeEach(() => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: spotPage } as AxiosResponse<
      PageResponse<TourSpot>
    >);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.mocked(loadKakaoMaps).mockReset();
  });

  it('지도 버튼으로 view=map을 켜고 목록으로 되돌린다', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', '');
    renderPage('/spots?keyword=궁');

    expect(await screen.findByRole('link', { name: /경복궁/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '목록' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '지도' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/spots?keyword=궁&view=map');
    expect(screen.getByRole('heading', { name: '지도 영역' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /경복궁/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '목록' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/spots\?keyword=궁$/);
    expect(await screen.findByRole('link', { name: /경복궁/ })).toBeInTheDocument();
  });

  it('현재 페이지에서 좌표가 유효한 항목만 마커로 표시하고 마커 클릭 시 상세로 이동한다', async () => {
    vi.stubEnv('VITE_KAKAO_MAP_APP_KEY', 'test-key');
    const handlers: Array<() => void> = [];
    const markerTitles: Array<string | undefined> = [];
    const maps = {
      LatLng: vi.fn(),
      LatLngBounds: vi.fn(function (this: object) {
        Object.assign(this, { extend: vi.fn() });
      }),
      Map: vi.fn(function () {
        return { setCenter: vi.fn(), setBounds: vi.fn() };
      }),
      Marker: vi.fn(function (options: { title?: string }) {
        markerTitles.push(options.title);
        return { setMap: vi.fn() };
      }),
      event: {
        addListener: vi.fn((_target: unknown, _type: string, handler: () => void) => {
          handlers.push(handler);
        }),
        removeListener: vi.fn(),
      },
    } as unknown as KakaoMapsApi;
    vi.mocked(loadKakaoMaps).mockResolvedValue(maps);

    renderPage('/spots?view=map');

    await waitFor(() => expect(markerTitles).toEqual(['경복궁']));
    expect(screen.getByText(/위치 정보가 있는 1곳을 표시합니다/)).toBeInTheDocument();

    handlers[0]();

    expect(await screen.findByText('상세 페이지')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/spots/1');
  });
});
