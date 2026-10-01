import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpotListPage } from '@/features/spots/pages/spot-list-page';
import type { PageResponse, TourSpot } from '@/features/spots/types';
import { http } from '@/shared/api/http';

const emptyPage: PageResponse<TourSpot> = {
  content: [],
  number: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/spots']}>
        <SpotListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SpotListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('입력 중에는 재요청하지 않고 submit할 때 page 0, size 20으로 검색한다', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: emptyPage,
    } as AxiosResponse<PageResponse<TourSpot>>);

    renderPage();

    await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(1));
    expect(getSpy).toHaveBeenLastCalledWith('/api/tour-spots', {
      params: { keyword: '', page: 0, size: 20 },
    });

    await user.type(screen.getByRole('searchbox', { name: '관광지 검색어' }), '경복궁');
    expect(getSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(2));
    expect(getSpy).toHaveBeenLastCalledWith('/api/tour-spots', {
      params: { keyword: '경복궁', page: 0, size: 20 },
    });
  });
});
