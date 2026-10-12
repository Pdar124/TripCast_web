import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClimatePage } from '@/features/climate/pages/climate-page';
import type { ClimateIndex, Region } from '@/features/climate/types';
import { http } from '@/shared/api/http';

const climateIndex: ClimateIndex = {
  regionId: '5013000000',
  date: '2026-10-05',
  score: 0.11,
  grade: '좋음',
};

const regions: Region[] = [
  {
    regionId: '5013000000',
    name: '서귀포시',
    sidoName: '제주특별자치도',
    displayName: '제주특별자치도 서귀포시',
  },
  {
    regionId: '2635000000',
    name: '해운대구',
    sidoName: '부산광역시',
    displayName: '부산광역시 해운대구',
  },
];

function responseFor(url: string) {
  if (url === '/api/regions') {
    return regions;
  }

  return url.endsWith('/range') ? [climateIndex] : climateIndex;
}

function renderPage(initialEntry = '/climate') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ClimatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClimatePage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-04T12:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('기본 10자리 지역 코드와 다음 날을 포함한 기간으로 조회한다', async () => {
    const getSpy = vi.spyOn(http, 'get').mockImplementation(async (url) => {
      return { data: responseFor(url) } as AxiosResponse;
    });
    renderPage();

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/regions/5013000000/climate-index'),
    );
    expect(getSpy).toHaveBeenCalledWith('/api/regions/5013000000/climate-index/range', {
      params: { from: '2026-09-21', to: '2026-10-05' },
    });
    expect(getSpy).toHaveBeenCalledWith('/api/regions');
    expect(await screen.findByText('지수 0.11')).toBeInTheDocument();
    expect(
      screen.getByText(/관광기후지수는 열쾌적성, 바람, 강수, 일사량을 종합해/),
    ).toBeInTheDocument();
    expect(screen.getByText('기간 추이')).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: '지역' })).toHaveValue(
      '제주특별자치도 서귀포시',
    );
  });

  it('기존 5자리 URL 지역 코드를 10자리로 보정한다', async () => {
    const getSpy = vi.spyOn(http, 'get').mockImplementation(async (url) => {
      return { data: responseFor(url) } as AxiosResponse;
    });
    renderPage('/climate?region=50130&from=2026-10-05&to=2026-10-05');

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/regions/5013000000/climate-index'),
    );
  });

  it('잘못된 지역 코드는 API 요청 전에 안내한다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(http, 'get').mockImplementation(async (url) => {
      return { data: responseFor(url) } as AxiosResponse;
    });
    renderPage();

    const input = await screen.findByRole('combobox', { name: '지역' });
    await user.clear(input);
    await user.type(input, '123');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '검색 결과에서 지역을 선택해 주세요.',
    );
  });

  it('지역 이름을 검색하고 선택한 지역 코드로 조회한다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const getSpy = vi.spyOn(http, 'get').mockImplementation(async (url) => {
      const data =
        url === '/api/regions'
          ? regions
          : url.endsWith('/range')
            ? [{ ...climateIndex, regionId: '2635000000' }]
            : { ...climateIndex, regionId: '2635000000' };
      return { data } as AxiosResponse;
    });
    renderPage();

    const input = await screen.findByRole('combobox', { name: '지역' });
    await user.clear(input);
    await user.type(input, '해운대');
    await user.click(screen.getByRole('option', { name: '부산광역시 해운대구' }));
    await user.click(screen.getByRole('button', { name: '조회' }));

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/regions/2635000000/climate-index'),
    );
  });

  it('지역 목록 로딩 실패 시 10자리 코드를 직접 입력한다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const getSpy = vi.spyOn(http, 'get').mockImplementation(async (url) => {
      if (url === '/api/regions') {
        throw new Error('지역 목록 요청 실패');
      }

      return { data: url.endsWith('/range') ? [climateIndex] : climateIndex } as AxiosResponse;
    });
    renderPage();

    expect(
      await screen.findByText(
        '지역 목록을 불러오지 못했습니다. 시군구 코드 10자리를 직접 입력해 주세요.',
      ),
    ).toBeInTheDocument();
    const input = screen.getByLabelText('시군구 코드');
    await user.clear(input);
    await user.type(input, '2635000000');
    await user.click(screen.getByRole('button', { name: '조회' }));

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/regions/2635000000/climate-index'),
    );
  });
});
