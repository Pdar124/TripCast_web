import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminDashboardPage } from '@/features/admin/pages/admin-dashboard-page';
import { useAuthStore } from '@/features/admin/store/auth-store';
import type { ClimateIndexSyncResult } from '@/features/admin/types';
import { http } from '@/shared/api/http';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().setSession({ token: 'test-token', username: 'tripcast-admin' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('수동 동기화를 요청하고 실행 결과를 네 개 통계 카드에 표시한다', async () => {
    const user = userEvent.setup();
    const result: ClimateIndexSyncResult = {
      requestedRegions: 10,
      successfulRegions: 9,
      savedRecords: 18,
      failedRegions: 1,
    };
    const postSpy = vi
      .spyOn(http, 'post')
      .mockResolvedValue({ data: result } as AxiosResponse<ClimateIndexSyncResult>);
    renderPage();

    await user.click(screen.getByRole('button', { name: '지금 동기화' }));

    await waitFor(() => expect(postSpy).toHaveBeenCalledWith('/api/admin/climate-index/sync'));
    expect(await screen.findByText('동기화가 완료되었습니다')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('동기화가 실패하면 오류와 다시 시도 버튼을 표시한다', async () => {
    const user = userEvent.setup();
    vi.spyOn(http, 'post').mockRejectedValue(new Error('network error'));
    renderPage();

    await user.click(screen.getByRole('button', { name: '지금 동기화' }));

    expect(await screen.findByText('동기화에 실패했습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });
});
