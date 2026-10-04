import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminLoginPage } from '@/features/admin/pages/admin-login-page';
import { useAuthStore } from '@/features/admin/store/auth-store';
import type { LoginResponse } from '@/features/admin/types';
import { http } from '@/shared/api/http';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route element={<AdminLoginPage />} path="/admin/login" />
          <Route element={<p>관리자 대시보드</p>} path="/admin" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('필수값이 비어 있으면 각 입력 항목의 오류를 표시한다', async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(http, 'post');
    renderPage();

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('아이디를 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('로그인에 성공하면 세션을 저장하고 관리자 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    vi.spyOn(http, 'post').mockResolvedValue({
      data: { token: 'test-token', username: 'tripcast-admin' },
    } as AxiosResponse<LoginResponse>);
    renderPage();

    await user.type(screen.getByLabelText(/아이디/), 'tripcast-admin');
    await user.type(screen.getByLabelText(/비밀번호/), 'safe-password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('관리자 대시보드')).toBeInTheDocument();
    await waitFor(() =>
      expect(useAuthStore.getState()).toMatchObject({
        token: 'test-token',
        username: 'tripcast-admin',
      }),
    );
  });
});
