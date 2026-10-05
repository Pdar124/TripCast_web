import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClimatePage } from '@/features/climate/pages/climate-page';
import type { ClimateIndex } from '@/features/climate/types';
import { http } from '@/shared/api/http';

const climateIndex: ClimateIndex = {
  regionId: '5013000000',
  date: '2026-10-05',
  score: 0.11,
  grade: '좋음',
};

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
      const data = url.endsWith('/range') ? [climateIndex] : climateIndex;
      return { data } as AxiosResponse<ClimateIndex | ClimateIndex[]>;
    });
    renderPage();

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/regions/5013000000/climate-index'),
    );
    expect(getSpy).toHaveBeenCalledWith('/api/regions/5013000000/climate-index/range', {
      params: { from: '2026-09-21', to: '2026-10-05' },
    });
    expect(await screen.findByText('지수 0.11')).toBeInTheDocument();
    expect(screen.getByText('기간 추이')).toBeInTheDocument();
  });

  it('기존 5자리 URL 지역 코드를 10자리로 보정한다', async () => {
    const getSpy = vi.spyOn(http, 'get').mockImplementation(async (url) => {
      const data = url.endsWith('/range') ? [climateIndex] : climateIndex;
      return { data } as AxiosResponse<ClimateIndex | ClimateIndex[]>;
    });
    renderPage('/climate?region=50130&from=2026-10-05&to=2026-10-05');

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/regions/5013000000/climate-index'),
    );
  });

  it('잘못된 지역 코드는 API 요청 전에 안내한다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(http, 'get').mockImplementation(async (url) => {
      const data = url.endsWith('/range') ? [climateIndex] : climateIndex;
      return { data } as AxiosResponse<ClimateIndex | ClimateIndex[]>;
    });
    renderPage();

    const input = screen.getByLabelText('시군구 코드');
    await user.clear(input);
    await user.type(input, '123');
    await user.click(screen.getByRole('button', { name: '조회' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '시군구 코드는 숫자 10자리로 입력해 주세요.',
    );
  });
});
